import { useState, useEffect, useCallback } from 'react';
import adminApi from '@/lib/api/admin.api';
import { fetchWithTimeout } from '@/lib/api/core';

export default function useAdminDashboard(opts: { timeout?: number } = { timeout: 8000 }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Best-effort fetch with a simple timeout wrapper
      const timeoutMs = opts.timeout ?? 8000;
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs));
      const res = await Promise.race([adminApi.getDashboardStats(), timeoutPromise]) as any;

      if (res && res.data) setData(res.data);
      else if (res) setData(res);
      else setData(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch admin dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [opts.timeout]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
