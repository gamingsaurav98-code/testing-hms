"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { staffApi } from '@/lib/api/staff.api';
import { 
  Button, 
  SearchBar, 
  TableSkeleton,
  ActionButtons 
} from '@/components/ui';
import { 
  AlertCircle, 
  Calendar, 
  Eye,
  Clock,
  User,
  Home,
  Settings,
  Check,
  X
} from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  description?: string;
  type: 'general' | 'urgent' | 'announcement' | 'maintenance';
  target_audience: 'all' | 'staff' | 'students';
  created_at: string;
  updated_at: string;
  status?: string; // Match admin interface - 'active', 'inactive'
  is_active?: boolean; // Keep for backward compatibility
}

export default function StaffNoticePage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [totalNotices, setTotalNotices] = useState(0);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await staffApi.getStaffNotices();
      const noticesData = response.data || [];
      
      setNotices(noticesData);
      setFilteredNotices(noticesData);
      setTotalNotices(noticesData.length);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('Failed to load notices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotices(notices);
    } else {
      const filtered = notices.filter(notice =>
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (notice.description && notice.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredNotices(filtered);
    }
  }, [searchQuery, notices]);

  // Function to get target audience display text
  const getTargetDisplay = (targetType: string): string => {
    switch (targetType) {
      case 'all':
        return 'Everyone';
      case 'students':
        return 'Students Only';
      case 'staff':
        return 'Staff Only';
      default:
        return targetType;
    }
  };

  // Function to get the sent time display
  const getSentTimeDisplay = (notice: Notice) => {
    const dateObj = new Date(notice.created_at);
    
    // Format date and time separately
    const dateStr = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return (
      <div className="flex flex-col">
        <span className="text-sm text-gray-900">{dateStr}</span>
        <span className="text-sm text-gray-500">{timeStr}</span>
      </div>
    );
  };

  // Determine status badge based on notice status (matching admin page)
  const renderStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <div className="inline-flex items-center bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
          <Check className="w-3 h-3 mr-1" />
          Active
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
          <X className="w-3 h-3 mr-1" />
          Inactive
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Staff Notices</h1>
          <p className="text-sm text-gray-500 mt-1">Loading notices...</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Minimal Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Staff Notices</h1>
          <p className="text-sm text-gray-500 mt-1">{totalNotices} total notices</p>
        </div>
      </div>

      {/* Compact Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search notices..."
        />
      </div>

      {/* Clean List View */}
      {filteredNotices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery ? 'No notices found' : 'No notices yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'No notices have been posted yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-10 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Title</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Posted Date</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredNotices.map((notice) => (
              <div key={notice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-10 gap-2 items-center">
                  {/* Notice Title */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-gray-900">{notice.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {notice.type && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {notice.type.charAt(0).toUpperCase() + notice.type.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-3">
                    <div className="text-sm text-gray-600 truncate">
                      {notice.description 
                        ? notice.description.length > 50 
                          ? `${notice.description.substring(0, 50)}...` 
                          : notice.description
                        : 'No description'
                      }
                    </div>
                  </div>

                  {/* Posted Date */}
                  <div className="col-span-2">
                    {getSentTimeDisplay(notice)}
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <div className="flex justify-center">
                      {renderStatusBadge(notice.status || (notice.is_active ? 'active' : 'inactive'))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex justify-center">
                      <ActionButtons 
                        viewUrl={`/staff/notice/${notice.id}`}
                        hideEdit={true}
                        hideDelete={true}
                        style="compact"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      {filteredNotices.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {filteredNotices.length} of {totalNotices} notices
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}
