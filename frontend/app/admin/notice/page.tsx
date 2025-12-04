"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { noticeApi, Notice, ApiError } from '@/lib/api';
import { PaginatedResponse } from '@/lib/api/core';
import { 
  Button, 
  SearchBar, 
  ConfirmModal, 
  SuccessToast, 
  TableSkeleton,
  ActionButtons 
} from '@/components/ui';
import { Calendar, User, AlertCircle, Check, X, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function NoticeList() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotices, setTotalNotices] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, noticeId: string | null}>({
    show: false,
    noticeId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch notices from API
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await noticeApi.getNotices(currentPage);
        setNotices(response.data);
        setFilteredNotices(response.data);
        setTotalPages(response.last_page);
        setTotalNotices(response.total);
      } catch (error) {
        console.error('Error fetching notices:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch notices: ${error.message}`);
        } else {
          setError('Failed to fetch notices. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, [currentPage]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotices(notices);
    } else {
      const filtered = notices.filter(notice =>
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.target_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (notice.description && notice.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredNotices(filtered);
    }
  }, [searchQuery, notices]);

  const handleDeleteNotice = async (noticeId: number | string) => {
    setDeleteModal({show: true, noticeId: noticeId.toString()});
  };

  const confirmDelete = async () => {
    const noticeId = deleteModal.noticeId;
    if (!noticeId) return;

    try {
      setIsDeleting(noticeId);
      setDeleteModal({show: false, noticeId: null});
      setAlert({show: true, message: 'Deleting notice...', type: 'success'});
      
      await noticeApi.deleteNotice(noticeId);
      
      // Remove from local state
      const updatedNotices = notices.filter(notice => notice.id.toString() !== noticeId);
      setNotices(updatedNotices);
      setFilteredNotices(updatedNotices.filter(notice =>
        !searchQuery.trim() ||
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.target_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (notice.description && notice.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
      
      setAlert({show: true, message: 'Notice deleted successfully!', type: 'success'});
      
      // Hide alert after 2 seconds - optimized
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting notice:', error);
      if (error instanceof ApiError) {
        setAlert({show: true, message: `Failed to delete notice: ${error.message}`, type: 'error'});
      } else {
        setAlert({show: true, message: 'Failed to delete notice. Please try again.', type: 'error'});
      }
      
      // Hide error alert after 3 seconds - optimized
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'error'});
      }, 3000);
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({show: false, noticeId: null});
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if needed
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border border-gray-300 rounded-md mr-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &laquo;
      </button>
    );

    // First page if needed
    if (startPage > 1) {
      pages.push(
        <button key="1" onClick={() => handlePageChange(1)} className="px-3 py-1 border border-gray-300 rounded-md mr-1">
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded-md mr-1 ${
            i === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 border border-gray-300 rounded-md mr-1"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &raquo;
      </button>
    );

    return <div className="flex justify-center mt-6">{pages}</div>;
  };

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
    // Use schedule_time if it exists, otherwise use created_at
    const sentTime = notice.schedule_time || notice.created_at;
    const dateObj = new Date(sentTime);
    
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

  // Determine status badge based on notice status
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
          <h1 className="text-xl font-medium text-gray-900">Notices</h1>
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
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting !== null}
        variant="danger"
      />

      {/* Alert Notification */}
      {alert.type === 'success' && alert.show && (
        <SuccessToast
          show={alert.show}
          message={alert.message}
          progress={100}
          onClose={() => setAlert({show: false, message: '', type: 'success'})}
        />
      )}
      {alert.type === 'error' && alert.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-red-100 border-red-500 text-red-700 border-l-4 p-4 rounded-lg shadow-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setAlert({show: false, message: '', type: 'success'})}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Notices</h1>
          <p className="text-sm text-gray-500 mt-1">{totalNotices} total notices</p>
        </div>
        <Button
          onClick={() => router.push('/admin/notice/create')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>}
          className="bg-[#235999] hover:bg-[#1e4d87]"
        >
          Add Notice
        </Button>
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
            {searchQuery ? 'Try a different search term' : 'Create your first notice to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => router.push('/admin/notice/create')}
              className="bg-[#235999] hover:bg-[#1e4d87]"
            >
              Create Notice
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Title</div>
              <div className="col-span-2">Description</div>
              <div className="col-span-2">Sent Date</div>
              <div className="col-span-2">Target</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredNotices.map((notice) => (
              <div key={notice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Notice Title */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-gray-900">{notice.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {notice.notice_type && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {notice.notice_type.charAt(0).toUpperCase() + notice.notice_type.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 truncate">
                      {notice.description 
                        ? notice.description.length > 15 
                          ? `${notice.description.substring(0, 15)}...` 
                          : notice.description
                        : 'No description'
                      }
                    </div>
                  </div>

                  {/* Sent Date */}
                  <div className="col-span-2">
                    {getSentTimeDisplay(notice)}
                  </div>

                  {/* Target */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-700">{getTargetDisplay(notice.target_type)}</div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <div className="flex justify-center">
                      {renderStatusBadge(notice.status || 'active')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2">
                    <div className="flex justify-center">
                      <ActionButtons 
                        viewUrl={`/admin/notice/${notice.id}`}
                        editUrl={`/admin/notice/${notice.id}/edit`}
                        onDelete={() => handleDeleteNotice(notice.id)}
                        isDeleting={isDeleting === notice.id.toString()}
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

      {/* Pagination */}
      {renderPagination()}

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
