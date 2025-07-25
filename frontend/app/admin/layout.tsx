'use client';

import React from 'react';
import Structure from '@/components/Structure';
import { withAuth } from '@/lib/auth';

function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Structure>{children}</Structure>;
}

export default withAuth(AdminLayout, ['admin']);
