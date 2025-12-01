import { API_BASE_URL, handleResponse, PaginatedResponse, safeFetch, fetchWithTimeout, DEFAULT_API_TIMEOUT } from './core';
import { getAuthHeaders, getAuthHeadersForFormData } from './auth.api';
import { Expense, ExpenseFormData, ExpenseCategory, ExpenseCategoryFormData } from './types/expense.types';

// Define interfaces for statistics cache
interface StatisticsCache {
  data: unknown;
  fetchedAt: number;
}

// Expense API functions
export const expenseApi = {
  // In-memory cache + inflight promise for expenses/statistics
  _statisticsCache: null as StatisticsCache | null,
  _statisticsPromise: null as Promise<unknown> | null,

  async getStatistics({ timeoutMs = DEFAULT_API_TIMEOUT, retries = 2, forceRefresh = false }:{ timeoutMs?: number, retries?: number, forceRefresh?: boolean } = {}) {
    const url = `${API_BASE_URL}/expenses/statistics` + (forceRefresh ? '?force_refresh=1' : '');
    const TTL = 4000;
    const now = Date.now();

    if (!forceRefresh && expenseApi._statisticsCache && (now - expenseApi._statisticsCache.fetchedAt) < TTL) {
      return Promise.resolve(expenseApi._statisticsCache.data);
    }

    if (!forceRefresh && expenseApi._statisticsPromise) return expenseApi._statisticsPromise;

    const inflight = (async () => {
      const start = Date.now();
      let attempt = 0;
      while (true) {
        attempt++;
        try {
          const resp = await fetchWithTimeout(url, {
            method: 'GET',
            headers: { ...getAuthHeaders(), 'Accept': 'application/json' }
          }, timeoutMs);

          const took = Date.now() - start;
          console.debug(`expenseApi.getStatistics - status ${resp.status} (took ${took}ms, attempt ${attempt})`);

          const data = await handleResponse<unknown>(resp);
          expenseApi._statisticsCache = { data, fetchedAt: Date.now() };
          return data;
        } catch (err) {
          console.warn(`expenseApi.getStatistics attempt ${attempt} failed:`, err);
          if (attempt > retries) throw err;
          const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 200);
          await new Promise(r => setTimeout(r, backoff + jitter));
        }
      }
    })();

    if (!forceRefresh) expenseApi._statisticsPromise = inflight;
    try { return await inflight; } finally { expenseApi._statisticsPromise = null; }
  },
  // Get all expenses with pagination
  async getExpenses(page: number = 1, signal?: AbortSignal): Promise<PaginatedResponse<Expense>> {
    const response = await safeFetch(`${API_BASE_URL}/expenses?page=${page}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal,
    });
    
    return handleResponse<PaginatedResponse<Expense>>(response);
  },

  // Get expenses by category
  async getExpensesByCategory(categoryId: string, page: number = 1): Promise<PaginatedResponse<Expense>> {
    const response = await safeFetch(`${API_BASE_URL}/expenses/category/${categoryId}?page=${page}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',  
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Expense>>(response);
  },

  // Get expenses by date range
  async getExpensesByDateRange(startDate: string, endDate: string, page: number = 1): Promise<PaginatedResponse<Expense>> {
    const response = await safeFetch(`${API_BASE_URL}/expenses/date-range?start_date=${startDate}&end_date=${endDate}&page=${page}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<PaginatedResponse<Expense>>(response);
  },

  // Get a single expense by ID
  async getExpense(id: string): Promise<Expense> {
    const response = await safeFetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<Expense>(response);
  },

  // Create a new expense
  async createExpense(data: ExpenseFormData): Promise<Expense> {
    const formData = new FormData();
    
    // Append all form fields
    formData.append('expense_category_id', data.expense_category_id);
    formData.append('expense_type', data.expense_type || '');
    formData.append('amount', data.amount.toString());
    formData.append('expense_date', data.expense_date);
    formData.append('title', data.title || '');
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.student_id) {
      formData.append('student_id', data.student_id);
    }
    
    if (data.staff_id) {
      formData.append('staff_id', data.staff_id);
    }
    
    if (data.supplier_id) {
      formData.append('supplier_id', data.supplier_id);
    }
    
    if (data.paid_amount !== undefined) {
      formData.append('paid_amount', data.paid_amount.toString());
    }
    
    if (data.due_amount !== undefined) {
      formData.append('due_amount', data.due_amount.toString());
    }
    
    if (data.payment_status) {
      formData.append('payment_status', data.payment_status);
    }
    
    if (data.payment_type_id) {
      formData.append('payment_type_id', data.payment_type_id);
    }
    
    // Append file if present
    if (data.expense_attachment) {
      formData.append('expense_attachment', data.expense_attachment);
    }
    
    // Append purchases if present
    if (data.purchases && data.purchases.length > 0) {
      formData.append('purchases', JSON.stringify(data.purchases));
    }

    const response = await safeFetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    
    return handleResponse<Expense>(response);
  },

  // Update an existing expense
  async updateExpense(id: string, data: ExpenseFormData): Promise<Expense> {
    const formData = new FormData();
    
    // Add method override for Laravel
    formData.append('_method', 'PUT');
    
    // Append all form fields
    formData.append('expense_category_id', data.expense_category_id);
    formData.append('expense_type', data.expense_type || '');
    formData.append('amount', data.amount.toString());
    formData.append('expense_date', data.expense_date);
    formData.append('title', data.title || '');
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.student_id) {
      formData.append('student_id', data.student_id);
    }
    
    if (data.staff_id) {
      formData.append('staff_id', data.staff_id);
    }
    
    if (data.supplier_id) {
      formData.append('supplier_id', data.supplier_id);
    }
    
    if (data.paid_amount !== undefined) {
      formData.append('paid_amount', data.paid_amount.toString());
    }
    
    if (data.due_amount !== undefined) {
      formData.append('due_amount', data.due_amount.toString());
    }
    
    if (data.payment_status) {
      formData.append('payment_status', data.payment_status);
    }
    
    if (data.payment_type_id) {
      formData.append('payment_type_id', data.payment_type_id);
    }
    
    // Append file if present and validate it again
    if (data.expense_attachment) {
      // Double-check file type and size
      const file = data.expense_attachment;
      
      // Check file type
      const validFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validFileTypes.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Allowed types: JPG, PNG, GIF, PDF.`);
      }
      
      // Check file size
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error(`File size exceeds 5MB limit. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      }
      
      console.log('Adding file to form data:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)}KB`
      });
      
      formData.append('expense_attachment', file);
    } else {
      console.log('No new attachment file to upload');
    }
    
    // Append purchases if present
    if (data.purchases && data.purchases.length > 0) {
      formData.append('purchases', JSON.stringify(data.purchases));
    }

    console.log('Sending update request to:', `${API_BASE_URL}/expenses/${id}`);
    
    try {
      const response = await safeFetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'POST', // Using POST with _method override for file uploads
        headers: getAuthHeadersForFormData(),
        body: formData,
      });
      
      return handleResponse<Expense>(response);
    } catch (error) {
      console.error('Network error during expense update:', error);
      throw error;
    }
  },

  // Delete an expense
  async deleteExpense(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
};

// Expense Category API functions
export const expenseCategoryApi = {
  // Get all expense categories
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const response = await safeFetch(`${API_BASE_URL}/expense-categories`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<ExpenseCategory[]>(response);
  },

  // Get a single expense category by ID
  async getExpenseCategory(id: string): Promise<ExpenseCategory> {
    const response = await safeFetch(`${API_BASE_URL}/expense-categories/${id}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<ExpenseCategory>(response);
  },

  // Create a new expense category
  async createExpenseCategory(data: ExpenseCategoryFormData): Promise<ExpenseCategory> {
    const response = await safeFetch(`${API_BASE_URL}/expense-categories`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse<ExpenseCategory>(response);
  },

  // Update an existing expense category
  async updateExpenseCategory(id: string, data: ExpenseCategoryFormData): Promise<ExpenseCategory> {
    const response = await safeFetch(`${API_BASE_URL}/expense-categories/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return handleResponse<ExpenseCategory>(response);
  },

  // Delete an expense category
  async deleteExpenseCategory(id: string): Promise<void> {
    const response = await safeFetch(`${API_BASE_URL}/expense-categories/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return handleResponse<void>(response);
  },
};
