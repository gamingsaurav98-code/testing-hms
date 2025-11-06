import { API_BASE_URL, handleResponse } from './core';
import { getAuthHeaders, getAuthHeadersForFormData } from './auth.api';
import { Income, IncomeFormData, IncomeType, PaymentType, Student } from './types';
import { PaginatedResponse } from './core';

// Income API functions
export const incomeApi = {
  // Get all incomes with pagination
  async getIncomes(page: number = 1): Promise<PaginatedResponse<Income>> {
    const response = await fetch(`${API_BASE_URL}/incomes?page=${page}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<PaginatedResponse<Income>>(response);
  },

  // Get a single income by ID
  async getIncome(id: string): Promise<Income> {
    const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Income>(response);
  },

  // Create a new income
  async createIncome(data: IncomeFormData): Promise<Income> {
    const formData = new FormData();
    
    // Append all form fields
    formData.append('student_id', data.student_id);
    formData.append('income_type_id', data.income_type_id);
    formData.append('payment_type_id', data.payment_type_id);
    formData.append('amount', String(data.amount));
    formData.append('income_date', data.income_date);
    
    if (data.title) {
      formData.append('title', data.title);
    }
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.received_amount !== undefined) {
      formData.append('received_amount', String(data.received_amount));
    }
    
    if (data.due_amount !== undefined) {
      formData.append('due_amount', String(data.due_amount));
    }
    
    if (data.payment_status) {
      formData.append('payment_status', data.payment_status);
    }
    
    // Append file if present
    if (data.income_attachment) {
      formData.append('income_attachment', data.income_attachment);
    }

    const response = await fetch(`${API_BASE_URL}/incomes`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<Income>(response);
  },

  // Update an existing income
  async updateIncome(id: string, data: IncomeFormData): Promise<Income> {
    const formData = new FormData();
    
    // Add method override for Laravel
    formData.append('_method', 'PUT');
    
    // Append all form fields
    formData.append('student_id', data.student_id);
    formData.append('income_type_id', data.income_type_id);
    formData.append('payment_type_id', data.payment_type_id);
    formData.append('amount', String(data.amount));
    formData.append('income_date', data.income_date);
    
    if (data.title) {
      formData.append('title', data.title);
    }
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.received_amount !== undefined) {
      formData.append('received_amount', String(data.received_amount));
    }
    
    if (data.due_amount !== undefined) {
      formData.append('due_amount', String(data.due_amount));
    }
    
    if (data.payment_status) {
      formData.append('payment_status', data.payment_status);
    }
    
    // Append file if present
    if (data.income_attachment) {
      formData.append('income_attachment', data.income_attachment);
    }

    const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<Income>(response);
  },

  // Delete an income
  async deleteIncome(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
  
  // Upload an attachment to an income
  async uploadAttachment(id: string, file: File): Promise<{ income_attachment: string }> {
    const formData = new FormData();
    formData.append('income_attachment', file);
    
    const response = await fetch(`${API_BASE_URL}/incomes/${id}/attachment`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<{ income_attachment: string }>(response);
  },

  // Get all income types for dropdown
  async getIncomeTypes(): Promise<IncomeType[]> {
    const response = await fetch(`${API_BASE_URL}/income-types?all=true`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await handleResponse<IncomeType[] | any>(response);
    
    // Ensure we return an array
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      console.error('Unexpected response format from income types API:', data);
      return [];
    }
  },

  // Get all payment types for dropdown
  async getPaymentTypes(): Promise<PaymentType[]> {
    const response = await fetch(`${API_BASE_URL}/payment-types?all=true`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await handleResponse<PaymentType[] | any>(response);
    
    // Ensure we return an array
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      console.error('Unexpected response format from payment types API:', data);
      return [];
    }
  },

  // Get all students for dropdown
  async getStudents(): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/students?all=true`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await handleResponse<Student[] | any>(response);
    
    // Ensure we return an array
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      console.error('Unexpected response format from students API:', data);
      return [];
    }
  }
};
