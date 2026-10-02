import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { onRefresh } from '../bus';
import BookingSheet from '../components/BookingSheet';
import EquipmentCard from '../components/EquipmentCard';
import { errorText } from '../i18n';
import { Alert, EquipGlyph, ImpactStrip, locate, Sheet, Toast, TYPES, todayISO, useLang } from '../ui';

const MapPanel = lazy(() => import('../components/MapPanel'));

export default function FarmerHome({ embedded = false }) {
  const { t, lang } = useLang();
  const { user, updateUser } = useAuth();
  const [radius, setRadius] = useState(25);
  const [type, setType] = useState('');
  const [price, setPrice] = useState('any');
  const [operator, setOperator] = useState('any');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [toast, setToast] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => onRefresh(() => setTick((value) => value + 1)), []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (user.lat == null) {
      setLoading(false);
      setItems([]);
      return undefined;
    }
    const params = new URLSearchParams({ lat: user.lat, lng: user.lng, radius });
    if (type) params.set('type', type);
    if (operator === 'yes') params.set('operator', '1');
    if (operator === 'no') params.set('operator', '0');
    if (price === 'low') params.set('maxPrice', '2000');
    if (price === 'mid') { params.set('minPrice', '2000'); params.set('maxPrice', '5000'); }
    if (price === 'high') params.set('minPrice', '5001');
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    let gone = false;
    setLoading(true);
    api(`/api/equipment?${params}`)
      .then((data) => { if (!gone) setItems(data.items); })
      .catch((err) => { if (!gone) setError(errorText(lang, err)); })
      .finally(() => { if (!gone) setLoading(false); });
    return () => { gone = true; };
  }, [user.lat, user.lng, radius, type, price, operator, from, to, tick, lang]);

  const exampleDays = from && to && to >= from
    ? Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000) + 1
    : 2;
  const extraFilters = price !== 'any' || operator !== 'any' || from || to;

  function saveLocation() {
    locate(async (lat, lng) => {
      const data = await api('/api/me', { method: 'PUT', body: { ...user, lat, lng } });
      updateUser(data.user);
      setToast(t('locationSaved'));
    }, () => setError(t('locationFailed')));
  }

  return (
    <div className="grid gap-4">
      {!embedded && (
        <>
          <h1 className="text-3xl font-extrabold">{t('hello', { name: user.name.split(' ')[0] })}</h1>
          <ImpactStrip />
        </>
      )}
      {embedded && <h2 className="text-2xl font-extrabold">{t('nearby')}</h2>}
      {user.lat == null && (
        <section className="card grid gap-3">
          <h2 className="text-2xl font-extrabold">{t('setLocation')}</h2>
          <p>{t('locationMissing')}</p>
          <button type="button" className="btn-primary" onClick={saveLocation}>{t('useLocation')}</button>
        </section>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" className={`min-h-14 shrink-0 rounded-2xl px-3 font-extrabold ${type === '' ? 'bg-leaf text-white' : 'bg-white'}`} onClick={() => setType('')}>{t('allTypes')}</button>
        {TYPES.map((item) => (
          <button key={item} type="button" className={`flex min-h-14 shrink-0 items-center gap-2 rounded-2xl px-3 font-extrabold ${type === item ? 'bg-leaf text-white' : 'bg-white'}`} onClick={() => setType(item)}>
            <EquipGlyph type={item} size={32} />
            {t(`type_${item}`)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[5, 10, 25, 50].map((km) => (
          <button key={km} type="button" className={`min-h-14 rounded-2xl font-extrabold ${radius === km ? 'bg-leaf text-white' : 'bg-white'}`} onClick={() => setRadius(km)}>{km} {t('km')}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost" onClick={() => setFiltersOpen(true)}>{t('moreFilters')}{extraFilters ? ` · ${t('filterOn')}` : ''}</button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={view === 'list' ? 'btn-primary' : 'btn-ghost'} onClick={() => setView('list')}>{t('list')}</button>
          <button type="button" className={view === 'map' ? 'btn-primary' : 'btn-ghost'} onClick={() => setView('map')}>{t('map')}</button>
        </div>
      </div>
      <p className="text-lg font-bold">{loading ? t('loading') : t('results', { count: items.length, km: radius })} · {t('sortNote')}</p>
      <Alert>{error}</Alert>
      {view === 'map' && user.lat != null && (
        <Suspense fallback={<p className="text-xl font-extrabold">{t('loadingMap')}</p>}>
          <MapPanel items={items} lat={user.lat} lng={user.lng} radius={radius} onBook={(item) => (item.ownerId === user.id ? setToast(t('notYourMachine')) : setBooking(item))} />
          <p className="text-base">{t('mapHint')}</p>
        </Suspense>
      )}
      {!loading && items.length === 0 && user.lat != null && (
        <div className="card grid gap-3">
          <p className="text-xl font-extrabold">{t('noResults')}</p>
          <button type="button" className="btn-primary" onClick={() => setRadius(50)}>{t('wider')}</button>
        </div>
      )}
      <div className={view === 'map' ? 'flex gap-3 overflow-x-auto' : 'grid gap-4'}>
        {items.map((item) => (
          <div key={item.id} className={view === 'map' ? 'w-72 shrink-0' : ''}>
            <EquipmentCard
              item={item}
              compact={view === 'map'}
              exampleDays={exampleDays}
              onBook={(item) => (item.ownerId === user.id ? setToast(t('notYourMachine')) : setBooking(item))}
              onToast={setToast}
            />
          </div>
        ))}
      </div>
      <BookingSheet item={booking} onClose={() => setBooking(null)} />
      <Sheet open={filtersOpen} title={t('filters')} onClose={() => setFiltersOpen(false)}>
        <div className="grid gap-3">
          <p className="font-extrabold">{t('price')}</p>
          <div className="grid gap-2">
            {[['any', 'any'], ['low', 'priceLow'], ['mid', 'priceMid'], ['high', 'priceHigh']].map(([id, label]) => (
              <button key={id} type="button" className={price === id ? 'btn-primary' : 'btn-ghost'} onClick={() => setPrice(id)}>{t(label)}</button>
            ))}
          </div>
          <p className="font-extrabold">{t('operatorQ')}</p>
          <div className="grid gap-2">
            {[['any', 'any'], ['yes', 'withOp'], ['no', 'withoutOp']].map(([id, label]) => (
              <button key={id} type="button" className={operator === id ? 'btn-primary' : 'btn-ghost'} onClick={() => setOperator(id)}>{t(label)}</button>
            ))}
          </div>
          <p className="text-base">{t('dateOptional')}</p>
          <label className="block"><span className="label">{t('from')}</span>
            <input className="field" type="date" min={todayISO()} value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="block"><span className="label">{t('to')}</span>
            <input className="field" type="date" min={from || todayISO()} value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <button type="button" className="btn-ghost" onClick={() => { setPrice('any'); setOperator('any'); setFrom(''); setTo(''); }}>{t('clear')}</button>
          <button type="button" className="btn-primary" onClick={() => setFiltersOpen(false)}>{t('gotIt')}</button>
        </div>
      </Sheet>
      <Toast message={toast} />
    </div>
  );
}
