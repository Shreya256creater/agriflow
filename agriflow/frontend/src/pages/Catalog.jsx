import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import BookingSheet from '../components/BookingSheet';
import { EquipGlyph, inr, rentWindowText, TYPE_COLOR, useLang } from '../ui';

export default function Catalog() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    let gone = false;
    api('/api/catalog')
      .then((data) => { if (!gone) setItems(data.items.filter((item) => item.isAvailable)); })
      .catch(() => { if (!gone) setItems([]); })
      .finally(() => { if (!gone) setLoading(false); });
    return () => { gone = true; };
  }, []);

  function book(item) {
    if (!user) {
      navigate('/signup');
      return;
    }
    if (user.id === item.ownerId) return;
    setBooking(item);
  }

  return (
    <div>
      <section className="bg-[#E7F1FA] text-navy">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-navy">{t('heroKicker')}</p>
            <h1 className="mt-3 font-serif text-6xl tracking-wide text-navy md:text-7xl">AgriFlow</h1>
            <p className="mt-4 max-w-xl text-xl leading-relaxed text-navy">{t('heroLead')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#equipment" className="inline-flex min-h-14 items-center rounded-full bg-gold px-6 text-lg font-extrabold text-navy">{t('equipmentTitle')}</a>
              {!user && <Link to="/signup" className="inline-flex min-h-14 items-center rounded-full border-2 border-navy px-6 text-lg font-extrabold text-navy">{t('signUp')}</Link>}
            </div>
          </div>
          <div className="rounded-[2rem] bg-[#163E5C] p-4 shadow-2xl">
            <div className="overflow-hidden rounded-[1.5rem] bg-white text-ink">
              <img src="/machines/tractor.svg" alt="" className="h-52 w-full object-cover" style={{ background: '#d7e8f5' }} />
              <div className="grid gap-2 p-5">
                <p className="text-sm font-extrabold uppercase tracking-wide text-blue">{t('type_tractor')}</p>
                <h2 className="font-serif text-4xl leading-tight text-navy">{t('tagline')}</h2>
                <p className="text-base text-soil">{t('problem')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="equipment" className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-serif text-4xl text-navy">{t('equipmentTitle')}</h2>
        {loading && <p className="mt-6 text-lg font-bold">{t('pleaseWait')}</p>}
        {!loading && items.length === 0 && <p className="mt-6 text-lg">{t('equipmentEmpty')}</p>}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-3xl bg-white shadow-md">
              <img
                src={item.photos?.[0] || `/machines/${item.type}.svg`}
                alt=""
                width="640"
                height="360"
                loading="lazy"
                decoding="async"
                className="h-44 w-full object-cover"
                style={{ background: TYPE_COLOR[item.type] }}
              />
              <div className="grid gap-2 p-4">
                <div className="flex items-center gap-2">
                  <EquipGlyph type={item.type} />
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-blue">{t(`type_${item.type}`)}</p>
                    <h3 className="text-xl font-extrabold leading-tight">{item.name}</h3>
                  </div>
                </div>
                <p className="text-base text-soil">{item.village} · {item.ownerName}</p>
                <dl className="grid gap-1 text-base">
                  <div className="flex justify-between gap-3"><dt className="font-bold">{t('availability')}</dt><dd className="font-extrabold text-blue">{t('available')}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="font-bold">{t('cost')}</dt><dd className="font-extrabold">{inr(item.pricePerDay)} {t('perDay')}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="font-bold">{t('rentDaysLabel')}</dt><dd>{rentWindowText(t, item)}</dd></div>
                </dl>
                <button type="button" className="btn-primary mt-2" onClick={() => book(item)}>
                  {user ? t('bookThis') : t('signUpToBook')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {booking && <BookingSheet item={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}
