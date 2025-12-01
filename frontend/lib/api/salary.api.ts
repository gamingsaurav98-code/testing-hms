import { API_BASE_URL, handleResponse, PaginatedResponse, safeFetch } from './core';
import { getAuthHeaders } from './auth.api';

export interface Salary {
  id: number;
  staff_id: number;
  amount: number;
  month: number;
  year: number;
  status: 'pending' | 'paid' | 'cancelled';
  month_name: string;
  formatted_amount: string;
  description?: string;
  created_at: string;
  updated_at: string;
  staff?: Staff;
}

export interface Staff {
  id: number;
  staff_id: string;
  staff_name: string;
  email: string;
  contact_number: string;
}

export interface SalaryStatistics {
  total_salaries_this_month: number;
  total_amount_this_month: number;
  paid_salaries_this_month: number;
  pending_salaries_this_month: number;
  total_salaries_this_year: number;
  total_amount_this_year: number;
}

export interface CreateSalaryRequest {
  staff_id: number;
  amount: number;
  month: number;
  year: number;
  description?: string;
  status?: 'pending' | 'paid' | 'cancelled';
}

export interface UpdateSalaryRequest {
  staff_id?: number;
  amount?: number;
  month?: number;
  year?: number;
  description?: string;
  status?: 'pending' | 'paid' | 'cancelled';
}

export interface SalaryFilters {
  staff_id?: number;
  month?: number;
  year?: number;
  status?: string;
  paginate?: boolean;
  per_page?: number;
}

export class SalaryApi {
  static async getAll(filters: SalaryFilters = {}): Promise<PaginatedResponse<Salary> | Salary[]> {
    const params = new URLSearchParams();
    
    if (filters.staff_id) params.append('staff_id', filters.staff_id.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.paginate !== undefined) params.append('paginate', filters.paginate.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const url = `${API_BASE_URL}/salaries${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await safeFetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<Salary> | Salary[]>(response);
  }

  static async getById(id: number): Promise<Salary> {
    const response = await safeFetch(`${API_BASE_URL}/salaries/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Salary>(response);
  }

  static async create(data: CreateSalaryRequest): Promise<Salary> {
    const response = await safeFetch(`${API_BASE_URL}/salaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Salary>(response);
  }

  static async update(id: number, data: UpdateSalaryRequest): Promise<Salary> {
    const response = await safeFetch(`${API_BASE_URL}/salaries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Salary>(response);
  }

  static async delete(id: number): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/salaries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse<void>(response);
  }

  static async getStaffSalaries(staffId: number): Promise<Salary[]> {
    const response = await safeFetch(`${API_BASE_URL}/staff/${staffId}/salaries`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Salary[]>(response);
  }

  // Staff-specific method to get current user's salary history
  static async getMySalaryHistory(): Promise<Salary[]> {
    try {
      const response = await safeFetch(`${API_BASE_URL}/my-staff/salary-history`, {
        headers: getAuthHeaders(),
      });
      
      // Handle authorization and other errors gracefully
      if (response.status === 401) {
        console.log('Authorization error - staff salary endpoint may require backend restart');
        return [];
      }
      
      if (response.status === 404 || response.status === 500) {
        console.log('Staff salary endpoint not available, backend might need restart');
        return [];
      }
      
      if (!response.ok) {
        console.log('Salary API request failed with status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        return [];
      }
      
      return handleResponse<Salary[]>(response);
    } catch (error) {
      console.error('getMySalaryHistory error:', error);
      return [];
    }
  }

  static async getStatistics(signal?: AbortSignal): Promise<SalaryStatistics> {
    const response = await safeFetch(`${API_BASE_URL}/salaries/statistics`, {
      headers: getAuthHeaders(),
      signal,
    });
    return handleResponse<SalaryStatistics>(response);
  }
}

export class StaffApi {
  static async getAll(includeAll = false): Promise<Staff[]> {
    const url = `${API_BASE_URL}/staff${includeAll ? '?all=true' : ''}`;
    const response = await safeFetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Staff[]>(response);
  }

  static async getById(id: number): Promise<Staff> {
    const response = await safeFetch(`${API_BASE_URL}/staff/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Staff>(response);
  }
}
