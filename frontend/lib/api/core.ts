// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Debug the API URL being used
console.log('Using API URL:', API_BASE_URL);

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
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    let validationErrors: Record<string, string | string[]> | undefined;
    
    try {
      console.log('Error response body:', errorText);
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
      
      // Extract validation errors from Laravel API response format
      if (errorJson.errors && response.status === 422) {
        validationErrors = errorJson.errors;
      }
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    console.error(`API Error: ${errorMessage}`);
    throw new ApiError(response.status, errorMessage, validationErrors);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    console.log('API Data received:', data);
    return data;
  }
  
  console.log('API Response not JSON');
  return {} as T;
}
