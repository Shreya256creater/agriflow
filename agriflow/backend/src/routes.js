import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { all, get, run, transaction } from './db.js';
import {
  CATALOG,
  PRESETS,
  clean,
  daysInclusive,
  haversineKm,
  isIsoDate,
  isoDate,
  normalizePhone,
  parsePhotos,
  round1,
  splitAmounts,
} from './util.js';

const SECRET = process.env.JWT_SECRET || 'farmshare-dev-secret';
const SAVINGS_SHARE = 0.3;

function fail(res, status, code) {
  return res.status(status).json({ error: code });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email || '',
    village: user.village,
    district: user.district,
    state: user.state,
    role: user.role,
    lat: user.lat == null ? null : Number(user.lat),
    lng: user.lng == null ? null : Number(user.lng),
  };
}

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '12d' });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return fail(res, 401, 'UNAUTHORIZED');
  try {
    const payload = jwt.verify(token, SECRET);
    const user = get('SELECT * FROM users WHERE id = ?', payload.id);
    if (!user) return fail(res, 401, 'UNAUTHORIZED');
    req.user = user;
    next();
  } catch {
    return fail(res, 401, 'UNAUTHORIZED');
  }
}

function allow(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return fail(res, 403, 'FORBIDDEN');
    next();
  };
}

function notify(userId, code, payload) {
  run(
    `INSERT INTO notifications (id, user_id, code, payload, is_read, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`,
    crypto.randomUUID(),
    userId,
    code,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
}

function fairMap(lat, lng) {
  const rows = all('SELECT type, price_per_day, lat, lng FROM equipment WHERE is_available = 1');
  const groups = {};
  for (const row of rows) {
    if (haversineKm(lat, lng, row.lat, row.lng) > 50) continue;
    groups[row.type] ??= [];
    groups[row.type].push(row.price_per_day);
  }
  const map = {};
  for (const [type, prices] of Object.entries(groups)) {
    if (prices.length >= 2) {
      const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      map[type] = { price: Math.round(avg), source: 'nearby' };
    }
  }
  return map;
}

function rentableDays(row) {
  if (!row.is_available) return 0;
  const today = isoDate(0);
  const from = row.available_from;
  const to = row.available_to;
  if (from && to) {
    const start = from > today ? from : today;
    if (to < start) return 0;
    return daysInclusive(start, to);
  }
  if (to) {
    if (to < today) return 0;
    return daysInclusive(today, to);
  }
  return null;
}

function shapeEquipment(row, distanceKm, fair) {
  const catalog = CATALOG[row.type] || { buy: 0, typical: row.price_per_day };
  const hint = fair[row.type] || { price: catalog.typical, source: 'typical' };
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    type: row.type,
    photos: parsePhotos(row.photos),
    condition: row.condition,
    pricePerHour: row.price_per_hour,
    pricePerDay: row.price_per_day,
    operatorIncluded: !!row.operator_included,
    village: row.village,
    lat: Number(row.lat),
    lng: Number(row.lng),
    availableFrom: row.available_from,
    availableTo: row.available_to,
    isAvailable: !!row.is_available,
    ownerName: row.owner_name || '',
    avgRating: row.avg_rating == null ? null : round1(Number(row.avg_rating)),
    reviewCount: Number(row.review_count || 0),
    ownerRating: row.owner_rating == null ? null : round1(Number(row.owner_rating)),
    isSaved: !!row.is_saved,
    distanceKm: distanceKm == null ? null : round1(distanceKm),
    buyPrice: catalog.buy,
    fairPrice: hint.price,
    fairSource: hint.source,
    rentableDays: rentableDays(row),
  };
}

const equipmentSelect = `
  SELECT e.*, u.name AS owner_name,
    (SELECT AVG(rating) FROM reviews r WHERE r.equipment_id = e.id) AS avg_rating,
    (SELECT COUNT(*) FROM reviews r WHERE r.equipment_id = e.id) AS review_count,
    (SELECT AVG(rating) FROM reviews r WHERE r.target_user_id = e.owner_id) AS owner_rating
`;

function confirmedOverlap(equipmentId, start, end, exceptId = null) {
  if (exceptId) {
    return get(
      `SELECT id FROM bookings
       WHERE equipment_id = ? AND status = 'confirmed'
         AND start_date <= ? AND end_date >= ? AND id != ?`,
      equipmentId,
      end,
      start,
      exceptId,
    );
  }
  return get(
    `SELECT id FROM bookings
     WHERE equipment_id = ? AND status = 'confirmed'
       AND start_date <= ? AND end_date >= ?`,
    equipmentId,
    end,
    start,
  );
}

function outsideWindow(equipment, start, end) {
  if (equipment.available_from && start < equipment.available_from) return true;
  if (equipment.available_to && end > equipment.available_to) return true;
  return false;
}

