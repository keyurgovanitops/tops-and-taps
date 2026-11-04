import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await client.get('/api/auth/me');
      setUser((prev) => ({ ...prev, ...res.data }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }));
    } catch (err) {
      console.warn('Could not refresh profile:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await client.post('/api/auth/login', { email, password });
      const { access_token, user: loggedUser } = res.data;
      setToken(access_token);
      setUser(loggedUser);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      return { success: true, user: loggedUser };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Invalid email or password'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await client.post('/api/auth/register', formData);
      const { access_token, user: newUser } = res.data;
      setToken(access_token);
      setUser(newUser);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role) => {
    const credentials = {
      admin: { email: 'admin@homeserve.com', password: 'admin123' },
      provider: { email: 'sparky@provider.com', password: 'provider123' },
      technician: { email: 'tech1@homeserve.com', password: 'tech123' },
      customer: { email: 'customer@gmail.com', password: 'customer123' },
    };
    const cred = credentials[role];
    if (cred) {
      return await login(cred.email, cred.password);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const restoreSession = (savedUser, savedToken) => {
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      localStorage.setItem('token', savedToken);
      localStorage.setItem('user', JSON.stringify(savedUser));
    } else {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, login, register, quickLogin, logout, restoreSession, loading, refreshUser: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

