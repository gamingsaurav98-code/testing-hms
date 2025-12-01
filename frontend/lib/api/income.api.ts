import { API_BASE_URL, handleResponse, safeFetch, fetchWithTimeout, DEFAULT_API_TIMEOUT } from './core';
import { getAuthHeaders, getAuthHeadersForFormData } from './auth.api';
import { Income, IncomeFormData, IncomeType, PaymentType, Student } from './types';
import { PaginatedResponse } from './core';

interface StatisticsCache<T = unknown> {
  data: T;
  fetchedAt: number;
}

interface StatisticsOptions {
  timeoutMs?: number;
  retries?: number;
  forceRefresh?: boolean;
  signal?: AbortSignal;
}

// Common API response type for statistics
interface StatisticsResponse {
  // Define the structure of your statistics response here
  // Example:
  // total: number;
  // byCategory: Record<string, number>;
  // Add other fields as needed
  [key: string]: unknown;
}

// Income API functions
export const incomeApi = {
  // Small in-memory cache + inflight dedupe for statistics endpoint
  _statisticsCache: null as StatisticsCache<StatisticsResponse> | null,
  _statisticsPromise: null as Promise<StatisticsResponse> | null,

  // Fetch incomes statistics (aggregated). Uses timeout + retries.
  async getStatistics({ 
    timeoutMs = DEFAULT_API_TIMEOUT, 
    retries = 2, 
    forceRefresh = false,
    signal
  }: StatisticsOptions = {}): Promise<StatisticsResponse> {
    const url = `${API_BASE_URL}/incomes/statistics` + (forceRefresh ? '?force_refresh=1' : '');

    // short in-memory cache (4s)
    const TTL = 4000;
    const now = Date.now();
    if (!forceRefresh && incomeApi._statisticsCache && (now - incomeApi._statisticsCache.fetchedAt) < TTL) {
      return incomeApi._statisticsCache.data;
    }

    if (!forceRefresh && incomeApi._statisticsPromise) return incomeApi._statisticsPromise;

    const inflight = (async (): Promise<StatisticsResponse> => {
      const start = Date.now();
      let attempt = 0;
      
      while (true) {
        attempt++;
        try {
          const resp = await fetchWithTimeout(url, {
            method: 'GET',
            headers: { ...getAuthHeaders(), 'Accept': 'application/json' },
            signal
          }, timeoutMs);

          const took = Date.now() - start;
          console.debug(`incomeApi.getStatistics - status ${resp.status} (took ${took}ms, attempt ${attempt})`);

          const data = await handleResponse<StatisticsResponse>(resp);
          incomeApi._statisticsCache = { data, fetchedAt: Date.now() };
          return data;
        } catch (err) {
          console.warn(`incomeApi.getStatistics attempt ${attempt} failed:`, err);
          if (attempt > retries) throw err;
          const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 200);
          await new Promise(r => setTimeout(r, backoff + jitter));
        }
      }
    })();

    if (!forceRefresh) incomeApi._statisticsPromise = inflight;
    try { return await inflight; } finally { incomeApi._statisticsPromise = null; }
  },
  // Get all incomes with pagination
  async getIncomes(page: number = 1, signal?: AbortSignal): Promise<PaginatedResponse<Income>> {
    if (page < 1) {
      throw new Error('Page number must be greater than 0');
    }
    
    const response = await safeFetch(`${API_BASE_URL}/incomes?page=${page}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal,
    });
    
    return handleResponse<PaginatedResponse<Income>>(response);
  },

  // Get a single income by ID
  async getIncome(id: string): Promise<Income> {
    const response = await safeFetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Income>(response);
  },

  // Get all income types for dropdown
  async getIncomeTypes(signal?: AbortSignal): Promise<IncomeType[]> {
    const response = await safeFetch(`${API_BASE_URL}/income-types`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal,
    });
    
    return handleResponse<IncomeType[]>(response);
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

    const response = await safeFetch(`${API_BASE_URL}/incomes`, {
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

    const response = await safeFetch(`${API_BASE_URL}/incomes/${id}`, {
      method: 'POST', // Using POST with _method override for file uploads
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<Income>(response);
  },

  // Delete an income
  async deleteIncome(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/incomes/${id}`, {
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
    
    const response = await safeFetch(`${API_BASE_URL}/incomes/${id}/attachment`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<{ income_attachment: string }>(response);
  },

  // Get all payment types for dropdown
  async getPaymentTypes(signal?: AbortSignal): Promise<PaymentType[]> {
    const response = await safeFetch(`${API_BASE_URL}/payment-types`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal,
    });
    
    return handleResponse<PaymentType[]>(response);
  },

  // Get all students for dropdown
  async getStudents(signal?: AbortSignal): Promise<Student[]> {
    const response = await safeFetch(`${API_BASE_URL}/students`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal,
    });
    
    // The backend sometimes returns a paginated shape: { data: Student[], ... }
    // Normalize it so callers always receive Student[] to avoid runtime errors
    const parsed = await handleResponse<unknown>(response);

    if (Array.isArray(parsed)) return parsed as Student[];
    if (parsed && typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Student[];
    }

    // If response isn't an array/paginated-data, return empty array to be safe
    console.warn('incomeApi.getStudents: unexpected response shape, returning empty array', parsed);
    return [];
  }
};
