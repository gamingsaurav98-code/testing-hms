// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

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
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    let validationErrors: Record<string, string | string[]> | undefined;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
      
      // Extract validation errors from Laravel API response format
      if (errorJson.errors && response.status === 422) {
        validationErrors = errorJson.errors;
      }
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new ApiError(response.status, errorMessage, validationErrors);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return {} as T;
}
