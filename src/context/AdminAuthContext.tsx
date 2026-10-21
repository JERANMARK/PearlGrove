import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface AdminUser {
  id: string;
  email: string;
  createdAt?: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('pearl_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    localStorage.removeItem('pearl_admin_token');
    try {
      const res = await adminApi.getMe();
      if (res.success && res.admin) {
        setAdmin(res.admin);
        setToken('cookie-session');
        localStorage.setItem('pearl_admin_user', JSON.stringify(res.admin));
      } else {
        localStorage.removeItem('pearl_admin_user');
        setAdmin(null);
        setToken(null);
      }
    } catch {
      setAdmin(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    const clearExpiredSession = () => {
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('pearl_admin_user');
    };
    window.addEventListener('pearl-admin-session-expired', clearExpiredSession);
    return () => window.removeEventListener('pearl-admin-session-expired', clearExpiredSession);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await adminApi.login({ email, password });
      if (res.success && res.admin) {
        localStorage.setItem('pearl_admin_user', JSON.stringify(res.admin));
        setToken('cookie-session');
        setAdmin(res.admin);
        return { success: true };
      }
      return { success: false, error: res.error || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } finally {
      localStorage.removeItem('pearl_admin_user');
      setToken(null);
      setAdmin(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: Boolean(token && admin),
        admin,
        token,
        loading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
