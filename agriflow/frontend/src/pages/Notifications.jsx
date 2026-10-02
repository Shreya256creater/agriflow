import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { emitRefresh } from '../bus';
import { prettyDate, useLang } from '../ui';

function dest(code) {
  if (code === 'BOOKING_REQUEST') return '/requests';
  if (code === 'MEMBER_ADDED') return '/profile';
  return '/bookings';
}

export default function Notifications() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api('/api/notifications').then((data) => setItems(data.items)).catch(() => {});
  }, []);

  async function markAll() {
    await api('/api/notifications/read', { method: 'POST' });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    emitRefresh();
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{t('notifications')}</h1>
      <p>{t('notesHelp')}</p>
      <button type="button" className="btn-ghost" onClick={markAll}>{t('markRead')}</button>
      {items.length === 0 && <p className="text-lg">{t('noNotes')}</p>}
      {items.map((item) => {
        const payload = item.payload || {};
        const text = t(`note_${item.code}`, {
          ...payload,
          start: prettyDate(payload.startDate, lang),
          end: prettyDate(payload.endDate, lang),
        });
        return (
          <button key={item.id} type="button" className={`card text-left ${item.read ? '' : 'border-2 border-leaf'}`} onClick={() => navigate(dest(item.code))}>
            <p className="text-lg font-bold">{text}</p>
            <p className="mt-1 text-base text-soil">{prettyDate(String(item.createdAt).slice(0, 10), lang)}</p>
          </button>
        );
      })}
    </div>
  );
}
