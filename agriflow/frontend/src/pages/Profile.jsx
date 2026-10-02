import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { errorText } from '../i18n';
import { Alert, Confirm, locate, PlaceFields, useLang } from '../ui';

export default function Profile() {
  const { t, lang } = useLang();
  const { user, updateUser } = useAuth();
  const { askOut } = useOutletContext();
  const [form, setForm] = useState({
    name: user.name, email: user.email || '', village: user.village, district: user.district, state: user.state, lat: user.lat, lng: user.lng,
  });
  const [password, setPassword] = useState({ currentPassword: '', password: '' });
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [removeId, setRemoveId] = useState('');

  useEffect(() => {
    if (user.role !== 'cooperative') return undefined;
    api('/api/group').then((data) => setGroup(data.group)).catch(() => {});
    return undefined;
  }, [user.role]);

  async function saveProfile(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/me', { method: 'PUT', body: form });
      updateUser(data.user);
      setInfo(t('savedProfile'));
    } catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/me/password', { method: 'PUT', body: password });
      setPassword({ currentPassword: '', password: '' });
      setInfo(t('passwordChanged'));
    } catch (err) { setError(errorText(lang, err)); }
    finally { setBusy(false); }
  }

  async function addMember(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/api/group/members', { method: 'POST', body: { phone } });
      setGroup(data.group);
      setPhone('');
      setInfo(t('addMember'));
    } catch (err) { setError(errorText(lang, err)); }
  }

  async function removeMember() {
    try {
      const data = await api(`/api/group/members/${removeId}`, { method: 'DELETE' });
      setGroup(data.group);
      setRemoveId('');
    } catch (err) {
      setRemoveId('');
      setError(errorText(lang, err));
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{t('profileTitle')}</h1>
      <p className="text-lg font-bold">{t(user.role)} · {user.phone}</p>
      {info && <p className="rounded-2xl bg-mist px-3 py-2 font-bold">{info}</p>}
      <Alert>{error}</Alert>
      <form className="grid gap-3" onSubmit={saveProfile}>
        <label className="block"><span className="label">{t('fullName')}</span>
          <input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="block"><span className="label">{t('emailOptional')}</span>
          <input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <PlaceFields state={form.state} district={form.district} village={form.village} lang={lang} t={t} onChange={(place) => setForm({ ...form, ...place })} />
        <button type="button" className="btn-ghost" onClick={() => locate((lat, lng) => { setForm((current) => ({ ...current, lat, lng })); setInfo(t('locationSaved')); }, () => setError(t('locationFailed')))}>
          {t('updateLocation')}
        </button>
        {form.lat != null && <p className="font-bold">{Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</p>}
        <button className="btn-primary" disabled={busy} type="submit">{t('save')}</button>
      </form>

      {user.role === 'cooperative' && (
        <section className="grid gap-3">
          <h2 className="text-2xl font-extrabold">{t('group')}</h2>
          <p>{t('groupHelp')}</p>
          <h3 className="text-xl font-extrabold">{t('inThisGroup')}</h3>
          {(!group || group.members.length === 0) && <p>{t('noMembers')}</p>}
          {group?.members.map((member) => (
            <div key={member.id} className="card flex items-center justify-between gap-2">
              <div>
                <p className="text-lg font-extrabold">{member.name}</p>
                <p>{member.village} · {member.phone}</p>
              </div>
              <button type="button" className="btn-clay w-auto px-4" onClick={() => setRemoveId(member.id)}>{t('remove')}</button>
            </div>
          ))}
          <form className="grid gap-2" onSubmit={addMember}>
            <label className="block"><span className="label">{t('memberPhone')}</span>
              <input className="field" inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <button className="btn-primary" type="submit">{t('addMember')}</button>
          </form>
        </section>
      )}

      <form className="grid gap-3" onSubmit={savePassword}>
        <h2 className="text-2xl font-extrabold">{t('changePassword')}</h2>
        <label className="block"><span className="label">{t('currentPassword')}</span>
          <input className="field" type="password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} />
        </label>
        <label className="block"><span className="label">{t('newPassword')}</span>
          <input className="field" type="password" value={password.password} onChange={(event) => setPassword({ ...password, password: event.target.value })} />
        </label>
        <button className="btn-ghost" disabled={busy} type="submit">{t('changePassword')}</button>
      </form>
      <button type="button" className="btn-clay" onClick={askOut}>{t('signOut')}</button>
      <Confirm open={!!removeId} title={t('removeAsk')} body="" yesLabel={t('remove')} noLabel={t('keep')} danger onYes={removeMember} onNo={() => setRemoveId('')} />
    </div>
  );
}
