import { API_BASE_URL, handleResponse } from './core';
import { getAuthHeaders, getAuthHeadersForFormData } from './auth.api';
import { PaginatedResponse } from './core';

// StaffAmenity interface
export interface StaffAmenity {
  id?: string;
  staff_id?: string;
  name: string;
  description?: string;
}

// StaffFinancial interface
export interface StaffFinancial {
  id?: string;
  staff_id?: string;
  salary_amount?: string;
  bonus_amount?: string;
  deduction_amount?: string;
  net_salary?: string;
  payment_date?: string;
  payment_type_id?: string;
  payment_type?: {
    id: string;
    name: string;
    description?: string;
  };
  created_at: string;
  updated_at?: string;
}

// Staff interface
export interface Staff {
  id: string;
  staff_name: string;
  user_id?: string;
  date_of_birth?: string;
  contact_number: string;
  email: string;
  district?: string;
  city_name?: string;
  ward_no?: string;
  street_name?: string;
  citizenship_no?: string;
  date_of_issue?: string;
  citizenship_issued_district?: string;
  educational_institution?: string;
  level_of_study?: string;
  blood_group?: string;
  food?: string;
  disease?: string;
  father_name?: string;
  father_contact?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_contact?: string;
  mother_occupation?: string;
  spouse_name?: string;
  spouse_contact?: string;
  spouse_occupation?: string;
  local_guardian_name?: string;
  local_guardian_address?: string;
  local_guardian_contact?: string;
  local_guardian_occupation?: string;
  local_guardian_relation?: string;
  is_active: boolean;
  staff_image?: string;
  staff_citizenship_image?: string;
  staff_contract_image?: string;
  // Staff-specific fields
  staff_id?: string;
  position?: string;
  department?: string;
  joining_date?: string;
  salary_amount?: string;
  employment_type?: string;
  // Verification Details
  declaration_agreed?: boolean;
  contract_agreed?: boolean;
  verified_by?: string;
  verified_on?: string;
  // Standard fields
  created_at: string;
  updated_at?: string;
  latest_salary?: string; // From latest salary record
}

// Extended Staff interface with amenities and financials
export interface StaffWithAmenities extends Staff {
  amenities?: StaffAmenity[];
  financials?: StaffFinancial[];
  salaries?: any[]; // Salary records
}

// Staff form data interface
export interface StaffFormData {
  staff_name: string;
  date_of_birth?: string;
  contact_number: string;
  email: string;
  district?: string;
  city_name?: string;
  ward_no?: string;
  street_name?: string;
  citizenship_no?: string;
  date_of_issue?: string;
  citizenship_issued_district?: string;
  educational_institution?: string;
  level_of_study?: string;
  blood_group?: string;
  food?: string;
  disease?: string;
  father_name?: string;
  father_contact?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_contact?: string;
  mother_occupation?: string;
  spouse_name?: string;
  spouse_contact?: string;
  spouse_occupation?: string;
  local_guardian_name?: string;
  local_guardian_address?: string;
  local_guardian_contact?: string;
  local_guardian_occupation?: string;
  local_guardian_relation?: string;
  is_active?: boolean;
  staff_id?: string;
  position?: string;
  department?: string;
  joining_date?: string;
  salary_amount?: string;
  employment_type?: string;
  declaration_agreed?: boolean;
  contract_agreed?: boolean;
  verified_by?: string;
  verified_on?: string;
  // Image fields
  staff_image?: File | null;
  staff_citizenship_image?: File | null;
  staff_contract_image?: File | null;
  amenities?: StaffAmenity[] | string[];
  removedAmenityIds?: number[];
  removedCitizenshipDocIds?: number[];
  removedContractDocIds?: number[];
}

// Staff financial form data interface
export interface StaffFinancialFormData {
  salary_amount?: string;
  bonus_amount?: string;
  deduction_amount?: string;
  net_salary?: string;
  payment_date: string;
  payment_type_id?: string;
  remark?: string;
}

// Staff API functions
export const staffApi = {
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
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
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
    const response = await fetch(`${API_BASE_URL}/staff-amenities`, {
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
  async getAllActiveStaff(): Promise<StaffWithAmenities[]> {
    const response = await fetch(`${API_BASE_URL}/staff?all=true`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<StaffWithAmenities[]>(response);
  },
  
  // Get paginated staff list
  async getStaff(page: number = 1, filters?: { search?: string; active?: boolean; department?: string; position?: string }): Promise<PaginatedResponse<StaffWithAmenities>> {
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
    
    const response = await fetch(`${API_BASE_URL}/staff?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<PaginatedResponse<StaffWithAmenities>>(response);
  },
  
  // Get single staff member
  async getStaffMember(id: string): Promise<StaffWithAmenities> {
    const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
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

    const response = await fetch(`${API_BASE_URL}/staff`, {
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

    const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<StaffWithAmenities>(response);
  },
  
  // Delete a staff member
  async deleteStaff(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
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
  
  // Get staff fields metadata
  async getStaffFields(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/staff/fields`, {
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
    const response = await fetch(`${API_BASE_URL}/staff/payments`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Staff-specific methods for authenticated staff portal
  // Get current staff's profile
  async getStaffProfile(): Promise<StaffWithAmenities> {
    const response = await fetch(`${API_BASE_URL}/my-staff/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<StaffWithAmenities>(response);
  },

  // Update current staff's profile
  async updateStaffProfile(data: Partial<StaffFormData>): Promise<StaffWithAmenities> {
    const response = await fetch(`${API_BASE_URL}/my-staff/profile`, {
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
    const response = await fetch(`${API_BASE_URL}/my-staff/my-checkincheckouts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current staff's complaints
  async getStaffComplains(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my-staff/complaints-list`, {
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

    const response = await fetch(`${API_BASE_URL}/my-staff/complaints-create`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<any>(response);
  },

  // Get a specific staff complaint
  async getStaffComplaint(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my-staff/complaints-view/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current staff's notices
  async getStaffNotices(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my-staff/notices`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get a specific staff notice by ID
  async getStaffNotice(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my-staff/notices/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  },

  // Get current staff's salary history
  async getStaffSalaryHistory(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/my-staff/salary-history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<any>(response);
  }
};
