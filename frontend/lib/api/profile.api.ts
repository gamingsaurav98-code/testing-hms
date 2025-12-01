import { API_BASE_URL, handleResponse, safeFetch } from './core';
import { getAuthHeaders } from './auth.api';

export interface UserProfile {
  id: number;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  staff_name?: string;  // For staff
  student_name?: string;  // For students
  [key: string]: unknown;  // Allow other properties from staff/student profiles
}

export interface UpdateProfileData {
  email: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// Profile API functions
export const profileApi = {
  // Get current user profile
  async getProfile(): Promise<UserProfile> {
    // First, get the current user's role from /auth/me
    const meResponse = await safeFetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const meResult = await handleResponse<{ status: string; data: { user: { role: string; id: number; user_id: string; email: string } } }>(meResponse);
    const role = meResult.data.user.role;
    const baseUser = meResult.data.user;
    
    let endpoint = '/admin/profile';
    if (role === 'staff') {
      endpoint = '/my-staff/profile';
    } else if (role === 'student') {
      endpoint = '/student/profile';
    }

    // For admin, use the /admin/profile endpoint
    if (role === 'admin') {
      const response = await safeFetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const result = await handleResponse<unknown>(response);
      const maybe = result as { data?: UserProfile } | UserProfile;
      if (maybe && typeof maybe === 'object' && 'data' in maybe && (maybe as { data?: UserProfile }).data) {
        return (maybe as { data: UserProfile }).data!;
      }
      return maybe as UserProfile;
    }
    
    // For staff and student, get their profile which includes more details
    const response = await safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const profileData = await handleResponse<unknown>(response);
    
    // Merge user data with profile data
    return {
      id: baseUser.id,
      user_id: baseUser.user_id,
      email: baseUser.email,
      role: role,
      created_at: profileData.created_at || '',
      updated_at: profileData.updated_at || '',
      ...profileData
    };
  },

  // Update profile (email)
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    // First, get the current user's role from /auth/me
    const meResponse = await safeFetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const meResult = await handleResponse<{ status: string; data: { user: { role: string } } }>(meResponse);
    const role = meResult.data.user.role;
    
    let endpoint = '/admin/profile';
    if (role === 'staff') {
      endpoint = '/my-staff/profile';
    } else if (role === 'student') {
      endpoint = '/student/profile';
    }

    const response = await safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse<unknown>(response);
    const maybe2 = result as { data?: UserProfile } | UserProfile;
    if (maybe2 && typeof maybe2 === 'object' && 'data' in maybe2 && (maybe2 as { data?: UserProfile }).data) {
      return (maybe2 as { data: UserProfile }).data!;
    }
    return maybe2 as UserProfile;
  },

  // Change password
  async changePassword(data: ChangePasswordData): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    await handleResponse<{ status: string; message: string }>(response);
  },
};
