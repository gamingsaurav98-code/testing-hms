import { API_BASE_URL, handleResponse } from './core';
import { getAuthHeaders } from './auth.api';

export const adminApi = {
  async getDashboardStats(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return handleResponse<any>(response);
  }
};

export default adminApi;
