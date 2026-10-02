import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { emitRefresh } from '../bus';
import { errorText } from '../i18n';
import { Alert, Confirm, EquipGlyph, fileToJpeg, locate, Toast, TYPES, todayISO, useLang } from '../ui';

const blank = {
  name: '',
  type: 'tractor',
  condition: 'good',
  pricePerHour: '',
  pricePerDay: '',
  operatorIncluded: true,
  village: '',
  lat: null,
  lng: null,
  availableFrom: todayISO(),
  availableTo: '',
  photos: [],
};

export default function Machines() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const formMode = location.pathname.endsWith('/new') || Boolean(id);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...blank, village: user.village, lat: user.lat, lng: user.lng });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [removeId, setRemoveId] = useState('');

  function load() {
    api('/api/equipment/mine').then((data) => setItems(data.items)).catch(() => {});
  }

  useEffect(() => {
    if (!formMode) load();
  }, [formMode]);

  useEffect(() => {
    if (!id) return undefined;
    api(`/api/equipment/${id}`).then(({ item }) => {
      setForm({
        name: item.name,
        type: item.type,
        condition: item.condition,
        pricePerHour: String(item.pricePerHour),
        pricePerDay: String(item.pricePerDay),
        operatorIncluded: item.operatorIncluded,
        village: item.village,
        lat: item.lat,
        lng: item.lng,
        availableFrom: item.availableFrom || '',
        availableTo: item.availableTo || '',
        photos: item.photos || [],
      });
    }).catch((err) => setError(errorText(lang, err)));
    return undefined;
  }, [id, lang]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function save(event) {
    event.preventDefault();
    setError('');
    const pricePerHour = Number(form.pricePerHour);
    const pricePerDay = Number(form.pricePerDay);
    if (!form.name.trim() || !form.village.trim()) { setError(t('fillAll')); return; }
    if (!Number.isInteger(pricePerHour) || pricePerHour < 1 || !Number.isInteger(pricePerDay) || pricePerDay < 1) {
      setError(t('err_VALIDATION')); return;
    }
    if (form.lat == null || form.lng == null) { setError(t('err_LOCATION')); return; }
    setBusy(true);
    try {
      const body = { ...form, pricePerHour, pricePerDay, availableFrom: form.availableFrom || null, availableTo: form.availableTo || null };
      if (id) await api(`/api/equipment/${id}`, { method: 'PUT', body });
      else await api('/api/equipment', { method: 'POST', body });
      emitRefresh();
      navigate('/machines');
    } catch (err) {
      setError(errorText(lang, err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item) {
    await api(`/api/equipment/${item.id}/availability`, { method: 'PATCH', body: { isAvailable: !item.isAvailable } });
    setToast(item.isAvailable ? t('hiddenNow') : t('shownNow'));
    emitRefresh();
    load();
  }

  async function remove() {
    try {
      await api(`/api/equipment/${removeId}`, { method: 'DELETE' });
      setToast(t('deleted'));
      emitRefresh();
      setRemoveId('');
      load();
    } catch (err) {
      setRemoveId('');
      setError(errorText(lang, err));
    }
  }

  async function addPhoto(file) {
    try {
      const photo = await fileToJpeg(file);
      setForm((current) => ({ ...current, photos: [photo] }));
    } catch (err) {
      setError(t(err.message === 'photoBig' ? 'photoBig' : 'photoBad'));
    }
  }

  if (formMode) {
    return (
      <form className="grid gap-3" onSubmit={save}>
        <h1 className="text-3xl font-extrabold">{id ? t('edit') : t('addMachine')}</h1>
        <label className="block"><span className="label">{t('machineName')}</span>
          <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <p className="label">{t('type')}</p>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((type) => (
            <button key={type} type="button" className={`flex min-h-14 items-center gap-2 rounded-2xl px-2 font-extrabold ${form.type === type ? 'bg-leaf text-white' : 'bg-white'}`} onClick={() => setForm({ ...form, type })}>
              <EquipGlyph type={type} size={32} /> {t(`type_${type}`)}
            </button>
          ))}
        </div>
        <label className="block"><span className="label">{t('condition')}</span>
          <select className="field" value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })}>
            <option value="good">{t('good')}</option>
            <option value="fair">{t('fair')}</option>
            <option value="repair">{t('repair')}</option>
          </select>
        </label>
        <label className="block"><span className="label">{t('priceHour')}</span>
          <input className="field" inputMode="numeric" value={form.pricePerHour} onChange={(event) => setForm({ ...form, pricePerHour: event.target.value.replace(/\D/g, '') })} />
        </label>
        <label className="block"><span className="label">{t('priceDay')}</span>
          <input className="field" inputMode="numeric" value={form.pricePerDay} onChange={(event) => setForm({ ...form, pricePerDay: event.target.value.replace(/\D/g, '') })} />
        </label>
        <p className="label">{t('operatorQ')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={form.operatorIncluded ? 'btn-primary' : 'btn-ghost'} onClick={() => setForm({ ...form, operatorIncluded: true })}>{t('yes')}</button>
          <button type="button" className={!form.operatorIncluded ? 'btn-primary' : 'btn-ghost'} onClick={() => setForm({ ...form, operatorIncluded: false })}>{t('no')}</button>
        </div>
        <label className="block"><span className="label">{t('pickup')}</span>
          <input className="field" value={form.village} onChange={(event) => setForm({ ...form, village: event.target.value })} />
        </label>
        <p className="text-base">{t('pickupHelp')}</p>
        <button type="button" className="btn-ghost" onClick={() => locate((lat, lng) => setForm((current) => ({ ...current, lat, lng })), () => setError(t('locationFailed')))}>
          {t('useLocation')}
        </button>
        {form.lat != null && <p className="font-bold">{t('locationSaved')}: {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</p>}
        <label className="block"><span className="label">{t('availableFrom')}</span>
          <input className="field" type="date" value={form.availableFrom} onChange={(event) => setForm({ ...form, availableFrom: event.target.value })} />
        </label>
        <label className="block"><span className="label">{t('availableTo')}</span>
          <input className="field" type="date" value={form.availableTo} onChange={(event) => setForm({ ...form, availableTo: event.target.value })} />
        </label>
        <p className="text-base">{t('availHelp')}</p>
        <label className="block"><span className="label">{t('photos')}</span>
          <input className="field py-3" type="file" accept="image/*" onChange={(event) => addPhoto(event.target.files?.[0])} />
        </label>
        <p className="text-base">{t('photoHelp')}</p>
        {form.photos[0] && (
          <div className="grid gap-2">
            <img src={form.photos[0]} alt="" className="h-40 w-full rounded-2xl object-cover" />
            <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, photos: [] })}>{t('removePhoto')}</button>
          </div>
        )}
        <Alert>{error}</Alert>
        <button className="btn-primary" disabled={busy} type="submit">{busy ? t('pleaseWait') : t('saveMachine')}</button>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{t('myMachines')}</h1>
      <Link className="btn-primary" to="/machines/new">{t('addMachine')}</Link>
      <Alert>{error}</Alert>
      {items.length === 0 && <p className="text-lg">{t('noMachines')}</p>}
      {items.map((item) => (
        <article key={item.id} className="card grid gap-3">
          <div className="flex items-center gap-2">
            <EquipGlyph type={item.type} />
            <div>
              <h2 className="text-xl font-extrabold">{item.name}</h2>
              <p>{t(`type_${item.type}`)} · {item.isAvailable ? t('available') : t('unavailable')}</p>
            </div>
          </div>
          <button type="button" className={item.isAvailable ? 'btn-ghost' : 'btn-primary'} onClick={() => toggle(item)}>
            {item.isAvailable ? t('turnOff') : t('turnOn')}
          </button>
          <Link className="btn-ghost" to={`/machines/${item.id}`}>{t('edit')}</Link>
          <button type="button" className="btn-clay" onClick={() => setRemoveId(item.id)}>{t('delete')}</button>
        </article>
      ))}
      <Confirm open={!!removeId} title={t('deleteAsk')} body="" yesLabel={t('yesDelete')} noLabel={t('keepMachine')} danger onYes={remove} onNo={() => setRemoveId('')} />
      <Toast message={toast} />
    </div>
  );
}
