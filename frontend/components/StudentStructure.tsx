"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function StudentStructure({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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

  const getPageName = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    
    // Define route mappings for student pages
    const routeMap: { [key: string]: string } = {
      'student': 'Dashboard',
      'checkin-checkout': 'Check-In/Out',
      'complain': 'Complaints',
      'notice': 'Notices',
      'payment-history': 'Payment History',
    };

    if (segments.length === 1) {
      return 'Student Dashboard';
    }

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

  // Student-specific sidebar items
  const sidebarItems = [
    // Core Student Functions
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ), 
      label: "Dashboard", 
      href: "/student",
      category: "core"
    },
    
    // Check-In/Out Operations
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Check-In/Out", 
      href: "/student/checkin-checkout",
      category: "operations"
    },
    
    // Financial
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Payment History", 
      href: "/student/payment-history",
      category: "financial"
    },
    
    // Communication
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Complaints", 
      href: "/student/complain",
      category: "communication"
    },
    { 
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
        </svg>
      ), 
      label: "Notices", 
      href: "/student/notice",
      category: "communication"
    },
  ];

  // sidebarItems is used directly for rendering in this component. Remove
  // unused grouped helpers to avoid ESLint no-unused-vars warnings.

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
              <span className="text-sm font-bold text-white tracking-tight">Student Portal</span>
            </div>
          </div>
          
          {/* Center - Navigation and info */}
          <div className="flex items-center justify-between flex-1 px-6">
            <div className="flex items-center">
              {/* Back Button */}
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
              
              {/* Page Title */}
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">{currentPageName}</h2>
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

          {/* Right side - User menu */}
          <div className="flex items-center px-6 space-x-3">
            {/* Notification bell */}
            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all duration-200 group">
              <svg className="w-5 h-5 text-gray-600 group-hover:text-[#235999] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-5.5.5-3.5V7a6 6 0 00-12 0v1.5l.5 3.5L2 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">2</span>
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
                  <span className="text-white font-bold text-lg">{user?.name?.charAt(0).toUpperCase() || 'S'}</span>
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-semibold text-gray-800">{user?.name?.split(' ')[0] || 'Student'}</div>
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
                        <span className="text-white font-bold text-lg">{user?.name?.charAt(0).toUpperCase() || 'S'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-gray-800 mb-1">{user?.name || 'Student'}</div>
                        <div 
                          className={`text-sm break-all cursor-pointer transition-all duration-200 hover:text-[#235999] ${
                            emailCopied ? 'text-green-600' : 'text-gray-500'
                          }`}
                          title={emailCopied ? "Email copied to clipboard!" : "Click to copy email"}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await navigator.clipboard.writeText(user?.email || '');
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
                              <span>{user?.email || 'No email'}</span>
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
                      href="/student/profile"
                      className="flex items-center px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#235999] transition-all duration-200 group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors duration-200">
                        <svg className="h-4 w-4 text-gray-500 group-hover:text-[#235999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">My Profile</div>
                        <div className="text-xs text-gray-500">Manage your account</div>
                      </div>
                    </Link>
                  </div>
                  <div className="border-t border-gray-200/50 my-2"></div>
                  <button 
                    className="flex items-center w-full px-5 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 group"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    disabled={authLoading}
                  >
                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-red-200 transition-colors duration-200">
                      <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Sign out</div>
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
              const isActive = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href) && !sidebarItems.some(otherItem => 
                otherItem.href !== item.href && 
                otherItem.href !== "/student" && 
                pathname.startsWith(otherItem.href) && 
                otherItem.href.length > item.href.length
              ));
              
              return (
                <Link
                  key={index}
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
