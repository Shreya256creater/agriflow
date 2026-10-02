import { useState } from 'react';
import { api, contactLinks } from '../api';
import { emitRefresh } from '../bus';
import { errorText } from '../i18n';
import { useAuth } from '../auth';
import { Alert, Confirm, inr, prettyDate, Stars, StatusPill, useLang } from '../ui';

const RENTER_PRESETS = ['worked_well', 'on_time', 'helpful_operator', 'small_problem', 'would_again'];
const OWNER_PRESETS = ['on_time', 'careful', 'would_again', 'small_problem'];

export default function BookingCard({ booking, onChange }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState('');
  const [rating, setRating] = useState(5);
  const [preset, setPreset] = useState('');
  const [comment, setComment] = useState('');
  const [banner, setBanner] = useState('');

  const isOwner = booking.ownerId === user.id;
  const phone = isOwner ? booking.renterPhone : booking.ownerPhone;
  const person = isOwner ? booking.renterName : booking.ownerName;
  const presets = isOwner ? OWNER_PRESETS : RENTER_PRESETS;
  const links = phone
    ? contactLinks(phone, t('waText', {
      name: person,
      me: user.name,
      machine: booking.equipmentName,
      start: prettyDate(booking.startDate, lang),
      end: prettyDate(booking.endDate, lang),
    }))
    : null;

  async function act(path, message) {
    setBusy(true);
    setError('');
    try {
      await api(path, { method: 'POST' });
      emitRefresh();
      setBanner(message);
      setAsk('');
      onChange();
    } catch (err) {
      setError(errorText(lang, err));
    } finally {
      setBusy(false);
    }
  }

  async function sendReview() {
    setBusy(true);
    setError('');
    try {
      await api('/api/reviews', {
        method: 'POST',
        body: { bookingId: booking.id, rating, preset, comment },
      });
      emitRefresh();
      setBanner(t('reviewThanks'));
      onChange();
    } catch (err) {
      setError(errorText(lang, err));
    } finally {
      setBusy(false);
    }
  }

  const reason = booking.note === 'auto_overlap'
    ? t('autoReason')
    : booking.note === 'declined'
      ? t('declinedReason')
      : booking.note === 'cancelled'
        ? t('cancelledReason')
        : '';

  return (
    <article className="card grid gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-extrabold">{booking.equipmentName}</h3>
        <StatusPill status={booking.status} t={t} />
      </div>
      <p className="text-lg">{prettyDate(booking.startDate, lang)} – {prettyDate(booking.endDate, lang)}</p>
      <p className="text-2xl font-extrabold">{inr(booking.totalCost)}</p>
      {isOwner && booking.status === 'pending' && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary" disabled={busy} onClick={() => act(`/api/bookings/${booking.id}/accept`, t('acceptDone'))}>{t('accept')}</button>
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => setAsk('decline')}>{t('decline')}</button>
        </div>
      )}
      {isOwner && booking.status === 'confirmed' && (
        <button type="button" className="btn-primary" disabled={busy} onClick={() => setAsk('done')}>{t('markDone')}</button>
      )}
      {!isOwner && (booking.status === 'pending' || booking.status === 'confirmed') && (
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => setAsk('cancel')}>{t('cancelBooking')}</button>
      )}
      <p className="text-lg">{isOwner ? `${t('renter')}: ${booking.renterName}` : `${t('ownerLabel')}: ${booking.ownerName}`}</p>
      <p className="text-base">{booking.renterVillage}{booking.renterDistrict ? `, ${booking.renterDistrict}` : ''}</p>
      {booking.members?.length > 0 && (
        <div className="rounded-2xl bg-mist px-3 py-2">
          <p className="font-extrabold">{t('shareLine', { count: booking.members.length })}</p>
          {booking.members.map((member) => (
            <p key={member.userId}>{member.name}: {inr(member.shareAmount)}</p>
          ))}
        </div>
      )}
      {reason && <p className="font-bold">{reason}</p>}
      {booking.status === 'pending' && <p>{t('cannotCallYet')}</p>}
      {links && (
        <div className="grid gap-2">
          <p className="font-extrabold">{t('planPickup')}</p>
          <p className="text-base">{t('linksHelp')}</p>
          <a className="btn-primary" href={links.tel}>{t('call')} {person}</a>
          <a className="btn-ghost" href={links.wa} target="_blank" rel="noreferrer">{t('whatsapp')}</a>
          <a className="btn-ghost" href={links.sms}>{t('sms')}</a>
        </div>
      )}
      {booking.status === 'completed' && !booking.reviewed && (
        <div className="grid gap-2">
          <p className="text-xl font-extrabold">{t('howWas')}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" aria-label={t('stars', { count: star })} className={`min-h-14 min-w-12 rounded-2xl text-3xl ${star <= rating ? 'text-[#C8922A]' : 'text-[#D9D3C6]'}`} onClick={() => setRating(star)}>★</button>
            ))}
          </div>
          <Stars value={rating} label={t('stars', { count: rating })} />
          {presets.map((key) => (
            <button key={key} type="button" className={`min-h-12 rounded-2xl border-2 px-3 text-left text-lg font-bold ${preset === key ? 'border-leaf bg-mist' : 'border-[#C5D2C2] bg-white'}`} onClick={() => setPreset(key)}>
              {t(`preset_${key}`)}
            </button>
          ))}
          <label className="block">
            <span className="label">{t('commentOptional')}</span>
            <input className="field" value={comment} onChange={(event) => setComment(event.target.value)} />
          </label>
          <button type="button" className="btn-primary" disabled={busy} onClick={sendReview}>{t('submitReview')}</button>
        </div>
      )}
      {booking.reviewed && booking.status === 'completed' && <p className="font-bold">{t('alreadyReviewed')}</p>}
      {banner && <p className="rounded-2xl bg-mist px-3 py-2 font-bold text-leafDark">{banner}</p>}
      <Alert>{error}</Alert>
      <Confirm
        open={ask === 'decline'}
        title={t('decline')}
        body={booking.equipmentName}
        yesLabel={t('decline')}
        noLabel={t('keep')}
        danger
        onYes={() => act(`/api/bookings/${booking.id}/decline`, t('declineDone'))}
        onNo={() => setAsk('')}
      />
      <Confirm
        open={ask === 'cancel'}
        title={t('cancelAsk')}
        body={booking.equipmentName}
        yesLabel={t('yes')}
        noLabel={t('keep')}
        danger
        onYes={() => act(`/api/bookings/${booking.id}/cancel`, t('cancelDone'))}
        onNo={() => setAsk('')}
      />
      <Confirm
        open={ask === 'done'}
        title={t('markDoneAsk')}
        body={booking.equipmentName}
        yesLabel={t('yes')}
        noLabel={t('keep')}
        onYes={() => act(`/api/bookings/${booking.id}/complete`, t('completeDone'))}
        onNo={() => setAsk('')}
      />
    </article>
  );
}
