"use client";

import React, { useEffect, useState } from 'react';
import { complainApi } from '@/lib/api/complain.api';

export default function ComplaintsBadge() {
  const [pending, setPending] = useState<number | string>('—');
  const [resolved, setResolved] = useState<number | string>('—');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const items = await complainApi.getAllComplains();
        if (!mounted) return;
        const arr = Array.isArray(items) ? items as Array<{ status?: string }> : [];
        setPending(arr.filter((c) => c.status === 'pending').length);
        setResolved(arr.filter((c) => c.status === 'resolved').length);
      } catch (err) {
        console.debug('ComplaintsBadge load failed', err);
        setPending('—'); setResolved('—');
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-yellow-600 font-medium">Pending: {pending}</span>
      <span className="text-green-600 font-medium">Resolved: {resolved}</span>
    </div>
  );
}
