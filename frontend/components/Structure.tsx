"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

type SidebarItem = {
  icon: () => JSX.Element;
  label: string;
  href: string;
  category: string;
  hasSubmenu?: boolean;
  submenu?: { label: string; href: string }[];
};

export default function Structure({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [expenseMenuOpen, setExpenseMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Logout function
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close user dropdown if clicking outside of it
      if (userDropdownOpen) {
        const userDropdownElement = document.querySelector('[data-dropdown="user"]');
        const userButtonElement = document.querySelector('[data-button="user"]');
        
        if (userDropdownElement && userButtonElement) {
          if (!userDropdownElement.contains(target) && !userButtonElement.contains(target)) {
            setUserDropdownOpen(false);
          }
        }
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userDropdownOpen]);

  // Determine if back button should be shown (3+ segments deep)
  const pathSegments = pathname.split('/').filter(Boolean);
  const showBackButton = pathSegments.length >= 3;

  // Get current page name based on pathname
  const getPageName = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean);
    
    if (pathname === '/admin' || pathname === '/admin/') {
      return 'Dashboard';
    }
    
    // Map routes to page names
    const routeMap: Record<string, string> = {
      'student': 'Students',
      'staff': 'Staff',
      'block': 'Blocks',
      'room': 'Rooms',
      'student-checkin-checkout': 'Student Check-In/Out',
      'staff-checkin-checkout': 'Staff Check-In/Out',
      'income': 'Income',
      'expense': 'Expenses',
      'salary': 'Salary',
      'supplier': 'Suppliers',
      'complain': 'Complaints',
      'notice': 'Notices',
      'inquiry': 'Inquiries',
      'report': 'Reports',
      'settings': 'Settings',
      'profile': 'Profile'
    };

    // Handle specific sub-routes
    if (segments.length >= 2) {
      const baseRoute = segments[1];
      const subRoute = segments[2];
      
      if (subRoute === 'create') {
        const baseName = routeMap[baseRoute];
        return `Create ${baseName ? baseName.slice(0, -1) : 'Item'}`;
      } else if (subRoute === 'edit' || (segments[3] === 'edit')) {
        const baseName = routeMap[baseRoute];
        return `Edit ${baseName ? baseName.slice(0, -1) : 'Item'}`;
      } else if (subRoute && !['create', 'edit'].includes(subRoute)) {
        const baseName = routeMap[baseRoute];
        return `${baseName ? baseName.slice(0, -1) : 'Item'} Details`;
      }
      
      return routeMap[baseRoute] || 'Dashboard';
    }
    
    return 'Dashboard';
  };

  const currentPageName = getPageName(pathname);

  // Auto-open expense menu if on expense or expense-category pages
  useEffect(() => {
    if (pathname.startsWith('/admin/expense')) {
      setExpenseMenuOpen(true);
    }
  }, [pathname]);

  const handleBackClick = () => {
    router.back();
  };

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };

  const sidebarItems: SidebarItem[] = [
    // Core Management
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ), 
      label: "Dashboard", 
      href: "/admin",
      category: "core"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
        </svg>
      ), 
      label: "Students", 
      href: "/admin/student",
      category: "core"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      ), 
      label: "Staff", 
      href: "/admin/staff",
      category: "core"
    },
    
    // Facility Management
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v2h4V6H4zm6 0v2h6V6h-6zM4 10v2h4v-2H4zm6 0v2h6v-2h-6zM4 14v2h4v-2H4zm6 0v2h6v-2h-6z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Blocks", 
      href: "/admin/block",
      category: "facility"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ), 
      label: "Rooms", 
      href: "/admin/room",
      category: "facility"
    },
    
    // Check-In/Out Operations
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Student Check-In/Out", 
      href: "/admin/student-checkin-checkout",
      category: "operations"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Staff Check-In/Out", 
      href: "/admin/staff-checkin-checkout",
      category: "operations"
    },
    
    // Financial Management
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Income", 
      href: "/admin/income",
      category: "financial"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Expenses", 
      href: "/admin/expense",
      category: "financial",
      hasSubmenu: true,
      submenu: [
        { label: "All Expenses", href: "/admin/expense" },
        { label: "Expense Categories", href: "/admin/expense-category" }
      ]
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Salary", 
      href: "/admin/salary",
      category: "financial"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Suppliers", 
      href: "/admin/supplier",
      category: "financial"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Payment Methods", 
      href: "/admin/payment-type",
      category: "financial"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Income Type", 
      href: "/admin/income-type",
      category: "financial"
    },
    
    // Communication & Support
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Complaints", 
      href: "/admin/complain",
      category: "communication"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Notices", 
      href: "/admin/notice",
      category: "communication"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Inquiries", 
      href: "/admin/inquiry",
      category: "communication"
    },
    
    // Reports & Settings
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Reports", 
      href: "/admin/report",
      category: "admin"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Settings", 
      href: "/admin/settings",
      category: "admin"
    },
  ];

  // Group items by category
  const groupedItems = sidebarItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof sidebarItems>);

  const categoryLabels = {
    core: "Core",
    facility: "Facility",
    operations: "Operations", 
    financial: "Financial",
    communication: "Communication",
    admin: "Administration"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 h-16 shadow-lg">
        <div className="flex items-center h-full">
          {/* Left side - Title area */}
          <div className="flex items-center w-64 px-6 border-r border-gray-200/50 h-full bg-gradient-to-r from-[#235999] to-[#1e4d87] relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center mr-4 rounded-xl hover:bg-white/20 transition-all duration-200 relative z-10"
            > 
              {sidebarOpen ? (
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo and Title */}
            <div className="flex items-center relative z-10">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3 backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Hostel Management</span>
            </div>
          </div>

          {/* Middle - Back button, title and time */}
          <div className="flex items-center justify-between flex-1 px-6">
            <div className="flex items-center">
              {showBackButton && (
                <button
                  onClick={handleBackClick}
                  className="w-9 h-9 flex items-center justify-center mr-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-200 shadow-sm border border-gray-200/50"
                >
                  <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">{currentPageName}</h1>
                <div className="w-2 h-2 bg-[#235999] rounded-full ml-3 animate-pulse"></div>
              </div>
            </div>

            {/* Time display with enhanced design */}
            <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600 bg-gradient-to-r from-white to-gray-50 px-4 py-2.5 rounded-xl border border-gray-200/50 shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-[#235999] to-[#1e4d87] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium">Current Time</span>
                <span className="font-semibold text-gray-800">{mounted ? formatDateTime(currentTime) : '--'}</span>
              </div>
            </div>
          </div>

          {/* Right side - Notifications and user */}
          <div className="flex items-center px-6 space-x-3">
            {/* Notification bell */}
            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all duration-200 group">
              <svg className="w-5 h-5 text-gray-600 group-hover:text-[#235999] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-5.5.5-3.5V7a6 6 0 00-12 0v1.5l.5 3.5L2 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">3</span>
              </div>
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                data-button="user"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserDropdownOpen(!userDropdownOpen);
                }}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#235999] to-[#1e4d87] rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-semibold text-gray-800">Admin</div>
                </div>
                <svg className="hidden lg:block w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User dropdown menu */}
              {userDropdownOpen && (
                <div 
                  data-dropdown="user"
                  className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl py-3 z-50 animate-in slide-in-from-top-2 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-5 py-4 border-b border-gray-100/50">
                    <div className="flex items-start space-x-4">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#235999] to-[#1e4d87] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-gray-800 mb-1">Admin</div>
                        <div 
                          className={`text-sm break-all cursor-pointer transition-all duration-200 hover:text-[#235999] ${
                            emailCopied ? 'text-green-600' : 'text-gray-500'
                          }`}
                          title={emailCopied ? "Email copied to clipboard!" : "Click to copy email"}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await navigator.clipboard.writeText('admin@hms.com');
                              setEmailCopied(true);
                              setTimeout(() => setEmailCopied(false), 1500); // Reduced from 2000ms
                            } catch (err) {
                              console.error('Failed to copy email:', err);
                            }
                          }}
                        >
                          {emailCopied ? (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Email copied!</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 group">
                              <span>admin@hms.com</span>
                              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/admin/profile"
                      className="flex items-center px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#235999] transition-all duration-200 group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors duration-200">
                        <svg className="h-4 w-4 text-gray-500 group-hover:text-[#235999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Profile</div>
                        <div className="text-xs text-gray-500">Manage your account</div>
                      </div>
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#235999] transition-all duration-200 group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors duration-200">
                        <svg className="h-4 w-4 text-gray-500 group-hover:text-[#235999]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Settings</div>
                        <div className="text-xs text-gray-500">Preferences & configuration</div>
                      </div>
                    </Link>
                  </div>
                  <div className="border-t border-gray-200/50 my-2"></div>
                  <button 
                    className="flex items-center w-full px-5 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleLogout}
                    disabled={authLoading}
                  >
                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-red-200 transition-colors duration-200">
                      {authLoading ? (
                        <svg className="h-4 w-4 text-red-500 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">
                        {authLoading ? 'Signing out...' : 'Sign out'}
                      </div>
                      <div className="text-xs text-gray-500">End current session</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-xl border-r border-gray-200/50 transition-transform duration-300 ease-out shadow-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Sidebar content */}
        <div className="h-full overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent hover:scrollbar-thumb-blue-300">
          <nav className="px-2 space-y-0.5">
            {sidebarItems.map((item, index) => {
              // For items with submenu, don't mark parent as active, only check submenu items
              const isActive = !item.hasSubmenu && (
                pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href) && !sidebarItems.some(otherItem => 
                  otherItem.href !== item.href && 
                  otherItem.href !== "/admin" && 
                  pathname.startsWith(otherItem.href) && 
                  otherItem.href.length > item.href.length
                ))
              );
              
              // Check if any submenu item is active
              const isSubmenuActive = item.submenu?.some(subItem => pathname === subItem.href || pathname.startsWith(subItem.href));
              const shouldShowSubmenu = item.hasSubmenu && (expenseMenuOpen || isSubmenuActive);
              
              return (
                <div key={index}>
                  {item.hasSubmenu ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpenseMenuOpen(!expenseMenuOpen);
                      }}
                      className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isSubmenuActive
                          ? "bg-gradient-to-r from-[#235999] to-[#1e4d87] text-white shadow-md shadow-blue-200/60"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#235999]"
                      }`}
                    >
                      <div className={`mr-3 flex-shrink-0 transition-transform duration-200 ${isSubmenuActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                        <item.icon />
                      </div>
                      <span className="tracking-tight text-xs font-semibold flex-1 text-left">{item.label}</span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${shouldShowSubmenu ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-[#235999] to-[#1e4d87] text-white shadow-md shadow-blue-200/60"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#235999]"
                      }`}
                    >
                      <div className={`mr-3 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                        <item.icon />
                      </div>
                      <span className="tracking-tight text-xs font-semibold">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
                      )}
                    </Link>
                  )}
                  
                  {/* Submenu */}
                  {item.hasSubmenu && shouldShowSubmenu && (
                    <div className="mt-1 ml-7 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                      {item.submenu?.map((subItem, subIndex) => {
                        const isSubItemActive = pathname === subItem.href || pathname.startsWith(subItem.href);
                        return (
                          <Link
                            key={subIndex}
                            href={subItem.href}
                            className={`group flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                              isSubItemActive
                                ? "bg-blue-100 text-[#235999]"
                                : "text-gray-600 hover:bg-blue-50 hover:text-[#235999]"
                            }`}
                          >
                            <div className="mr-2 w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Main content */}
      <main className="pt-16 lg:pl-64 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}