"use client";

import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { API_BASE_URL, handleResponse, fetchWithTimeout } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';

export default function InHostelTodayCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [inHostelCount, setInHostelCount] = useState<number | string>('—');

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        // Use attendance statistics endpoint
        const res = await fetchWithTimeout(`${API_BASE_URL}/student-checkincheckouts/attendance/statistics?all=true`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs);
        const payload = await handleResponse<{ checked_in_count?: number }>(res);
        if (!mounted) return;
        const numberVal = payload?.checked_in_count ?? 0;
        setInHostelCount(Number(numberVal || 0));
      } catch (err) {
        console.debug('InHostelTodayCard load failed', err);
        setInHostelCount('—');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; try { controller.abort(); } catch {} };
  }, [timeoutMs]);

  return (
    <StatCard title="Students in Hostel Today" value={loading ? '—' : inHostelCount} subtitle="Currently present" icon="home" color="indigo" />
  );
}
