'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, tokenStorage } from '@/lib/api';
import { User } from '@/lib/api/auth.api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
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

    // Try to load cached user data first for instant load
    const cachedUser = localStorage.getItem('hms_user');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        setIsLoading(false); // Set loading to false immediately with cached data
        
        // Verify token in background without showing loading
        verifyTokenInBackground();
        return;
      } catch (error) {
        console.error('Invalid cached user data:', error);
        localStorage.removeItem('hms_user');
      }
    }

    // If no cached data, do quick auth check
    await verifyTokenQuick();
  };

  const verifyTokenInBackground = async () => {
    try {
      const response = await authApi.me();
      if (response.status === 'success') {
        setUser(response.data.user);
        localStorage.setItem('hms_user', JSON.stringify(response.data.user));
      } else {
        // Invalid token
        tokenStorage.remove();
        localStorage.removeItem('hms_user');
        setUser(null);
      }
    } catch (error) {
      console.error('Background auth check failed:', error);
      tokenStorage.remove();
      localStorage.removeItem('hms_user');
      setUser(null);
    }
  };

  const verifyTokenQuick = async () => {
    try {
      const response = await authApi.me();
      if (response.status === 'success') {
        setUser(response.data.user);
        localStorage.setItem('hms_user', JSON.stringify(response.data.user));
      } else {
        // Invalid token
        tokenStorage.remove();
        localStorage.removeItem('hms_user');
      }
    } catch (error) {
      console.error('Quick auth check failed:', error);
      tokenStorage.remove();
      localStorage.removeItem('hms_user');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyToken = async () => {
    try {
      const response = await authApi.me();
      if (response.status === 'success') {
        setUser(response.data.user);
        localStorage.setItem('hms_user', JSON.stringify(response.data.user));
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
    if (response.status === 'success' && response.data) {
      setUser(response.data.user);
      localStorage.setItem('hms_user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      redirectToDashboard(response.data.user.role);
      return { success: true };
    } else {
      // Return error information instead of throwing
      return { success: false, message: response.message };
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
      // Don't wait for loading - redirect immediately if not authenticated
      if (!isLoading && !isAuthenticated) {
        router.push('/');
        return;
      }

      // If we have a user but loading is still true, and we have cached data, proceed anyway
      if (user && allowedRoles && !allowedRoles.includes(user.role)) {
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
    }, [isAuthenticated, isLoading, user, router]);

    // If we have cached user data, show the component immediately
    if (user && (isAuthenticated || localStorage.getItem('hms_user'))) {
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return null; // Will redirect in useEffect
      }
      return <WrappedComponent {...props} />;
    }

    // Only show loading for very brief moments or if no cached data
    if (isLoading && !user) {
      return null; // Return nothing instead of loading screen for faster experience
    }

    // If not authenticated and not loading, redirect will happen in useEffect
    return null;
  };
}
