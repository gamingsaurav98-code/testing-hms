// API configuration with environment-specific handling
const getApiBaseUrl = (): string => {
  // For client-side (browser) requests, always use localhost
  if (typeof window !== 'undefined') {
    return 'http://localhost:8000/api';
  }
  
  // For server-side requests (Docker container), use the service name or environment variable
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Default timeout for API calls
export const DEFAULT_API_TIMEOUT = 10000; // 10 seconds

// Debug the API URL being used
console.log('HMS: Using API URL:', API_BASE_URL, '(client-side:', typeof window !== 'undefined', ')');

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export class ApiError extends Error {
  public validation?: Record<string, string | string[]>;
  
  constructor(public status: number, message: string, validation?: Record<string, string | string[]>) {
    super(message);
    this.name = 'ApiError';
    this.validation = validation;
  }
}

// Helper function to handle API responses
export async function handleResponse<T>(response: Response): Promise<T> {
  console.log(`API Response: ${response.url} - Status: ${response.status}`);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  // Handle network errors
  if (!response) {
    console.error('No response received from API');
    throw new ApiError(0, 'No response from server. Please check your connection.');
  }

  const contentType = response.headers.get('content-type');
  let responseData: any;

  try {
    // Always try to get JSON first if content type is application/json
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Fallback to text if not JSON
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }
  } catch (error) {
    console.error('Error reading response:', error);
    throw new ApiError(response.status, 'Failed to read server response');
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let validationErrors: Record<string, string | string[]> | undefined;
    
    if (typeof responseData === 'object' && responseData !== null) {
      // Handle both Laravel standard error format and custom error format
      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (responseData.error) {
        errorMessage = responseData.error;
      }
      
      // Extract validation errors from Laravel API response format
      if (responseData.errors && response.status === 422) {
        validationErrors = responseData.errors;
        errorMessage = Object.values(responseData.errors).flat().join(', ');
      }
    }
    
    console.error(`API Error: ${errorMessage}`);
    throw new ApiError(response.status, errorMessage, validationErrors);
  }
  
  console.log('API Data received:', responseData);
  return responseData as T;
}

// Helper function to create fetch with timeout
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = DEFAULT_API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(0, `Request timed out after ${timeout/1000} seconds`);
    }
    throw error;
  }
}
