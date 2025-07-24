"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { noticeApi, Notice } from '@/lib/api/notice.api';
import { PaginatedResponse, ApiError } from '@/lib/api/core';
import { 
  Button, 
  SearchBar, 
  TableSkeleton,
  ActionButtons 
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { 
  AlertCircle, 
  Calendar, 
  Eye,
  Clock,
  User,
  Home,
  Settings
} from 'lucide-react';

export default function StudentNoticeList() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotices = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // For student notice list, we can use the general notices endpoint
      // and let the backend filter based on authentication
      const response = await noticeApi.getNotices(page);
      
      setNotices(response.data);
      setFilteredNotices(response.data);
      setCurrentPage(response.current_page);
      setTotalPages(response.last_page);
      setTotalCount(response.total);
    } catch (err) {
      console.error('Error fetching notices:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load notices. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices(currentPage);
  }, [currentPage]);

  // Filter notices based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotices(notices);
    } else {
      const filtered = notices.filter(notice =>
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotices(filtered);
    }
  }, [searchQuery, notices]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewNotice = (noticeId: number) => {
    router.push(`/student/notice/${noticeId}`);
  };

  const getNoticeTypeColor = (type: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      event: 'bg-blue-100 text-blue-800 border-blue-200',
      announcement: 'bg-purple-100 text-purple-800 border-purple-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all':
        return <User className="w-4 h-4" />;
      case 'student':
        return <User className="w-4 h-4" />;
      case 'block':
        return <Home className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getTargetDisplay = (notice: Notice) => {
    if (notice.target_info) {
      return notice.target_info.name;
    }
    
    switch (notice.target_type) {
      case 'all':
        return 'All Users';
      case 'student':
        return 'All Students';
      case 'staff':
        return 'All Staff';
      case 'specific_student':
        return notice.student ? notice.student.name : 'Specific Student';
      case 'specific_staff':
        return notice.staff ? notice.staff.name : 'Specific Staff';
      case 'block':
        return notice.block ? notice.block.name : 'Specific Block';
      default:
        return 'Unknown';
    }
  };

  if (loading && filteredNotices.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Notices</h1>
          <p className="text-gray-600">View notices and announcements from the administration</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Notices</h1>
          <p className="text-gray-600">View notices and announcements from the administration</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Notices</h1>
            <p className="text-gray-600">View notices and announcements from the administration</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{totalCount} total notices</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search notices by title or description..."
        />
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search criteria' : 'No notices have been posted yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Notice Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getTargetIcon(notice.target_type)}
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => handleViewNotice(notice.id)}>
                          {notice.title}
                        </h3>
                      </div>
                      
                      {/* Notice Type Badge */}
                      {notice.notice_type && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getNoticeTypeColor(notice.notice_type)}`}>
                          {notice.notice_type === 'urgent' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {notice.notice_type === 'event' && <Calendar className="w-3 h-3 mr-1" />}
                          {notice.notice_type}
                        </span>
                      )}
                    </div>

                    {/* Notice Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {notice.description}
                    </p>

                    {/* Notice Meta Information */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>For: {getTargetDisplay(notice)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Posted: {formatDate(notice.created_at)}</span>
                      </div>
                      
                      {notice.schedule_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled: {formatDate(notice.schedule_time)}</span>
                        </div>
                      )}
                      
                      {notice.attachments && notice.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            {notice.attachments.length} attachment{notice.attachments.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    <Button
                      onClick={() => handleViewNotice(notice.id)}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-4">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="secondary"
            size="sm"
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
