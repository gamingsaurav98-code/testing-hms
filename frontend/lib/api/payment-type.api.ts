import { API_BASE_URL, handleResponse, PaginatedResponse, safeFetch } from './core';
import { getAuthHeaders } from './auth.api';

export interface PaymentType {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTypeFormData {
  name: string;
  is_active?: boolean;
}

export const paymentTypeApi = {
  // Get all payment types with pagination
  async getPaymentTypes(page: number = 1): Promise<PaginatedResponse<PaymentType>> {
    const response = await safeFetch(`${API_BASE_URL}/payment-types?page=${page}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<PaymentType>>(response);
  },

  // Get all payment types without pagination
  async getAllPaymentTypes(): Promise<PaymentType[]> {
    const response = await safeFetch(`${API_BASE_URL}/payment-types?all=true`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await handleResponse<unknown>(response);
    
    // Ensure we return an array
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data?: unknown }).data)) {
      return (data as { data: PaymentType[] }).data;
    } else {
      return [];
    }
  },

  // Get a single payment type by ID
  async getPaymentType(id: string): Promise<PaymentType> {
    const response = await safeFetch(`${API_BASE_URL}/payment-types/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<PaymentType>(response);
  },

  // Create a new payment type
  async createPaymentType(data: PaymentTypeFormData): Promise<PaymentType> {
    const response = await safeFetch(`${API_BASE_URL}/payment-types`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<PaymentType>(response);
  },

  // Update an existing payment type
  async updatePaymentType(id: string, data: PaymentTypeFormData): Promise<PaymentType> {
    const response = await safeFetch(`${API_BASE_URL}/payment-types/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<PaymentType>(response);
  },

  // Delete a payment type
  async deletePaymentType(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/payment-types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete payment type');
    }
  },
};
