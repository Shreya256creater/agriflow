import { useEffect, useState } from 'react';
import { api } from '../api';
import { onRefresh } from '../bus';
import BookingCard from '../components/BookingCard';
import { inr, useLang } from '../ui';

export default function Earnings() {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  function load() {
    api('/api/stats').then((stats) => setTotal(stats.earnings)).catch(() => {});
    api('/api/bookings').then((data) => {
      setRows(data.asOwner.filter((booking) => booking.status === 'confirmed' || booking.status === 'completed'));
    }).catch(() => {});
  }
  useEffect(() => {
    load();
    return onRefresh(load);
  }, []);

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{t('earnings')}</h1>
      <section className="card">
        <p className="text-lg font-bold">{t('totalEarnings')}</p>
        <p className="text-4xl font-extrabold text-leafDark">{inr(total)}</p>
        <p className="mt-2 text-base">{t('earningsHelp')}</p>
      </section>
      <h2 className="text-2xl font-extrabold">{t('historyTitle')}</h2>
      {rows.length === 0 && <p className="text-lg">{t('noEarnings')}</p>}
      {rows.map((booking) => <BookingCard key={booking.id} booking={booking} onChange={load} />)}
    </div>
  );
}
