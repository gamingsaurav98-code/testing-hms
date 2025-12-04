'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import useAdminDashboard from '@/hooks/useAdminDashboard';
// RoomsCard was moved responsibilities to BedsSummaryCard — remove top-level page usage
import StudentsCard from '@/components/admin/dashboard/StudentsCard';
import FinanceCard from '@/components/admin/dashboard/FinanceCard';
import CapacityCard from '@/components/admin/dashboard/CapacityCard';
import CurrentStudentsCard from '@/components/admin/dashboard/CurrentStudentsCard';
import OutOfHostelCard from '@/components/admin/dashboard/OutOfHostelCard';
import InHostelTodayCard from '@/components/admin/dashboard/InHostelTodayCard';
import OutstandingDuesCard from '@/components/admin/dashboard/OutstandingDuesCard';
import BedsSummaryCard from '@/components/admin/dashboard/BedsSummaryCard';
import StaffCard from '@/components/admin/dashboard/StaffCard';
import RecentActivityCard from '@/components/admin/dashboard/RecentActivityCard';
import ComplaintsBadge from '@/components/admin/dashboard/ComplaintsBadge';

// Page is rendered using per-card components which own their own data fetches.

export default function AdminDashboardPage() {
  // auth handled elsewhere; this page is using server-provided `useAdminDashboard` for data
  const { data: adminData, error: adminError } = useAdminDashboard();
  
  // Dashboard data is now fetched by per-card components (page is storage-free)
  // local loading state is not required at the moment — the hook provides loading status
  // dev-only debug UI state
  const [showDebug, setShowDebug] = useState(false);
  const [localToken, setLocalToken] = useState<string | null>(null);

  
  // Mount-time initializers — keep auth token stored for the debug panel
  useEffect(() => {
    setLocalToken(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Admin User!</h1>
            <p className="text-blue-100 text-lg">See the current status at your hostel today</p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.href = '/admin/student/create'}
              variant="secondary"
              size="lg"
              className="bg-white/90 backdrop-blur-sm text-blue-700 hover:bg-white border-0 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center space-x-3"
              icon={
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              }
            >
              New Student
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin/income/create'}
              variant="secondary"
              size="lg"
              className="bg-white/90 backdrop-blur-sm text-blue-700 hover:bg-white border-0 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center space-x-3"
              icon={
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              }
            >
              Record Payment
            </Button>
            <button
              type="button"
              onClick={() => setShowDebug(v => !v)}
              className="ml-2 px-3 py-2 rounded-lg text-sm bg-white/10 text-white border border-white/20"
            >
              {showDebug ? 'Hide debug' : 'Show debug'}
            </button>
          </div>
        </div>

      {/* Dev debug panel (toggle with 'Show debug' button) */}
      {showDebug && (
        <div className="bg-white/95 border border-gray-200 rounded-xl p-4 mb-6 text-xs text-gray-700 max-w-full overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <strong>Dev Debug — server payload and client token</strong>
            <span className="text-gray-500 text-xs">Only visible in your dev build</span>
          </div>
          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-600">adminData (server)</div>
            <pre className="bg-gray-100 rounded p-2 text-xs overflow-auto max-h-44">{JSON.stringify(adminData, null, 2)}</pre>
            {adminError && (
              <div className="mt-2 text-red-600">
                <div className="text-xs font-semibold">server error</div>
                <div className="text-xs">{String(adminError)}</div>
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600">Stored auth_token (localStorage)</div>
            <pre className="bg-gray-100 rounded p-2 text-xs">{localToken ?? 'no token found'}</pre>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <CapacityCard timeoutMs={10000} />
        <CurrentStudentsCard timeoutMs={10000} />
        <OutOfHostelCard timeoutMs={10000} />
        <InHostelTodayCard timeoutMs={10000} />
      
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Financial Overview */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Financial Overview</h2>
                <p className="text-gray-500 mt-1">Last 30 days summary</p>
              </div>
              <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                This Month
              </div>
            </div>
              <div className="grid grid-cols-2 gap-8">
                {/* FinanceCard now owns its own fetch / timeout logic and renders both income & expense summaries */}
                <div className="col-span-2">
                  <FinanceCard timeoutMs={15000} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-gray-500 mt-1">Latest transactions and updates</p>
              </div>
            </div>
            <RecentActivityCard timeoutMs={15000} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Outstanding Dues */}
          <OutstandingDuesCard timeoutMs={20000} />

          <BedsSummaryCard timeoutMs={20000} />

          {/* Students / Staff Overview */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Staff Overview</h2>
              <Button 
                onClick={() => window.location.href = '/admin/staff'}
                className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View all
              </Button>
            </div>
            <div className="space-y-4">
              {/* Add StudentsCard alongside the staff items so students fetches are colocated */}
              <StudentsCard timeoutMs={10000} />
              <StaffCard timeoutMs={10000} />
            </div>
          </div>
        </div>

      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-8">
        <div 
          onClick={() => window.location.href = '/admin/student/create'}
          className="group bg-white border border-gray-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-blue-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 group-hover:bg-blue-200 transition-colors">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Add Student</h3>
          <p className="text-sm text-gray-600">Register new student</p>
        </div>
        
        <div 
          onClick={() => window.location.href = '/admin/complain'}
          className="group bg-white border border-gray-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-yellow-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mb-4 group-hover:bg-yellow-200 transition-colors">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Complaints</h3>
          <p className="text-sm text-gray-600 mb-2">View & manage complaints</p>
          <div className="flex items-center justify-between text-xs">
            <ComplaintsBadge />
          </div>
        </div>
        
        <div 
          onClick={() => window.location.href = '/admin/room'}
          className="group bg-white border border-gray-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-green-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4 group-hover:bg-green-200 transition-colors">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Rooms</h3>
          <p className="text-sm text-gray-600">Manage rooms & beds</p>
        </div>
        
        <div 
          onClick={() => window.location.href = '/admin/income/create'}
          className="group bg-white border border-gray-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-purple-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4 group-hover:bg-purple-200 transition-colors">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">New Payment</h3>
          <p className="text-sm text-gray-600">Record payment</p>
        </div>

        <div 
          onClick={() => window.location.href = '/admin/salary'}
          className="group bg-white border border-gray-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-indigo-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-4 group-hover:bg-indigo-200 transition-colors">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Salaries</h3>
          <p className="text-sm text-gray-600 mb-2">Manage staff salaries</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Data loading...</span>
            <span className="text-gray-400 text-xs">API pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
