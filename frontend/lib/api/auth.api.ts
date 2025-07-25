import { API_BASE_URL, handleResponse, ApiError } from './core';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'staff';
  user_type_id?: number;
  is_active: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  profile?: any;
}

export interface UserPermissions {
  can_manage_users?: boolean;
  can_manage_students?: boolean;
  can_manage_staff?: boolean;
  can_manage_finances?: boolean;
  can_manage_rooms?: boolean;
  can_manage_blocks?: boolean;
  can_view_reports?: boolean;
  can_manage_notices?: boolean;
  can_manage_complaints?: boolean;
  can_manage_inquiries?: boolean;
  can_manage_expenses?: boolean;
  can_manage_income?: boolean;
  can_manage_suppliers?: boolean;
  can_manage_checkout_rules?: boolean;
  can_view_profile?: boolean;
  can_update_profile?: boolean;
  can_view_finances?: boolean;
  can_checkin_checkout?: boolean;
  can_create_complaints?: boolean;
  can_view_complaints?: boolean;
  can_chat?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: 'success';
  message: string;
  data: {
    user: User;
    token: string;
    token_type: 'Bearer';
  };
}

export interface UserMeResponse {
  status: 'success';
  data: {
    user: User;
    permissions: UserPermissions;
  };
}

export interface LogoutResponse {
  status: 'success';
  message: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'admin' | 'student' | 'staff';
  user_type_id?: number;
}

export interface ActiveSession {
  id: number;
  name: string;
  abilities: string[];
  last_used_at: string;
  created_at: string;
  expires_at?: string;
}

export interface ActiveSessionsResponse {
  status: 'success';
  data: {
    active_sessions: ActiveSession[];
    total_sessions: number;
  };
}

// Auth token management
const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Get auth headers
export function getAuthHeaders(): Record<string, string> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

export const authApi = {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await handleResponse<LoginResponse>(response);
    
    // Store token if login successful
    if (data.status === 'success' && data.data.token) {
      tokenStorage.set(data.data.token);
    }
    
    return data;
  },

  // Logout user
  async logout(): Promise<LogoutResponse> {
    console.log('Attempting logout...');
    const token = tokenStorage.get();
    console.log('Current token:', token ? `${token.substring(0, 20)}...` : 'No token found');
    
    // If no token exists, consider it already logged out
    if (!token) {
      console.log('No token found, already logged out');
      return { status: 'success', message: 'Already logged out' };
    }
    
    const headers = getAuthHeaders();
    console.log('Auth headers:', headers);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: headers,
      });

      console.log('Logout response status:', response.status);
      
      // If token is invalid/expired (401), consider logout successful
      if (response.status === 401) {
        console.log('Token already invalid, removing local token');
        tokenStorage.remove();
        return { status: 'success', message: 'Token was already invalid' };
      }
      
      const data = await handleResponse<LogoutResponse>(response);
      
      // Remove token on successful logout
      if (data.status === 'success') {
        console.log('Logout successful, removing token');
        tokenStorage.remove();
      }
      
      return data;
    } catch (error) {
      console.log('Logout failed, but removing token anyway for security');
      tokenStorage.remove();
      // Don't throw error for logout - always succeed locally
      return { status: 'success', message: 'Logged out locally' };
    }
  },

  // Logout from all devices
  async logoutAll(): Promise<LogoutResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<LogoutResponse>(response);
    
    // Remove token on successful logout
    if (data.status === 'success') {
      tokenStorage.remove();
    }
    
    return data;
  },

  // Get current user
  async me(): Promise<UserMeResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse<UserMeResponse>(response);
  },

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<LogoutResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse<LogoutResponse>(response);
  },

  // Register user (admin only)
  async register(data: RegisterRequest): Promise<{ status: 'success'; message: string; data: { user: User } }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  // Refresh token
  async refreshToken(): Promise<{ status: 'success'; message: string; data: { token: string; token_type: 'Bearer' } }> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await handleResponse<{ status: 'success'; message: string; data: { token: string; token_type: 'Bearer' } }>(response);
    
    // Update stored token
    if (data.status === 'success' && data.data.token) {
      tokenStorage.set(data.data.token);
    }
    
    return data;
  },

  // Check user permission
  async checkPermission(permission: string): Promise<{ status: 'success'; data: { has_permission: boolean; permission: string; user_role: string } }> {
    const response = await fetch(`${API_BASE_URL}/auth/check-permission`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permission }),
    });

    return handleResponse(response);
  },

  // Get active sessions
  async getActiveSessions(): Promise<ActiveSessionsResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/active-sessions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse<ActiveSessionsResponse>(response);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return tokenStorage.get() !== null;
  },

  // Get current token
  getToken(): string | null {
    return tokenStorage.get();
  }
};
