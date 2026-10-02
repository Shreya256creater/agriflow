import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Confirm, LangToggle, useLang } from '../ui';

function Item({ to, end, children, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `min-h-12 text-base font-bold text-navy ${isActive ? 'underline decoration-gold decoration-4 underline-offset-8' : 'hover:text-blue'}`}
    >
      {children}
    </NavLink>
  );
}

export default function SiteChrome() {
  const { t } = useLang();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [askOut, setAskOut] = useState(false);
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);

  return (
    <div className="flex min-h-screen flex-col bg-sky text-navy">
      <header className="sticky top-0 z-40 border-b border-[#D5E4F2] bg-white text-navy shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-serif text-3xl tracking-wide text-navy" onClick={close}>AgriFlow</Link>
          <button
            type="button"
            className="grid min-h-12 min-w-12 place-items-center rounded-full text-2xl text-navy md:hidden"
            aria-expanded={menu}
            aria-label="Menu"
            onClick={() => setMenu((open) => !open)}
          >
            {menu ? '✕' : '☰'}
          </button>
          <nav className={`${menu ? 'flex' : 'hidden'} absolute left-0 right-0 top-[4.5rem] z-40 flex-col gap-3 border-t border-[#D5E4F2] bg-white px-4 py-4 text-navy md:static md:flex md:flex-row md:items-center md:gap-5 md:border-0 md:bg-transparent md:p-0`}>
            <Item to="/" end onClick={close}>{t('navEquipment')}</Item>
            {user && (
              <>
                <Item to="/rent" onClick={close}>{t('navRent')}</Item>
                <Item to="/list" onClick={close}>{t('navList')}</Item>
                <Item to="/bookings" onClick={close}>{t('navBookings')}</Item>
                <Item to="/requests" onClick={close}>{t('navRequests')}</Item>
                <Item to="/profile" onClick={close}>{t('navAccount')}</Item>
              </>
            )}
            <LangToggle />
            {user ? (
              <button type="button" className="min-h-12 rounded-full border-2 border-navy bg-white px-4 text-base font-extrabold text-navy" onClick={() => { close(); setAskOut(true); }}>
                {t('signOut')}
              </button>
            ) : (
              <>
                <Link to="/signup" className="min-h-12 text-base font-bold text-navy" onClick={close}>{t('signUp')}</Link>
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-5 text-base font-extrabold text-navy" onClick={close}>{t('signIn')}</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet context={{ askOut: () => setAskOut(true) }} />
      </main>
      <footer className="border-t border-[#D5E4F2] bg-white px-4 py-8 text-center text-navy">
        <p className="font-serif text-3xl text-navy">AgriFlow</p>
        <p className="mt-2 text-base text-navy">{t('footerNote')}</p>
      </footer>
      <Confirm
        open={askOut}
        title={t('signOutAsk')}
        body=""
        yesLabel={t('signOutYes')}
        noLabel={t('stay')}
        danger
        onYes={() => { setAskOut(false); signOut(); navigate('/'); }}
        onNo={() => setAskOut(false)}
      />
    </div>
  );
}
