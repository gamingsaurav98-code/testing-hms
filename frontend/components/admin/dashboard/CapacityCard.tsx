"use client";

import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { API_BASE_URL, handleResponse, fetchWithTimeout } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';

export default function CapacityCard({ timeoutMs = 30000 }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [capacity, setCapacity] = useState<number | string>('—');

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/admin/dashboard/stats`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs);
        const payload = await handleResponse<{ rooms?: { total_capacity?: number } }>(res);
        if (!mounted) return;
        const totalCapacity = payload?.rooms?.total_capacity || 0;
        setCapacity(totalCapacity);
      } catch (err) {
        console.debug('CapacityCard load failed', err);
        setCapacity('—');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => { mounted = false; try { controller.abort(); } catch {} };
  }, [timeoutMs]);

  return (
    <StatCard title="Total Student Capacity" value={loading ? '—' : capacity} subtitle="All Rooms" icon="bed" color="blue" />
  );
}
