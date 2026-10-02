import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { errorText } from '../i18n';
import { Alert, ImpactStrip, LangToggle, locate, PlaceFields, useLang } from '../ui';

const DEMOS = [
  ['9800000001', 'demoFarmer'],
  ['9800000011', 'demoOwner'],
  ['9800000021', 'demoCoop'],
];

const emptyPlace = { state: 'Gujarat', district: '', village: '' };

export default function Landing() {
  const { t, lang } = useLang();
  const { user, ready, signIn, signUp } = useAuth();
  const [mode, setMode] = useState('in');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [code, setCode] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', role: '', ...emptyPlace, lat: null, lng: null,
  });
  const [locating, setLocating] = useState(false);

  useEffect(() => { setError(''); setInfo(''); }, [mode, lang]);

  if (!ready) return <div className="grid min-h-screen place-items-center bg-cream text-3xl font-extrabold">FarmShare</div>;
  if (user) return <Navigate to="/home" replace />;

  async function submitIn(event) {
    event.preventDefault();
    setError('');
    if (!login.trim() || !password) { setError(t('fillAll')); return; }
    setBusy(true);
    try { await signIn(login.trim(), password); }
    catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  async function submitUp(event) {
    event.preventDefault();
    setError('');
    if (!form.role) { setError(t('chooseRole')); return; }
    if (!form.name.trim() || !form.phone.trim() || !form.village.trim() || !form.district.trim() || !form.state) {
      setError(t('fillAll')); return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))) { setError(t('badPhone')); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError(t('badEmail')); return; }
    if (form.password.length < 6) { setError(t('shortPass')); return; }
    setBusy(true);
    try { await signUp(form); }
    catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  async function askCode(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await (await import('../api')).api('/api/auth/forgot', { method: 'POST', body: { phone: resetPhone } });
      setCode(data.demoCode);
      setInfo(t('demoNote'));
    } catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  async function submitReset(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await (await import('../api')).api('/api/auth/reset', { method: 'POST', body: { phone: resetPhone, code: resetCode, password: resetPassword } });
      setMode('in');
      setInfo(t('resetDone'));
      setCode('');
    } catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  function useDemo(phone) {
    setLogin(phone);
    setPassword('demo123');
    setMode('in');
    setBusy(true);
    signIn(phone, 'demo123').catch((err) => setError(errorText(lang, err))).finally(() => setBusy(false));
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-cream">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-leafDark px-3 py-3 text-white">
        <div className="text-2xl font-extrabold">FarmShare</div>
        <LangToggle />
      </header>
      <main className="grid gap-4 px-4 py-5">
        <p className="text-base font-extrabold uppercase tracking-wide text-leaf">{t('madeFor')}</p>
        <h1 className="text-4xl font-extrabold leading-tight">{t('tagline')}</h1>
        <p className="text-lg">{t('problem')}</p>
        <ol className="grid gap-3">
          {[['find', 'findHelp'], ['book', 'bookHelp'], ['farm', 'farmHelp']].map(([title, help], index) => (
            <li key={title} className="card flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-wheat text-2xl font-extrabold text-ink">{index + 1}</span>
              <span>
                <span className="block text-xl font-extrabold">{t(title)}</span>
                <span className="block text-lg">{t(help)}</span>
              </span>
            </li>
          ))}
        </ol>
        <ImpactStrip />
        <p className="text-base text-soil">{t('liveNumbers')}</p>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={mode === 'in' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('in')}>{t('signIn')}</button>
          <button type="button" className={mode === 'up' ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode('up')}>{t('signUp')}</button>
        </div>

        {mode === 'in' && (
          <form className="grid gap-3" onSubmit={submitIn}>
            <h2 className="text-2xl font-extrabold">{t('welcomeBack')}</h2>
            <label className="block"><span className="label">{t('phoneOrEmail')}</span>
              <input className="field" autoComplete="username" value={login} onChange={(event) => setLogin(event.target.value)} />
            </label>
            <label className="block"><span className="label">{t('password')}</span>
              <span className="flex gap-2">
                <input className="field" type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                <button type="button" className="btn-ghost w-28" onClick={() => setShowPass((value) => !value)}>{showPass ? t('hide') : t('show')}</button>
              </span>
            </label>
            <button type="button" className="text-left text-lg font-extrabold text-leaf underline" onClick={() => setMode('forgot')}>{t('forgot')}</button>
            {info && <p className="rounded-2xl bg-mist px-3 py-2 font-bold">{info}</p>}
            <Alert>{error}</Alert>
            <button className="btn-primary" disabled={busy} type="submit">{busy ? t('pleaseWait') : t('signIn')}</button>
          </form>
        )}

        {mode === 'up' && (
          <form className="grid gap-3" onSubmit={submitUp}>
            <h2 className="text-2xl font-extrabold">{t('create')}</h2>
            <fieldset className="grid gap-2">
              <legend className="label">{t('role')}</legend>
              {[['farmer', 'roleFarmerHelp'], ['owner', 'roleOwnerHelp'], ['cooperative', 'roleCoopHelp']].map(([role, help]) => (
                <label key={role} className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-3 ${form.role === role ? 'border-leaf bg-mist' : 'border-[#C5D2C2] bg-white'}`}>
                  <input type="radio" className="h-6 w-6" name="role" checked={form.role === role} onChange={() => setForm({ ...form, role })} />
                  <span><span className="block text-lg font-extrabold">{t(role)}</span><span className="block text-base">{t(help)}</span></span>
                </label>
              ))}
            </fieldset>
            <label className="block"><span className="label">{t('fullName')}</span>
              <input className="field" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="block"><span className="label">{t('phone')}</span>
              <input className="field" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label className="block"><span className="label">{t('emailOptional')}</span>
              <input className="field" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="block"><span className="label">{t('password')}</span>
              <input className="field" type={showPass ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            <button type="button" className="text-left text-lg font-extrabold text-leaf" onClick={() => setShowPass((value) => !value)}>{showPass ? t('hide') : t('show')}</button>
            <h3 className="text-xl font-extrabold">{t('where')}</h3>
            <p className="text-base">{t('locHelp')}</p>
            <PlaceFields state={form.state} district={form.district} village={form.village} lang={lang} t={t} onChange={(place) => setForm({ ...form, ...place })} />
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setLocating(true);
                locate(
                  (lat, lng) => { setForm((current) => ({ ...current, lat, lng })); setInfo(t('locationSaved')); setLocating(false); },
                  () => { setError(t('locationFailed')); setLocating(false); },
                );
              }}
            >
              {locating ? t('locating') : t('useLocation')}
            </button>
            {form.lat != null && <p className="font-bold">{t('locationSaved')}: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</p>}
            <Alert>{error}</Alert>
            <button className="btn-primary" disabled={busy} type="submit">{busy ? t('pleaseWait') : t('create')}</button>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="grid gap-3" onSubmit={code ? submitReset : askCode}>
            <h2 className="text-2xl font-extrabold">{t('forgotTitle')}</h2>
            <p>{t('forgotHelp')}</p>
            <label className="block"><span className="label">{t('phone')}</span>
              <input className="field" inputMode="numeric" value={resetPhone} onChange={(event) => setResetPhone(event.target.value)} />
            </label>
            {code && (
              <>
                <p className="rounded-2xl bg-wheat px-3 py-3 text-2xl font-extrabold">{t('codeIs', { code })}</p>
                <p>{t('demoNote')}</p>
                <label className="block"><span className="label">{t('resetCode')}</span>
                  <input className="field" inputMode="numeric" value={resetCode} onChange={(event) => setResetCode(event.target.value)} />
                </label>
                <label className="block"><span className="label">{t('newPassword')}</span>
                  <input className="field" type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
                </label>
              </>
            )}
            <Alert>{error}</Alert>
            <button className="btn-primary" disabled={busy} type="submit">{busy ? t('pleaseWait') : code ? t('setNewPassword') : t('enter')}</button>
            <button type="button" className="btn-ghost" onClick={() => { setMode('in'); setCode(''); }}>{t('backToSignIn')}</button>
          </form>
        )}

        <section className="grid gap-2">
          <h2 className="text-2xl font-extrabold">{t('tryDemo')}</h2>
          <p>{t('passwordDemo')}</p>
          {DEMOS.map(([phone, label]) => (
            <button key={phone} type="button" className="btn-ghost" onClick={() => useDemo(phone)}>{t(label)} · {phone}</button>
          ))}
          <p className="text-base">{t('andMore')}</p>
        </section>
      </main>
    </div>
  );
}
