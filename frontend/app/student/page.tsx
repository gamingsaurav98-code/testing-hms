'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { studentCheckInCheckOutApi } from '@/lib/api/student-checkincheckout.api';
import { studentApi } from '@/lib/api/student.api';

interface StudentDashboardStats {
  currentStatus: 'checked-in' | 'checked-out' | 'pending';
  roomNumber: string;
  bedNumber: string;
  lastCheckIn: string;
  lastCheckOut: string;
  myComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  thisMonthPayments: number;
  outstandingDues: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  recentActivities: Array<{
    type: 'payment' | 'complaint' | 'checkout' | 'checkin';
    message: string;
    time: string;
    status?: string;
  }>;
  upcomingPayments: Array<{
    type: string;
    amount: number;
    dueDate: string;
  }>;
}

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<StudentDashboardStats>({
    currentStatus: 'checked-out',
    roomNumber: '',
    bedNumber: '',
    lastCheckIn: '',
    lastCheckOut: '',
    myComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    thisMonthPayments: 0,
    outstandingDues: 0,
    lastPaymentDate: '',
    lastPaymentAmount: 0,
    recentActivities: [],
    upcomingPayments: [],
  });
  const [loading, setLoading] = useState(true);
  const [studentId] = useState('1'); // This should come from auth context

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch student-specific data with optimized timeouts (2 seconds each)
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
      
      // Fetch student-specific data using optimized API calls
      const [
        profileData,
        checkInOutData,
        complaintsData,
        paymentsData,
        noticesData
      ] = await Promise.all([
        fetchWithTimeout(() => studentApi.getStudentProfile(), null),
        fetchWithTimeout(() => studentApi.getStudentCheckInOuts(), { data: [] }),
        fetchWithTimeout(() => studentApi.getStudentComplains(), { data: [], total: 0 }),
        fetchWithTimeout(() => studentApi.getStudentPayments(), { data: [] }),
        fetchWithTimeout(() => studentApi.getStudentNotices(), { data: [] })
      ]);

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Calculate current status from check-in/out data
      const myCheckIns = checkInOutData.data || [];
      
      // Get the latest check-in/out record
      const latestRecord = myCheckIns.length > 0 ? myCheckIns[0] : null;
      let currentStatus: 'checked-in' | 'checked-out' | 'pending' = 'checked-out';
      
      if (latestRecord) {
        if (latestRecord.checkout_time) {
          currentStatus = 'checked-out';
        } else if (latestRecord.checkin_time) {
          currentStatus = 'checked-in';
        }
      }

      // Calculate complaint statistics
      const myComplaints = complaintsData.data || [];
      const pendingComplaints = myComplaints.filter((complaint: any) => 
        complaint.status === 'pending'
      ).length;
      const resolvedComplaints = myComplaints.filter((complaint: any) => 
        complaint.status === 'resolved'
      ).length;

      // Calculate payment statistics from student's payment history
      const myPayments = paymentsData.data || [];
      const thisMonthPayments = myPayments
        .filter((payment: any) => {
          const paymentDate = new Date(payment.payment_date || payment.created_at);
          return paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || '0'), 0);

      // Get latest payment info
      const latestPayment = myPayments.length > 0 ? myPayments[0] : null;
      const lastPaymentDate = latestPayment ? latestPayment.payment_date || latestPayment.created_at : '';
      const lastPaymentAmount = latestPayment ? parseFloat(latestPayment.amount || '0') : 0;

      // Calculate outstanding dues (this would need proper logic based on student fees)
      const outstandingDues = 0; // Placeholder - should be calculated based on student's fee structure

      // Get room information from profile
      const roomNumber = profileData?.room?.room_name || '';
      const bedNumber = ''; // This would need to come from specific bed assignment logic

      // Generate recent activities
      const recentActivities: Array<{
        type: 'payment' | 'complaint' | 'checkout' | 'checkin';
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
            message: `Checked in to Room ${(checkIn.student && checkIn.student.room && checkIn.student.room.room_name) ? checkIn.student.room.room_name : 'N/A'}`,
            time: timeAgo,
            status: checkIn.status,
          });
        }

        if (checkIn.checkout_time) {
          const checkOutDate = new Date(checkIn.date || checkIn.created_at);
          const timeAgo = formatTimeAgo(checkOutDate);
          recentActivities.push({
            type: 'checkout' as const,
            message: `Checked out from Room ${(checkIn.student && checkIn.student.room && checkIn.student.room.room_name) ? checkIn.student.room.room_name : 'N/A'}`,
            time: timeAgo,
            status: 'completed',
          });
        }
      });

      // Add recent payments
      myPayments.slice(0, 2).forEach((payment: any) => {
        const paymentDate = new Date(payment.income_date || payment.created_at);
        const timeAgo = formatTimeAgo(paymentDate);
        recentActivities.push({
          type: 'payment' as const,
          message: `Payment of Rs.${parseFloat(payment.amount || '0').toLocaleString()} made`,
          time: timeAgo,
          status: 'completed',
        });
      });

      // Add recent complaints
      myComplaints.slice(0, 2).forEach((complaint: any) => {
        const complaintDate = new Date(complaint.complaint_date || complaint.created_at);
        const timeAgo = formatTimeAgo(complaintDate);
        recentActivities.push({
          type: 'complaint' as const,
          message: `Complaint: ${complaint.title}`,
          time: timeAgo,
          status: complaint.status,
        });
      });

      // Sort activities by most recent first
      recentActivities.sort((a, b) => {
        // This is a simple sort, in real app you'd parse the time strings properly
        return a.time.localeCompare(b.time);
      });

      setStats({
        currentStatus,
        roomNumber: roomNumber || 'Not Assigned',
        bedNumber: bedNumber || 'Not Assigned',
        lastCheckIn: latestRecord?.checkin_time || '',
        lastCheckOut: latestRecord?.checkout_time || '',
        myComplaints: myComplaints.length,
        pendingComplaints,
        resolvedComplaints,
        thisMonthPayments,
        outstandingDues,
        lastPaymentDate,
        lastPaymentAmount,
        recentActivities: recentActivities.slice(0, 5),
        upcomingPayments: [
          { type: 'Monthly Fee', amount: 15000, dueDate: '2025-08-01' },
          { type: 'Room Fee', amount: 5000, dueDate: '2025-08-15' },
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

  const StatusCard = ({ title, value, subtitle, icon, color = 'blue', action }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
    action?: { label: string; href: string };
  }) => {
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    };

    const getIcon = (iconName: string) => {
      const iconMap = {
        'status': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        'room': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        'complaint': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
        'payment': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
      };
      return iconMap[iconName as keyof typeof iconMap] || null;
    };

    return (
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {icon && (
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${colorClasses[color].bg} ${colorClasses[color].text}`}>
                {getIcon(icon)}
              </div>
            )}
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {action && (
            <Button 
              onClick={() => window.location.href = action.href}
              className="text-xs px-3 py-2 rounded-lg"
              variant="secondary"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="text-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-blue-300 mx-auto animate-ping"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Student!</h1>
            <p className="text-blue-100 text-lg">Here's your hostel status and recent activities</p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.href = '/student/checkin-checkout/create'}
              variant="secondary"
              size="lg"
              className="bg-white/90 backdrop-blur-sm text-blue-700 hover:bg-white border-0 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              {stats.currentStatus === 'checked-in' ? 'Check Out' : 'Check In'}
            </Button>
            <Button 
              onClick={() => window.location.href = '/student/complain/create'}
              variant="secondary"
              size="lg"
              className="bg-white/90 backdrop-blur-sm text-blue-700 hover:bg-white border-0 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              New Complaint
            </Button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusCard
          title="Check-In Status"
          value={stats.currentStatus === 'checked-in' ? 'Checked In' : 'Checked Out'}
          subtitle={stats.roomNumber ? `Room ${stats.roomNumber}` : 'No room assigned'}
          icon="status"
          color={stats.currentStatus === 'checked-in' ? 'green' : 'red'}
          action={{ label: 'Manage', href: '/student/checkin-checkout' }}
        />
        <StatusCard
          title="Current Room"
          value={stats.roomNumber || 'Not Assigned'}
          subtitle={stats.bedNumber ? `Bed ${stats.bedNumber}` : 'No bed assigned'}
          icon="room"
          color="blue"
        />
        <StatusCard
          title="My Complaints"
          value={stats.myComplaints}
          subtitle={`${stats.pendingComplaints} pending, ${stats.resolvedComplaints} resolved`}
          icon="complaint"
          color="yellow"
          action={{ label: 'View All', href: '/student/complain' }}
        />
        <StatusCard
          title="This Month Payments"
          value={`Rs.${Math.round(stats.thisMonthPayments).toLocaleString()}`}
          subtitle="Total paid this month"
          icon="payment"
          color="green"
          action={{ label: 'History', href: '/student/payment-history' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activities */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
              <p className="text-gray-500 mt-1">Your latest check-ins, payments, and complaints</p>
            </div>
            <div className="space-y-4">
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'payment' 
                      ? 'bg-green-100 text-green-600' 
                      : activity.type === 'complaint'
                      ? 'bg-yellow-100 text-yellow-600'
                      : activity.type === 'checkin'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {activity.type === 'payment' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    ) : activity.type === 'complaint' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : activity.type === 'checkin' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    {activity.status && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        activity.status === 'completed' || activity.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : activity.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {stats.recentActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No recent activities to display</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Upcoming Payments & Quick Actions */}
        <div className="space-y-6">
          {/* Outstanding Dues */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Outstanding Dues</h2>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-sm text-orange-700 font-medium">Immediate attention required</span>
                </div>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-3">Rs.{Math.round(stats.outstandingDues).toLocaleString()}</p>
            <Button 
              onClick={() => window.location.href = '/student/payment-history'}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              View Payment Details
            </Button>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Payments</h2>
            </div>
            <div className="space-y-4">
              {stats.upcomingPayments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.type}</p>
                    <p className="text-xs text-gray-500">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-gray-900">Rs.{payment.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/student/checkin-checkout'}
                className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100"
                variant="secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Check-In/Out History
              </Button>
              <Button 
                onClick={() => window.location.href = '/student/notice'}
                className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100"
                variant="secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 1h5l5 5V1H4z" />
                </svg>
                View Notices
              </Button>
              <Button 
                onClick={() => window.location.href = '/student/complain'}
                className="w-full justify-start bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                variant="secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                My Complaints
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
