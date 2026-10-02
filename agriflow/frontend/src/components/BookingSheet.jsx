import { useEffect, useState } from 'react';
import { api } from '../api';
import { emitRefresh } from '../bus';
import { errorText } from '../i18n';
import { useAuth } from '../auth';
import { addDays, Alert, dayLabel, daysInclusive, inr, Sheet, todayISO, useLang } from '../ui';

export default function BookingSheet({ item, onClose }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(addDays(todayISO(), 1));
  const [endDate, setEndDate] = useState(addDays(todayISO(), 2));
  const [split, setSplit] = useState(false);
  const [picked, setPicked] = useState([]);
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.role !== 'cooperative') return undefined;
    api('/api/group').then((data) => setMembers(data.group?.members || [])).catch(() => {});
    return undefined;
  }, [user]);

  useEffect(() => {
    setDone(false);
    setError('');
    setSplit(false);
    setPicked([]);
    setStartDate(addDays(todayISO(), 1));
    setEndDate(addDays(todayISO(), 2));
  }, [item?.id]);

  useEffect(() => {
    setDone(false);
    setError('');
    setSplit(false);
    setPicked([]);
    setStartDate(addDays(todayISO(), 1));
    setEndDate(addDays(todayISO(), 2));
  }, [item?.id]);

  if (!item) return null;
  const days = startDate && endDate && endDate >= startDate ? daysInclusive(startDate, endDate) : 0;
  const total = days > 0 ? days * item.pricePerDay : 0;
  const shareCount = split ? picked.length : 0;

  function toggleMember(id) {
    setPicked((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
  }

  async function send() {
    setError('');
    if (!days || days < 1) {
      setError(t('err_BAD_DATES'));
      return;
    }
    if (split && picked.length < 2) {
      setError(t('pickTwo'));
      return;
    }
    setBusy(true);
    try {
      await api('/api/bookings', {
        method: 'POST',
        body: { equipmentId: item.id, startDate, endDate, split, memberIds: picked },
      });
      emitRefresh();
      setDone(true);
    } catch (err) {
      setError(errorText(lang, err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={!!item} title={done ? t('requestSent') : t('sheetTitle')} onClose={onClose}>
      {done ? (
        <div className="grid gap-3">
          <p className="text-lg">{t('requestSentHelp', { owner: item.ownerName })}</p>
          <button type="button" className="btn-primary" onClick={onClose}>{t('gotIt')}</button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-xl font-extrabold">{item.name}</p>
          <label className="block">
            <span className="label">{t('from')}</span>
            <input className="field" type="date" value={startDate} min={todayISO()} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="block">
            <span className="label">{t('to')}</span>
            <input className="field" type="date" value={endDate} min={startDate || todayISO()} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <p className="text-base">{t('inclusive')}</p>
          <p className="text-3xl font-extrabold">{t('total')}: {days > 0 ? inr(total) : '—'}</p>
          {days > 0 && (
            <p className="text-lg font-bold">{t('rentCompare', { days: dayLabel(t, days), rent: inr(total), buy: inr(item.buyPrice) })}</p>
          )}
          {user?.role === 'cooperative' && (
            <div className="grid gap-2">
              <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-3 text-lg font-bold">
                <input type="checkbox" className="h-6 w-6" checked={split} onChange={(event) => setSplit(event.target.checked)} />
                {t('split')}
              </label>
              {split && (
                <div className="grid gap-2">
                  <p className="font-extrabold">{t('whoShares')}</p>
                  {members.length === 0 && <p>{t('noMembers')}</p>}
                  {members.map((member) => (
                    <label key={member.id} className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-3 text-lg font-bold">
                      <input type="checkbox" className="h-6 w-6" checked={picked.includes(member.id)} onChange={() => toggleMember(member.id)} />
                      {member.name} · {member.village}
                    </label>
                  ))}
                  {shareCount > 0 && <p>{t('eachPays', { amount: inr(Math.ceil(total / shareCount)) })}</p>}
                  <p className="text-base">{t('firstPays')}</p>
                </div>
              )}
            </div>
          )}
          <Alert>{error}</Alert>
          <button type="button" className="btn-primary" disabled={busy} onClick={send}>
            {busy ? t('pleaseWait') : t('sendRequest')}
          </button>
        </div>
      )}
    </Sheet>
  );
}
