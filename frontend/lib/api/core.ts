

// Smart base URL — no more localhost hell
export const API_BASE_URL =
  typeof window === "undefined"
    ? (process.env.INTERNAL_API_URL || "http://hms_backend:8000/api")  // Server-side (Next.js API routes)
    : (process.env.NEXT_PUBLIC_API_BASE_URL || "/api");               // Client-side (browser) → uses proxy!

export const DEFAULT_API_TIMEOUT = 60_000; // 60s for dashboard

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public originalError?: unknown
  ) {
    super(message); 
    this.name = "ApiError";
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorBody = await response.text();
      errorMessage = errorBody || response.statusText;
    } catch {}
    
    // Handle 404 as a valid response (no data found)
    if (response.status === 404) {
      return null as T;
    }
    
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 401 || response.headers.get("content-length") === "0") {
    return null as T;
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(500, "Invalid JSON response");
  }
}

export async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = DEFAULT_API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(init.headers || {}),
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(408, "Request Timeout");
    }

    const message = err instanceof Error ? err.message : "Network Error";
    throw new ApiError(0, message, err);
  }
}

export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<Response> {
  let fullUrl: string;
  if (url.startsWith("/api/")) {
    // URL already has /api/ prefix, use as-is for client-side proxy
    fullUrl = url;
  } else if (url.startsWith("/")) {
    fullUrl = `${API_BASE_URL}${url}`;
  } else {
    fullUrl = `${API_BASE_URL}/${url}`;
  }
  return fetchWithTimeout(fullUrl, options, timeoutMs);
}

// Re-export PaginatedResponse from types
export type { PaginatedResponse } from './types';
