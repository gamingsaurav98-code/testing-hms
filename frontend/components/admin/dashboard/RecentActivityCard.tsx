"use client";

import React, { useEffect, useState } from 'react';
import adminApi from '@/lib/api/admin.api';

export default function RecentActivityCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const resRaw: unknown = await adminApi.getDashboardStats({ timeoutMs }).catch(() => null);
        if (!mounted) return;
        const res = (resRaw && typeof resRaw === 'object') ? (resRaw as { recent_activity?: unknown }) : null;
        const list = Array.isArray(res?.recent_activity) ? res!.recent_activity as Array<Record<string, unknown>> : [];
        setActivities(list);
      } catch (err) {
        console.debug('RecentActivityCard load failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [timeoutMs]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : activities.length === 0 ? (
          <div className="text-sm text-gray-500">No recent activity</div>
        ) : activities.map((a, i) => (
          <div key={i} className="text-sm text-gray-700">{String(a?.description ?? a?.title ?? '—')}</div>
        ))}
      </div>
    </div>
  );
}
