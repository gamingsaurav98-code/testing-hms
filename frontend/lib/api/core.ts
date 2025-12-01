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
export const DEFAULT_API_TIMEOUT = 60000; // 60 seconds

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
  let responseData: unknown;

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
  } catch (error: unknown) {
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
// safeFetch wraps native fetch and converts network failures into ApiError
export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Let AbortError bubble up so callers can detect abort vs network failure
    return await fetch(url, options);
  } catch (err: unknown) {
    // Detect aborts in a type-safe way
    if (typeof err === 'object' && err !== null && 'name' in err && (err as { name?: string }).name === 'AbortError') throw err;
    // Convert all other failures into ApiError with status 0
    throw new ApiError(0, 'Network request failed. Please check your connection.');
  }
}

// Abort-aware fetch with a timeout. If the timeout elapses the request is aborted
// so the server can stop any work for cancelled requests.
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = DEFAULT_API_TIMEOUT): Promise<Response> {
  // If the caller provided their own signal we must respect it and not replace it
  const callerSignal = (options as RequestInit).signal as AbortSignal | undefined;

  // We use an internal controller only when the caller didn't pass one
  const internalController = !callerSignal ? new AbortController() : undefined;
  const signal = callerSignal ?? internalController!.signal;

  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    // Abort without a reason — some runtimes don't accept non-DOM types as
    // a reason. Fetch will reject with an AbortError which we map to a timeout
    // in the caller.
    if (internalController) internalController.abort();
  }, timeout);

  try {
    const response = await safeFetch(url, { ...options, signal });
    return response;
  } catch (err: unknown) {
    // If our timeout fired then map abort to a 408 so consumer code can detect timeout
    if (timedOut) {
      throw new ApiError(408, 'Request Timeout');
    }

    // Rethrow AbortError or ApiError as-is for callers to handle
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
