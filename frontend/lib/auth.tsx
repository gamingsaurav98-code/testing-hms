'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, tokenStorage } from '@/lib/api';
import { ApiError } from '@/lib/api/core';
import { User } from '@/lib/api/auth.api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user_id: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user && !!tokenStorage.get();

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
        // Server explicitly returned a non-success payload
        tokenStorage.remove();
        localStorage.removeItem('hms_user');
        setUser(null);
      }
    } catch (error: any) {
      // Network / timeout errors are expected occasionally and shouldn't be noisy
      if (error instanceof ApiError && (error.status === 0 || error.status === 408)) {
        console.debug('Background auth check failed (network/timeout):', error.message || error);
      } else {
        console.error('Background auth check failed:', error);
      }
      // Only remove token for known auth errors (401/403). For network or transient errors keep the token so
      // in-flight requests won't be affected by premature deletion by this background check.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        tokenStorage.remove();
        localStorage.removeItem('hms_user');
        setUser(null);
      }
      // Otherwise leave the token intact and allow other requests to proceed — we'll try again later
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
    } catch (error: any) {
      // Quietly handle network or timeout errors on quick auth check — only
      // escalate actual authentication failures (401/403) which we handle below.
      if (error instanceof ApiError && (error.status === 0 || error.status === 408)) {
        console.debug('Quick auth check failed (network/timeout):', error.message || error);
      } else {
        console.error('Quick auth check failed:', error);
      }
      // Only remove token for authentication errors; network errors shouldn't wipe the token
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        tokenStorage.remove();
        localStorage.removeItem('hms_user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkAuthStatus();
  }, []);

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  const login = async (user_id: string, password: string) => {
    const response = await authApi.login({ user_id, password });
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
