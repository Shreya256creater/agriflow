import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { onRefresh } from '../bus';
import BookingCard from '../components/BookingCard';
import { useLang } from '../ui';

export default function Bookings() {
  const { t } = useLang();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');

  function load() {
    api('/api/bookings').then((data) => setRows(data.asRenter)).catch(() => {});
  }
  useEffect(() => {
    load();
    return onRefresh(load);
  }, []);

  const shown = rows.filter((booking) => filter === 'all' || booking.status === filter);
  const filters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{t('bookings')}</h1>
      {user.role === 'cooperative' && <p className="text-lg">{t('asRenter')}</p>}
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((status) => (
          <button key={status} type="button" className={`min-h-12 shrink-0 rounded-full px-4 font-extrabold ${filter === status ? 'bg-leaf text-white' : 'bg-white'}`} onClick={() => setFilter(status)}>
            {status === 'all' ? t('allWord') : t(status)}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="text-lg">{t('noBookings')}</p>}
      {shown.map((booking) => <BookingCard key={booking.id} booking={booking} onChange={load} />)}
    </div>
  );
}
