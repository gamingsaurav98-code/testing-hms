import { API_BASE_URL, handleResponse, PaginatedResponse, safeFetch, fetchWithTimeout, DEFAULT_API_TIMEOUT } from './core';
import { getAuthHeaders, getAuthHeadersForFormData } from './auth.api';
import type { 
  Staff as StaffBaseType,
  StaffSalary as StaffSalaryType,
  StaffAmenity as StaffAmenityType
} from './types';

// Core interfaces for staff data
export interface StaffFinancial {
  id: string;
  staff_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  payment_type?: {
    id: string;
    name: string;
    description?: string;
  };
}


// Define local interfaces for form data
export interface StaffFormData {
  staff_name: string;
  date_of_birth?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  position?: string;
  department?: string;
  joining_date?: string;
  salary?: number | string;
  is_active?: boolean;
  staff_id?: string;
  employment_type?: string;
  declaration_agreed?: boolean;
  contract_agreed?: boolean;
  verified_by?: string;
  verified_on?: string;
  // Image fields
  staff_image?: File | null;
  staff_citizenship_image?: File | null;
  staff_contract_image?: File | null;
  documents?: File[];
  // Amenities and removals are used by create/update flows
  amenities?: StaffAmenity[] | string[];
  removedAmenityIds?: number[];
  removedCitizenshipDocIds?: number[];
  removedContractDocIds?: number[];
}

export interface StaffFinancialFormData {
  staff_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
}

// Base staff interface
export interface Staff extends Omit<StaffBaseType, 'salaries' | 'amenities' | 'financials' | 'check_in_check_outs' | 'complaints' | 'notices' | 'leaves' | 'documents'> {
  // Core staff properties - must match exactly with StaffBaseType
  id: string;
  staff_name: string;
  contact_number: string;
  email: string;
  is_active: boolean;
  position: string;
  department: string;
  joining_date: string;
  salary_amount: string;
  staff_image: string;
  created_at: string;
  updated_at: string;
}

// Extended interface with all relationships
export interface StaffWithAmenities extends Staff {
  // Staff relationships with proper typing
  amenities?: StaffAmenityType[];
  financials?: StaffFinancial[];
  salaries?: StaffSalaryType[];
  check_in_check_outs?: StaffCheckInOut[];
  complaints?: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  notices?: Array<{
    id: string;
    title: string;
    content: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
  }>;
  leaves?: Array<{
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
  }>;
  documents?: Array<{
    id: string;
    document_type: string;
    document_url: string;
    created_at: string;
  }>;
}

// StaffCheckIn interface
export interface StaffCheckInOut {
  id: string;
  staff_id: string;
  check_in: string;
  check_out: string | null;
  created_at: string;
  updated_at: string;
  staff?: StaffBaseType;
}


// StaffSalary interface
export interface StaffSalary {
  id: string;
  staff_id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  payment_method: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  staff?: StaffBaseType;
}

// StaffLeave interface
export interface StaffLeave {
  id: string;
  staff_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  staff?: StaffBaseType;
}

