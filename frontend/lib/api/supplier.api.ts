import { API_BASE_URL, handleResponse, safeFetch } from './core';
import { Supplier, SupplierFormData } from './types';
import { PaginatedResponse } from './core';
import { getAuthHeaders } from './auth.api';

// Supplier API functions
export const supplierApi = {
  // Get all suppliers with pagination
  async getSuppliers(page: number = 1): Promise<PaginatedResponse<Supplier>> {
    const url = `${API_BASE_URL}/suppliers?page=${page}`;
    const response = await safeFetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const apiResponse = await handleResponse<{status: boolean, data: Supplier[]}>(response);
    
    // Map the API response to match expected PaginatedResponse format
    // Currently the backend doesn't provide pagination, so we simulate it
    return {
      data: apiResponse.data,
      current_page: 1,
      last_page: 1,
      per_page: apiResponse.data.length,
      total: apiResponse.data.length
    };
  },

  // Get a single supplier by ID
  async getSupplier(id: string): Promise<Supplier> {
    const url = `${API_BASE_URL}/suppliers/${id}`;
    const response = await safeFetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const apiResponse = await handleResponse<{status: boolean, data: Supplier}>(response);
    return apiResponse.data;
  },

  // Create a new supplier
  async createSupplier(data: SupplierFormData): Promise<Supplier> {
    const response = await safeFetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const apiResponse = await handleResponse<{status: boolean, message: string, data: Supplier}>(response);
    return apiResponse.data;
  },

  // Update an existing supplier
  async updateSupplier(id: string, data: SupplierFormData): Promise<Supplier> {
    const response = await safeFetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const apiResponse = await handleResponse<{status: boolean, message: string, data: Supplier}>(response);
    return apiResponse.data;
  },

  // Delete a supplier
  async deleteSupplier(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    await handleResponse<{status: boolean, message: string}>(response);
    return;
  },
  
  // Upload attachment for a supplier
  async uploadAttachment(id: string, file: File, name: string, type: string): Promise<unknown> {
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('name', name);
    formData.append('type', type);
    
    const response = await safeFetch(`${API_BASE_URL}/suppliers/${id}/attachment`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
    
    const apiResponse = await handleResponse<{status: boolean, message: string, data: unknown}>(response);
    return apiResponse.data;
  },
  
  // Update an existing attachment
  async updateAttachment(supplierId: string, attachmentId: string, data: {file?: File, name?: string, type?: string}): Promise<unknown> {
    const formData = new FormData();
    
    if (data.file) {
      formData.append('attachment', data.file);
    }
    
    if (data.name) {
      formData.append('name', data.name);
    }
    
    if (data.type) {
      formData.append('type', data.type);
    }
    
    const response = await safeFetch(`${API_BASE_URL}/suppliers/${supplierId}/attachment/${attachmentId}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
    
    const apiResponse = await handleResponse<{status: boolean, message: string, data: unknown}>(response);
    return apiResponse.data;
  },
  
  // Delete an attachment
  async deleteAttachment(supplierId: string, attachmentId: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/suppliers/${supplierId}/attachment/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    await handleResponse<{status: boolean, message: string}>(response);
    return;
  },
};