function loadBookingExtras(bookings) {
  if (!bookings.length) return { members: {}, reviews: {} };
  const ids = bookings.map((booking) => booking.id);
  const marks = ids.map(() => '?').join(',');
  const members = {};
  for (const row of all(
    `SELECT bm.booking_id, bm.user_id, bm.share_amount, u.name
     FROM booking_members bm JOIN users u ON u.id = bm.user_id
     WHERE bm.booking_id IN (${marks})`,
    ...ids,
  )) {
    members[row.booking_id] ??= [];
    members[row.booking_id].push({
      userId: row.user_id,
      name: row.name,
      shareAmount: row.share_amount,
    });
  }
  const reviews = {};
  for (const row of all(
    `SELECT id, booking_id, reviewer_id, rating, preset, comment
     FROM reviews WHERE booking_id IN (${marks})`,
    ...ids,
  )) {
    reviews[row.booking_id] ??= [];
    reviews[row.booking_id].push({
      id: row.id,
      reviewerId: row.reviewer_id,
      rating: row.rating,
      preset: row.preset || '',
      comment: row.comment || '',
    });
  }
  return { members, reviews };
}

function shapeBooking(row, viewer, extras) {
  const confirmed = row.status === 'confirmed';
  const isOwner = viewer.id === row.owner_id;
  const isRenter = viewer.id === row.renter_id;
  const party = isOwner || isRenter;
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment_name,
    equipmentType: row.equipment_type,
    startDate: row.start_date,
    endDate: row.end_date,
    days: daysInclusive(row.start_date, row.end_date),
    totalCost: row.total_cost,
    status: row.status,
    note: row.note || '',
    createdAt: row.created_at,
    renterId: row.renter_id,
    renterName: row.renter_name,
    renterVillage: row.renter_village,
    renterDistrict: row.renter_district,
    renterRating: row.renter_rating == null ? null : round1(Number(row.renter_rating)),
    renterPhone: party && confirmed && isOwner ? row.renter_phone : '',
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerVillage: row.owner_village,
    ownerPhone: party && confirmed && isRenter ? row.owner_phone : '',
    members: extras.members[row.id] || [],
    reviews: extras.reviews[row.id] || [],
    reviewed: (extras.reviews[row.id] || []).some((review) => review.reviewerId === viewer.id),
  };
}

