import { useState, useEffect, useCallback } from 'react';
import adminApi from '@/lib/api/admin.api';
import { fetchWithTimeout } from '@/lib/api/core';

export default function useAdminDashboard(opts: { timeout?: number } = { timeout: 60000 }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the adminApi's fetchWithTimeout-backed method directly and pass through the configured timeout
      const timeoutMs = opts.timeout ?? 25000;
      const res = await adminApi.getDashboardStats(timeoutMs);

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
