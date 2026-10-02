import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { errorText } from '../i18n';
import { Alert, useLang } from '../ui';

export default function Login() {
  const { t, lang } = useLang();
  const { user, ready, signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [forgot, setForgot] = useState(false);
  const [code, setCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  if (!ready) return <p className="px-4 py-16 text-center text-2xl font-extrabold text-navy">AgriFlow</p>;
  if (user) return <Navigate to="/rent" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!phone.trim() || !password) { setError(t('fillAll')); return; }
    setBusy(true);
    try { await signIn(phone.trim(), password); }
    catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  async function askCode(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/auth/forgot', { method: 'POST', body: { phone } });
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
      await api('/api/auth/reset', { method: 'POST', body: { phone, code: resetCode, password: resetPassword } });
      setForgot(false);
      setInfo(t('resetDone'));
      setCode('');
    } catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto grid max-w-lg gap-4 px-4 py-10">
      <h1 className="font-serif text-5xl text-navy">{t('loginTitle')}</h1>
      <p className="text-lg">{t('loginHelp')}</p>
      {!forgot && (
        <form className="grid gap-3 rounded-3xl bg-white p-5 shadow-md" onSubmit={submit}>
          <label className="block"><span className="label">{t('phone')}</span>
            <input className="field" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className="block"><span className="label">{t('password')}</span>
            <span className="flex gap-2">
              <input className="field" type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" className="btn-ghost w-28" onClick={() => setShowPass((value) => !value)}>{showPass ? t('hide') : t('show')}</button>
            </span>
          </label>
          <button type="button" className="text-left text-lg font-extrabold text-blue underline" onClick={() => setForgot(true)}>{t('forgot')}</button>
          {info && <p className="rounded-2xl bg-mist px-3 py-2 font-bold">{info}</p>}
          <Alert>{error}</Alert>
          <button className="btn-primary" disabled={busy} type="submit">{busy ? t('pleaseWait') : t('signIn')}</button>
          <p className="text-base text-soil">{t('demoHint')}</p>
          <Link className="text-center text-lg font-extrabold text-blue" to="/signup">{t('needAccount')}</Link>
        </form>
      )}
      {forgot && (
        <form className="grid gap-3 rounded-3xl bg-white p-5 shadow-md" onSubmit={code ? submitReset : askCode}>
          <h2 className="text-2xl font-extrabold">{t('forgotTitle')}</h2>
          <p>{t('forgotHelp')}</p>
          <label className="block"><span className="label">{t('phone')}</span>
            <input className="field" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          {code && <p className="rounded-2xl bg-mist px-3 py-2 text-xl font-extrabold">{t('codeIs', { code })}</p>}
          {info && <p className="text-base">{info}</p>}
          {code && (
            <>
              <label className="block"><span className="label">{t('resetCode')}</span>
                <input className="field" inputMode="numeric" value={resetCode} onChange={(event) => setResetCode(event.target.value)} />
              </label>
              <label className="block"><span className="label">{t('newPassword')}</span>
                <input className="field" type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
              </label>
            </>
          )}
          <Alert>{error}</Alert>
          <button className="btn-primary" disabled={busy} type="submit">{busy ? t('pleaseWait') : code ? t('setNewPassword') : t('forgotTitle')}</button>
          <button type="button" className="btn-ghost" onClick={() => { setForgot(false); setError(''); }}>{t('haveAccount')}</button>
        </form>
      )}
    </div>
  );
}
