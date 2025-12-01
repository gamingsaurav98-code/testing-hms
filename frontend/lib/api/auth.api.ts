import { API_BASE_URL, handleResponse, fetchWithTimeout, ApiError, safeFetch } from './core';

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
  profile?: unknown;
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
  user_id: string;
  password: string;
}

export interface LoginResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    user: User;
    token: string;
    token_type: 'Bearer';
  } | null;
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

export interface CreateAccountRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface CreateAccountResponse {
  status: 'success';
  message: string;
  data: {
    user: User;
  };
}

// Cleaned up - removed unused interfaces: ActiveSession, ActiveSessionsResponse

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

// Get auth headers for FormData requests (without Content-Type)
export function getAuthHeadersForFormData(): Record<string, string> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
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
    const response = await safeFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const contentType = response.headers.get('content-type');
    let responseData: unknown;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = { message: 'Login failed' };
    }

    // For login errors, return the error in the response format instead of throwing
    if (!response.ok) {
      let errorMessage = 'Authentication failed';
      if (typeof responseData === 'object' && responseData !== null && 'message' in responseData) {
        const pd = responseData as { message?: string };
        if (pd.message) errorMessage = pd.message;
      }
      
      // Return error as a "successful" response that the UI can handle
      return {
        status: 'error' as const,
        message: errorMessage,
        data: null
      } as LoginResponse;
    }

    // Store token if login successful
    try {
      const parsed = responseData as LoginResponse;
      if (parsed?.status === 'success' && parsed.data && parsed.data.token) {
        tokenStorage.set(parsed.data.token);
      }
    } catch {
      // ignore parsing errors
    }
    
    return responseData as LoginResponse;
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
      const response = await safeFetch(`${API_BASE_URL}/auth/logout`, {
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
    } catch {
      console.log('Logout failed, but removing token anyway for security');
      tokenStorage.remove();
      // Don't throw error for logout - always succeed locally
      return { status: 'success', message: 'Logged out locally' };
    }
  },

  // Logout from all devices
  async logoutAll(): Promise<LogoutResponse> {
    const response = await safeFetch(`${API_BASE_URL}/auth/logout-all`, {
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
    try {
      const url = `${API_BASE_URL}/auth/me`;
      console.debug('authApi.me - fetching', url, 'headers:', getAuthHeaders());
      const start = Date.now();
      // Keep fast failure for auth checks: use a short timeout so background
      // token verification doesn't hang the app if the backend is unreachable
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      }, 8000);

      console.debug(`authApi.me - response status: ${response.status} (took ${Date.now() - start}ms)`);

      return handleResponse<UserMeResponse>(response);
    } catch (error: unknown) {
      // Do not spam console with expected network/timeouts from background checks.
      if (error instanceof ApiError && (error.status === 0 || error.status === 408)) {
        console.debug('authApi.me - network/timeout while fetching user:', error.message || error);
      } else {
        console.error('Get user error:', error);
      }

      // Still rethrow so caller can decide how to act (e.g., invalidate token on 401)
      throw error;
    }
  },

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<LogoutResponse> {
    const response = await safeFetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse<LogoutResponse>(response);
  },

  // Register user (admin only)
  async register(data: RegisterRequest): Promise<{ status: 'success'; message: string; data: { user: User } }> {
    const response = await safeFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  // Create account for pre-registered staff/student (public)
  async createAccount(data: CreateAccountRequest): Promise<CreateAccountResponse> {
    const response = await safeFetch(`${API_BASE_URL}/auth/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse<CreateAccountResponse>(response);
  },

  // Note: refreshToken, checkPermission, and getActiveSessions methods removed as they are not used in the frontend

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return tokenStorage.get() !== null;
  },

  // Get current token
  getToken(): string | null {
    return tokenStorage.get();
  }
};
