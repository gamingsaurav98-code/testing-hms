import { API_BASE_URL, handleResponse, PaginatedResponse } from './core';
import { getAuthHeaders } from './auth.api';

// Student Check-in/Check-out interfaces
export interface StudentCheckInCheckOut {
  id: string;
  student_id: string;
  block_id: string;
  checkout_rule_id?: string;
  date: string;
  checkin_time?: string;
  checkout_time?: string;
  estimated_checkin_date?: string;
  checkout_duration?: string;
  status: 'pending' | 'approved' | 'declined' | 'checked_in' | 'checked_out';
  remarks?: string;
  created_at: string;
  updated_at: string;
  // Relations
  student?: {
    id: string;
    student_name: string;
    student_id?: string;
    contact_number: string;
    email: string;
    room?: {
      id: string;
      room_name: string;
      block?: {
        id: string;
        block_name: string;
      };
    };
  };
  block?: {
    id: string;
    block_name: string;
  };
  checkout_rule?: {
    id: string;
    percentage: number;
    active_after_days?: number;
  };
  checkout_financials?: StudentCheckoutFinancial[];
}

export interface StudentCheckoutRule {
  id: string;
  student_id: string;
  is_active: boolean;
  active_after_days?: number;
  percentage?: number;
  created_at: string;
  updated_at: string;
  // Relations
  student?: {
    id: string;
    student_name: string;
    student_id?: string;
    room?: {
      id: string;
      room_name: string;
      block?: {
        id: string;
        block_name: string;
      };
    };
  };
}

export interface StudentCheckoutFinancial {
  id: string;
  student_id: string;
  checkout_id: string;
  checkout_rule_id?: string;
  checkout_duration?: string;
  deducted_amount: string;
  created_at: string;
  updated_at: string;
  // Relations
  student?: {
    id: string;
    student_name: string;
  };
  check_in_check_out?: StudentCheckInCheckOut;
  checkout_rule?: StudentCheckoutRule;
}

// Form data interfaces
export interface StudentCheckInCheckOutFormData {
  student_id: string;
  block_id: string;
  date: string;
  checkin_time?: string;
  checkout_time?: string;
  estimated_checkin_date?: string;
  remarks?: string;
}

export interface CheckInFormData {
  student_id?: string; // Optional since backend gets it from auth
  block_id?: string;
  checkin_time?: string;
  remarks?: string;
}

export interface CheckOutFormData {
  estimated_checkin_date?: string;
  remarks?: string;
}

export interface StudentCheckoutRuleFormData {
  student_id: string;
  is_active: boolean;
  active_after_days?: number;
  percentage?: number;
}

// Filter interfaces
export interface CheckInCheckOutFilters {
  student_id?: string;
  block_id?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  status?: 'checked_in' | 'checked_out';
  per_page?: number;
  all?: boolean;
}

export interface AttendanceStatistics {
  total_records: number;
  checked_in_count: number;
  checked_out_count: number;
  unique_students: number;
  by_date: Array<{
    date: string;
    total: number;
    checked_in: number;
    checked_out: number;
  }>;
  by_block: Array<{
    block_id: string;
    block_name: string;
    total: number;
    checked_in: number;
    checked_out: number;
    unique_students: number;
  }>;
}

export interface StudentStatistics {
  total_checkouts: number;
  total_deducted_amount: number;
  average_checkout_duration_hours: number;
  recent_checkouts: StudentCheckInCheckOut[];
}

