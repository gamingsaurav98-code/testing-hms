import { API_BASE_URL, handleResponse, PaginatedResponse, safeFetch, fetchWithTimeout, DEFAULT_API_TIMEOUT } from './core';
import { getAuthHeaders } from './auth.api';

// Staff Check-in/Check-out interfaces
export interface StaffCheckInCheckOut {
  id: string;
  staff_id: string;
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
  staff?: {
    id: string;
    staff_name: string;
    staff_id?: string;
    contact_number: string;
    email: string;
    position?: string;
    department?: string;
    salary_amount?: string;
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
  checkout_financials?: StaffCheckoutFinancial[];
}

export interface StaffCheckoutRule {
  id: string;
  staff_id: string;
  percentage: number;
  active_after_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  staff?: {
    id: string;
    staff_name: string;
    staff_id?: string;
    department?: string;
    position?: string;
  };
}

export interface StaffCheckoutFinancial {
  id: string;
  staff_checkin_checkout_id: string;
  checkout_rule_id: string;
  deducted_amount: number;
  calculated_hours: number;
  checkout_date: string;
  created_at: string;
  updated_at: string;
  checkout_rule?: StaffCheckoutRule;
  staff_checkin_checkout?: StaffCheckInCheckOut;
}

// Form data interfaces
export interface StaffCheckInCheckOutFormData {
  staff_id: string;
  block_id: string;
  date: string;
  checkin_time?: string;
  checkout_time?: string;
  estimated_checkin_date?: string;
  remarks?: string;
}

export interface CheckInFormData {
  block_id: string;
  remarks?: string;
}

export interface CheckOutFormData {
  estimated_checkin_date?: string;
  remarks?: string;
}

export interface StaffCheckoutRuleFormData {
  staff_id: string;
  percentage: number;
  active_after_days?: number;
  is_active: boolean;
}

// Filter interfaces
export interface CheckInCheckOutFilters {
  staff_id?: string;
  block_id?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  all?: boolean;
}

export interface AttendanceStatistics {
  total_records: number;
  checked_in_count: number;
  checked_out_count: number;
  unique_staff: number;
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
    unique_staff: number;
  }>;
  by_department: Array<{
    department: string;
    total: number;
    checked_in: number;
    checked_out: number;
    unique_staff: number;
  }>;
}

export interface StaffStatistics {
  total_checkouts: number;
  total_deducted_amount: number;
  average_checkout_duration_hours: number;
  recent_checkouts: StaffCheckInCheckOut[];
}

