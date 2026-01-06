'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'GOVERNORATE_MANAGER' | 'AGENT' | 'BUSINESS' | 'USER';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
        if (!accessToken) {
          setUser(null);
          return;
        }

        // Migrate old key if present
        if (!localStorage.getItem('accessToken') && localStorage.getItem('access_token')) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.removeItem('access_token');
        }

        const me = await authApi.me();
        setUser(me.data);
        localStorage.setItem('user_data', JSON.stringify(me.data));
      } catch (error: any) {
        console.error('Auth check failed:', error);
        
        // Only logout on 401 (Unauthorized) - don't logout on other errors
        if (error?.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          setUser(null);
        } else {
          // For other errors, keep the user logged in (they may be offline or API is down)
          // Try to restore user from localStorage
          const cachedUser = localStorage.getItem('user_data');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated (except on login page)
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    
    // Store in localStorage
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    localStorage.setItem('user_data', JSON.stringify(res.data.user));
    
    // Store in cookie for middleware
    document.cookie = `token=${res.data.accessToken}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
    
    setUser(res.data.user);
    router.push('/');
  };

  const logout = () => {
    // Best-effort server logout; ignore failures.
    authApi.logout().catch(() => undefined);

    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    // Clear cookie
    document.cookie = 'token=; path=/; max-age=0';
    
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
