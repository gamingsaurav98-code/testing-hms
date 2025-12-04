"use client";

import React, { useEffect, useState } from 'react';
import adminApi from '@/lib/api/admin.api';

export default function OutstandingDuesCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number | string>('—');
  const [count, setCount] = useState<number | string>('—');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // use adminApi default timeout when timeoutMs is not provided
        // pass the timeout as an options object (adminApi expects { timeoutMs })
        const resRaw: unknown = await adminApi.getDashboardStats({ timeoutMs }).catch(() => null);
        if (!mounted) return;
        const res = (resRaw && typeof resRaw === 'object') ? (resRaw as { finance?: Record<string, unknown> }) : null;
        const finance = (res?.finance ?? null) as Record<string, unknown> | null;
        setTotal((finance?.['outstanding_total'] as number | string) ?? 0);
        setCount((finance?.['outstanding_count'] as number | string) ?? 0);
      } catch (err) {
        console.debug('OutstandingDuesCard load failed', err);
        setTotal('—'); setCount('—');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [timeoutMs]);

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Outstanding Dues</h2>
          <div className="text-sm text-yellow-700 font-medium mt-1">{loading ? 'loading…' : `${count} records`}</div>
        </div>
      </div>
      <p className="text-4xl font-bold text-gray-900 mb-3">{loading ? '—' : `Rs.${Math.round(Number(total || 0)).toLocaleString()}`}</p>
      <div className="text-sm text-gray-600">Outstanding payments across incomes & student balances</div>
    </div>
  );
}
