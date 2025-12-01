import { API_BASE_URL, handleResponse, fetchWithTimeout, DEFAULT_API_TIMEOUT } from './core';
import { getAuthHeaders } from './auth.api';

// Simple short-lived cache and inflight-promise holder so multiple
// concurrent callers (several cards rendering on the same page)
// do not issue duplicated heavy requests to the same aggregated
// dashboard endpoint.
let _dashboardCache: { data: unknown; fetchedAt: number } | null = null;
let _dashboardPromise: Promise<unknown> | null = null;
const DASHBOARD_CACHE_TTL_MS = 4000; // 4s

export const adminApi = {
  // Small in-memory dedupe/cache so multiple concurrent cards don't
  // all hit the backend with identical heavy requests. Cache is short
  // lived so we avoid staleness while preventing duplicate inflight
  // requests during a page render.
  async getDashboardStats({ timeoutMs = DEFAULT_API_TIMEOUT, forceRefresh = false, retries = 2 }:{ timeoutMs?: number, forceRefresh?: boolean, retries?: number } = {}): Promise<unknown> {
    // Module-level in-memory cache / promise holder (initialized below)
    // will be used to dedupe multiple simultaneous calls.
    const url = `${API_BASE_URL}/admin/dashboard/stats`;
    const urlWithForce = forceRefresh ? `${url}?force_refresh=1` : url;
    console.debug('adminApi.getDashboardStats - start fetch:', url);

    // Short-circuit when we have a fresh cached value
    const now = Date.now();
    if (!forceRefresh) {
      if (_dashboardCache && (now - _dashboardCache.fetchedAt) < DASHBOARD_CACHE_TTL_MS) {
        console.debug('adminApi.getDashboardStats - returning cached data');
        return Promise.resolve(_dashboardCache.data);
      }

      // If a request is already in-flight return the same promise so
      // callers share the single fetch instead of issuing multiple.
      if (_dashboardPromise) {
        console.debug('adminApi.getDashboardStats - returning inflight promise (dedupe)');
        return _dashboardPromise;
      }
    }

    // Create a promise representing the inflight fetch so other callers
    // can use it until it's complete.
    const inflight = (async (): Promise<unknown> => {
      const start = Date.now();
      let attempt = 0;
      try {
        while (true) {
          try {
          attempt++;

          const response = await fetchWithTimeout(urlWithForce, {
            method: 'GET',
            headers: {
              ...getAuthHeaders(),
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }, timeoutMs);

          const took = Date.now() - start;
          console.debug(`adminApi.getDashboardStats - response status: ${response.status} (took ${took}ms, attempts ${attempt})`);

          const data = await handleResponse<unknown>(response);

          // Cache successful result for a short window to avoid repeated
          // identical requests during the same page render.
          _dashboardCache = { data, fetchedAt: Date.now() };

          return data;
          } catch (err: unknown) {
          const took = Date.now() - start;
          console.warn(`adminApi.getDashboardStats - attempt ${attempt} failed after ${took}ms:`, err);

          // Clear the cache for failures so subsequent calls will retry
          _dashboardCache = null;

          // If we've exhausted retries, surface the last error
          if (attempt > retries) {
            throw err;
          }

            // Wait with exponential backoff + jitter before next attempt
            const backoff = Math.min(2000, 200 * Math.pow(2, attempt));
            const jitter = Math.floor(Math.random() * 200);
            await new Promise((r) => setTimeout(r, backoff + jitter));
            // continue loop -> retry
          }
        }
      } finally {
        // Clear the inflight promise once finished so future calls can
        // start a fresh fetch when cache TTL expires
        _dashboardPromise = null;
      }
    })();

    if (!forceRefresh) {
      _dashboardPromise = inflight;
    }

    return inflight;
  }
};

export default adminApi;
