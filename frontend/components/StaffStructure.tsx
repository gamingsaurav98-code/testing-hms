"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function StaffStructure({ children }: { children: React.ReactNode }) {
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
    
    // Define route mappings for staff pages
    const routeMap: { [key: string]: string } = {
      'staff': 'Dashboard',
      'checkin-checkout': 'Check-In/Out',
      'notice': 'Notices',
      'salary': 'Salary',
      'payment-history': 'Payment History',
      'complain': 'Complains',
    };

    if (segments.length === 1) {
      return 'Staff Dashboard';
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
      } else if (!isNaN(Number(subRoute))) {
        const baseName = routeMap[baseRoute];
        return `View ${baseName ? baseName.slice(0, -1) : 'Item'}`;
      }
      
      return routeMap[baseRoute] || 'Staff Panel';
    }

    return 'Staff Panel';
  };

  const currentPageName = getPageName(pathname);

  // Handle back navigation
  const handleBackClick = () => {
    router.back();
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEmailCopy = () => {
    navigator.clipboard.writeText(user?.email || '');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 1500); // Reduced from 2000ms
  };

  // Sidebar items for staff
  const sidebarItems = [
    {
      label: 'Dashboard',
      href: '/staff',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Check-In/Out',
      href: '/staff/checkin-checkout',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      label: 'Salary',
      href: '/staff/salary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Complains',
      href: '/staff/complain',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: 'Notices',
      href: '/staff/notice',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 h-16 shadow-lg">
        <div className="flex items-center h-full">
          {/* Left side - Title area */}
          <div className="flex items-center w-64 px-6 border-r border-gray-200/50 h-full bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
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
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Staff Portal</span>
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
                <div className="w-2 h-2 bg-blue-600 rounded-full ml-3 animate-pulse"></div>
              </div>
            </div>
            
            {/* Time display with enhanced design */}
            <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600 bg-gradient-to-r from-white to-gray-50 px-4 py-2.5 rounded-xl border border-gray-200/50 shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
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
              <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-5.5.5-3.5V7a6 6 0 00-12 0v1.5l.5 3.5L2 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">1</span>
              </div>
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                data-button="user"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">Staff Member</span>
                  <span className="text-xs text-gray-500">{user?.email || 'No email'}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User dropdown menu */}
              {userDropdownOpen && (
                <div
                  data-dropdown="user"
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200"
                >
                  {/* User info section */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">S</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Staff Member</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                          <button
                            onClick={handleEmailCopy}
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors duration-200"
                          >
                            {emailCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <Link
                      href="/staff/profile"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </Link>
                    <Link
                      href="/staff/settings"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  </div>

                  {/* Logout button */}
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={handleLogout}
                      disabled={authLoading}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                    >
                      {authLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-3"></div>
                      ) : (
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                      {authLoading ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 transform transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl`}>
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent hover:scrollbar-thumb-blue-300">
            {sidebarItems.map((item, index) => {
              const isActive = pathname === item.href || (item.href !== "/staff" && pathname.startsWith(item.href) && !sidebarItems.some(otherItem => 
                otherItem.href !== item.href && 
                otherItem.href !== "/staff" && 
                pathname.startsWith(otherItem.href) && 
                otherItem.href.length > item.href.length
              ));
              
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200/60"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600"
                  }`}
                >
                  <div className={`mr-3 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {item.icon}
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
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-64'}`}>
        {children}
      </main>
    </div>
  );
}
