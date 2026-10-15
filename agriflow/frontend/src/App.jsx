import { Navigate, Outlet, Route, Routes, useOutletContext } from 'react-router-dom';
import { useAuth } from './auth';
import SiteChrome from './components/SiteChrome';
import Bookings from './pages/Bookings';
import Catalog from './pages/Catalog';
import ListMachine from './pages/ListMachine';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Providers from './pages/Providers';
import Rent from './pages/Rent';
import Requests from './pages/Requests';
import Signup from './pages/Signup';

function NeedAuth() {
  const outlet = useOutletContext();
  const { user, ready } = useAuth();
  if (!ready) return <p className="px-4 py-16 text-center text-2xl font-extrabold text-navy">AgriFlow</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet context={outlet} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteChrome />}>
        <Route path="/" element={<Catalog />} />
        <Route path="/providers/:type" element={<Providers />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route element={<NeedAuth />}>
          <Route path="/rent" element={<Rent />} />
          <Route path="/list" element={<ListMachine />} />
          <Route path="/bookings" element={<div className="mx-auto max-w-3xl px-4 py-8"><Bookings /></div>} />
          <Route path="/requests" element={<div className="mx-auto max-w-3xl px-4 py-8"><Requests /></div>} />
          <Route path="/profile" element={<div className="mx-auto max-w-3xl px-4 py-8"><Profile /></div>} />
          <Route path="/notifications" element={<div className="mx-auto max-w-3xl px-4 py-8"><Notifications /></div>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
