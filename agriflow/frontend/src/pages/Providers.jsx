import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import BookingSheet from '../components/BookingSheet';
import { inr, MACHINE_PHOTO, rentWindowText, TYPES, useLang } from '../ui';

export default function Providers() {
  const { type } = useParams();
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!TYPES.includes(type)) return undefined;
    let gone = false;
    api('/api/catalog')
      .then((data) => {
        if (!gone) setItems(data.items.filter((item) => item.type === type && item.isAvailable));
      })
      .catch(() => { if (!gone) setItems([]); })
      .finally(() => { if (!gone) setLoading(false); });
    return () => { gone = true; };
  }, [type]);

  if (!TYPES.includes(type)) return <Navigate to="/" replace />;

  function book(item) {
    if (!user) {
      navigate('/signup');
      return;
    }
    if (user.id === item.ownerId) return;
    setBooking(item);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-base font-extrabold text-blue">{t('chooseMachine')}</Link>
      <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-md">
        <img src={MACHINE_PHOTO[type] || `/machines/${type}.svg`} alt="" className="block h-auto w-full" />
      </div>
      <h1 className="mt-4 font-serif text-3xl text-navy">{t(`type_${type}`)}</h1>
      <p className="mt-1 text-base text-soil">{t('providersTitle')}</p>
      {loading && <p className="mt-4 text-base font-bold">{t('pleaseWait')}</p>}
      {!loading && items.length === 0 && <p className="mt-4 text-base">{t('noProviders')}</p>}
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="grid gap-2 rounded-3xl bg-white p-4 shadow-md">
            <h2 className="text-lg font-extrabold">{item.ownerName}</h2>
            <p className="text-base text-soil">{item.name} · {item.village}</p>
            <p><span className="font-bold">{t('availability')}: </span>{t('available')}</p>
            <p><span className="font-bold">{t('cost')}: </span>{inr(item.pricePerDay)} {t('perDay')}</p>
            <p><span className="font-bold">{t('rentDaysLabel')}: </span>{rentWindowText(t, item)}</p>
            <button type="button" className="btn-primary" onClick={() => book(item)}>
              {user ? t('bookThis') : t('signUpToBook')}
            </button>
          </article>
        ))}
      </div>
      {booking && <BookingSheet item={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}
