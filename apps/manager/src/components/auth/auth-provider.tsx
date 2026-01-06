'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  avatar?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  governorateId?: string;
  cityId?: string;
  districtId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  governorateId?: string;
  cityId?: string;
  districtId?: string;
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
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          setUser(null);
          return;
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

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    
    // Verify role is GOVERNORATE_MANAGER
    if (res.data.user.role !== 'GOVERNORATE_MANAGER') {
      throw new Error('هذه الصفحة مخصصة لمديري المحافظات فقط');
    }
    
    // Store in localStorage
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    localStorage.setItem('user_data', JSON.stringify(res.data.user));
    
    // Store in cookie for middleware
    document.cookie = `token=${res.data.accessToken}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
    
    setUser(res.data.user);
    router.push('/dashboard');
  };

  const register = async (data: RegisterData) => {
    const res = await authApi.register(data);
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    localStorage.setItem('user_data', JSON.stringify(res.data.user));
    setUser(res.data.user);
    router.push('/');
  };

  const logout = () => {
    authApi.logout().catch(() => undefined);
    
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_data');
    
    // Clear cookie
    document.cookie = 'token=; path=/; max-age=0';
    
    setUser(null);
    router.push('/');
  };

  const refreshUser = async () => {
    try {
      const me = await authApi.me();
      setUser(me.data);
      localStorage.setItem('user_data', JSON.stringify(me.data));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
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
