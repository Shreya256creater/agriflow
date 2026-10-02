const TOKEN_KEY = 'farmshare_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error('NETWORK');
    error.code = 'NETWORK';
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    setToken(null);
    const here = window.location.pathname;
    if (here !== '/' && here !== '/login' && here !== '/signup') window.location.assign('/login');
  }
  if (!response.ok) {
    const error = new Error(data.error || 'SERVER');
    error.code = data.error || 'SERVER';
    throw error;
  }
  return data;
}

export function contactLinks(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  const full = `91${digits}`;
  return {
    tel: `tel:+${full}`,
    sms: `sms:+${full}?body=${encodeURIComponent(text)}`,
    wa: `https://wa.me/${full}?text=${encodeURIComponent(text)}`,
  };
}
