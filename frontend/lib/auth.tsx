'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, tokenStorage } from '@/lib/api';
import { User } from '@/lib/api/auth.api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user && !!tokenStorage.get();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = tokenStorage.get();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.me();
      if (response.status === 'success') {
        setUser(response.data.user);
      } else {
        // Invalid token
        tokenStorage.remove();
        localStorage.removeItem('hms_user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      tokenStorage.remove();
      localStorage.removeItem('hms_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.status === 'success') {
      setUser(response.data.user);
      localStorage.setItem('hms_user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      redirectToDashboard(response.data.user.role);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      tokenStorage.remove();
      localStorage.removeItem('hms_user');
      router.push('/');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      if (response.status === 'success') {
        setUser(response.data.user);
        localStorage.setItem('hms_user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, logout
      await logout();
    }
  };

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'student':
        router.push('/student');
        break;
      case 'staff':
        router.push('/staff');
        break;
      default:
        router.push('/admin'); // Default fallback
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
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

// HOC for protecting routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push('/');
          return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard if user doesn't have access
          switch (user.role) {
            case 'admin':
              router.push('/admin');
              break;
            case 'student':
              router.push('/student');
              break;
            case 'staff':
              router.push('/staff');
              break;
            default:
              router.push('/');
          }
          return;
        }
      }
    }, [isAuthenticated, isLoading, user, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-blue-300 mx-auto animate-ping"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
      return null; // Will redirect in useEffect
    }

    return <WrappedComponent {...props} />;
  };
}
