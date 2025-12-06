'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StudentCheckInCheckOut, studentCheckInCheckOutApi } from '@/lib/api/student-checkincheckout.api';
import { StaffCheckInCheckOut, staffCheckInCheckOutApi } from '@/lib/api/staff-checkincheckout.api';
import { API_BASE_URL, handleResponse, safeFetch } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';
import { Button, ConfirmModal, ActionButtons } from '@/components/ui';
import {
  Plus,
  Search,
  Check,
  Clock,
  X
} from 'lucide-react';

// Unified type for both student and staff records
export type CheckInCheckOutRecord = (StudentCheckInCheckOut & { type: 'student' }) | (StaffCheckInCheckOut & { type: 'staff' });

export default function StudentCheckinCheckoutList() {
  const [filteredRecords, setFilteredRecords] = useState<CheckInCheckOutRecord[]>([]);
  const [allRecords, setAllRecords] = useState<CheckInCheckOutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    recordId: string | null;
    studentName: string;
  }>({
    show: false,
    recordId: null,
    studentName: ''
  });

  const fetchRecords = async (page: number = 1) => {
    try {
      setLoading(true);

      // Fetch both student and staff records in parallel
      const [studentResponse, staffResponse] = await Promise.all([
        studentCheckInCheckOutApi.getCheckInCheckOuts(page),
        staffCheckInCheckOutApi.getCheckInCheckOuts(page)
      ]);

      // Combine records with type indicators
      const studentRecords: CheckInCheckOutRecord[] = studentResponse.data.map(record => ({
        ...record,
        type: 'student' as const
      }));

      const staffRecords: CheckInCheckOutRecord[] = staffResponse.data.map(record => ({
        ...record,
        type: 'staff' as const
      }));

      // Combine and sort by most recent checkout first
      const combinedRecords = [...studentRecords, ...staffRecords].sort((a, b) => {
        const aTime = a.checkout_time || a.checkin_time || a.created_at;
        const bTime = b.checkout_time || b.checkin_time || b.created_at;
        return new Date(bTime || '').getTime() - new Date(aTime || '').getTime();
      });

      setAllRecords(combinedRecords);
      setFilteredRecords(combinedRecords);

      // For now, use the larger pagination count (simplified approach)
      const maxPages = Math.max(
        studentResponse.last_page || 1,
        staffResponse.last_page || 1
      );
      setTotalPages(maxPages);

    } catch (error) {
      console.error('Error fetching records:', error);
      setFilteredRecords([]);
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Live search effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(allRecords);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = allRecords.filter(record =>
        (record.type === 'student' && record.student?.student_name?.toLowerCase().includes(searchLower)) ||
        (record.type === 'staff' && record.staff?.staff_name?.toLowerCase().includes(searchLower))
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, allRecords]);

  useEffect(() => {
    fetchRecords(currentPage);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Live search handles filtering, no need to fetch again
  };

  const handleDelete = async () => {
    if (!deleteModal.recordId) return;

    try {
      // Determine the record type from the current records
      const recordToDelete = allRecords.find(record => record.id === deleteModal.recordId);
      if (!recordToDelete) return;

      // Use appropriate endpoint based on record type
      const endpoint = recordToDelete.type === 'student'
        ? `${API_BASE_URL}/student-checkincheckouts/${deleteModal.recordId}`
        : `${API_BASE_URL}/staff-checkincheckouts/${deleteModal.recordId}`;

      const response = await safeFetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      await handleResponse(response);
      setDeleteModal({ show: false, recordId: null, studentName: '' });
      fetchRecords(currentPage);
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const formatTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateTime: string | null | undefined) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDuration = (record: StudentCheckInCheckOut) => {
    if (!record.checkout_time) return '-';
    
    // Use actual check-in time if available, otherwise use estimated check-in time
    const endTime = record.checkin_time || record.estimated_checkin_date;
    if (!endTime) return '-';
    
    const checkout = new Date(record.checkout_time);
    const checkInOrEstimated = new Date(endTime);
    const diffMs = checkInOrEstimated.getTime() - checkout.getTime();
    
    // Handle negative duration (if checkout is after check-in/estimated time)
    const absDiffMs = Math.abs(diffMs);
    const diffDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getStatusBadge = (record: StudentCheckInCheckOut) => {
    // Check admin approval status first
    if (record.status === 'approved') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Approved
        </span>
      );
    } else if (record.status === 'declined') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="w-3 h-3 mr-1" />
          Declined
        </span>
      );
    } else if (record.status === 'pending') {
      // Differentiate between pending checkout and pending check-in
      if (record.checkout_time && record.checkin_time) {
        // Both times exist - this is a pending check-in approval
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending In
          </span>
        );
      } else if (record.checkout_time) {
        // Only checkout time exists - this is a pending checkout approval
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Out
          </span>
        );
      } else {
        // Generic pending
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      }
    } else if (record.checkout_time && record.checkin_time) {
      // If both checkout and checkin exist and status is not pending/approved/declined
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Complete
        </span>
      );
    } else if (record.checkout_time) {
      // Only checkout exists
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="w-3 h-3 mr-1" />
          Checked Out
        </span>
      );
    } else if (record.checkin_time) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          Checked In
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <X className="w-3 h-3 mr-1" />
          Draft
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Check-in/Check-out Management</h1>
          <Link href="/admin/student-checkin-checkout/create">
            <Button
              className="bg-[#235999] hover:bg-[#1e4d87] text-white"
              icon={<Plus className="w-4 h-4" />}
            >
              Add New Record
            </Button>
          </Link>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSearch} className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-600 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 outline-none transition-all duration-200 bg-white"
            />
          </div>
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Checkout Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Check-in Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? `No records found matching "${searchTerm}"` : 'No check-in/check-out records found.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.type === 'student'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {record.type === 'student' ? 'Student' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.type === 'student'
                          ? (record.student?.student_name || 'N/A')
                          : (record.staff?.staff_name || 'N/A')
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.block?.block_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-500">
                          {formatDate(record.checkout_time)}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatTime(record.checkout_time)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.estimated_checkin_date ? formatDate(record.estimated_checkin_date) : 'Not set'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-500">
                          {formatDate(record.checkin_time)}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatTime(record.checkin_time)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {calculateDuration(record)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <ActionButtons
                        viewUrl={`/admin/${record.type}-checkin-checkout/${record.id}`}
                        editUrl={`/admin/${record.type}-checkin-checkout/${record.id}/edit`}
                        onDelete={() => setDeleteModal({
                          show: true,
                          recordId: record.id,
                          studentName: record.type === 'student'
                            ? (record.student?.student_name || 'Unknown')
                            : (record.staff?.staff_name || 'Unknown')
                        })}
                        style="compact"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        onCancel={() => setDeleteModal({ show: false, recordId: null, studentName: '' })}
        onConfirm={handleDelete}
        title="Delete Check-in/Check-out Record"
        message={`Are you sure you want to delete the check-in/check-out record for ${deleteModal.studentName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
