import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { onRefresh } from '../bus';
import { Confirm, LangToggle, useLang } from '../ui';

function Icon({ d }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  home: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z',
  bookings: 'M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z',
  saved: 'M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z',
  machines: 'M4 16h16M7 16V9h10v7M9 9V6h6v3',
  profile: 'M12 12a4 4 0 1 0-0.1-8 4 4 0 0 0 .1 8ZM5 20a7 7 0 0 1 14 0',
};

export default function Shell() {
  const { t } = useLang();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [askOut, setAskOut] = useState(false);

  useEffect(() => {
    const load = () => api('/api/stats').then(setStats).catch(() => {});
    load();
    return onRefresh(load);
  }, []);

  const farmerNav = [
    ['/home', 'home', t('home')],
    ['/bookings', 'bookings', t('bookings')],
    ['/saved', 'saved', t('saved')],
    ['/profile', 'profile', t('profile')],
  ];
  const ownerNav = [
    ['/home', 'home', t('home')],
    ['/machines', 'machines', t('machines')],
    ['/requests', 'bookings', t('requests')],
    ['/profile', 'profile', t('profile')],
  ];
  const coopNav = [
    ['/home', 'home', t('home')],
    ['/bookings', 'bookings', t('bookings')],
    ['/machines', 'machines', t('machines')],
    ['/profile', 'profile', t('profile')],
  ];
  const items = user.role === 'farmer' ? farmerNav : user.role === 'owner' ? ownerNav : coopNav;

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col bg-cream">
      <header className="z-30 flex shrink-0 items-center justify-between gap-2 bg-leafDark px-3 py-2 text-white">
        <button type="button" className="text-xl font-extrabold" onClick={() => navigate('/home')}>FarmShare</button>
        <div className="flex items-center gap-2">
          <LangToggle />
          <button type="button" className="relative grid min-h-12 min-w-12 place-items-center rounded-full bg-white/15 text-xl" aria-label={t('notifications')} onClick={() => navigate('/notifications')}>
            ✶
            {stats?.unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-7 min-w-7 place-items-center rounded-full bg-wheat px-1 text-base font-extrabold leading-none text-ink">{stats.unread}</span>}
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <Outlet context={{ stats, askOut: () => setAskOut(true) }} />
      </main>
      <nav className="grid shrink-0 border-t-2 border-[#D9E2D4] bg-white pb-[env(safe-area-inset-bottom)]" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map(([to, icon, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center text-base font-extrabold ${isActive ? 'text-leaf' : 'text-soil'}`}>
            <Icon d={ICONS[icon]} />
            <span>{label}{to === '/requests' && stats?.pendingRequests > 0 ? ` (${stats.pendingRequests})` : ''}</span>
          </NavLink>
        ))}
      </nav>
      <Confirm
        open={askOut}
        title={t('signOutAsk')}
        body=""
        yesLabel={t('signOutYes')}
        noLabel={t('stay')}
        danger
        onYes={() => { signOut(); navigate('/'); }}
        onNo={() => setAskOut(false)}
      />
    </div>
  );
}
