import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { onRefresh } from '../bus';
import BookingCard from '../components/BookingCard';
import { ImpactStrip, inr, useLang } from '../ui';

export default function OwnerHome() {
  const { t } = useLang();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);

  function load() {
    api('/api/stats').then(setStats).catch(() => {});
    api('/api/bookings').then((data) => {
      setRequests(data.asOwner.filter((booking) => booking.status === 'pending').slice(0, 2));
    }).catch(() => {});
  }

  useEffect(() => {
    load();
    return onRefresh(load);
  }, []);

  const cards = [
    ['/machines', stats?.listed ?? '–', t('listed')],
    ['/earnings', stats ? inr(stats.earnings) : '–', t('totalEarnings')],
    ['/requests', stats?.pendingRequests ?? '–', t('pendingRequests')],
    ['/earnings', stats?.activeRentals ?? '–', t('activeRentals')],
  ];

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{t('hello', { name: user.name.split(' ')[0] })}</h1>
      <ImpactStrip />
      <div className="grid grid-cols-2 gap-3">
        {cards.map(([to, value, label]) => (
          <Link key={label} to={to} className="card block min-h-28">
            <div className="text-3xl font-extrabold leading-none">{value}</div>
            <div className="mt-2 text-lg font-bold leading-tight">{label}</div>
          </Link>
        ))}
      </div>
      <Link to="/machines/new" className="btn-primary">{t('addMachine')}</Link>
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">{t('requests')}</h2>
          <Link className="text-lg font-extrabold text-leaf" to="/requests">{t('viewAll')}</Link>
        </div>
        {requests.length === 0 && <p className="text-lg">{t('noRequests')}</p>}
        {requests.map((booking) => <BookingCard key={booking.id} booking={booking} onChange={load} />)}
      </section>
    </div>
  );
}
