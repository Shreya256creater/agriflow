import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    api('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  async function signIn(login, password) {
    const data = await api('/api/auth/signin', { method: 'POST', body: { login, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signUp(body) {
    const data = await api('/api/auth/signup', { method: 'POST', body });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function signOut() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signUp, signOut, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
