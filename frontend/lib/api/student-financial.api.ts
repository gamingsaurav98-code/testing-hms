import { API_BASE_URL, handleResponse, safeFetch } from './core';
import { getAuthHeaders } from './auth.api';
import { PaginatedResponse } from './types';

export interface StudentFinancial {
  id: string;
  student_id: string;
  amount: string;
  admission_fee?: string;
  form_fee?: string;
  security_deposit?: string;
  monthly_fee?: string;
  is_existing_student?: boolean;
  previous_balance?: string;
  initial_balance_after_registration?: string;
  balance_type?: 'due' | 'advance';
  payment_date: string;
  joining_date?: string;
  payment_type_id?: string;
  remark?: string;
  created_at: string;
  updated_at?: string;
  student?: {
    id: string;
    student_name: string;
  };
  paymentType?: {
    id: string;
    name: string;
  };
}

export interface StudentFinancialFormData {
  student_id: string;
  amount: string;
  admission_fee?: string;
  form_fee?: string;
  security_deposit?: string;
  monthly_fee?: string;
  is_existing_student?: boolean;
  previous_balance?: string;
  initial_balance_after_registration?: string;
  balance_type?: 'due' | 'advance';
  payment_date: string;
  joining_date?: string;
  payment_type_id?: string;
  remark?: string;
}

export interface FinancialFieldMetadata {
  type: 'string' | 'boolean' | 'date' | 'enum' | 'foreign_id' | 'text';
  required: boolean;
  table?: string;
  options?: string[];
  note?: string;
  default?: string | boolean | number | null;
}

export interface StudentFinancialFieldsResponse {
  financial_fields: Record<string, FinancialFieldMetadata>;
  note: string;
}

class StudentFinancialApi {
  async getFinancials(page: number = 1, params?: Record<string, any>): Promise<PaginatedResponse<StudentFinancial>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...params
    });

    const response = await safeFetch(`${API_BASE_URL}/student-financials?${queryParams}`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  }

  async getFinancial(id: string): Promise<StudentFinancial> {
    const response = await safeFetch(`${API_BASE_URL}/student-financials/${id}`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  }

  async createFinancial(data: StudentFinancialFormData): Promise<StudentFinancial> {
    const response = await safeFetch(`${API_BASE_URL}/student-financials`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return handleResponse(response);
  }

  async updateFinancial(id: string, data: Partial<StudentFinancialFormData>): Promise<StudentFinancial> {
    const response = await safeFetch(`${API_BASE_URL}/student-financials/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return handleResponse(response);
  }

  async deleteFinancial(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/student-financials/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  }

  async getStudentFinancials(studentId: string): Promise<StudentFinancial[]> {
    const response = await safeFetch(`${API_BASE_URL}/students/${studentId}/financials`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  }

  async getFields(): Promise<StudentFinancialFieldsResponse> {
    const response = await safeFetch(`${API_BASE_URL}/student-financials/fields/metadata`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  }
}

export const studentFinancialApi = new StudentFinancialApi();
