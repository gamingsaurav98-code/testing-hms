import { API_BASE_URL, handleResponse, fetchWithTimeout } from './core';
import { getAuthHeaders } from './auth.api';

export const adminApi = {
  async getDashboardStats(timeoutMs: number = 25000): Promise<any> {
    const url = `${API_BASE_URL}/admin/dashboard/stats`;
    console.debug('adminApi.getDashboardStats - start fetch:', url);

    const start = Date.now();
    try {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, timeoutMs);

      const took = Date.now() - start;
      console.debug(`adminApi.getDashboardStats - response status: ${response.status} (took ${took}ms)`);

      return handleResponse<any>(response);
    } catch (err) {
      const took = Date.now() - start;
      console.warn(`adminApi.getDashboardStats - failed after ${took}ms:`, err);
      throw err;
    }
  }
};

export default adminApi;
