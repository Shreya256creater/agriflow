import { useEffect, useState } from 'react';
import { api } from '../api';
import { onRefresh } from '../bus';
import BookingCard from '../components/BookingCard';
import { useLang } from '../ui';

export default function Requests() {
  const { t } = useLang();
  const [rows, setRows] = useState([]);

  function load() {
    api('/api/bookings').then((data) => setRows(data.asOwner.filter((booking) => booking.status === 'pending'))).catch(() => {});
  }
  useEffect(() => {
    load();
    return onRefresh(load);
  }, []);

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{t('requests')}</h1>
      {rows.length === 0 && <p className="text-lg">{t('noRequests')}</p>}
      {rows.map((booking) => <BookingCard key={booking.id} booking={booking} onChange={load} />)}
    </div>
  );
}