// API functions for Student Check-in/Check-out
export const studentCheckInCheckOutApi = {
  // Get all check-in/check-out records (student-specific)
  async getCheckInCheckOuts(
    page: number = 1, 
    filters: CheckInCheckOutFilters = {}
  ): Promise<PaginatedResponse<StudentCheckInCheckOut>> {
    // Students use their own endpoint that returns only their records
    const response = await fetch(`${API_BASE_URL}/student/checkincheckouts`, {
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse<{ data: StudentCheckInCheckOut[]; total: number }>(response);
    
    // Transform to match pagination format expected by UI
    return {
      data: result.data,
      current_page: 1,
      per_page: result.data.length,
      total: result.total || result.data.length,
      last_page: 1
    };
  },

  // Get specific check-in/check-out record (student-specific)
  async getCheckInCheckOut(id: string): Promise<{ data: StudentCheckInCheckOut }> {
    const response = await fetch(`${API_BASE_URL}/student/checkincheckouts/${id}`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse<{ data: StudentCheckInCheckOut }>(response);
  },

  // NOTE: Admin-only methods (createCheckInCheckOut, updateCheckInCheckOut, deleteCheckInCheckOut) 
  // are not available for students. Students use checkIn/checkOut methods instead.

  // Admin: Create check-in/check-out record
  async createCheckInCheckOut(data: StudentCheckInCheckOutFormData): Promise<{ data: StudentCheckInCheckOut }> {
    const response = await fetch(`${API_BASE_URL}/student-checkincheckouts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse<{ data: StudentCheckInCheckOut }>(response);
  },

  // Admin: Update check-in/check-out record
  async updateCheckInCheckOut(id: string, data: Partial<StudentCheckInCheckOutFormData>): Promise<{ data: StudentCheckInCheckOut }> {
    const response = await fetch(`${API_BASE_URL}/student-checkincheckouts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse<{ data: StudentCheckInCheckOut }>(response);
  },

  // Quick check-in (Student function)
  async checkIn(data: CheckInFormData): Promise<{ data: StudentCheckInCheckOut }> {
    console.log('Student checkin request:', data);
    console.log('API URL:', `${API_BASE_URL}/student/checkin`);
    console.log('Headers:', getAuthHeaders());
    
    try {
      const response = await fetch(`${API_BASE_URL}/student/checkin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      console.log('Checkin response status:', response.status);
      console.log('Checkin response headers:', Object.fromEntries(response.headers.entries()));
      
      return handleResponse<{ data: StudentCheckInCheckOut }>(response);
    } catch (error) {
      console.error('Checkin API error:', error);
      throw new Error('Failed to check in. Please try again.');
    }
  },

  // Quick check-out (Student function)
  async checkOut(data: CheckOutFormData): Promise<{ data: StudentCheckInCheckOut }> {
    console.log('Student checkout request:', data);
    console.log('API URL:', `${API_BASE_URL}/student/checkout`);
    console.log('Headers:', getAuthHeaders());
    
    try {
      const response = await fetch(`${API_BASE_URL}/student/checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      console.log('Checkout response status:', response.status);
      console.log('Checkout response headers:', Object.fromEntries(response.headers.entries()));
      
      return handleResponse<{ data: StudentCheckInCheckOut }>(response);
    } catch (error) {
      console.error('Checkout API error:', error);
      throw new Error('Failed to submit checkout request. Please try again.');
    }
  },

  // Get today's attendance (Student function)
  async getTodayAttendance(): Promise<{ data: StudentCheckInCheckOut[]; date: string }> {
    console.log('Getting student today attendance');
    console.log('API URL:', `${API_BASE_URL}/student/today-attendance`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/student/today-attendance`, {
        headers: getAuthHeaders(),
      });
      
      console.log('Today attendance response status:', response.status);
      return handleResponse<{ data: StudentCheckInCheckOut[]; date: string }>(response);
    } catch (error) {
      console.error('Today attendance API error:', error);
      throw new Error('Failed to get today\'s attendance. Please try again.');
    }
  },

  // Approve checkout request
  async approveCheckout(id: string): Promise<{ data: StudentCheckInCheckOut }> {
    const response = await fetch(`${API_BASE_URL}/student-checkincheckouts/${id}/approve-checkout`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<{ data: StudentCheckInCheckOut }>(response);
  },

  // Decline checkout request
  async declineCheckout(id: string, remarks?: string): Promise<{ data: StudentCheckInCheckOut }> {
    const response = await fetch(`${API_BASE_URL}/student-checkincheckouts/${id}/decline-checkout`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        remarks: remarks || 'Checkout declined by admin'
      }),
    });
    return handleResponse<{ data: StudentCheckInCheckOut }>(response);
  },

  // Admin: Get specific student check-in/checkout record
  async getStudentCheckInCheckOutRecord(id: string): Promise<{ data: StudentCheckInCheckOut }> {
    const response = await fetch(`${API_BASE_URL}/student-checkincheckouts/${id}`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse<{ data: StudentCheckInCheckOut }>(response);
  },

  // Get student statistics
  async getStudentStatistics(
    studentId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{ data: StudentStatistics }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const response = await fetch(`${API_BASE_URL}/student-checkincheckouts/statistics/${studentId}?${queryParams}`);
    return handleResponse<{ data: StudentStatistics }>(response);
  },

  // Get attendance statistics
  async getAttendanceStatistics(
    startDate?: string, 
    endDate?: string, 
    blockId?: string
  ): Promise<{ data: AttendanceStatistics }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (blockId) queryParams.append('block_id', blockId);
    
    const response = await fetch(`${API_BASE_URL}/student-checkincheckouts/attendance/statistics?${queryParams}`);
    return handleResponse<{ data: AttendanceStatistics }>(response);
  },

  // Get my records (student-specific endpoint)
  async getMyRecords(): Promise<{ data: StudentCheckInCheckOut[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/student/checkincheckouts`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StudentCheckInCheckOut[]; total: number }>(response);
  },
};

// API functions for Student Checkout Rules
export const studentCheckoutRuleApi = {
  // Get all checkout rules
  async getCheckoutRules(
    page: number = 1, 
    filters: { student_id?: string; is_active?: boolean; block_id?: string; all?: boolean } = {}
  ): Promise<PaginatedResponse<StudentCheckoutRule>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await fetch(`${API_BASE_URL}/student-checkout-rules?${queryParams}`);
    return handleResponse<PaginatedResponse<StudentCheckoutRule>>(response);
  },

  // Get specific checkout rule
  async getCheckoutRule(id: string): Promise<{ data: StudentCheckoutRule }> {
    const response = await fetch(`${API_BASE_URL}/student-checkout-rules/${id}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse<{ data: StudentCheckoutRule }>(response);
  },

  // Create new checkout rule
  async createCheckoutRule(data: StudentCheckoutRuleFormData): Promise<{ data: StudentCheckoutRule }> {
    const response = await fetch(`${API_BASE_URL}/student-checkout-rules`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: StudentCheckoutRule }>(response);
  },

  // Update checkout rule
  async updateCheckoutRule(id: string, data: Partial<StudentCheckoutRuleFormData>): Promise<{ data: StudentCheckoutRule }> {
    const response = await fetch(`${API_BASE_URL}/student-checkout-rules/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: StudentCheckoutRule }>(response);
  },

  // Delete checkout rule
  async deleteCheckoutRule(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/student-checkout-rules/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  },

  // Get rules for specific student
  async getStudentRules(studentId: string): Promise<{ data: StudentCheckoutRule[] }> {
    const response = await fetch(`${API_BASE_URL}/student-checkout-rules/student/${studentId}`);
    return handleResponse<{ data: StudentCheckoutRule[] }>(response);
  },

  // Toggle rule status
  async toggleRuleStatus(id: string): Promise<{ data: StudentCheckoutRule }> {
    const response = await fetch(`${API_BASE_URL}/student-checkout-rules/${id}/toggle-status`, {
      method: 'POST',
    });
    return handleResponse<{ data: StudentCheckoutRule }>(response);
  },

  // Get rule preview
  async getRulePreview(studentId: string): Promise<{ data: any }> {
    const response = await fetch(`${API_BASE_URL}/student-checkout-rules/preview/${studentId}`);
    return handleResponse<{ data: any }>(response);
  },
};

// API functions for Student Checkout Financials
export const studentCheckoutFinancialApi = {
  // Get all checkout financials
  async getCheckoutFinancials(
    page: number = 1, 
    filters: { student_id?: string; block_id?: string; start_date?: string; end_date?: string; month?: string; year?: string; all?: boolean } = {}
  ): Promise<PaginatedResponse<StudentCheckoutFinancial>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await fetch(`${API_BASE_URL}/student-checkout-financials?${queryParams}`);
    return handleResponse<PaginatedResponse<StudentCheckoutFinancial>>(response);
  },

  // Get specific checkout financial
  async getCheckoutFinancial(id: string): Promise<{ data: StudentCheckoutFinancial }> {
    const response = await fetch(`${API_BASE_URL}/student-checkout-financials/${id}`);
    return handleResponse<{ data: StudentCheckoutFinancial }>(response);
  },

  // Get financials for specific student
  async getStudentFinancials(
    studentId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{ data: { financials: StudentCheckoutFinancial[]; summary: any } }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const response = await fetch(`${API_BASE_URL}/student-checkout-financials/student/${studentId}?${queryParams}`);
    return handleResponse<{ data: { financials: StudentCheckoutFinancial[]; summary: any } }>(response);
  },

  // Get financial statistics
  async getFinancialStatistics(
    startDate?: string, 
    endDate?: string, 
    blockId?: string
  ): Promise<{ data: any }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (blockId) queryParams.append('block_id', blockId);
    
    const response = await fetch(`${API_BASE_URL}/student-checkout-financials/statistics/overview?${queryParams}`);
    return handleResponse<{ data: any }>(response);
  },

  // Export financials
  async exportFinancials(
    startDate?: string, 
    endDate?: string, 
    blockId?: string
  ): Promise<{ data: any[]; summary: any }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (blockId) queryParams.append('block_id', blockId);
    
    const response = await fetch(`${API_BASE_URL}/student-checkout-financials/export/data?${queryParams}`);
    return handleResponse<{ data: any[]; summary: any }>(response);
  },
};