// API functions for Staff Check-in/Check-out
export const staffCheckInCheckOutApi = {
  // Get all check-in/check-out records (Admin function)
  async getCheckInCheckOuts(
    page: number = 1, 
    filters: CheckInCheckOutFilters = {},
    signal?: AbortSignal
  ): Promise<PaginatedResponse<StaffCheckInCheckOut>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts?${queryParams}`, {
      headers: getAuthHeaders(),
      signal,
    });
    return handleResponse<PaginatedResponse<StaffCheckInCheckOut>>(response);
  },

  // Get specific check-in/check-out record
  async getCheckInCheckOut(id: string): Promise<{ data: StaffCheckInCheckOut }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffCheckInCheckOut }>(response);
  },

  // Create new check-in/check-out record (Admin function)
  async createCheckInCheckOut(data: StaffCheckInCheckOutFormData): Promise<{ data: StaffCheckInCheckOut }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: StaffCheckInCheckOut }>(response);
  },

  // Update check-in/check-out record (Admin function)
  async updateCheckInCheckOut(id: string, data: Partial<StaffCheckInCheckOutFormData>): Promise<{ data: StaffCheckInCheckOut }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: StaffCheckInCheckOut }>(response);
  },

  // Delete check-in/check-out record (Admin function)
  async deleteCheckInCheckOut(id: string): Promise<{ message: string }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },

  // Quick check-in (Staff function)
  async checkIn(data: CheckInFormData): Promise<{ data: StaffCheckInCheckOut }> {
    console.log('Staff checkin request:', data);
    console.log('API URL:', `${API_BASE_URL}/my-staff/checkin`);
    console.log('Headers:', getAuthHeaders());
    
    try {
      const response = await safeFetch(`${API_BASE_URL}/my-staff/checkin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      console.log('Checkin response status:', response.status);
      console.log('Checkin response headers:', Object.fromEntries(response.headers.entries()));
      
      return handleResponse<{ data: StaffCheckInCheckOut }>(response);
    } catch (error) {
      console.error('Checkin API error:', error);
      throw new Error('Failed to check in. Please try again.');
    }
  },

  // Quick check-out (Staff function)
  async checkOut(data: CheckOutFormData): Promise<{ data: StaffCheckInCheckOut }> {
    console.log('Staff checkout request:', data);
    console.log('API URL:', `${API_BASE_URL}/my-staff/checkout`);
    console.log('Headers:', getAuthHeaders());
    
    try {
      const response = await safeFetch(`${API_BASE_URL}/my-staff/checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      console.log('Checkout response status:', response.status);
      console.log('Checkout response headers:', Object.fromEntries(response.headers.entries()));
      
      return handleResponse<{ data: StaffCheckInCheckOut }>(response);
    } catch (error) {
      console.error('Checkout API error:', error);
      throw new Error('Failed to submit checkout request. Please try again.');
    }
  },

  // Get today's attendance (Admin function)
  async getTodayAttendance(blockId?: string): Promise<{ data: StaffCheckInCheckOut[]; date: string }> {
    const queryParams = new URLSearchParams();
    if (blockId) queryParams.append('block_id', blockId);
    
    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts/today/attendance?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffCheckInCheckOut[]; date: string }>(response);
  },

  // Approve checkout request (Admin function)
  async approveCheckout(id: string): Promise<{ data: StaffCheckInCheckOut }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts/${id}/approve-checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffCheckInCheckOut }>(response);
  },

  // Decline checkout request (Admin function)
  async declineCheckout(id: string, remarks?: string): Promise<{ data: StaffCheckInCheckOut }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts/${id}/decline-checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks }),
    });
    return handleResponse<{ data: StaffCheckInCheckOut }>(response);
  },

  // Get staff statistics (Admin function)
  async getStaffStatistics(
    staffId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{ data: StaffStatistics }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const response = await safeFetch(`${API_BASE_URL}/staff-checkincheckouts/statistics/${staffId}?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffStatistics }>(response);
  },

  // Get attendance statistics (Admin function)
  // In-memory cache + inflight promise for staff attendance statistics
  _attendanceCache: null as { data: unknown; fetchedAt: number } | null,
  _attendancePromise: null as Promise<unknown> | null,

  async getAttendanceStatistics({ startDate, endDate, blockId, department, timeoutMs = DEFAULT_API_TIMEOUT, retries = 2, forceRefresh = false }:{ startDate?: string; endDate?: string; blockId?: string; department?: string; timeoutMs?: number; retries?: number; forceRefresh?: boolean } = {}): Promise<{ data: AttendanceStatistics }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (blockId) queryParams.append('block_id', blockId);
    if (department) queryParams.append('department', department);

    const url = `${API_BASE_URL}/staff-checkincheckouts/attendance/statistics?${queryParams}` + (forceRefresh ? '&force_refresh=1' : '');

    const TTL = 3000; // 3s
    const now = Date.now();

    if (!forceRefresh && staffCheckInCheckOutApi._attendanceCache && (now - staffCheckInCheckOutApi._attendanceCache.fetchedAt) < TTL) {
      return Promise.resolve(staffCheckInCheckOutApi._attendanceCache.data as { data: AttendanceStatistics });
    }

    if (!forceRefresh && staffCheckInCheckOutApi._attendancePromise) return staffCheckInCheckOutApi._attendancePromise as Promise<{ data: AttendanceStatistics }>;

    const inflight = (async () => {
      const start = Date.now();
      let attempt = 0;
      while (true) {
        attempt++;
        try {
          const resp = await fetchWithTimeout(url, { method: 'GET', headers: { ...getAuthHeaders(), 'Accept': 'application/json' } }, timeoutMs);
          const took = Date.now() - start;
          console.debug(`staffCheckInCheckOutApi.getAttendanceStatistics - status ${resp.status} (took ${took}ms, attempt ${attempt})`);
          const data = await handleResponse<{ data: AttendanceStatistics }>(resp);
          staffCheckInCheckOutApi._attendanceCache = { data, fetchedAt: Date.now() };
          return data;
        } catch (err) {
          console.warn(`staffCheckInCheckOutApi.getAttendanceStatistics attempt ${attempt} failed:`, err);
          if (attempt > retries) throw err;
          const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 200);
          await new Promise(r => setTimeout(r, backoff + jitter));
        }
      }
    })();

    if (!forceRefresh) staffCheckInCheckOutApi._attendancePromise = inflight;
    try { return await inflight; } finally { staffCheckInCheckOutApi._attendancePromise = null; }
  },

  // Staff-specific method to get current user's check-in/checkout records
  async getMyRecords(): Promise<{ data: StaffCheckInCheckOut[] }> {
    const url = `${API_BASE_URL}/my-staff/my-checkincheckouts`;
    
    try {
      const response = await safeFetch(url, {
        headers: getAuthHeaders(),
      });
      
      const result = await handleResponse<{ data: StaffCheckInCheckOut[] }>(response);
      return result;
    } catch (error) {
      // Return empty data instead of throwing error to prevent crashes
      return { data: [] };
    }
  },

  // Staff-specific method to get a single record by ID
  async getMyRecord(id: string): Promise<{ data: StaffCheckInCheckOut }> {
    const url = `${API_BASE_URL}/my-staff/my-checkincheckouts/${id}`;
    
    try {
      const response = await safeFetch(url, {
        headers: getAuthHeaders(),
      });
      
      const result = await handleResponse<{ data: StaffCheckInCheckOut }>(response);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Get my today's attendance (Staff function)
  async getMyTodayAttendance(): Promise<{ data: StaffCheckInCheckOut | null }> {
    const response = await safeFetch(`${API_BASE_URL}/my-staff/today-attendance`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffCheckInCheckOut | null }>(response);
  },
};

// API functions for Staff Checkout Rules (Admin functions)
export const staffCheckoutRuleApi = {
  // Get all checkout rules
  async getCheckoutRules(
    page: number = 1, 
    filters: { staff_id?: string; is_active?: boolean; department?: string; position?: string; all?: boolean } = {}
  ): Promise<PaginatedResponse<StaffCheckoutRule>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-rules?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<StaffCheckoutRule>>(response);
  },

  // Get specific checkout rule
  async getCheckoutRule(id: string): Promise<{ data: StaffCheckoutRule }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-rules/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffCheckoutRule }>(response);
  },

  // Create new checkout rule
  async createCheckoutRule(data: StaffCheckoutRuleFormData): Promise<{ data: StaffCheckoutRule }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: StaffCheckoutRule }>(response);
  },

  // Update checkout rule
  async updateCheckoutRule(id: string, data: Partial<StaffCheckoutRuleFormData>): Promise<{ data: StaffCheckoutRule }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ data: StaffCheckoutRule }>(response);
  },

  // Delete checkout rule
  async deleteCheckoutRule(id: string): Promise<{ message: string }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },

  // Get rules for specific staff
  async getStaffRules(staffId: string): Promise<{ data: StaffCheckoutRule[] }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-rules/staff/${staffId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffCheckoutRule[] }>(response);
  },

  // Toggle rule status
  async toggleRuleStatus(id: string): Promise<{ data: StaffCheckoutRule }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-rules/${id}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffCheckoutRule }>(response);
  },

  // Get rule preview
  async getRulePreview(staffId: string): Promise<{ data: any }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-rules/preview/${staffId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: any }>(response);
  },
};

// API functions for Staff Checkout Financials (Admin functions)
export const staffCheckoutFinancialApi = {
  // Get all checkout financials
  async getCheckoutFinancials(
    page: number = 1, 
    filters: { 
      staff_id?: string; 
      block_id?: string; 
      department?: string;
      start_date?: string; 
      end_date?: string; 
      month?: string; 
      year?: string; 
      all?: boolean 
    } = {}
  ): Promise<PaginatedResponse<StaffCheckoutFinancial>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-financials?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<StaffCheckoutFinancial>>(response);
  },

  // Get checkout financial by ID
  async getCheckoutFinancial(id: string): Promise<{ data: StaffCheckoutFinancial }> {
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-financials/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: StaffCheckoutFinancial }>(response);
  },

  // Get financial statistics
  async getFinancialStatistics(
    startDate?: string, 
    endDate?: string, 
    blockId?: string,
    department?: string
  ): Promise<{ data: any }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (blockId) queryParams.append('block_id', blockId);
    if (department) queryParams.append('department', department);
    
    const response = await safeFetch(`${API_BASE_URL}/staff-checkout-financials/statistics/overview?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ data: any }>(response);
  }
};
