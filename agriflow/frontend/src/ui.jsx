import { createContext, useContext, useEffect, useState } from 'react';
import { translate } from './i18n';
import { districtLabel, districtOptions, stateLabel, stateOptions, villageLabel, villageOptions } from './places';

const LangContext = createContext(null);

function guessLang() {
  const saved = localStorage.getItem('agriflow_lang') || localStorage.getItem('farmshare_lang');
  if (saved === 'hi') return 'hi';
  if ((navigator.language || '').startsWith('hi')) return 'hi';
  return 'en';
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(guessLang);
  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  }, [lang]);
  function setLang(next) {
    const value = next === 'hi' ? 'hi' : 'en';
    setLangState(value);
    localStorage.setItem('agriflow_lang', value);
  }
  const t = (key, vars) => translate(lang, key, vars);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  const items = [
    ['en', 'English'],
    ['hi', 'हिन्दी'],
  ];
  return (
    <div role="group" aria-label="Language" className="flex rounded-full bg-[#E7F1FA] p-1">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={lang === id}
          onClick={() => setLang(id)}
          className={`min-h-11 rounded-full px-3 text-base font-extrabold text-navy ${lang === id ? 'bg-white' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export const TYPES = [
  'tractor', 'harvester', 'seed_drill', 'sprayer', 'rotavator', 'thresher',
  'water_pump', 'cultivator', 'fertiliser_spreader', 'manure_spreader',
  'khurpi', 'knapsack_sprayer', 'drone_sprayer', 'hoe', 'spade', 'digging_rod',
  'mouldboard_plough', 'disc_plough',
];

export const MACHINE_OPTIONS = [
  'tractor', 'harvester', 'seed_drill', 'sprayer', 'rotavator',
  'water_pump', 'cultivator', 'fertiliser_spreader', 'manure_spreader',
  'khurpi', 'knapsack_sprayer', 'drone_sprayer', 'hoe', 'spade', 'digging_rod',
  'mouldboard_plough', 'disc_plough', 'thresher',
];

export const MACHINE_PHOTO = {
  tractor: '/machines/tractor.png',
  harvester: '/machines/harvester.png',
  seed_drill: '/machines/seed_drill.png',
  sprayer: '/machines/sprayer.png',
  rotavator: '/machines/rotavator.png',
  thresher: '/machines/thresher.svg',
  water_pump: '/machines/water_pump.png',
  cultivator: '/machines/cultivator.png',
  fertiliser_spreader: '/machines/fertiliser_spreader.png',
  manure_spreader: '/machines/manure_spreader.png',
  khurpi: '/machines/khurpi.png',
  knapsack_sprayer: '/machines/knapsack_sprayer.png',
  drone_sprayer: '/machines/drone_sprayer.png',
  hoe: '/machines/hoe.png',
  spade: '/machines/spade.png',
  digging_rod: '/machines/digging_rod.png',
  mouldboard_plough: '/machines/mouldboard_plough.png',
  disc_plough: '/machines/disc_plough.png',
};

export const TYPE_COLOR = {
  tractor: '#1B6CA8',
  harvester: '#0E3A5C',
  seed_drill: '#3D87C4',
  sprayer: '#14507A',
  rotavator: '#2A6F9A',
  thresher: '#0A2C46',
};

export function EquipGlyph({ type, size = 36 }) {
  const color = TYPE_COLOR[type] || '#1F6B45';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill={color} />
      {type === 'tractor' && <path d="M10 30h8l4-8h10l6 8h4v4H10v-4zm6 6a3 3 0 1 0 0.1 0M34 36a4 4 0 1 0 0.1 0" stroke="white" strokeWidth="2" fill="none" />}
      {type === 'harvester' && <path d="M8 28h14l4-8h16v10H8v-2zm6 6h16" stroke="white" strokeWidth="2" fill="none" />}
      {type === 'seed_drill' && <path d="M12 22h24M16 22v10M22 22v10M28 22v10M34 22v10M20 14h8l3 8H17l3-8z" stroke="white" strokeWidth="2" fill="none" />}
      {type === 'sprayer' && <path d="M14 28c0-6 6-10 12-8 4 1 6 4 6 8H14zm18-2h10M38 20c2 2 2 6 0 8" stroke="white" strokeWidth="2" fill="none" />}
      {type === 'rotavator' && <path d="M10 24h28v6H10zM14 34a4 4 0 1 0 0.1 0M24 34a4 4 0 1 0 0.1 0M34 34a4 4 0 1 0 0.1 0" stroke="white" strokeWidth="2" fill="none" />}
      {type === 'thresher' && <ellipse cx="24" cy="26" rx="14" ry="8" stroke="white" strokeWidth="2" fill="none" />}
    </svg>
  );
}

export function inr(value) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0))}`;
}

function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return formatISO(new Date());
}

export function addDays(iso, count) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + count);
  return formatISO(date);
}

export function daysInclusive(start, end) {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  return Math.round((b - a) / 86400000) + 1;
}

export function dayLabel(t, days) {
  return days === 1 ? t('oneDay') : t('manyDays', { count: days });
}

export function rentWindowText(t, item) {
  if (!item?.isAvailable || item.rentableDays === 0) return t('notAvailable');
  if (item.rentableDays == null) return t('openDates');
  return dayLabel(t, item.rentableDays);
}

export function prettyDate(iso, lang) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const locale = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
}

export function formatKm(km) {
  if (km == null) return '';
  return km < 10 ? (Math.round(km * 10) / 10).toFixed(1) : String(Math.round(km));
}

export function Stars({ value, label }) {
  const full = Math.round(Number(value) || 0);
  return (
    <span aria-label={label} className="text-xl tracking-tight text-[#C8922A]">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= full ? '' : 'text-[#D9D3C6]'}>★</span>
      ))}
    </span>
  );
}

