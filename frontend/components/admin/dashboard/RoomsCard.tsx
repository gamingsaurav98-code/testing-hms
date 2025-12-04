"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, handleResponse, fetchWithTimeout } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';

export default function RoomsCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [totalRooms, setTotalRooms] = useState<number>(0);
  const [totalCapacity, setTotalCapacity] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        // Use fetchWithTimeout so this component cancels cleanly on unmount
        const res = await fetchWithTimeout(`${API_BASE_URL}/rooms?per_page=5&page=1`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs);
        const payload = await handleResponse<{ data: Array<{ capacity?: number }> }>(res);
        if (!mounted) return;
        const rooms = Array.isArray(payload?.data) ? payload.data : [];
        setTotalRooms(rooms.length);
        setTotalCapacity(rooms.reduce((s, r) => s + (Number(r.capacity || 0) || 0), 0));
      } catch (err) {
        // Keep component resilient: log debug and keep defaults
        console.debug('RoomsCard load failed:', err);
        } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      try { controller.abort(); } catch { }
    };
  }, [timeoutMs]);

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Rooms</h3>
          <div className="mt-2 text-2xl font-bold text-gray-900">{loading ? '—' : totalRooms}</div>
          <div className="text-xs text-gray-500">Capacity: {loading ? '—' : totalCapacity}</div>
        </div>
      </div>
    </div>
  );
}
