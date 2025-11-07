'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { staffCheckInCheckOutApi, StaffCheckInCheckOut } from '@/lib/api/staff-checkincheckout.api';
import { PaginatedResponse } from '@/lib/api/core';
import { Button, ConfirmModal, ActionButtons } from '@/components/ui';
import { 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  Search,
  Check,
  Clock,
  X,
  Eye,
  Edit,
  Trash
} from 'lucide-react';

export default function StaffCheckinCheckoutList() {
  const [records, setRecords] = useState<StaffCheckInCheckOut[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StaffCheckInCheckOut[]>([]);
  const [allRecords, setAllRecords] = useState<StaffCheckInCheckOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    recordId: string | null;
    staffName: string;
  }>({
    show: false,
    recordId: null,
    staffName: ''
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRecords = async (page: number = 1) => {
    try {
      setLoading(true);
      const response: PaginatedResponse<StaffCheckInCheckOut> = await staffCheckInCheckOutApi.getCheckInCheckOuts(page, { all: true });
      
      const fetchedRecords = response.data || [];
      setAllRecords(fetchedRecords);
      setRecords(fetchedRecords);
      setFilteredRecords(fetchedRecords);
      
      // Set pagination info from PaginatedResponse structure
      if (response.last_page) {
        setTotalPages(response.last_page);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecords([]);
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
        record.staff?.staff_name?.toLowerCase().includes(searchLower)
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
      await staffCheckInCheckOutApi.deleteCheckInCheckOut(deleteModal.recordId);
      setDeleteModal({ show: false, recordId: null, staffName: '' });
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

  const calculateDuration = (record: StaffCheckInCheckOut) => {
    if (!record.checkout_time) return '-';
    
    // If staff has checked in, calculate actual duration between checkout and checkin
    if (record.checkin_time) {
      const checkout = new Date(record.checkout_time);
      const checkin = new Date(record.checkin_time);
      const diffMs = checkin.getTime() - checkout.getTime();
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
      } else if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else {
        return `${diffMinutes}m`;
      }
    }
    
    // If not checked in yet, calculate estimated duration between checkout and estimated checkin
    if (record.estimated_checkin_date) {
      const checkout = new Date(record.checkout_time);
      const estimated = new Date(record.estimated_checkin_date);
      const diffMs = estimated.getTime() - checkout.getTime();
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h ${diffMinutes}m (est.)`;
      } else if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m (est.)`;
      } else {
        return `${diffMinutes}m (est.)`;
      }
    }
    
    return '-';
  };

  const getStatusBadge = (record: StaffCheckInCheckOut) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Check-in/Check-out</h1>
          <Link href="/admin/staff-checkin-checkout/create">
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
              placeholder="Search by staff name..."
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
                  Staff Name
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
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? `No staff found matching "${searchTerm}"` : 'No check-in/check-out records found.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.staff?.staff_name || 'N/A'}
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
                        viewUrl={`/admin/staff-checkin-checkout/${record.id}`}
                        editUrl={`/admin/staff-checkin-checkout/${record.id}/edit`}
                        onDelete={() => setDeleteModal({
                          show: true,
                          recordId: record.id,
                          staffName: record.staff?.staff_name || 'Unknown'
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
        onCancel={() => setDeleteModal({ show: false, recordId: null, staffName: '' })}
        onConfirm={handleDelete}
        title="Delete Check-in/Check-out Record"
        message={`Are you sure you want to delete the check-in/check-out record for ${deleteModal.staffName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
