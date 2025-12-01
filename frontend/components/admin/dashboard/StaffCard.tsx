"use client";

import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import { staffApi } from '@/lib/api/staff.api';

export default function StaffCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [totalStaff, setTotalStaff] = useState<number | string>('—');
  const [activeStaff, setActiveStaff] = useState<number | string>('—');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // getAllActiveStaff currently returns staff list without pagination
        const all = await staffApi.getAllActiveStaff();
        if (!mounted) return;
        const arr = Array.isArray(all) ? all as Array<{ is_active?: boolean }> : [];
        // Count total staff as length; consider is_active flag for active count
        setTotalStaff(arr.length);
        setActiveStaff(arr.filter((s) => s.is_active !== false).length);
      } catch (err) {
        console.debug('StaffCard load failed', err);
        setTotalStaff('—'); setActiveStaff('—');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [timeoutMs]);

  return (
    <div>
      <StatCard title="Staff Overview" value={loading ? '—' : totalStaff} subtitle={`Active: ${loading ? '—' : activeStaff}`} icon="users" color="purple" />
    </div>
  );
}
