import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const [loading, setLoading] = useState(() => {
    const hasToken = localStorage.getItem('token');
    const hasUser = localStorage.getItem('user');
    if (!hasToken) return false;
    if (hasToken && hasUser) return false;
    return true;
  });

  useEffect(() => {
    const verifySession = async () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          if (err.response && err.response.status === 401) {
            console.warn('Session expired, clearing authentication state');
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setToken(res.data.token);
      setUser(res.data.user);
      setLoading(false);
      return res.data;
    }
  };

  const register = async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setToken(res.data.token);
      setUser(res.data.user);
      setLoading(false);
      return res.data;
    }
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/update-profile', data);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
