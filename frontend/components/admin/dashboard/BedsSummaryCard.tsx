"use client";

import React, { useEffect, useState } from 'react';
import adminApi from '@/lib/api/admin.api';

export default function BedsSummaryCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [totalBeds, setTotalBeds] = useState<number>(0);
  const [occupiedBeds, setOccupiedBeds] = useState<number>(0);
  const [availableBeds, setAvailableBeds] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // Let adminApi choose its default timeout if none provided.
        // Pass the timeout as an options object (adminApi expects { timeoutMs })
        const resRaw: unknown = await adminApi.getDashboardStats({ timeoutMs }).catch(() => null);
        if (!mounted) return;
        // Be defensive about the return shape — the API may return null/array/object
        const res = (resRaw && typeof resRaw === 'object') ? (resRaw as { rooms?: Record<string, unknown> }) : null;
        const rooms = (res?.rooms ?? {}) as Record<string, unknown>;
        const totalCapacity = Number(rooms['total_capacity'] ?? 0);
        const occupied = Number(rooms['occupied_beds'] ?? 0);
        const available = Number(rooms['available_beds'] ?? Math.max(0, totalCapacity - occupied));

        setTotalBeds(totalCapacity);
        setOccupiedBeds(occupied);
        setAvailableBeds(available);
      } catch (err) {
        console.debug('BedsSummaryCard load failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [timeoutMs]);

  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Room Status</h2>
        <button onClick={() => window.location.href = '/admin/room'} className="text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium">View all</button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-gray-700 font-medium">Total Beds</span>
          </div>
          <span className="font-bold text-gray-900">{loading ? '—' : totalBeds}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-700 font-medium">Occupied</span>
          </div>
          <span className="font-bold text-gray-900">{loading ? '—' : occupiedBeds}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
            <span className="text-gray-700 font-medium">Available</span>
          </div>
          <span className="font-bold text-gray-900">{loading ? '—' : availableBeds}</span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Occupancy Rate</span>
            <span>{loading ? '—' : `${occupancyPercent}%`}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${occupancyPercent}%` }}></div>
          </div>
        </div>
      </div>

    </div>
  );
}