// StaffDocument interface
export interface StaffDocument {
  id: string;
  staff_id: string;
  document_type: string;
  document_url: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

// StaffAmenity interface
export interface StaffAmenity {
  id: string;
  staff_id: string;
  name: string;
  description: string;
}

// StaffFinancial interface
// NOTE: duplicate/garbled definitions removed above. The StaffFinancial interface is defined once.


// Staff API functions
export const staffApi = {
  // in-memory cache + inflight promises for staff lists
  _staffCache: new Map<string, { data: unknown; fetchedAt: number }>(),
  _staffPromises: new Map<string, Promise<unknown>>(),
  // Get dashboard statistics (accessible to all authenticated users)
  async getDashboardStats(): Promise<{
    rooms: { 
      total: number; 
      occupied: number; 
      available: number;
      total_capacity: number;
      occupied_beds: number;
      available_beds: number;
    };
    students: { total: number };
  }> {
    try {
      const response = await safeFetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Dashboard stats API failed with status: ${response.status}`);
      }
      
      const result = await handleResponse<{
        rooms: { 
          total: number; 
          occupied: number; 
          available: number;
          total_capacity: number;
          occupied_beds: number;
          available_beds: number;
        };
        students: { total: number };
      }>(response);
      
      return result;
    } catch (error) {
      console.error('getDashboardStats error:', error);
      // Return fallback data structure
      return {
        rooms: { total: 0, occupied: 0, available: 0, total_capacity: 0, occupied_beds: 0, available_beds: 0 },
        students: { total: 0 }
      };
    }
  },

  // Get available amenities for staff creation/edit
  async getAvailableAmenities(): Promise<StaffAmenity[]> {
    const response = await safeFetch(`${API_BASE_URL}/staff-amenities`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StaffAmenity[]>(response);
  },
  
  // Get all active staff (no pagination)
  async getAllActiveStaff({ timeoutMs = DEFAULT_API_TIMEOUT, retries = 2, forceRefresh = false }:{ timeoutMs?: number, retries?: number, forceRefresh?: boolean } = {}): Promise<StaffWithAmenities[]> {
    const url = `${API_BASE_URL}/staff?all=true`;
    const cacheKey = `staff:all:true`;
    const TTL = 3000;
    const now = Date.now();

    if (!forceRefresh && staffApi._staffCache.has(cacheKey)) {
      const cached = staffApi._staffCache.get(cacheKey)!;
      if ((now - cached.fetchedAt) < TTL) return Promise.resolve(cached.data as StaffWithAmenities[]);
    }

    let attempt = 0;
    while (true) {
      attempt++;
      try {
        const resp = await fetchWithTimeout(url, { method: 'GET', headers: { ...getAuthHeaders(), 'Accept': 'application/json', 'Content-Type': 'application/json' } }, timeoutMs);
        const data = await handleResponse<StaffWithAmenities[]>(resp);
        staffApi._staffCache.set(cacheKey, { data, fetchedAt: Date.now() });
        return data;
      } catch (err) {
        if (attempt > retries) throw err;
        const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
        const jitter = Math.floor(Math.random() * 200);
        await new Promise(r => setTimeout(r, backoff + jitter));
      }
    }
  },
  
  // Get paginated staff list
  async getStaff(page: number = 1, filters?: { search?: string; active?: boolean; department?: string; position?: string }, signal?: AbortSignal, { timeoutMs = DEFAULT_API_TIMEOUT, retries = 2, forceRefresh = false }:{ timeoutMs?: number, retries?: number, forceRefresh?: boolean } = {}): Promise<PaginatedResponse<StaffWithAmenities>> {
    const params = new URLSearchParams({
      page: page.toString(),
    });
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    if (filters?.active !== undefined) {
      params.append('active', filters.active.toString());
    }
    
    if (filters?.department) {
      params.append('department', filters.department);
    }
    
    if (filters?.position) {
      params.append('position', filters.position);
    }
    
    const url = `${API_BASE_URL}/staff?${params.toString()}`;

    const cacheKey = `staff:${params.toString()}`;
    const TTL = 3000;
    const now = Date.now();

    if (!forceRefresh && staffApi._staffCache.has(cacheKey)) {
      const cached = staffApi._staffCache.get(cacheKey)!;
      if ((now - cached.fetchedAt) < TTL) return Promise.resolve(cached.data as PaginatedResponse<StaffWithAmenities>);
    }

    if (!forceRefresh && staffApi._staffPromises.has(cacheKey)) return staffApi._staffPromises.get(cacheKey) as Promise<PaginatedResponse<StaffWithAmenities>>;

    const inflight = (async () => {
      const start = Date.now();
      let attempt = 0;
      while (true) {
        attempt++;
        try {
          const response = await fetchWithTimeout(url, { method: 'GET', headers: getAuthHeaders(), signal }, timeoutMs);
          const data = await handleResponse<PaginatedResponse<StaffWithAmenities>>(response);
          staffApi._staffCache.set(cacheKey, { data, fetchedAt: Date.now() });
          return data;
        } catch (err) {
          if (attempt > retries) throw err;
          const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 200);
          await new Promise(r => setTimeout(r, backoff + jitter));
        }
      }
    })();

    if (!forceRefresh) staffApi._staffPromises.set(cacheKey, inflight);
    try { return await inflight as PaginatedResponse<StaffWithAmenities>; } finally { staffApi._staffPromises.delete(cacheKey); }
    
  },
  
  // Get single staff member
  async getStaffMember(id: string): Promise<StaffWithAmenities> {
    const response = await safeFetch(`${API_BASE_URL}/staff/${id}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StaffWithAmenities>(response);
  },
  
  // Create a new staff member
  async createStaff(data: StaffFormData): Promise<StaffWithAmenities> {
    const formData = new FormData();
    
    // Append all base form fields
    Object.entries(data).forEach(([key, value]) => {
      // Skip amenities as we'll handle them separately
      if (key !== 'amenities' && value !== undefined && value !== null) {
        if (key === 'staff_image' || key === 'staff_citizenship_image' || key === 'staff_contract_image') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Handle amenities
    if (data.amenities && Array.isArray(data.amenities)) {
      // Check if amenities is an array of strings (IDs) or objects
      if (typeof data.amenities[0] === 'string') {
        // If it's an array of IDs, handle accordingly
        data.amenities.forEach((amenityId, index) => {
          // TypeScript needs a type assertion here
          formData.append(`amenities[${index}]`, amenityId as string);
        });
      } else {
        // Handle as array of objects
        (data.amenities as StaffAmenity[]).forEach((amenity, index) => {
          formData.append(`amenities[${index}][name]`, amenity.name);
          if (amenity.description) {
            formData.append(`amenities[${index}][description]`, amenity.description);
          }
        });
      }
    }

    const response = await safeFetch(`${API_BASE_URL}/staff`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<StaffWithAmenities>(response);
  },
  
  // Update an existing staff member
  async updateStaff(id: string, data: StaffFormData): Promise<StaffWithAmenities> {
    const formData = new FormData();
    
    // Add method override for Laravel
    formData.append('_method', 'PUT');
    
    // Append all base form fields
    Object.entries(data).forEach(([key, value]) => {
      // Skip amenities and removed tracking arrays as we'll handle them separately
      if (key !== 'amenities' && key !== 'removedAmenityIds' && key !== 'removedCitizenshipDocIds' && key !== 'removedContractDocIds' && value !== undefined && value !== null) {
        if (key === 'staff_image' || key === 'staff_citizenship_image' || key === 'staff_contract_image') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // Handle removed amenity IDs
    if (data.removedAmenityIds && Array.isArray(data.removedAmenityIds)) {
      data.removedAmenityIds.forEach((id: number, index: number) => {
        formData.append(`removedAmenityIds[${index}]`, String(id));
      });
    }
    
    // Handle removed citizenship document IDs
    if ((data as any).removedCitizenshipDocIds && Array.isArray((data as any).removedCitizenshipDocIds)) {
      (data as any).removedCitizenshipDocIds.forEach((id: number, index: number) => {
        formData.append(`removedCitizenshipDocIds[${index}]`, String(id));
      });
    }
    
    // Handle removed contract document IDs
    if ((data as any).removedContractDocIds && Array.isArray((data as any).removedContractDocIds)) {
      (data as any).removedContractDocIds.forEach((id: number, index: number) => {
        formData.append(`removedContractDocIds[${index}]`, String(id));
      });
    }
    
    // Handle amenities
    if (data.amenities && Array.isArray(data.amenities)) {
      // Check if amenities is an array of strings (IDs) or objects
      if (typeof data.amenities[0] === 'string') {
        // If it's an array of IDs, handle accordingly
        data.amenities.forEach((amenityId, index) => {
          // TypeScript needs a type assertion here
          formData.append(`amenities[${index}]`, amenityId as string);
        });
      } else {
        // Handle as array of objects (backward compatibility)
        (data.amenities as StaffAmenity[]).forEach((amenity, index) => {
          if (amenity.id) {
            formData.append(`amenities[${index}][id]`, amenity.id);
          }
          formData.append(`amenities[${index}][name]`, amenity.name);
          if (amenity.description) {
            formData.append(`amenities[${index}][description]`, amenity.description);
          }
        });
      }
    }

    const response = await safeFetch(`${API_BASE_URL}/staff/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<StaffWithAmenities>(response);
  },
  
  // Delete a staff member
  async deleteStaff(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/staff/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete staff member');
    }
  },

  // Toggle staff status (activate/deactivate)
  async toggleStaffStatus(id: string): Promise<{message: string, staff: StaffWithAmenities, is_active: boolean}> {
    const response = await safeFetch(`${API_BASE_URL}/staff/${id}/toggle-status`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<{message: string, staff: StaffWithAmenities, is_active: boolean}>(response);
  },
  
  // Get staff fields metadata
  async getStaffFields(): Promise<any> {
    const response = await safeFetch(`${API_BASE_URL}/staff/fields`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<any>(response);
  },

  // Get staff payments (staff-specific endpoint)
  async getStaffPayments(): Promise<any> {
    const response = await safeFetch(`${API_BASE_URL}/staff/payments`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Staff-specific methods for authenticated staff portal
  // Get current staff's profile
  async getStaffProfile(): Promise<StaffWithAmenities> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<StaffWithAmenities>(response);
  },

  // Update current staff's profile
  async updateStaffProfile(data: Partial<StaffFormData>): Promise<StaffWithAmenities> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse<StaffWithAmenities>(response);
  },

  // Get current staff's check-in/out records
  async getStaffCheckInOuts(): Promise<any> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/my-checkincheckouts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current staff's complaints
  async getStaffComplains(): Promise<any> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/complaints-list`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Create a new staff complaint
  async createStaffComplaint(data: {
    title: string;
    description: string;
    complain_attachment?: File;
  }): Promise<any> {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.complain_attachment) {
      formData.append('complain_attachment', data.complain_attachment);
    }

    const response = await safeFetch(`${API_BASE_URL}/my-staff/complaints-create`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<any>(response);
  },

  // Get a specific staff complaint
  async getStaffComplaint(id: string): Promise<any> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/complaints-view/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current staff's notices
  async getStaffNotices(): Promise<any> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/notices`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get a specific staff notice by ID
  async getStaffNotice(id: string): Promise<any> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/notices/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current staff's salary history
  async getStaffSalaryHistory(): Promise<any> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/salary-history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  }
};
