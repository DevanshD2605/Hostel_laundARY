import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchConfig = useCallback(async () => {
    try {
      const cfg = await api.config();
      setConfig(cfg);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user || user.role !== 'student') {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const notifs = await api.listNotifications();
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch (err) {
      setAuthToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await fetchConfig();
      if (getAuthToken()) {
        await refreshUser();
      }
      setLoading(false);
    };
    initAuth();
  }, [fetchConfig, refreshUser]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const loginWithOtp = async (email, otp) => {
    const res = await api.auth.verifyOtp(email, otp);
    const me = res.me || (await refreshUser());
    setUser(me);
    return me;
  };

  const quickSwitchUser = async (email) => {
    setLoading(true);
    try {
      const res = await api.auth.verifyOtp(email, '123456');
      const me = res.me || (await refreshUser());
      setUser(me);
      if (me?.role === 'student') {
        await fetchNotifications();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      return me;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        config,
        loading,
        notifications,
        unreadCount,
        loginWithOtp,
        quickSwitchUser,
        logout,
        refreshUser,
        refreshConfig: fetchConfig,
        refreshNotifications: fetchNotifications,
        markAllNotificationsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
