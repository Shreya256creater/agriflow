import bcrypt from 'bcryptjs';
import { all, get, run, transaction } from './db.js';
import { isoDate } from './util.js';

function notify(id, userId, code, payload, read, createdAt) {
  run(
    `INSERT INTO notifications (id, user_id, code, payload, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    userId,
    code,
    JSON.stringify(payload),
    read ? 1 : 0,
    createdAt,
  );
}

export function seedIfEmpty() {
  const existing = get('SELECT COUNT(*) AS c FROM users');
  if (existing && Number(existing.c) > 0) return;

  const hash = bcrypt.hashSync('demo123', 10);
  const now = new Date().toISOString();
  const from = isoDate(-30);
  const to = isoDate(180);

  const users = [
    ['usr_ramesh', 'Ramesh Patel', '9800000001', 'ramesh@farmshare.local', 'Borsad', 'Anand', 'Gujarat', 'farmer', 22.5565, 72.9512],
    ['usr_sita', 'Sita Ben Parmar', '9800000002', 'sita@farmshare.local', 'Lambhvel', 'Anand', 'Gujarat', 'farmer', 22.5925, 72.922],
    ['usr_mahesh', 'Mahesh Desai', '9800000011', 'mahesh@farmshare.local', 'Gamdi', 'Anand', 'Gujarat', 'owner', 22.535, 72.962],
    ['usr_kheda', 'Kheda Custom Hiring Center', '9800000012', 'kheda@farmshare.local', 'Nadiad', 'Kheda', 'Gujarat', 'owner', 22.6939, 72.8616],
    ['usr_farida', 'Farida Sheikh', '9800000013', 'farida@farmshare.local', 'Vadodara', 'Vadodara', 'Gujarat', 'owner', 22.31, 73.17],
    ['usr_jayesh', 'Jayesh Chauhan', '9800000014', 'jayesh@farmshare.local', 'Karamsad', 'Anand', 'Gujarat', 'owner', 22.5425, 72.903],
    ['usr_coop', 'Anand Mahila Cooperative', '9800000021', 'coop@farmshare.local', 'Anand', 'Anand', 'Gujarat', 'cooperative', 22.5645, 72.9289],
  ];

  const machines = [
    ['eq_tractor_mahesh', 'usr_mahesh', 'Mahindra 575 Tractor', 'tractor', 'good', 650, 4200, 1, 'Gamdi', 22.535, 72.962, 1],
    ['eq_rotavator_mahesh', 'usr_mahesh', '6-foot Rotavator', 'rotavator', 'good', 450, 2200, 0, 'Gamdi', 22.5365, 72.964, 1],
    ['eq_harvester_kheda', 'usr_kheda', 'Combine Harvester', 'harvester', 'good', 2800, 14000, 1, 'Nadiad', 22.6939, 72.8616, 1],
    ['eq_drill_kheda', 'usr_kheda', '9-row Seed Drill', 'seed_drill', 'fair', 350, 1800, 0, 'Nadiad', 22.697, 72.866, 1],
    ['eq_sprayer_kheda', 'usr_kheda', 'Boom Sprayer', 'sprayer', 'good', 300, 1600, 1, 'Nadiad', 22.69, 72.858, 1],
    ['eq_tractor_farida', 'usr_farida', 'John Deere Tractor', 'tractor', 'good', 800, 5000, 1, 'Vadodara', 22.31, 73.17, 1],
    ['eq_thresher_farida', 'usr_farida', 'Multi-crop Thresher', 'thresher', 'fair', 550, 2800, 0, 'Vadodara', 22.307, 73.164, 0],
    ['eq_sprayer_jayesh', 'usr_jayesh', 'Power Sprayer', 'sprayer', 'good', 250, 1200, 0, 'Karamsad', 22.5425, 72.903, 1],
    ['eq_drill_jayesh', 'usr_jayesh', 'Seed-cum-Fertilizer Drill', 'seed_drill', 'good', 400, 2100, 1, 'Karamsad', 22.545, 72.907, 1],
    ['eq_tractor_coop', 'usr_coop', 'Swaraj 744 Tractor', 'tractor', 'good', 500, 3500, 1, 'Anand', 22.5645, 72.9289, 1],
  ];

  transaction(() => {
    for (const user of users) {
      run(
        `INSERT INTO users
          (id, name, phone, email, password_hash, village, district, state, role, lat, lng, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ...user.slice(0, 4),
        hash,
        ...user.slice(4),
        now,
      );
    }

    run(
      `INSERT INTO groups (id, name, admin_user_id, created_at) VALUES (?, ?, ?, ?)`,
      'grp_anand',
      'Anand Mahila Cooperative',
      'usr_coop',
      now,
    );
    run(`INSERT INTO group_members (group_id, user_id) VALUES ('grp_anand', 'usr_ramesh')`);
    run(`INSERT INTO group_members (group_id, user_id) VALUES ('grp_anand', 'usr_sita')`);

    for (const machine of machines) {
      run(
        `INSERT INTO equipment
          (id, owner_id, name, type, photos, condition, price_per_hour, price_per_day,
           operator_included, village, lat, lng, available_from, available_to, is_available, created_at)
         VALUES (?, ?, ?, ?, '[]', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        machine[0],
        machine[1],
        machine[2],
        machine[3],
        machine[4],
        machine[5],
        machine[6],
        machine[7],
        machine[8],
        machine[9],
        machine[10],
        from,
        to,
        machine[11],
        now,
      );
    }

    const doneStart = isoDate(-18);
    const doneEnd = isoDate(-16);
    run(
      `INSERT INTO bookings
        (id, equipment_id, renter_id, start_date, end_date, total_cost, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', NULL, ?)`,
      'bk_done_ramesh',
      'eq_tractor_mahesh',
      'usr_ramesh',
      doneStart,
      doneEnd,
      3 * 4200,
      now,
    );
    run(
      `INSERT INTO reviews
        (id, booking_id, reviewer_id, target_user_id, equipment_id, rating, preset, comment, created_at)
       VALUES (?, ?, ?, ?, ?, 5, 'worked_well', '', ?)`,
      'rv_ramesh',
      'bk_done_ramesh',
      'usr_ramesh',
      'usr_mahesh',
      'eq_tractor_mahesh',
      now,
    );

    const sitaStart = isoDate(-30);
    const sitaEnd = isoDate(-29);
    run(
      `INSERT INTO bookings
        (id, equipment_id, renter_id, start_date, end_date, total_cost, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', NULL, ?)`,
      'bk_done_sita',
      'eq_drill_jayesh',
      'usr_sita',
      sitaStart,
      sitaEnd,
      2 * 2100,
      now,
    );
    run(
      `INSERT INTO reviews
        (id, booking_id, reviewer_id, target_user_id, equipment_id, rating, preset, comment, created_at)
       VALUES (?, ?, ?, ?, ?, 4, 'on_time', '', ?)`,
      'rv_sita',
      'bk_done_sita',
      'usr_sita',
      'usr_jayesh',
      'eq_drill_jayesh',
      now,
    );

    const soonStart = isoDate(5);
    const soonEnd = isoDate(6);
    run(
      `INSERT INTO bookings
        (id, equipment_id, renter_id, start_date, end_date, total_cost, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NULL, ?)`,
      'bk_soon_ramesh',
      'eq_sprayer_jayesh',
      'usr_ramesh',
      soonStart,
      soonEnd,
      2 * 1200,
      now,
    );

    const pendingStart = isoDate(8);
    const pendingEnd = isoDate(9);
    run(
      `INSERT INTO bookings
        (id, equipment_id, renter_id, start_date, end_date, total_cost, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?)`,
      'bk_pending_sita',
      'eq_harvester_kheda',
      'usr_sita',
      pendingStart,
      pendingEnd,
      2 * 14000,
      now,
    );

    const splitStart = isoDate(12);
    const splitEnd = isoDate(13);
    run(
      `INSERT INTO bookings
        (id, equipment_id, renter_id, start_date, end_date, total_cost, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'split', ?)`,
      'bk_split_coop',
      'eq_rotavator_mahesh',
      'usr_coop',
      splitStart,
      splitEnd,
      2 * 2200,
      now,
    );
    run(
      `INSERT INTO booking_members (booking_id, user_id, share_amount) VALUES ('bk_split_coop', 'usr_ramesh', 2200)`,
    );
    run(
      `INSERT INTO booking_members (booking_id, user_id, share_amount) VALUES ('bk_split_coop', 'usr_sita', 2200)`,
    );

    run(
      `INSERT INTO saved_equipment (user_id, equipment_id, created_at) VALUES ('usr_ramesh', 'eq_rotavator_mahesh', ?)`,
      now,
    );
    run(
      `INSERT INTO saved_equipment (user_id, equipment_id, created_at) VALUES ('usr_ramesh', 'eq_harvester_kheda', ?)`,
      now,
    );

    notify(
      'nt_mahesh',
      'usr_mahesh',
      'BOOKING_REQUEST',
      { equipmentName: '6-foot Rotavator', renterName: 'Anand Mahila Cooperative', startDate: splitStart, endDate: splitEnd, bookingId: 'bk_split_coop' },
      false,
      now,
    );
    notify(
      'nt_kheda',
      'usr_kheda',
      'BOOKING_REQUEST',
      { equipmentName: 'Combine Harvester', renterName: 'Sita Ben Parmar', startDate: pendingStart, endDate: pendingEnd, bookingId: 'bk_pending_sita' },
      false,
      now,
    );
    notify(
      'nt_ramesh',
      'usr_ramesh',
      'BOOKING_ACCEPTED',
      { equipmentName: 'Power Sprayer', ownerName: 'Jayesh Chauhan', startDate: soonStart, endDate: soonEnd, bookingId: 'bk_soon_ramesh' },
      false,
      now,
    );
    notify(
      'nt_sita',
      'usr_sita',
      'BOOKING_SENT',
      { equipmentName: 'Combine Harvester', ownerName: 'Kheda Custom Hiring Center', startDate: pendingStart, endDate: pendingEnd, bookingId: 'bk_pending_sita' },
      false,
      now,
    );
  });

  const count = all('SELECT id FROM equipment').length;
  console.log(`Seeded FarmShare with ${users.length} people and ${count} machines around Anand, Gujarat.`);
}
