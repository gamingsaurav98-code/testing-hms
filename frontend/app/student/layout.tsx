'use client';

import React from 'react';
import StudentStructure from '@/components/StudentStructure';
import { withAuth } from '@/lib/auth';

function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentStructure>{children}</StudentStructure>;
}

export default withAuth(StudentLayout, ['student']);
