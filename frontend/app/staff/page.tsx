'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { staffCheckInCheckOutApi } from '@/lib/api/staff-checkincheckout.api';
import { SalaryApi } from '@/lib/api/salary.api';
import { staffApi } from '@/lib/api/staff.api';
import { 
  Calendar,
  Clock,
  User,
  AlertCircle,
  Home,
  Settings
} from 'lucide-react';

interface StaffDashboardStats {
  currentStatus: 'checked-in' | 'checked-out' | 'pending';
  workShift: string;
  department: string;
  position: string;
  lastCheckIn: string;
  lastCheckOut: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  totalStudents: number;
  monthlySalary: number;
  lastSalaryDate: string;
  lastSalaryAmount: number;
  recentActivities: Array<{
    type: 'checkin' | 'checkout' | 'salary' | 'maintenance' | 'student';
    message: string;
    time: string;
    status?: string;
  }>;
  pendingTasks: Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
  }>;
  hasPendingCheckout?: boolean;
}

export default function StaffDashboardPage() {
  const [stats, setStats] = useState<StaffDashboardStats>({
    currentStatus: 'checked-out',
    workShift: 'Day Shift (8AM - 4PM)',
    department: 'General',
    position: 'Staff Member',
    lastCheckIn: '',
    lastCheckOut: '',
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalCapacity: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    totalStudents: 0,
    monthlySalary: 0,
    lastSalaryDate: '',
    lastSalaryAmount: 0,
    recentActivities: [],
    pendingTasks: [],
    hasPendingCheckout: false,
  });
  const [loading, setLoading] = useState(true);
  const [staffId] = useState('1'); // This should come from auth context

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch staff-specific data with optimized timeouts (2 seconds each)
      const fetchWithTimeout = async (apiCall: any, fallback: any) => {
        try {
          return await Promise.race([
            apiCall(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout after 2 seconds')), 2000)
            )
          ]);
        } catch (error) {
          console.warn('API call failed, using fallback:', error);
          return fallback;
        }
      };
      
      // Fetch staff-specific data using optimized API calls
      const [
        profileData,
        checkInOutData,
        salaryData,
        complaintsData,
        noticesData,
        dashboardStats
      ] = await Promise.all([
        fetchWithTimeout(() => staffApi.getStaffProfile(), null),
        fetchWithTimeout(() => staffApi.getStaffCheckInOuts(), { data: [] }),
        fetchWithTimeout(() => SalaryApi.getMySalaryHistory(), []),
        fetchWithTimeout(() => staffApi.getStaffComplains(), { data: [], total: 0 }),
        fetchWithTimeout(() => staffApi.getStaffNotices(), { data: [] }),
        // Call dashboard stats directly without timeout wrapper
        staffApi.getDashboardStats()
      ]);

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Calculate current status from check-in/out data
      const myCheckIns = checkInOutData.data || [];
      
      const latestCheckIn = myCheckIns.length > 0 ? myCheckIns
        .filter((record: any) => record.status === 'approved' || record.status === 'checked_in')
        .sort((a: any, b: any) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())[0] : null;

      const currentStatus = (latestCheckIn as any)?.checkin_time && !(latestCheckIn as any)?.checkout_time ? 'checked-in' : 'checked-out';

      // Use real data from API for room and student stats
      const totalRooms = dashboardStats.rooms.total;
      const occupiedRooms = dashboardStats.rooms.occupied;
      const availableRooms = dashboardStats.rooms.available;
      const totalCapacity = dashboardStats.rooms.total_capacity;
      const occupiedBeds = dashboardStats.rooms.occupied_beds;
      const availableBeds = dashboardStats.rooms.available_beds;
      const totalStudents = dashboardStats.students.total;

      // Calculate salary statistics
      const mySalaries = Array.isArray(salaryData) ? salaryData : [];

      const thisMonthSalary = mySalaries.find((salary: any) => 
        salary.month === (currentMonth + 1) && salary.year === currentYear
      );

      const lastSalary = mySalaries
        .sort((a: any, b: any) => {
          const aDate = new Date(a.year, a.month - 1);
          const bDate = new Date(b.year, b.month - 1);
          return bDate.getTime() - aDate.getTime();
        })[0];

      // Generate recent activities
      const recentActivities: Array<{
        type: 'checkin' | 'checkout' | 'salary' | 'maintenance' | 'student';
        message: string;
        time: string;
        status?: string;
      }> = [];

      // Add recent check-ins/check-outs
      myCheckIns.slice(0, 2).forEach((checkIn: any) => {
        if (checkIn.checkin_time) {
          const checkInDate = new Date(checkIn.date || checkIn.created_at);
          const timeAgo = formatTimeAgo(checkInDate);
          recentActivities.push({
            type: 'checkin' as const,
            message: `Checked in for ${checkIn.shift || 'work shift'}`,
            time: timeAgo,
            status: checkIn.status,
          });
        }

        if (checkIn.checkout_time) {
          const checkOutDate = new Date(checkIn.date || checkIn.created_at);
          const timeAgo = formatTimeAgo(checkOutDate);
          recentActivities.push({
            type: 'checkout' as const,
            message: `Checked out from ${checkIn.shift || 'work shift'}`,
            time: timeAgo,
            status: 'completed',
          });
        }
      });

      // Add recent salary information
      if (lastSalary) {
        const salaryDate = new Date(lastSalary.year, lastSalary.month - 1);
        const timeAgo = formatTimeAgo(salaryDate);
        recentActivities.push({
          type: 'salary' as const,
          message: `Salary of Rs.${parseFloat(String(lastSalary.amount || '0')).toLocaleString()} processed`,
          time: timeAgo,
          status: lastSalary.status,
        });
      }

      // Add work-related activities for staff
      recentActivities.push(
        {
          type: 'maintenance' as const,
          message: `Current work shift active`,
          time: 'Current',
          status: 'active',
        }
      );

      // Sort activities by most recent first
      recentActivities.sort((a, b) => {
        if (a.time === 'Current') return -1;
        if (b.time === 'Current') return 1;
        return a.time.localeCompare(b.time);
      });

      setStats({
        currentStatus,
        workShift: 'Day Shift (8AM - 4PM)', // This should come from staff data
        department: profileData?.department || 'General',
        position: profileData?.position || 'Staff Member',
        lastCheckIn: (latestCheckIn as any)?.checkin_time || '',
        lastCheckOut: (latestCheckIn as any)?.checkout_time || '',
        totalRooms,
        occupiedRooms,
        availableRooms,
        totalCapacity,
        occupiedBeds,
        availableBeds,
        totalStudents,
        monthlySalary: thisMonthSalary ? parseFloat(String(thisMonthSalary.amount || '0')) : 0,
        lastSalaryDate: lastSalary ? `${lastSalary.year}-${String(lastSalary.month).padStart(2, '0')}-01` : '',
        lastSalaryAmount: lastSalary ? parseFloat(String(lastSalary.amount || '0')) : 0,
        hasPendingCheckout: checkInOutData?.length > 0 && !(latestCheckIn as any)?.checkout_time,
        recentActivities: recentActivities.slice(0, 5),
        pendingTasks: [
          { task: 'Review student check-in requests', priority: 'high', dueDate: '2025-07-29' },
          { task: 'Update room maintenance records', priority: 'medium', dueDate: '2025-07-30' },
          { task: 'Submit monthly activity report', priority: 'low', dueDate: '2025-08-01' },
        ],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return '1 week ago';
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 60) return '1 month ago';
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full animate-spin" style={{clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, Staff Member!</h1>
                <p className="text-blue-100 text-lg flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    {stats.department}
                  </span>
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {stats.position}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Room Capacity</h3>
                    <p className="text-sm text-gray-500">
                      {stats.availableBeds > 0 ? `${stats.availableBeds} beds vacant` : 'All beds occupied'}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</p>
                {stats.totalCapacity > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {stats.occupiedBeds} occupied • {stats.availableBeds} vacant
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Students</h3>
                    <p className="text-sm text-gray-500">Total active students</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Salary</h3>
                    <p className="text-sm text-gray-500">
                      {stats.lastSalaryDate ? `Last: ${new Date(stats.lastSalaryDate).toLocaleDateString()}` : 'No record'}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.monthlySalary > 0 ? `Rs.${Math.round(stats.monthlySalary).toLocaleString()}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Status Alert */}
        {stats.hasPendingCheckout && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Checkout Request Pending</h3>
                <p className="text-yellow-600">Your checkout request is awaiting admin approval</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activities Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-gray-500 mt-1">Your latest work activities and updates</p>
                </div>
                <Button variant="secondary" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {stats.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'salary' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : activity.type === 'checkin'
                        ? 'bg-blue-100 text-blue-600'
                        : activity.type === 'checkout'
                        ? 'bg-red-100 text-red-600'
                        : activity.type === 'student'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {activity.type === 'salary' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : activity.type === 'checkin' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : activity.type === 'checkout' ? (
                        <Clock className="w-5 h-5" />
                      ) : activity.type === 'student' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      {activity.status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          activity.status === 'completed' || activity.status === 'approved' || activity.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : activity.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : activity.status === 'active' || activity.status === 'available'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {stats.recentActivities.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
                    <p className="text-gray-500">Your activities will appear here as you use the system</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/staff/checkin-checkout'}
                  variant="secondary" 
                  className="w-full justify-start"
                >
                  <Clock className="w-4 h-4 mr-3" />
                  Check-In/Out
                </Button>
                <Button 
                  onClick={() => window.location.href = '/staff/salary'}
                  variant="secondary" 
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Salary Details
                </Button>
                <Button 
                  onClick={() => window.location.href = '/staff/complain'}
                  variant="secondary" 
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Submit Complain
                </Button>
                <Button 
                  onClick={() => window.location.href = '/staff/notice'}
                  variant="secondary" 
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Notices
                </Button>
                <Button 
                  onClick={() => window.location.href = '/staff/payment-history'}
                  variant="secondary" 
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Payment History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
