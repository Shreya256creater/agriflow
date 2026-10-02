import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import BookingSheet from '../components/BookingSheet';
import { EquipGlyph, inr, rentWindowText, TYPES, useLang } from '../ui';

const SORTS = ['available', 'cost-asc', 'cost-desc', 'days', 'name'];

export default function Rent() {
  const { t } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('available');
  const [type, setType] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    let gone = false;
    api('/api/catalog')
      .then((data) => { if (!gone) setItems(data.items); })
      .catch(() => { if (!gone) setItems([]); })
      .finally(() => { if (!gone) setLoading(false); });
    return () => { gone = true; };
  }, []);

  const shown = useMemo(() => {
    const rows = items.filter((item) => !type || item.type === type);
    const days = (item) => (item.rentableDays == null ? 9999 : item.rentableDays);
    rows.sort((a, b) => {
      if (sort === 'cost-asc') return a.pricePerDay - b.pricePerDay;
      if (sort === 'cost-desc') return b.pricePerDay - a.pricePerDay;
      if (sort === 'days') return days(b) - days(a);
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return a.pricePerDay - b.pricePerDay;
    });
    return rows;
  }, [items, sort, type]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-5xl text-navy">{t('rentPageTitle')}</h1>
      <p className="mt-2 max-w-2xl text-lg">{t('rentPageHelp')}</p>
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block min-w-52">
          <span className="label">{t('sortBy')}</span>
          <select className="field" value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORTS.map((id) => (
              <option key={id} value={id}>
                {t(id === 'available' ? 'sortAvailable' : id === 'cost-asc' ? 'sortCostLow' : id === 'cost-desc' ? 'sortCostHigh' : id === 'days' ? 'sortDays' : 'sortName')}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-52">
          <span className="label">{t('type')}</span>
          <select className="field" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">{t('allMachines')}</option>
            {TYPES.map((item) => <option key={item} value={item}>{t(`type_${item}`)}</option>)}
          </select>
        </label>
      </div>

      {loading && <p className="mt-6 text-lg font-bold">{t('pleaseWait')}</p>}
      {!loading && shown.length === 0 && <p className="mt-6 text-lg">{t('equipmentEmpty')}</p>}

      <div className="mt-6 hidden overflow-hidden rounded-3xl bg-white shadow-md md:block">
        <table className="w-full text-left">
          <thead className="bg-[#E7F1FA] text-navy">
            <tr>
              <th className="px-4 py-3">{t('machines')}</th>
              <th className="px-4 py-3">{t('availability')}</th>
              <th className="px-4 py-3">{t('cost')}</th>
              <th className="px-4 py-3">{t('rentDaysLabel')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr key={item.id} className="border-t border-mist">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <EquipGlyph type={item.type} />
                    <div>
                      <p className="font-extrabold">{item.name}</p>
                      <p className="text-sm text-soil">{t(`type_${item.type}`)} · {item.village}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold">{item.isAvailable ? t('available') : t('notAvailable')}</td>
                <td className="px-4 py-3 font-extrabold">{inr(item.pricePerDay)} <span className="font-bold text-soil">{t('perDay')}</span></td>
                <td className="px-4 py-3">{rentWindowText(t, item)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!item.isAvailable || user.id === item.ownerId}
                    onClick={() => setBooking(item)}
                  >
                    {t('bookThis')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-3 md:hidden">
        {shown.map((item) => (
          <article key={item.id} className="grid gap-2 rounded-3xl bg-white p-4 shadow-md">
            <div className="flex items-center gap-2">
              <EquipGlyph type={item.type} />
              <div>
                <h2 className="text-xl font-extrabold">{item.name}</h2>
                <p className="text-sm text-soil">{item.village}</p>
              </div>
            </div>
            <p><span className="font-bold">{t('availability')}: </span>{item.isAvailable ? t('available') : t('notAvailable')}</p>
            <p><span className="font-bold">{t('cost')}: </span>{inr(item.pricePerDay)} {t('perDay')}</p>
            <p><span className="font-bold">{t('rentDaysLabel')}: </span>{rentWindowText(t, item)}</p>
            <button type="button" className="btn-primary" disabled={!item.isAvailable || user.id === item.ownerId} onClick={() => setBooking(item)}>{t('bookThis')}</button>
          </article>
        ))}
      </div>
      {booking && <BookingSheet item={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}
