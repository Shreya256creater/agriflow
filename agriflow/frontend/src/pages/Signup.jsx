import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { errorText } from '../i18n';
import { Alert, locate, PlaceFields, useLang } from '../ui';

const emptyPlace = { state: 'Gujarat', district: '', village: '' };

export default function Signup() {
  const { t, lang } = useLang();
  const { user, ready, signUp } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', password: '', role: 'farmer', ...emptyPlace, lat: null, lng: null,
  });

  if (!ready) return <p className="px-4 py-16 text-center text-2xl font-extrabold text-navy">AgriFlow</p>;
  if (user) return <Navigate to="/rent" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim() || !form.village.trim() || !form.district.trim() || !form.state) {
      setError(t('fillAll'));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))) { setError(t('badPhone')); return; }
    if (form.password.length < 6) { setError(t('shortPass')); return; }
    setBusy(true);
    try { await signUp(form); }
    catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto grid max-w-lg gap-4 px-4 py-10">
      <h1 className="font-serif text-5xl text-navy">{t('signupTitle')}</h1>
      <p className="text-lg">{t('signupHelp')}</p>
      <form className="grid gap-3 rounded-3xl bg-white p-5 shadow-md" onSubmit={submit}>
        <label className="block"><span className="label">{t('fullName')}</span>
          <input className="field" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="block"><span className="label">{t('phone')}</span>
          <input className="field" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </label>
        <label className="block"><span className="label">{t('password')}</span>
          <input className="field" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <PlaceFields
          state={form.state}
          district={form.district}
          village={form.village}
          lang={lang}
          t={t}
          onChange={(place) => setForm((current) => ({ ...current, ...place }))}
        />
        <fieldset className="grid gap-2">
          <legend className="label">{t('role')}</legend>
          {['farmer', 'owner', 'cooperative'].map((role) => (
            <button key={role} type="button" className={form.role === role ? 'btn-primary' : 'btn-ghost'} onClick={() => setForm({ ...form, role })}>
              {t(role)}
            </button>
          ))}
        </fieldset>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setLocating(true);
            locate(
              (lat, lng) => { setForm((current) => ({ ...current, lat, lng })); setLocating(false); },
              () => { setError(t('locationFailed')); setLocating(false); },
            );
          }}
        >
          {locating ? t('locating') : t('useLocation')}
        </button>
        {form.lat != null && <p className="font-bold">{t('locationSaved')}: {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</p>}
        <Alert>{error}</Alert>
        <button className="btn-primary" disabled={busy} type="submit">{busy ? t('pleaseWait') : t('signUp')}</button>
        <Link className="text-center text-lg font-extrabold text-blue" to="/login">{t('haveAccount')}</Link>
      </form>
    </div>
  );
}
