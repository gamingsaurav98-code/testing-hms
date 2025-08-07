// API configuration with environment-specific handling
const getApiBaseUrl = (): string => {
  // Always use environment variable if explicitly set
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Smart fallback based on environment
  if (typeof window !== 'undefined') {
    // Client-side: use localhost when accessing via localhost, otherwise use backend service
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:8000/api'
      : 'http://backend:8000/api';
  }
  
  // Server-side: always use backend service name for Docker
  return 'http://backend:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Increased timeout for better reliability in Docker environment
export const DEFAULT_API_TIMEOUT = 10000; // 10 seconds

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
  // Handle network errors
  if (!response) {
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
    
    // Don't log API errors to console - they are handled by UI components
    // Only system administrators need these in production logs, not end users
    throw new ApiError(response.status, errorMessage, validationErrors);
  }
  
  return responseData as T;
}

// Helper function to create fetch with timeout
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = DEFAULT_API_TIMEOUT): Promise<Response> {
  try {
    // Use Promise.race with graceful timeout handling
    const fetchPromise = fetch(url, options);
    
    const timeoutPromise = new Promise<Response>((resolve) => {
      setTimeout(() => {
        // Return a mock 408 response instead of throwing
        resolve(new Response(JSON.stringify({ error: 'Request timeout' }), {
          status: 408,
          statusText: 'Request Timeout',
          headers: { 'Content-Type': 'application/json' }
        }));
      }, timeout);
    });
    
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    throw error;
  }
}
