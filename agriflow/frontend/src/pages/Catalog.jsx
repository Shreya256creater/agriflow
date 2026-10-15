import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { translate } from '../i18n';
import { MACHINE_OPTIONS, MACHINE_PHOTO, useLang } from '../ui';

export default function Catalog() {
  const { t } = useLang();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MACHINE_OPTIONS;
    return MACHINE_OPTIONS.filter((type) => {
      const en = translate('en', `type_${type}`).toLowerCase();
      const hi = translate('hi', `type_${type}`).toLowerCase();
      return en.includes(q) || hi.includes(q);
    });
  }, [query]);

  return (
    <div>
      <section className="bg-[#E7F1FA] text-navy">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-14">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-navy">{t('heroKicker')}</p>
            <h1 className="mt-3 font-serif text-5xl tracking-wide text-navy md:text-6xl">AgriFlow</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-navy">{t('heroLead')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#equipment" className="inline-flex min-h-12 items-center rounded-full bg-gold px-5 text-base font-extrabold text-navy">{t('chooseMachine')}</a>
              {!user && <Link to="/signup" className="inline-flex min-h-12 items-center rounded-full border-2 border-navy px-5 text-base font-extrabold text-navy">{t('signUp')}</Link>}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-white shadow-md">
            <img src="/machines/hero.jpg" alt="" className="block h-auto w-full" />
          </div>
        </div>
      </section>

      <section id="equipment" className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-serif text-3xl text-navy">{t('chooseMachine')}</h2>
        <label className="mt-4 block">
          <span className="sr-only">{t('searchMachines')}</span>
          <input
            className="field"
            type="search"
            value={query}
            placeholder={t('searchMachines')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {shown.length === 0 && <p className="mt-4 text-base">{t('noMatch')}</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((type) => (
            <Link key={type} to={`/providers/${type}`} className="overflow-hidden rounded-3xl bg-white shadow-md">
              <img
                src={MACHINE_PHOTO[type]}
                alt={t(`type_${type}`)}
                width="640"
                height="360"
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
              <p className="px-4 py-3 text-center text-lg font-extrabold text-navy">{t(`type_${type}`)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