export function Sheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-cream p-4 pb-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-12 min-w-12 rounded-full bg-white text-xl font-extrabold" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, yesLabel, noLabel, onYes, onNo, danger }) {
  return (
    <Sheet open={open} title={title} onClose={onNo}>
      <p className="text-lg">{body}</p>
      <div className="mt-4 grid gap-3">
        <button type="button" className={danger ? 'btn-clay' : 'btn-primary'} onClick={onYes}>{yesLabel}</button>
        <button type="button" className="btn-ghost" onClick={onNo}>{noLabel}</button>
      </div>
    </Sheet>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-24 left-1/2 z-50 w-[min(100%-1.5rem,32rem)] -translate-x-1/2 rounded-2xl bg-ink px-4 py-3 text-center text-lg font-bold text-white">
      {message}
    </div>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return <p role="alert" className="rounded-2xl bg-[#F8E4DE] px-4 py-3 text-lg font-bold text-clay">{children}</p>;
}

export function StatusPill({ status, t }) {
  const tones = {
    pending: 'bg-[#F8E8C8] text-[#6A4B10]',
    confirmed: 'bg-mist text-leafDark',
    completed: 'bg-[#E7EEF8] text-[#1E3A5F]',
    cancelled: 'bg-[#F8E4DE] text-clay',
  };
  return <span className={`inline-flex min-h-10 items-center rounded-full px-3 text-base font-extrabold ${tones[status] || ''}`}>{t(status)}</span>;
}

export function ImpactStrip() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  useEffect(() => {
    let gone = false;
    import('./api').then(({ api }) => api('/api/impact').then((impact) => {
      if (!gone) setData(impact);
    }).catch(() => {}));
    return () => {
      gone = true;
    };
  }, []);
  if (!data) return null;
  const cells = [
    [t('impactFarmers'), data.farmersServed],
    [t('impactHours'), data.machineHours],
    [t('impactSaved'), inr(data.moneySaved)],
  ];
  return (
    <section className="card bg-[#E7F1FA] text-navy">
      <h2 className="text-xl font-extrabold">{t('impactTitle')}</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {cells.map(([label, value]) => (
          <div key={label}>
            <div className="text-2xl font-extrabold leading-none">{value}</div>
            <div className="mt-1 text-base leading-tight text-navy">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-base">{t('impactOwnerEarn')}: {inr(data.ownerEarnings)}</p>
      <p className="mt-2 text-base leading-snug text-navy">{t('impactNote')}</p>
    </section>
  );
}

export function PlaceFields({ state, district, village, onChange, t, lang }) {
  const districts = districtOptions(state);
  const villages = villageOptions();
  const [districtOther, setDistrictOther] = useState(Boolean(district) && !districts.includes(district));
  const [villageOther, setVillageOther] = useState(Boolean(village) && !villages.includes(village));

  useEffect(() => {
    if (district && !districtOptions(state).includes(district)) setDistrictOther(true);
    if (district && districtOptions(state).includes(district)) setDistrictOther(false);
  }, [district, state]);
  useEffect(() => {
    if (village && !villageOptions().includes(village)) setVillageOther(true);
    if (village && villageOptions().includes(village)) setVillageOther(false);
  }, [village]);

  return (
    <div className="grid gap-3">
      <label className="block">
        <span className="label">{t('state')}</span>
        <select className="field" value={state} onChange={(event) => { setDistrictOther(false); setVillageOther(false); onChange({ state: event.target.value, district: '', village: '' }); }}>
          <option value="">{t('state')}</option>
          {stateOptions().map((name) => <option key={name} value={name}>{stateLabel(lang, name)}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="label">{t('district')}</span>
        <select
          className="field"
          value={districtOther ? 'Other' : district}
          onChange={(event) => {
            const next = event.target.value;
            if (next === 'Other') {
              setDistrictOther(true);
              onChange({ state, district: '', village });
            } else {
              setDistrictOther(false);
              onChange({ state, district: next, village });
            }
          }}
        >
          <option value="">{t('district')}</option>
          {districts.map((name) => <option key={name} value={name}>{districtLabel(lang, name)}</option>)}
          <option value="Other">{t('other')}</option>
        </select>
      </label>
      {districtOther && (
        <label className="block">
          <span className="label">{t('writeHere')}</span>
          <input className="field" value={district} onChange={(event) => onChange({ state, district: event.target.value, village })} />
        </label>
      )}
      <label className="block">
        <span className="label">{t('village')}</span>
        <select
          className="field"
          value={villageOther ? 'Other' : village}
          onChange={(event) => {
            const next = event.target.value;
            if (next === 'Other') {
              setVillageOther(true);
              onChange({ state, district, village: '' });
            } else {
              setVillageOther(false);
              onChange({ state, district, village: next });
            }
          }}
        >
          <option value="">{t('village')}</option>
          {villages.map((name) => <option key={name} value={name}>{villageLabel(lang, name)}</option>)}
          <option value="Other">{t('other')}</option>
        </select>
      </label>
      {villageOther && (
        <label className="block">
          <span className="label">{t('writeHere')}</span>
          <input className="field" value={village} onChange={(event) => onChange({ state, district, village: event.target.value })} />
        </label>
      )}
    </div>
  );
}

export function locate(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => onSuccess(position.coords.latitude, position.coords.longitude),
    () => onError(),
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
  );
}

export function fileToJpeg(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('photoBad'));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const data = canvas.toDataURL('image/jpeg', 0.72);
      if (data.length > 500000) reject(new Error('photoBig'));
      else resolve(data);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('photoBad'));
    };
    image.src = url;
  });
}
