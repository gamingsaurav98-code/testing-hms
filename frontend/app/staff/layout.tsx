'use client';

'use client';

import React from 'react';
import { withAuth } from '@/lib/auth';

function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-xl font-semibold text-gray-900">Staff Portal</h1>
            <button className="text-gray-500 hover:text-gray-700">
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default withAuth(StaffLayout, ['staff']);
