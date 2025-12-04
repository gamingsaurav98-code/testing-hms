"use client";

import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { API_BASE_URL, handleResponse, fetchWithTimeout } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';

export default function CurrentStudentsCard({ timeoutMs = 30000 }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState<number | string>('—');

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/students?paginate=false`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs);
        const payload = await handleResponse<unknown>(res);
        if (!mounted) return;
        const arrCandidate = Array.isArray(payload) ? payload : ((((payload as unknown) as Record<string, unknown>)['data']) ?? []);
        const arr = Array.isArray(arrCandidate) ? arrCandidate : [];
        setTotalStudents(arr.length);
      } catch (err) {
        console.debug('CurrentStudentsCard load failed', err);
        setTotalStudents('—');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; try { controller.abort(); } catch {} };
  }, [timeoutMs]);

  return (
    <StatCard title="Total Current Students" value={loading ? '—' : totalStudents} subtitle="Currently enrolled" icon="users" color="green" />
  );
}
 