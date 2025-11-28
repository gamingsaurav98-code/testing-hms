'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { studentApi } from '@/lib/api/student.api';
import { roomApi } from '@/lib/api/room.api';
import { staffApi } from '@/lib/api/staff.api';
import { incomeApi } from '@/lib/api/income.api';
import { expenseApi } from '@/lib/api/expense.api';
import { staffCheckInCheckOutApi } from '@/lib/api/staff-checkincheckout.api';
import { complainApi } from '@/lib/api/complain.api';
import { SalaryApi } from '@/lib/api/salary.api';
import { API_BASE_URL, handleResponse } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';
import useAdminDashboard from '@/hooks/useAdminDashboard';

interface DashboardStats {
  totalStudentCapacity: number;
  totalCurrentStudents: number;
  totalRooms: number;
  outOfHostelStudents: number;
  studentsInHostelToday: number;
  currentlyPresent: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  outstandingDues: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  totalStaff: number;
  activeStaff: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  incomeChangePositive: boolean;
  expenseChangePositive: boolean;
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  thisMonthSalaryAmount: number;
  paidSalariesThisMonth: number;
  pendingSalariesThisMonth: number;
  recentActivities: Array<{
    type: 'payment' | 'complaint' | 'checkout' | 'checkin';
    message: string;
    time: string;
    student?: string;
    staff?: string;
  }>;
}

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudentCapacity: 0,
    totalCurrentStudents: 0,
    totalRooms: 0,
    outOfHostelStudents: 0,
    studentsInHostelToday: 0,
    currentlyPresent: 0,
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    outstandingDues: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    totalStaff: 0,
    activeStaff: 0,
    incomeChangePercent: 0,
    expenseChangePercent: 0,
    incomeChangePositive: true,
    expenseChangePositive: false,
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    thisMonthSalaryAmount: 0,
    paidSalariesThisMonth: 0,
    pendingSalariesThisMonth: 0,
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);
  const { data: adminData, loading: adminLoading } = useAdminDashboard();

  useEffect(() => {
    // Only fetch data when user is authenticated and not loading auth
    if (isAuthenticated && !authLoading) {
      // Prefer consolidated server-side dashboard when available
      if (adminData) {
        // Map server shape to local stats
        const s = adminData as any;
        setStats(prev => ({
          ...prev,
          totalStudentCapacity: s.rooms?.total_capacity ?? prev.totalStudentCapacity,
          totalCurrentStudents: s.students?.total ?? prev.totalCurrentStudents,
          totalRooms: s.rooms?.total_rooms ?? prev.totalRooms,
          outOfHostelStudents: s.students?.out_of_hostel ?? prev.outOfHostelStudents,
          studentsInHostelToday: s.students?.in_hostel ?? prev.studentsInHostelToday,
          currentlyPresent: s.students?.in_hostel ?? prev.currentlyPresent,
          thisMonthIncome: s.finance?.monthly_incomes ?? prev.thisMonthIncome,
          thisMonthExpense: s.finance?.monthly_expenses ?? prev.thisMonthExpense,
          outstandingDues: s.finance?.outstanding_total ?? prev.outstandingDues,
          totalBeds: s.rooms?.total_capacity ?? prev.totalBeds,
          occupiedBeds: s.rooms?.occupied_beds ?? prev.occupiedBeds,
          availableBeds: s.rooms?.available_beds ?? prev.availableBeds,
          recentActivities: (s.recent_activity || []).map((a: any) => ({
            type: a.type === 'income' ? 'payment' : a.type,
            message: a.title || a.type || '',
            time: a.date || a.occurred_at || a.created_at || '',
            student: a.student_id ? String(a.student_id) : undefined,
            staff: a.staff_id ? String(a.staff_id) : undefined,
          })),
        }));
        setLoading(false);
      } else {
        fetchDashboardData();
      }
    }
  }, [isAuthenticated, authLoading, adminData, adminLoading, fetchDashboardData]);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch critical data first with optimized timeouts (3 seconds each for faster response)
      const fetchWithTimeout = async (apiCall: any, fallback: any) => {
        try {
          return await Promise.race([
            apiCall(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout after 3 seconds')), 3000)
            )
          ]);
        } catch (error) {
          console.warn('API call failed, using fallback:', error);
          return fallback;
        }
      };

      // Fetch essential data first (these are needed for the dashboard to show)
      const [
        studentsData,
        staffData,
        roomsData,
        incomesData,
        expensesData,
      ] = await Promise.all([
        fetchWithTimeout(() => studentApi.getStudents(1), { data: [], total: 0 }),
        fetchWithTimeout(() => staffApi.getStaff(1), { data: [], total: 0 }),
        fetchWithTimeout(() => roomApi.getRooms(1, { per_page: 1000 }), { data: [], total: 0 }), // Fetch all rooms for accurate stats
        fetchWithTimeout(() => incomeApi.getIncomes(1), { data: [] }),
        fetchWithTimeout(() => expenseApi.getExpenses(1), { data: [] }),
      ]);

      // Initialize with fallback data for slower APIs
      let studentCheckInsData: any = { data: [] };
      let staffCheckInsData: any = { data: [] };
      let complainsData: any = { data: [], total: 0 };

      // Fetch slower APIs in background (don't wait for these)
      fetchWithTimeout(async () => {
        const response = await fetch(`${API_BASE_URL}/student-checkincheckouts?page=1`, {
          headers: getAuthHeaders()
        });
        return handleResponse(response);
      }, { data: [] })
        .then(data => { studentCheckInsData = data; });
      
      fetchWithTimeout(() => staffCheckInCheckOutApi.getCheckInCheckOuts(1), { data: [] })
        .then(data => { staffCheckInsData = data; });
      
      fetchWithTimeout(() => complainApi.getComplains(1), { data: [], total: 0 })
        .then(data => { complainsData = data; });

      // Fetch salary statistics
      let salaryStats = {
        total_salaries_this_month: 0,
        total_amount_this_month: 0,
        paid_salaries_this_month: 0,
        pending_salaries_this_month: 0,
      };

      try {
        const fetchedSalaryStats = await fetchWithTimeout(() => SalaryApi.getStatistics(), salaryStats);
        salaryStats = fetchedSalaryStats;
      } catch (error) {
        console.warn('Salary statistics not available:', error);
      }

      // Calculate real stats from fetched data
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Calculate actual capacity from rooms data
      const totalCapacity = roomsData.data?.reduce((sum: number, room: any) => 
        sum + (parseInt(room.capacity) || 0), 0) || 0;
      
      // Get actual current students count
      const currentStudents = studentsData.total || studentsData.data?.length || 0;
      
      // Get actual rooms count
      const totalRooms = roomsData.total || roomsData.data?.length || 0;
      
      // Calculate students currently in hostel (checked in and not checked out)
      const studentsInHostelToday = studentCheckInsData.data?.filter((checkIn: any) => 
        checkIn.status === 'approved' && !checkIn.check_out_date
      ).length || 0;

      // Calculate out of hostel students (total students - students in hostel)
      const outOfHostelStudents = Math.max(0, currentStudents - studentsInHostelToday);

      // Calculate this month's income from real data
      const thisMonthIncome = incomesData.data?.filter((income: any) => {
        const incomeDate = new Date(income.income_date || income.created_at);
        return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
      }).reduce((sum: number, income: any) => sum + parseFloat(income.amount || 0), 0) || 0;

      // Calculate this month's expenses from real data
      const thisMonthExpense = expensesData.data?.filter((expense: any) => {
        const expenseDate = new Date(expense.expense_date || expense.created_at);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      }).reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0) || 0;

      // Calculate previous month's data for percentage change
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const previousMonthIncome = incomesData.data?.filter((income: any) => {
        const incomeDate = new Date(income.income_date || income.created_at);
        return incomeDate.getMonth() === previousMonth && incomeDate.getFullYear() === previousYear;
      }).reduce((sum: number, income: any) => sum + parseFloat(income.amount || 0), 0) || 0;

      const previousMonthExpense = expensesData.data?.filter((expense: any) => {
        const expenseDate = new Date(expense.expense_date || expense.created_at);
        return expenseDate.getMonth() === previousMonth && expenseDate.getFullYear() === previousYear;
      }).reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0) || 0;

      // Calculate beds properly based on actual room occupancy
      const totalBeds = totalCapacity;
      
      // Calculate occupied beds using the occupied_beds field from backend
      // or by counting students in each room
      const occupiedBeds = roomsData.data?.reduce((sum: number, room: any) => {
        // Use occupied_beds if available, otherwise count students
        const occupied = room.occupied_beds || room.students?.length || 0;
        return sum + occupied;
      }, 0) || 0;
      
      const availableBeds = Math.max(0, totalBeds - occupiedBeds);

      // Staff calculations from real data
      const totalStaff = staffData.total || staffData.data?.length || 0;
      const activeStaff = staffData.data?.filter((staff: any) => 
        staff.is_active !== false && staff.is_active !== 0
      ).length || totalStaff;

      // Complaint calculations
      const totalComplaints = complainsData.total || complainsData.data?.length || 0;
      const pendingComplaints = complainsData.data?.filter((complaint: any) => 
        complaint.status === 'pending'
      ).length || 0;
      const resolvedComplaints = complainsData.data?.filter((complaint: any) => 
        complaint.status === 'resolved'
      ).length || 0;

      // Calculate outstanding dues (this would need a specific API endpoint)
      // For now, we'll use a placeholder but this should come from a real dues API
      const outstandingDues = 0; // Set to 0 until we have real dues data

      // Calculate percentage changes
      const incomeChangePercent = previousMonthIncome > 0 
        ? Math.round(((thisMonthIncome - previousMonthIncome) / previousMonthIncome) * 100) 
        : 0;
      const expenseChangePercent = previousMonthExpense > 0 
        ? Math.round(((thisMonthExpense - previousMonthExpense) / previousMonthExpense) * 100) 
        : 0;

      // Generate recent activities from real data
      const recentActivities: Array<{
        type: 'payment' | 'complaint' | 'checkout' | 'checkin';
        message: string;
        time: string;
        student?: string;
        staff?: string;
      }> = [];
      
      // Add recent income entries as payment activities
      const recentIncomes = incomesData.data?.slice(0, 3) || [];
      recentIncomes.forEach((income: any) => {
        const incomeDate = new Date(income.income_date || income.created_at);
        const timeAgo = formatTimeAgo(incomeDate);
        recentActivities.push({
          type: 'payment' as const,
          message: `Payment of Rs.${parseFloat(income.amount || 0).toLocaleString()} received${income.student_name ? ` from ${income.student_name}` : ''}`,
          time: timeAgo,
          student: income.student_name || undefined,
        });
      });

      // Add recent complaints
      const recentComplaints = complainsData.data?.slice(0, 2) || [];
      recentComplaints.forEach((complaint: any) => {
        const complaintDate = new Date(complaint.complaint_date || complaint.created_at);
        const timeAgo = formatTimeAgo(complaintDate);
        recentActivities.push({
          type: 'complaint' as const,
          message: `New complaint: ${complaint.title}`,
          time: timeAgo,
          student: complaint.student?.student_name || undefined,
        });
      });

      setStats({
        totalStudentCapacity: totalCapacity,
        totalCurrentStudents: currentStudents,
        totalRooms,
        outOfHostelStudents,
        studentsInHostelToday,
        currentlyPresent: studentsInHostelToday,
        thisMonthIncome,
        thisMonthExpense,
        outstandingDues,
        totalBeds,
        occupiedBeds,
        availableBeds,
        totalStaff,
        activeStaff,
        incomeChangePercent,
        expenseChangePercent,
        incomeChangePositive: incomeChangePercent >= 0,
        expenseChangePositive: expenseChangePercent <= 0, // Lower expenses are positive
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        thisMonthSalaryAmount: salaryStats.total_amount_this_month || 0,
        paidSalariesThisMonth: salaryStats.paid_salaries_this_month || 0,
        pendingSalariesThisMonth: salaryStats.pending_salaries_this_month || 0,
        recentActivities: recentActivities.slice(0, 5), // Limit to 5 most recent
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to format time ago
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

  const StatCard = ({ title, value, subtitle, icon, color = 'blue', trend }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
    trend?: { value: number; isPositive: boolean };
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
        'bed': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
        'users': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        'home': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        'person': (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
          {trend && (
            <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}%
            </div>
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
          <p className="mt-6 text-gray-600 font-medium">Loading dashboard data...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch the latest information</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (no loading screen needed)
  if (!isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Admin User!</h1>
            <p className="text-blue-100 text-lg">Here's what's happening at your hostel today</p>
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
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Student Capacity"
          value={stats.totalStudentCapacity}
          subtitle="All Rooms"
          icon="bed"
          color="blue"
        />
        <StatCard
          title="Total Current Students"
          value={stats.totalCurrentStudents}
          subtitle="Currently enrolled"
          icon="users"
          color="green"
        />
        <StatCard
          title="Out of Hostel Students"
          value={stats.outOfHostelStudents}
          subtitle="On leave"
          icon="person"
          color="yellow"
        />
        <StatCard
          title="Students in Hostel Today"
          value={stats.studentsInHostelToday}
          subtitle="Currently present"
          icon="home"
          color="indigo"
        />
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
              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-700">Monthly Income</p>
                    </div>
                  </div>
                  <div className={`flex items-center text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full ${
                    stats.incomeChangePositive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {stats.incomeChangePositive ? '↗' : '↘'} {Math.abs(stats.incomeChangePercent)}%
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-900">Rs.{Math.round(stats.thisMonthIncome).toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">vs last month</p>
              </div>
              <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-700">Monthly Expenses</p>
                    </div>
                  </div>
                  <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                    stats.expenseChangePositive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {stats.expenseChangePositive ? '↘' : '↗'} {Math.abs(stats.expenseChangePercent)}%
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-900">Rs.{Math.round(stats.thisMonthExpense).toLocaleString()}</p>
                <p className="text-sm text-red-600 mt-1">vs last month</p>
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
            <div className="space-y-4">
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'payment' 
                      ? 'bg-blue-100 text-blue-600' 
                      : activity.type === 'complaint'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {activity.type === 'payment' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    ) : activity.type === 'complaint' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
                    {activity.student && (
                      <p className="text-xs text-blue-600 mt-1">Student: {activity.student}</p>
                    )}
                    {activity.staff && (
                      <p className="text-xs text-green-600 mt-1">Staff: {activity.staff}</p>
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* Outstanding Dues */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Outstanding Dues</h2>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-yellow-700 font-medium">27 students</span>
                </div>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-3">Rs.{Math.round(stats.outstandingDues).toLocaleString()}</p>
          </div>

          {/* Room Status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Room Status</h2>
              <Button 
                onClick={() => window.location.href = '/admin/room'}
                className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View all
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Total Beds</span>
                </div>
                <span className="font-bold text-gray-900">{stats.totalBeds}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Occupied</span>
                </div>
                <span className="font-bold text-gray-900">{stats.occupiedBeds}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Available</span>
                </div>
                <span className="font-bold text-gray-900">{stats.availableBeds}</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Occupancy Rate</span>
                <span>{stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalBeds > 0 ? Math.min(100, Math.round((stats.occupiedBeds / stats.totalBeds) * 100)) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Staff Overview */}
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
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Total Staff</span>
                </div>
                <span className="font-bold text-gray-900">{stats.totalStaff}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">Active</span>
                </div>
                <span className="font-bold text-gray-900">{stats.activeStaff}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Cards */}
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
            <span className="text-yellow-600 font-medium">Pending: {stats.pendingComplaints}</span>
            <span className="text-green-600 font-medium">Resolved: {stats.resolvedComplaints}</span>
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
