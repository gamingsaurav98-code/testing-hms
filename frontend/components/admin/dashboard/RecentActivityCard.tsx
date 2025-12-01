"use client";

import React, { useEffect, useState } from 'react';
import adminApi from '@/lib/api/admin.api';

interface RecentActivityItem {
  title?: string;
  type?: string;
  date?: string;
  occurred_at?: string;
}

export default function RecentActivityCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // If timeoutMs is undefined, adminApi.getDashboardStats will fall
        // back to its own default (larger) timeout to allow slow replies.
        const resRaw: unknown = await adminApi.getDashboardStats(timeoutMs).catch(() => null);
        if (!mounted) return;
        const res = resRaw as Record<string, unknown> | null;
        const recent = (res?.recent_activity ?? []) as unknown;
        const arr = Array.isArray(recent) ? recent as RecentActivityItem[] : [];
        setItems(arr);
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
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        <div className="text-xs text-gray-500">Latest</div>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          items.length === 0 ? (
            <div className="text-sm text-gray-500">No recent activity</div>
          ) : (
            items.map((it, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{it.title ?? it.type ?? 'Activity'}</div>
                <div className="text-xs text-gray-500 mt-1">{it.date ? new Date(it.date).toLocaleString() : (it.occurred_at ? new Date(it.occurred_at).toLocaleString() : '')}</div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
