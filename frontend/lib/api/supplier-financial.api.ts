import { API_BASE_URL, handleResponse, safeFetch } from './core';
import { getAuthHeaders } from './auth.api';

export interface SupplierFinancial {
  id: string;
  supplier_id: string;
  initial_balance: number;
  balance_type: 'due' | 'advance';
  amount: number;
  payment_date: string;
  payment_type_id: string;
  remark?: string;
  created_at: string;
  updated_at?: string;
  supplier?: unknown;
  paymentType?: unknown;
}

export interface SupplierFinancialFormData {
  supplier_id: number;
  initial_balance: number;
  balance_type: 'due' | 'advance';
  amount: number;
  payment_date: string;
  payment_type_id: number;
  remark?: string;
}

// Supplier Financial API functions
export const supplierFinancialApi = {
  // Get all financial records for a supplier
  async getFinancialsBySupplier(supplierId: string): Promise<SupplierFinancial[]> {
    const response = await safeFetch(`${API_BASE_URL}/suppliers/${supplierId}/financials`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const apiResponse = await handleResponse<{status: boolean, data: SupplierFinancial[]}>(response);
    return apiResponse.data;
  },

  // Get a single financial record by ID
  async getFinancial(id: string): Promise<SupplierFinancial> {
    const response = await safeFetch(`${API_BASE_URL}/supplier-financials/${id}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const apiResponse = await handleResponse<{status: boolean, data: SupplierFinancial}>(response);
    return apiResponse.data;
  },

  // Create a new financial record
  async createFinancial(data: SupplierFinancialFormData): Promise<SupplierFinancial> {
    const response = await safeFetch(`${API_BASE_URL}/supplier-financials`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const apiResponse = await handleResponse<{status: boolean, message: string, data: SupplierFinancial}>(response);
    return apiResponse.data;
  },

  // Update an existing financial record
  async updateFinancial(id: string, data: Partial<SupplierFinancialFormData>): Promise<SupplierFinancial> {
    const response = await safeFetch(`${API_BASE_URL}/supplier-financials/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const apiResponse = await handleResponse<{status: boolean, message: string, data: SupplierFinancial}>(response);
    return apiResponse.data;
  },

  // Delete a financial record
  async deleteFinancial(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/supplier-financials/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    await handleResponse<{status: boolean, message: string}>(response);
    return;
  }
};
