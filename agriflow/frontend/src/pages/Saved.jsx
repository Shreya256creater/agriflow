import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { onRefresh } from '../bus';
import BookingSheet from '../components/BookingSheet';
import EquipmentCard from '../components/EquipmentCard';
import { Toast, useLang } from '../ui';

export default function Saved() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [booking, setBooking] = useState(null);
  const [toast, setToast] = useState('');

  function load() {
    api('/api/saved').then((data) => setItems(data.items)).catch(() => {});
  }
  useEffect(() => {
    load();
    return onRefresh(load);
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-extrabold">{t('saved')}</h1>
      {items.length === 0 && (
        <div className="card grid gap-3">
          <p className="text-lg">{t('noSaved')}</p>
          <Link className="btn-primary" to="/home">{t('browse')}</Link>
        </div>
      )}
      {items.map((item) => (
        <EquipmentCard key={item.id} item={item} onBook={setBooking} onToast={(message) => { setToast(message); load(); }} />
      ))}
      <BookingSheet item={booking} onClose={() => setBooking(null)} />
      <Toast message={toast} />
    </div>
  );
}
