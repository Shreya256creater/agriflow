export const CATALOG = {
  tractor: { buy: 750000, typical: 4500 },
  harvester: { buy: 2200000, typical: 14000 },
  seed_drill: { buy: 90000, typical: 2000 },
  sprayer: { buy: 55000, typical: 1500 },
  rotavator: { buy: 110000, typical: 2500 },
  thresher: { buy: 140000, typical: 3000 },
  water_pump: { buy: 25000, typical: 800 },
  cultivator: { buy: 80000, typical: 1800 },
  fertiliser_spreader: { buy: 70000, typical: 1500 },
  manure_spreader: { buy: 180000, typical: 3000 },
  khurpi: { buy: 200, typical: 20 },
  knapsack_sprayer: { buy: 2500, typical: 150 },
  drone_sprayer: { buy: 400000, typical: 4000 },
  hoe: { buy: 400, typical: 30 },
  spade: { buy: 500, typical: 30 },
  digging_rod: { buy: 800, typical: 40 },
  mouldboard_plough: { buy: 45000, typical: 1200 },
  disc_plough: { buy: 70000, typical: 1500 },
};

export const PRESETS = [
  'worked_well',
  'on_time',
  'helpful_operator',
  'careful',
  'small_problem',
  'would_again',
];

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isoDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatLocal(date);
}

export function daysInclusive(start, end) {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  return Math.round((b - a) / 86400000) + 1;
}

export function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function normalizePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export function clean(value, max) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

export function parsePhotos(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, 2) : [];
  } catch {
    return [];
  }
}

export function splitAmounts(total, count) {
  const base = Math.floor(total / count);
  const amounts = Array.from({ length: count }, () => base);
  amounts[0] += total - base * count;
  return amounts;
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}