function listBookings(viewer) {
  const rows = all(
    `SELECT b.*,
        e.name AS equipment_name, e.type AS equipment_type, e.owner_id,
        o.name AS owner_name, o.phone AS owner_phone, o.village AS owner_village,
        r.name AS renter_name, r.phone AS renter_phone, r.village AS renter_village, r.district AS renter_district,
        (SELECT AVG(rating) FROM reviews rv WHERE rv.target_user_id = b.renter_id) AS renter_rating
     FROM bookings b
     JOIN equipment e ON e.id = b.equipment_id
     JOIN users o ON o.id = e.owner_id
     JOIN users r ON r.id = b.renter_id
     WHERE b.renter_id = ? OR e.owner_id = ?
     ORDER BY b.created_at DESC`,
    viewer.id,
    viewer.id,
  );
  const extras = loadBookingExtras(rows);
  const shaped = rows.map((row) => shapeBooking(row, viewer, extras));
  return {
    asRenter: shaped.filter((booking) => booking.renterId === viewer.id),
    asOwner: shaped.filter((booking) => booking.ownerId === viewer.id),
  };
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readPlace(body) {
  const name = clean(body.name, 80);
  const phone = normalizePhone(body.phone);
  const email = clean(body.email, 120).toLowerCase();
  const village = clean(body.village, 80);
  const district = clean(body.district, 80);
  const state = clean(body.state, 80);
  const role = body.role;
  const lat = body.lat == null || body.lat === '' ? null : Number(body.lat);
  const lng = body.lng == null || body.lng === '' ? null : Number(body.lng);
  return { name, phone, email, village, district, state, role, lat, lng };
}

function impactStats() {
  const farmers = get(
    `SELECT COUNT(DISTINCT renter_id) AS c FROM bookings WHERE status IN ('confirmed', 'completed')`,
  );
  const completed = all(
    `SELECT start_date, end_date, total_cost FROM bookings WHERE status = 'completed'`,
  );
  const agreed = all(
    `SELECT total_cost FROM bookings WHERE status IN ('confirmed', 'completed')`,
  );
  let machineHours = 0;
  let completedCost = 0;
  for (const booking of completed) {
    machineHours += daysInclusive(booking.start_date, booking.end_date) * 8;
    completedCost += booking.total_cost;
  }
  const ownerEarnings = agreed.reduce((sum, booking) => sum + booking.total_cost, 0);
  return {
    farmersServed: Number(farmers?.c || 0),
    machineHours,
    moneySaved: Math.round(completedCost * SAVINGS_SHARE),
    ownerEarnings,
  };
}

function checkDates(start, end) {
  if (!isIsoDate(start) || !isIsoDate(end) || end < start || start < isoDate(0)) return 'BAD_DATES';
  const days = daysInclusive(start, end);
  if (days < 1 || days > 60) return 'BAD_DATES';
  return '';
}

export function registerRoutes(app) {
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/catalog', (_req, res) => {
    const rows = all(
      `${equipmentSelect},
        0 AS is_saved
       FROM equipment e JOIN users u ON u.id = e.owner_id
       ORDER BY e.is_available DESC, e.name COLLATE NOCASE`,
    );
    res.json({ items: rows.map((row) => shapeEquipment(row, null, {})) });
  });

  app.get('/api/impact', (_req, res) => {
    res.json(impactStats());
  });

  app.post('/api/auth/signup', (req, res) => {
    const place = readPlace(req.body || {});
    const password = String(req.body?.password || '');
    if (!place.name || !place.phone || !place.village || !place.district || !place.state) {
      return fail(res, 400, 'VALIDATION');
    }
    if (!['farmer', 'owner', 'cooperative'].includes(place.role)) return fail(res, 400, 'VALIDATION');
    if (password.length < 6) return fail(res, 400, 'SHORT_PASSWORD');
    if (place.email && !validEmail(place.email)) return fail(res, 400, 'INVALID_EMAIL');
    if (get('SELECT id FROM users WHERE phone = ?', place.phone)) return fail(res, 409, 'PHONE_TAKEN');
    if (place.email && get('SELECT id FROM users WHERE email = ?', place.email)) {
      return fail(res, 409, 'EMAIL_TAKEN');
    }
    const latOk = place.lat == null || Number.isFinite(place.lat);
    const lngOk = place.lng == null || Number.isFinite(place.lng);
    if (!latOk || !lngOk) return fail(res, 400, 'VALIDATION');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    transaction(() => {
      run(
        `INSERT INTO users
          (id, name, phone, email, password_hash, village, district, state, role, lat, lng, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        place.name,
        place.phone,
        place.email || null,
        bcrypt.hashSync(password, 10),
        place.village,
        place.district,
        place.state,
        place.role,
        place.lat,
        place.lng,
        now,
      );
      if (place.role === 'cooperative') {
        run(
          `INSERT INTO groups (id, name, admin_user_id, created_at) VALUES (?, ?, ?, ?)`,
          crypto.randomUUID(),
          place.name,
          id,
          now,
        );
      }
    });
    const user = get('SELECT * FROM users WHERE id = ?', id);
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  });

  app.post('/api/auth/signin', (req, res) => {
    const login = clean(req.body?.login, 120).toLowerCase();
    const password = String(req.body?.password || '');
    const phone = normalizePhone(login);
    let user = null;
    if (phone) user = get('SELECT * FROM users WHERE phone = ?', phone);
    if (!user && login.includes('@')) user = get('SELECT * FROM users WHERE email = ?', login);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return fail(res, 401, 'BAD_LOGIN');
    res.json({ token: tokenFor(user), user: publicUser(user) });
  });

  app.post('/api/auth/forgot', (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return fail(res, 400, 'INVALID_PHONE');
    const user = get('SELECT id FROM users WHERE phone = ?', phone);
    if (!user) return fail(res, 404, 'NOT_FOUND');
    const code = String(Math.floor(1000 + Math.random() * 9000));
    run('DELETE FROM password_resets WHERE phone = ?', phone);
    run(
      `INSERT INTO password_resets (phone, code_hash, expires_at) VALUES (?, ?, ?)`,
      phone,
      bcrypt.hashSync(code, 8),
      Date.now() + 15 * 60 * 1000,
    );
    res.json({
      ok: true,
      demoCode: code,
      note: 'No SMS service is configured. This demo shows the code once.',
    });
  });

  app.post('/api/auth/reset', (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    const code = clean(req.body?.code, 8);
    const password = String(req.body?.password || '');
    if (!phone || !code) return fail(res, 400, 'VALIDATION');
    if (password.length < 6) return fail(res, 400, 'SHORT_PASSWORD');
    const row = get('SELECT * FROM password_resets WHERE phone = ?', phone);
    if (!row || row.expires_at < Date.now() || !bcrypt.compareSync(code, row.code_hash)) {
      return fail(res, 400, 'BAD_CODE');
    }
    run('UPDATE users SET password_hash = ? WHERE phone = ?', bcrypt.hashSync(password, 10), phone);
    run('DELETE FROM password_resets WHERE phone = ?', phone);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', authRequired, (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  app.put('/api/me', authRequired, (req, res) => {
    const place = readPlace({ ...publicUser(req.user), ...req.body, role: req.user.role });
    if (!place.name || !place.village || !place.district || !place.state) return fail(res, 400, 'VALIDATION');
    if (place.email && !validEmail(place.email)) return fail(res, 400, 'INVALID_EMAIL');
    if (place.email) {
      const taken = get('SELECT id FROM users WHERE email = ? AND id != ?', place.email, req.user.id);
      if (taken) return fail(res, 409, 'EMAIL_TAKEN');
    }
    const lat = Number.isFinite(place.lat) ? place.lat : null;
    const lng = Number.isFinite(place.lng) ? place.lng : null;
    run(
      `UPDATE users
       SET name = ?, email = ?, village = ?, district = ?, state = ?, lat = ?, lng = ?
       WHERE id = ?`,
      place.name,
      place.email || null,
      place.village,
      place.district,
      place.state,
      lat,
      lng,
      req.user.id,
    );
    if (req.user.role === 'cooperative') {
      run('UPDATE groups SET name = ? WHERE admin_user_id = ?', place.name, req.user.id);
    }
    res.json({ user: publicUser(get('SELECT * FROM users WHERE id = ?', req.user.id)) });
  });

  app.put('/api/me/password', authRequired, (req, res) => {
    const current = String(req.body?.currentPassword || '');
    const next = String(req.body?.password || '');
    if (!bcrypt.compareSync(current, req.user.password_hash)) return fail(res, 400, 'WRONG_PASSWORD');
    if (next.length < 6) return fail(res, 400, 'SHORT_PASSWORD');
    run('UPDATE users SET password_hash = ? WHERE id = ?', bcrypt.hashSync(next, 10), req.user.id);
    res.json({ ok: true });
  });

  app.get('/api/stats', authRequired, (req, res) => {
    const listed = get('SELECT COUNT(*) AS c FROM equipment WHERE owner_id = ?', req.user.id);
    const active = get(
      `SELECT COUNT(*) AS c FROM bookings b
       JOIN equipment e ON e.id = b.equipment_id
       WHERE e.owner_id = ? AND b.status = 'confirmed'`,
      req.user.id,
    );
    const pending = get(
      `SELECT COUNT(*) AS c FROM bookings b
       JOIN equipment e ON e.id = b.equipment_id
       WHERE e.owner_id = ? AND b.status = 'pending'`,
      req.user.id,
    );
    const earnings = get(
      `SELECT COALESCE(SUM(b.total_cost), 0) AS c FROM bookings b
       JOIN equipment e ON e.id = b.equipment_id
       WHERE e.owner_id = ? AND b.status IN ('confirmed', 'completed')`,
      req.user.id,
    );
    const upcoming = get(
      `SELECT COUNT(*) AS c FROM bookings
       WHERE renter_id = ? AND status IN ('pending', 'confirmed') AND end_date >= ?`,
      req.user.id,
      isoDate(0),
    );
    const saved = get('SELECT COUNT(*) AS c FROM saved_equipment WHERE user_id = ?', req.user.id);
    const unread = get(
      'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0',
      req.user.id,
    );
    res.json({
      listed: Number(listed.c),
      activeRentals: Number(active.c),
      pendingRequests: Number(pending.c),
      earnings: Number(earnings.c),
      upcoming: Number(upcoming.c),
      saved: Number(saved.c),
      unread: Number(unread.c),
    });
  });

  app.get('/api/equipment/mine', authRequired, (req, res) => {
    const rows = all(
      `${equipmentSelect},
        EXISTS(SELECT 1 FROM saved_equipment s WHERE s.user_id = ? AND s.equipment_id = e.id) AS is_saved
       FROM equipment e JOIN users u ON u.id = e.owner_id
       WHERE e.owner_id = ?
       ORDER BY e.created_at DESC`,
      req.user.id,
      req.user.id,
    );
    const fair = req.user.lat == null ? {} : fairMap(req.user.lat, req.user.lng);
    res.json({
      items: rows.map((row) => {
        const distance = req.user.lat == null ? null : haversineKm(req.user.lat, req.user.lng, row.lat, row.lng);
        return shapeEquipment(row, distance, fair);
      }),
    });
  });

  app.get('/api/equipment', authRequired, (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return fail(res, 400, 'LOCATION');
    const radius = Math.min(50, Math.max(1, Number(req.query.radius) || 25));
    const type = String(req.query.type || '');
    const operator = String(req.query.operator || '');
    const minPrice = req.query.minPrice === undefined || req.query.minPrice === '' ? null : Number(req.query.minPrice);
    const maxPrice = req.query.maxPrice === undefined || req.query.maxPrice === '' ? null : Number(req.query.maxPrice);
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');
    if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) return fail(res, 400, 'BAD_DATES');

    const where = ['e.is_available = 1'];
    const params = [req.user.id];
    if (type) {
      if (!CATALOG[type]) return fail(res, 400, 'VALIDATION');
      where.push('e.type = ?');
      params.push(type);
    }
    if (operator === '1' || operator === '0') {
      where.push('e.operator_included = ?');
      params.push(Number(operator));
    }
    if (minPrice != null && Number.isFinite(minPrice)) {
      where.push('e.price_per_day >= ?');
      params.push(minPrice);
    }
    if (maxPrice != null && Number.isFinite(maxPrice)) {
      where.push('e.price_per_day <= ?');
      params.push(maxPrice);
    }
    if (from) {
      where.push('(e.available_from IS NULL OR e.available_from <= ?)');
      params.push(from);
    }
    if (to) {
      where.push('(e.available_to IS NULL OR e.available_to >= ?)');
      params.push(to);
    }
    if (from && to) {
      where.push(`NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.equipment_id = e.id AND b.status = 'confirmed'
          AND b.start_date <= ? AND b.end_date >= ?
      )`);
      params.push(to, from);
    }

    const rows = all(
      `${equipmentSelect},
        EXISTS(SELECT 1 FROM saved_equipment s WHERE s.user_id = ? AND s.equipment_id = e.id) AS is_saved
       FROM equipment e JOIN users u ON u.id = e.owner_id
       WHERE ${where.join(' AND ')}`,
      ...params,
    );
    const fair = fairMap(lat, lng);
    const items = rows
      .map((row) => shapeEquipment(row, haversineKm(lat, lng, row.lat, row.lng), fair))
      .filter((item) => item.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    res.json({ items, radius });
  });

  app.get('/api/equipment/:id', authRequired, (req, res) => {
    const row = get(
      `${equipmentSelect},
        EXISTS(SELECT 1 FROM saved_equipment s WHERE s.user_id = ? AND s.equipment_id = e.id) AS is_saved
       FROM equipment e JOIN users u ON u.id = e.owner_id
       WHERE e.id = ?`,
      req.user.id,
      req.params.id,
    );
    if (!row) return fail(res, 404, 'NOT_FOUND');
    const originLat = Number.isFinite(Number(req.user.lat)) ? Number(req.user.lat) : row.lat;
    const originLng = Number.isFinite(Number(req.user.lng)) ? Number(req.user.lng) : row.lng;
    const item = shapeEquipment(row, haversineKm(originLat, originLng, row.lat, row.lng), fairMap(originLat, originLng));
    const reviews = all(
      `SELECT r.rating, r.preset, r.comment, r.created_at, u.name AS reviewer_name
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.equipment_id = ?
       ORDER BY r.created_at DESC`,
      row.id,
    ).map((review) => ({
      rating: review.rating,
      preset: review.preset || '',
      comment: review.comment || '',
      reviewerName: review.reviewer_name,
      createdAt: review.created_at,
    }));
    res.json({ item, reviews });
  });

  app.post('/api/equipment', authRequired, (req, res) => {
    const saved = saveEquipment(req, null);
    if (saved.error) return fail(res, saved.status, saved.error);
    res.status(201).json(saved);
  });

  app.put('/api/equipment/:id', authRequired, (req, res) => {
    const existing = get('SELECT * FROM equipment WHERE id = ?', req.params.id);
    if (!existing) return fail(res, 404, 'NOT_FOUND');
    if (existing.owner_id !== req.user.id) return fail(res, 403, 'FORBIDDEN');
    const saved = saveEquipment(req, existing);
    if (saved.error) return fail(res, saved.status, saved.error);
    res.json(saved);
  });

  app.patch('/api/equipment/:id/availability', authRequired, (req, res) => {
    const existing = get('SELECT * FROM equipment WHERE id = ?', req.params.id);
    if (!existing || existing.owner_id !== req.user.id) return fail(res, 404, 'NOT_FOUND');
    const isAvailable = req.body?.isAvailable ? 1 : 0;
    run('UPDATE equipment SET is_available = ? WHERE id = ?', isAvailable, existing.id);
    res.json({ ok: true, isAvailable: !!isAvailable });
  });

  app.delete('/api/equipment/:id', authRequired, (req, res) => {
    const existing = get('SELECT * FROM equipment WHERE id = ?', req.params.id);
    if (!existing || existing.owner_id !== req.user.id) return fail(res, 404, 'NOT_FOUND');
    const booking = get('SELECT id FROM bookings WHERE equipment_id = ?', existing.id);
    if (booking) return fail(res, 409, 'HAS_BOOKINGS');
    run('DELETE FROM equipment WHERE id = ?', existing.id);
    res.json({ ok: true });
  });

  app.get('/api/saved', authRequired, (req, res) => {
    const rows = all(
      `${equipmentSelect},
        1 AS is_saved
       FROM saved_equipment s
       JOIN equipment e ON e.id = s.equipment_id
       JOIN users u ON u.id = e.owner_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      req.user.id,
    );
    const lat = Number(req.user.lat);
    const lng = Number(req.user.lng);
    const fair = Number.isFinite(lat) ? fairMap(lat, lng) : {};
    res.json({
      items: rows.map((row) => {
        const distance = Number.isFinite(lat) ? haversineKm(lat, lng, row.lat, row.lng) : null;
        return shapeEquipment(row, distance, fair);
      }),
    });
  });

  app.post('/api/saved/:id', authRequired, (req, res) => {
    const equipment = get('SELECT id FROM equipment WHERE id = ?', req.params.id);
    if (!equipment) return fail(res, 404, 'NOT_FOUND');
    const existing = get(
      'SELECT 1 AS ok FROM saved_equipment WHERE user_id = ? AND equipment_id = ?',
      req.user.id,
      equipment.id,
    );
    if (existing) {
      run('DELETE FROM saved_equipment WHERE user_id = ? AND equipment_id = ?', req.user.id, equipment.id);
      return res.json({ saved: false });
    }
    run(
      'INSERT INTO saved_equipment (user_id, equipment_id, created_at) VALUES (?, ?, ?)',
      req.user.id,
      equipment.id,
      new Date().toISOString(),
    );
    res.json({ saved: true });
  });

  app.get('/api/bookings', authRequired, (req, res) => {
    res.json(listBookings(req.user));
  });

  app.post('/api/bookings', authRequired, (req, res) => {
    const equipment = get('SELECT * FROM equipment WHERE id = ?', req.body?.equipmentId);
    if (!equipment) return fail(res, 404, 'NOT_FOUND');
    if (equipment.owner_id === req.user.id) return fail(res, 400, 'OWN_MACHINE');
    if (!equipment.is_available) return fail(res, 400, 'UNAVAILABLE');
    const start = String(req.body?.startDate || '');
    const end = String(req.body?.endDate || '');
    const dateError = checkDates(start, end);
    if (dateError) return fail(res, 400, dateError);
    if (outsideWindow(equipment, start, end)) return fail(res, 400, 'OUTSIDE_WINDOW');
    if (confirmedOverlap(equipment.id, start, end)) return fail(res, 409, 'OVERLAP');

    const days = daysInclusive(start, end);
    const total = days * equipment.price_per_day;
    let memberIds = [];
    if (req.body?.split) {
      if (req.user.role !== 'cooperative') return fail(res, 403, 'FORBIDDEN');
      memberIds = [...new Set((req.body.memberIds || []).map(String))];
      if (memberIds.length < 2) return fail(res, 400, 'PICK_MEMBERS');
      const group = get('SELECT id FROM groups WHERE admin_user_id = ?', req.user.id);
      if (!group) return fail(res, 400, 'VALIDATION');
      const allowed = new Set(
        all('SELECT user_id FROM group_members WHERE group_id = ?', group.id).map((row) => row.user_id),
      );
      if (memberIds.some((id) => !allowed.has(id))) return fail(res, 400, 'VALIDATION');
    }

    const bookingId = crypto.randomUUID();
    const amounts = memberIds.length ? splitAmounts(total, memberIds.length) : [];
    transaction(() => {
      run(
        `INSERT INTO bookings
          (id, equipment_id, renter_id, start_date, end_date, total_cost, status, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        bookingId,
        equipment.id,
        req.user.id,
        start,
        end,
        total,
        memberIds.length ? 'split' : null,
        new Date().toISOString(),
      );
      memberIds.forEach((userId, index) => {
        run(
          'INSERT INTO booking_members (booking_id, user_id, share_amount) VALUES (?, ?, ?)',
          bookingId,
          userId,
          amounts[index],
        );
      });
    });

    const payload = {
      equipmentName: equipment.name,
      renterName: req.user.name,
      ownerName: get('SELECT name FROM users WHERE id = ?', equipment.owner_id).name,
      startDate: start,
      endDate: end,
      bookingId,
    };
    notify(equipment.owner_id, 'BOOKING_REQUEST', payload);
    notify(req.user.id, 'BOOKING_SENT', payload);
    const booking = listBookings(req.user).asRenter.find((item) => item.id === bookingId);
    res.status(201).json({ booking });
  });

  app.post('/api/bookings/:id/accept', authRequired, (req, res) => {
    const row = bookingRow(req.params.id);
    if (!row) return fail(res, 404, 'NOT_FOUND');
    if (row.owner_id !== req.user.id) return fail(res, 403, 'FORBIDDEN');
    if (row.status !== 'pending') return fail(res, 400, 'BAD_STATUS');
    if (confirmedOverlap(row.equipment_id, row.start_date, row.end_date)) return fail(res, 409, 'OVERLAP');

    const clashes = all(
      `SELECT id, renter_id FROM bookings
       WHERE equipment_id = ? AND status = 'pending' AND id != ?
         AND start_date <= ? AND end_date >= ?`,
      row.equipment_id,
      row.id,
      row.end_date,
      row.start_date,
    );
    transaction(() => {
      run(`UPDATE bookings SET status = 'confirmed', note = NULL WHERE id = ?`, row.id);
      for (const clash of clashes) {
        run(`UPDATE bookings SET status = 'cancelled', note = 'auto_overlap' WHERE id = ?`, clash.id);
      }
    });
    notify(row.renter_id, 'BOOKING_ACCEPTED', bookingPayload(row));
    for (const clash of clashes) {
      notify(clash.renter_id, 'BOOKING_AUTO_DECLINED', {
        equipmentName: row.equipment_name,
        startDate: row.start_date,
        endDate: row.end_date,
        bookingId: clash.id,
      });
    }
    const booking = listBookings(req.user).asOwner.find((item) => item.id === row.id);
    res.json({ booking });
  });

  app.post('/api/bookings/:id/decline', authRequired, (req, res) => {
    const row = bookingRow(req.params.id);
    if (!row) return fail(res, 404, 'NOT_FOUND');
    if (row.owner_id !== req.user.id) return fail(res, 403, 'FORBIDDEN');
    if (row.status !== 'pending') return fail(res, 400, 'BAD_STATUS');
    run(`UPDATE bookings SET status = 'cancelled', note = 'declined' WHERE id = ?`, row.id);
    notify(row.renter_id, 'BOOKING_DECLINED', bookingPayload(row));
    res.json({ ok: true });
  });

  app.post('/api/bookings/:id/cancel', authRequired, (req, res) => {
    const row = bookingRow(req.params.id);
    if (!row) return fail(res, 404, 'NOT_FOUND');
    if (row.renter_id !== req.user.id) return fail(res, 403, 'FORBIDDEN');
    if (!['pending', 'confirmed'].includes(row.status)) return fail(res, 400, 'BAD_STATUS');
    run(`UPDATE bookings SET status = 'cancelled', note = 'cancelled' WHERE id = ?`, row.id);
    notify(row.owner_id, 'BOOKING_CANCELLED', bookingPayload(row));
    res.json({ ok: true });
  });

  app.post('/api/bookings/:id/complete', authRequired, (req, res) => {
    const row = bookingRow(req.params.id);
    if (!row) return fail(res, 404, 'NOT_FOUND');
    if (row.owner_id !== req.user.id) return fail(res, 403, 'FORBIDDEN');
    if (row.status !== 'confirmed') return fail(res, 400, 'BAD_STATUS');
    run(`UPDATE bookings SET status = 'completed' WHERE id = ?`, row.id);
    notify(row.renter_id, 'BOOKING_COMPLETED', bookingPayload(row));
    res.json({ ok: true });
  });

  app.post('/api/reviews', authRequired, (req, res) => {
    const booking = bookingRow(req.body?.bookingId);
    if (!booking) return fail(res, 404, 'NOT_FOUND');
    if (booking.status !== 'completed') return fail(res, 400, 'BAD_STATUS');
    const isRenter = booking.renter_id === req.user.id;
    const isOwner = booking.owner_id === req.user.id;
    if (!isRenter && !isOwner) return fail(res, 403, 'FORBIDDEN');
    if (get('SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?', booking.id, req.user.id)) {
      return fail(res, 409, 'ALREADY_REVIEWED');
    }
    const rating = Number(req.body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, 400, 'VALIDATION');
    const preset = clean(req.body?.preset, 40);
    if (preset && !PRESETS.includes(preset)) return fail(res, 400, 'VALIDATION');
    const comment = clean(req.body?.comment, 300);
    const target = isRenter ? booking.owner_id : booking.renter_id;
    run(
      `INSERT INTO reviews
        (id, booking_id, reviewer_id, target_user_id, equipment_id, rating, preset, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      booking.id,
      req.user.id,
      target,
      booking.equipment_id,
      rating,
      preset || null,
      comment,
      new Date().toISOString(),
    );
    notify(target, 'REVIEW_RECEIVED', {
      equipmentName: booking.equipment_name,
      rating,
      bookingId: booking.id,
    });
    res.status(201).json({ ok: true });
  });

  app.get('/api/notifications', authRequired, (req, res) => {
    const rows = all(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 40`,
      req.user.id,
    );
    res.json({
      items: rows.map((row) => ({
        id: row.id,
        code: row.code,
        payload: JSON.parse(row.payload || '{}'),
        read: !!row.is_read,
        createdAt: row.created_at,
      })),
    });
  });

  app.post('/api/notifications/read', authRequired, (_req, res) => {
    run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', req.user.id);
    res.json({ ok: true });
  });

  app.get('/api/group', authRequired, allow('cooperative'), (req, res) => {
    res.json(groupPayload(req.user.id));
  });

  app.post('/api/group/members', authRequired, allow('cooperative'), (req, res) => {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return fail(res, 400, 'INVALID_PHONE');
    const group = get('SELECT * FROM groups WHERE admin_user_id = ?', req.user.id);
    if (!group) return fail(res, 400, 'VALIDATION');
    const farmer = get('SELECT * FROM users WHERE phone = ?', phone);
    if (!farmer) return fail(res, 404, 'NOT_FOUND');
    if (farmer.role !== 'farmer') return fail(res, 400, 'ONLY_FARMERS');
    const existing = get(
      'SELECT 1 AS ok FROM group_members WHERE group_id = ? AND user_id = ?',
      group.id,
      farmer.id,
    );
    if (existing) return fail(res, 409, 'ALREADY_MEMBER');
    run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', group.id, farmer.id);
    notify(farmer.id, 'MEMBER_ADDED', { groupName: group.name });
    res.status(201).json(groupPayload(req.user.id));
  });

  app.delete('/api/group/members/:userId', authRequired, allow('cooperative'), (req, res) => {
    const group = get('SELECT * FROM groups WHERE admin_user_id = ?', req.user.id);
    if (!group) return fail(res, 400, 'VALIDATION');
    const busy = get(
      `SELECT b.id FROM bookings b
       JOIN booking_members bm ON bm.booking_id = b.id
       WHERE bm.user_id = ? AND b.renter_id = ? AND b.status IN ('pending', 'confirmed')`,
      req.params.userId,
      req.user.id,
    );
    if (busy) return fail(res, 409, 'MEMBER_IN_BOOKING');
    run('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', group.id, req.params.userId);
    res.json(groupPayload(req.user.id));
  });
}

function groupPayload(adminId) {
  const group = get('SELECT * FROM groups WHERE admin_user_id = ?', adminId);
  if (!group) return { group: null };
  const members = all(
    `SELECT u.id, u.name, u.phone, u.village, u.district
     FROM group_members gm JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ?
     ORDER BY u.name`,
    group.id,
  ).map((member) => ({
    id: member.id,
    name: member.name,
    phone: member.phone,
    village: member.village,
    district: member.district,
  }));
  return { group: { id: group.id, name: group.name, members } };
}

function bookingRow(id) {
  return get(
    `SELECT b.*, e.owner_id, e.name AS equipment_name,
        o.name AS owner_name, r.name AS renter_name
     FROM bookings b
     JOIN equipment e ON e.id = b.equipment_id
     JOIN users o ON o.id = e.owner_id
     JOIN users r ON r.id = b.renter_id
     WHERE b.id = ?`,
    id,
  );
}

function bookingPayload(row) {
  return {
    equipmentName: row.equipment_name,
    renterName: row.renter_name || '',
    ownerName: row.owner_name || '',
    startDate: row.start_date,
    endDate: row.end_date,
    bookingId: row.id,
  };
}

function saveEquipment(req, existing) {
  const body = req.body || {};
  const name = clean(body.name, 80);
  const type = String(body.type || '');
  const condition = String(body.condition || '');
  const pricePerHour = Number(body.pricePerHour);
  const pricePerDay = Number(body.pricePerDay);
  const village = clean(body.village, 80);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const availableFrom = body.availableFrom ? String(body.availableFrom) : null;
  const availableTo = body.availableTo ? String(body.availableTo) : null;
  const photos = Array.isArray(body.photos) ? body.photos.filter((item) => typeof item === 'string').slice(0, 2) : [];
  if (!name || !village) return { status: 400, error: 'VALIDATION' };
  if (!CATALOG[type]) return { status: 400, error: 'VALIDATION' };
  if (!['good', 'fair', 'repair'].includes(condition)) return { status: 400, error: 'VALIDATION' };
  if (!Number.isInteger(pricePerHour) || pricePerHour < 1 || pricePerHour > 100000) {
    return { status: 400, error: 'VALIDATION' };
  }
  if (!Number.isInteger(pricePerDay) || pricePerDay < 1 || pricePerDay > 500000) {
    return { status: 400, error: 'VALIDATION' };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { status: 400, error: 'LOCATION' };
  if ((availableFrom && !isIsoDate(availableFrom)) || (availableTo && !isIsoDate(availableTo))) {
    return { status: 400, error: 'BAD_DATES' };
  }
  if (availableFrom && availableTo && availableTo < availableFrom) return { status: 400, error: 'BAD_DATES' };
  if (photos.join('').length > 700000) return { status: 400, error: 'VALIDATION' };

  const operator = body.operatorIncluded ? 1 : 0;
  const photoJson = JSON.stringify(photos);
  if (!existing) {
    const id = crypto.randomUUID();
    run(
      `INSERT INTO equipment
        (id, owner_id, name, type, photos, condition, price_per_hour, price_per_day,
         operator_included, village, lat, lng, available_from, available_to, is_available, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      id,
      req.user.id,
      name,
      type,
      photoJson,
      condition,
      pricePerHour,
      pricePerDay,
      operator,
      village,
      lat,
      lng,
      availableFrom,
      availableTo,
      new Date().toISOString(),
    );
    return { id };
  }
  run(
    `UPDATE equipment SET
      name = ?, type = ?, photos = ?, condition = ?, price_per_hour = ?, price_per_day = ?,
      operator_included = ?, village = ?, lat = ?, lng = ?, available_from = ?, available_to = ?
     WHERE id = ?`,
    name,
    type,
    photoJson,
    condition,
    pricePerHour,
    pricePerDay,
    operator,
    village,
    lat,
    lng,
    availableFrom,
    availableTo,
    existing.id,
  );
  return { id: existing.id };
}
