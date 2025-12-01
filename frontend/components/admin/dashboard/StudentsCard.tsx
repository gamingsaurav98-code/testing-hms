"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, handleResponse, fetchWithTimeout } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';

export default function StudentsCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [studentsTotal, setStudentsTotal] = useState<number>(0);
  const [inHostel, setInHostel] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/students?paginate=false`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs);
        const payload = await handleResponse<unknown>(res);
        if (!mounted) return;
        // payload may be array or {data: array}
        const arrCandidate = Array.isArray(payload) ? payload : ((((payload as unknown) as Record<string, unknown>)['data']) ?? []);
        const arr = Array.isArray(arrCandidate) ? arrCandidate : [];
        setStudentsTotal(Array.isArray(arr) ? arr.length : 0);

        // Best-effort fetch for in-hostel counts (lightweight): use student-checkincheckouts stat
        const checkinsRes = await fetchWithTimeout(`${API_BASE_URL}/student-checkincheckouts/attendance/statistics?all=true`, { headers: getAuthHeaders(), signal: controller.signal }, 8000);
        const ci = await handleResponse<unknown>(checkinsRes);
        if (mounted && ci && typeof ci === 'object') {
          const totalRecords = (((ci as unknown) as Record<string, unknown>)['checked_in_count'] ?? 0) as number | string | undefined;
          setInHostel(Number(totalRecords ?? 0));
        }
      } catch (err) {
        console.debug('StudentsCard load failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => { mounted = false; try { controller.abort(); } catch { } };
  }, [timeoutMs]);

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <h3 className="text-sm font-medium text-gray-700">Students</h3>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-2xl font-bold text-gray-900">{loading ? '—' : studentsTotal}</div>
        <div className="text-xs text-gray-500">In hostel: {loading ? '—' : inHostel}</div>
      </div>
    </div>
  );
}
