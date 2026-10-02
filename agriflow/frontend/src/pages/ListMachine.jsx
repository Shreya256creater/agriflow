import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { emitRefresh } from '../bus';
import { errorText } from '../i18n';
import { Alert, EquipGlyph, fileToJpeg, inr, locate, Toast, TYPES, todayISO, useLang } from '../ui';

const blank = {
  name: '',
  type: 'tractor',
  condition: 'good',
  pricePerHour: '',
  pricePerDay: '',
  operatorIncluded: false,
  village: '',
  lat: null,
  lng: null,
  availableFrom: todayISO(),
  availableTo: '',
  photos: [],
};

export default function ListMachine() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...blank, village: user.village || '', lat: user.lat, lng: user.lng });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  function load() {
    api('/api/equipment/mine').then((data) => setItems(data.items)).catch(() => {});
  }

  useEffect(() => { load(); }, []);
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
      setError(t('err_VALIDATION'));
      return;
    }
    if (form.lat == null || form.lng == null) { setError(t('err_LOCATION')); return; }
    setBusy(true);
    try {
      await api('/api/equipment', {
        method: 'POST',
        body: { ...form, pricePerHour, pricePerDay, availableFrom: form.availableFrom || null, availableTo: form.availableTo || null },
      });
      setForm({ ...blank, village: user.village || '', lat: user.lat, lng: user.lng });
      setToast(t('savedAdded'));
      emitRefresh();
      load();
    } catch (err) {
      setError(errorText(lang, err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item) {
    await api(`/api/equipment/${item.id}/availability`, { method: 'PATCH', body: { isAvailable: !item.isAvailable } });
    load();
  }

  async function addPhoto(file) {
    try {
      const photo = await fileToJpeg(file);
      setForm((current) => ({ ...current, photos: [photo] }));
    } catch (err) {
      setError(t(err.message === 'photoBig' ? 'photoBig' : 'photoBad'));
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-5xl text-navy">{t('listTitle')}</h1>
        <p className="mt-2 text-lg">{t('listHelp')}</p>
      </div>
      <form className="grid gap-3 rounded-3xl bg-white p-5 shadow-md" onSubmit={save}>
          <h2 className="text-2xl font-extrabold">{t('addMachine')}</h2>
          <label className="block"><span className="label">{t('machineName')}</span>
            <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block"><span className="label">{t('type')}</span>
            <select className="field" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              {TYPES.map((type) => <option key={type} value={type}>{t(`type_${type}`)}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">{t('condition')}</span>
            <select className="field" value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })}>
              <option value="good">{t('good')}</option>
              <option value="fair">{t('fair')}</option>
              <option value="repair">{t('repair')}</option>
            </select>
          </label>
          <label className="block"><span className="label">{t('priceDay')}</span>
            <input className="field" inputMode="numeric" value={form.pricePerDay} onChange={(event) => setForm({ ...form, pricePerDay: event.target.value.replace(/\D/g, '') })} />
          </label>
          <label className="block"><span className="label">{t('priceHour')}</span>
            <input className="field" inputMode="numeric" value={form.pricePerHour} onChange={(event) => setForm({ ...form, pricePerHour: event.target.value.replace(/\D/g, '') })} />
          </label>
          <label className="block"><span className="label">{t('availableFrom')}</span>
            <input className="field" type="date" value={form.availableFrom} onChange={(event) => setForm({ ...form, availableFrom: event.target.value })} />
          </label>
          <label className="block"><span className="label">{t('availableTo')}</span>
            <input className="field" type="date" value={form.availableTo} onChange={(event) => setForm({ ...form, availableTo: event.target.value })} />
          </label>
          <p className="text-base">{t('availHelp')}</p>
          <label className="block"><span className="label">{t('pickup')}</span>
            <input className="field" value={form.village} onChange={(event) => setForm({ ...form, village: event.target.value })} />
          </label>
          <button type="button" className="btn-ghost" onClick={() => locate((lat, lng) => setForm((current) => ({ ...current, lat, lng })), () => setError(t('locationFailed')))}>
            {t('useLocation')}
          </button>
          {form.lat != null && <p className="font-bold">{t('locationSaved')}: {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</p>}
          <label className="block"><span className="label">{t('photos')}</span>
            <input className="field py-3" type="file" accept="image/*" onChange={(event) => addPhoto(event.target.files?.[0])} />
          </label>
          <Alert>{error}</Alert>
          <button className="btn-primary" disabled={busy} type="submit">{busy ? t('pleaseWait') : t('saveMachine')}</button>
        </form>
      <section className="grid gap-3">
        <h2 className="text-2xl font-extrabold">{t('yourMachines')}</h2>
        {items.length === 0 && <p>{t('noMachines')}</p>}
        {items.map((item) => (
          <article key={item.id} className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-md">
            <div className="flex items-center gap-3">
              <EquipGlyph type={item.type} />
              <div>
                <p className="text-lg font-extrabold">{item.name}</p>
                <p className="text-base">{inr(item.pricePerDay)} {t('perDay')} · {item.isAvailable ? t('available') : t('notAvailable')}</p>
              </div>
            </div>
            <button type="button" className="btn-ghost w-auto" onClick={() => toggle(item)}>
              {item.isAvailable ? t('unavailable') : t('available')}
            </button>
          </article>
        ))}
      </section>
      <Toast message={toast} />
    </div>
  );
}
