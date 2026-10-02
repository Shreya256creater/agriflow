import { api } from '../api';
import { emitRefresh } from '../bus';
import { dayLabel, EquipGlyph, formatKm, inr, Stars, TYPE_COLOR, useLang } from '../ui';

export default function EquipmentCard({ item, exampleDays = 2, onBook, onToast, compact = false }) {
  const { t } = useLang();
  const days = exampleDays > 0 ? exampleDays : 2;
  const rent = item.pricePerDay * days;
  const fairText = item.fairSource === 'nearby'
    ? t('fairNearby', { price: inr(item.fairPrice) })
    : t('fairTypical', { price: inr(item.fairPrice) });
  let fairHint = '';
  if (item.fairSource === 'nearby' && item.fairPrice) {
    const gap = Math.abs(item.pricePerDay - item.fairPrice) / item.fairPrice;
    if (gap < 0.08) fairHint = t('matchesAvg');
    else fairHint = item.pricePerDay < item.fairPrice ? t('lowerThan') : t('higherThan');
  }

  async function toggleSave() {
    const data = await api(`/api/saved/${item.id}`, { method: 'POST' });
    emitRefresh();
    onToast?.(data.saved ? t('savedAdded') : t('savedRemoved'));
  }

  return (
    <article className="card overflow-hidden">
      <div className="relative">
        <img
          src={item.photos?.[0] || `/machines/${item.type}.svg`}
          alt={item.name}
          width="640"
          height="360"
          loading="lazy"
          decoding="async"
          className="h-40 w-full rounded-2xl object-cover"
          style={{ background: TYPE_COLOR[item.type] || '#E7F2E4' }}
        />
        <button
          type="button"
          onClick={toggleSave}
          aria-pressed={item.isSaved}
          aria-label={t('saved')}
          className="absolute left-2 top-2 grid min-h-12 min-w-12 place-items-center rounded-full bg-white text-2xl"
        >
          {item.isSaved ? '♥' : '♡'}
        </button>
        {item.distanceKm != null && (
          <span className="absolute right-2 top-2 rounded-full bg-leafDark px-3 py-2 text-base font-extrabold text-white">
            {formatKm(item.distanceKm)} {t('km')}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <EquipGlyph type={item.type} />
        <div>
          <p className="text-base font-extrabold text-leaf">{t(`type_${item.type}`)}</p>
          <h3 className="text-xl font-extrabold leading-tight">{item.name}</h3>
        </div>
      </div>
      {!compact && (
        <>
          <p className="mt-2 text-lg">
            <Stars value={item.avgRating} label={item.avgRating ? t('stars', { count: item.avgRating }) : t('noRating')} />
            <span className="ml-2 font-bold">{item.ownerName}</span>
            {item.reviewCount ? <span className="text-soil"> · {item.reviewCount}</span> : null}
          </p>
          <p className="mt-1 text-3xl font-extrabold text-leafDark">{inr(item.pricePerDay)} <span className="text-lg">{t('perDay')}</span></p>
          <p className="text-base text-soil">{inr(item.pricePerHour)} {t('perHour')}</p>
          <p className="mt-1 text-lg font-bold">{item.operatorIncluded ? t('withDriver') : t('machineOnly')}</p>
          <p className="text-base">{item.village}</p>
          <p className="mt-2 rounded-2xl bg-mist px-3 py-2 text-base font-bold text-leafDark">{fairText}</p>
          {fairHint && <p className="mt-1 text-base font-bold">{fairHint}</p>}
          <p className="mt-2 text-lg font-bold">
            {t('rentCompare', { days: dayLabel(t, days), rent: inr(rent), buy: inr(item.buyPrice) })}
          </p>
        </>
      )}
      {compact && (
        <p className="mt-2 text-2xl font-extrabold">{inr(item.pricePerDay)} <span className="text-base">{t('perDay')}</span></p>
      )}
      {!item.isAvailable && <p className="mt-2 font-extrabold text-clay">{t('unavailable')}</p>}
      <button type="button" className="btn-primary mt-3" onClick={() => onBook(item)}>{t('bookNow')}</button>
    </article>
  );
}
