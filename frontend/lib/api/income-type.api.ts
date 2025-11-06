import { API_BASE_URL, handleResponse, PaginatedResponse } from './core';
import { getAuthHeaders } from './auth.api';

export interface IncomeType {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeTypeFormData {
  title: string;
  description?: string;
}

export const incomeTypeApi = {
  // Get all income types with pagination
  async getIncomeTypes(page: number = 1): Promise<PaginatedResponse<IncomeType>> {
    const response = await fetch(`${API_BASE_URL}/income-types?page=${page}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<IncomeType>>(response);
  },

  // Get all income types without pagination
  async getAllIncomeTypes(): Promise<IncomeType[]> {
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
      return [];
    }
  },

  // Get a single income type by ID
  async getIncomeType(id: string): Promise<IncomeType> {
    const response = await fetch(`${API_BASE_URL}/income-types/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<IncomeType>(response);
  },

  // Create a new income type
  async createIncomeType(data: IncomeTypeFormData): Promise<IncomeType> {
    const response = await fetch(`${API_BASE_URL}/income-types`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<IncomeType>(response);
  },

  // Update an existing income type
  async updateIncomeType(id: string, data: IncomeTypeFormData): Promise<IncomeType> {
    const response = await fetch(`${API_BASE_URL}/income-types/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<IncomeType>(response);
  },

  // Delete an income type
  async deleteIncomeType(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/income-types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete income type');
    }
  },
};
