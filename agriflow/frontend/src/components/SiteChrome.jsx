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
      className={({ isActive }) => `inline-flex min-h-12 items-center whitespace-nowrap text-base font-bold text-navy ${isActive ? 'underline decoration-gold decoration-4 underline-offset-8' : 'hover:text-blue'}`}
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

  return (
    <div className="flex min-h-screen flex-col bg-sky text-navy">
      <header className="sticky top-0 z-40 border-b border-[#D5E4F2] bg-white text-navy shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-nowrap items-center gap-3 px-4 py-3">
          <Link to="/" className="shrink-0 font-serif text-2xl tracking-wide text-navy sm:text-3xl">AgriFlow</Link>
          <div className="flex shrink-0 flex-nowrap items-center gap-3 sm:gap-4">
            <Item to="/" end>{t('navEquipment')}</Item>
            {!user && <Link to="/signup" className="inline-flex min-h-12 items-center whitespace-nowrap text-base font-bold text-navy">{t('signUp')}</Link>}
          </div>
          <nav className="ml-auto flex min-w-0 flex-nowrap items-center justify-end gap-3 overflow-x-auto sm:gap-4">
            {user && (
              <>
                <Item to="/rent">{t('navRent')}</Item>
                <Item to="/list">{t('navList')}</Item>
                <Item to="/bookings">{t('navBookings')}</Item>
                <Item to="/requests">{t('navRequests')}</Item>
                <Item to="/profile">{t('navAccount')}</Item>
              </>
            )}
            <LangToggle />
            {user ? (
              <button type="button" className="inline-flex min-h-12 items-center whitespace-nowrap rounded-full border-2 border-navy bg-white px-4 text-base font-extrabold text-navy" onClick={() => setAskOut(true)}>
                {t('signOut')}
              </button>
            ) : (
              <Link to="/login" className="inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-gold px-4 text-base font-extrabold text-navy">{t('signIn')}</Link>
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
