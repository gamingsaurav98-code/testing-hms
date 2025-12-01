"use client";

import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { API_BASE_URL, handleResponse, fetchWithTimeout } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';

export default function OutOfHostelCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [outOfHostel, setOutOfHostel] = useState<number | string>('—');

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        // Fetch students count and attendance stat and compute out-of-hostel = total - checked_in
        const [studentsRes, attendanceRes] = await Promise.all([
          fetchWithTimeout(`${API_BASE_URL}/students?paginate=false`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs),
          fetchWithTimeout(`${API_BASE_URL}/student-checkincheckouts/attendance/statistics?all=true`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs),
        ]);

        const studentsPayload = await handleResponse<unknown>(studentsRes);

        if (!mounted) return;

        const arrCandidate = Array.isArray(studentsPayload) ? studentsPayload : ((((studentsPayload as unknown) as Record<string, unknown>)['data']) ?? []);
        const arr = Array.isArray(arrCandidate) ? arrCandidate : [];
        const attendancePayload = await handleResponse<{ checked_in_count?: number }>(attendanceRes);
  const totalStudents = arr.length;
  const inHostel = attendancePayload?.checked_in_count ?? 0;

        setOutOfHostel(Math.max(0, totalStudents - Number(inHostel || 0)));
      } catch (err) {
        console.debug('OutOfHostelCard load failed', err);
        setOutOfHostel('—');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; try { controller.abort(); } catch {} };
  }, [timeoutMs]);

  return (
    <StatCard title="Out of Hostel Students" value={loading ? '—' : outOfHostel} subtitle="On leave" icon="person" color="yellow" />
  );
}
