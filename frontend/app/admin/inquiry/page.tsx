"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { inquiryApi, Inquiry, ApiError } from '@/lib/api/index';
import { 
  Button, 
  SearchBar, 
  ConfirmModal, 
  SuccessToast, 
  TableSkeleton,
  ActionButtons 
} from '@/components/ui';

export default function InquiryList() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, inquiryId: string | null}>({
    show: false,
    inquiryId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch inquiries from API
  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await inquiryApi.getInquiries(currentPage);
        setInquiries(response.data);
        setFilteredInquiries(response.data);
        setTotalPages(response.last_page);
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch inquiries: ${error.message}`);
        } else {
          setError('Failed to fetch inquiries. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiries();
  }, [currentPage]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInquiries(inquiries);
    } else {
      const filtered = inquiries.filter(inquiry =>
        inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inquiry.email && inquiry.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inquiry.block?.block_name && inquiry.block.block_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredInquiries(filtered);
    }
  }, [searchQuery, inquiries]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    setDeleteModal({show: true, inquiryId});
  };

  const confirmDelete = async () => {
    const inquiryId = deleteModal.inquiryId;
    if (!inquiryId) return;

    try {
      setIsDeleting(inquiryId);
      setDeleteModal({show: false, inquiryId: null});
      setAlert({show: true, message: 'Deleting inquiry...', type: 'success'});
      
      await inquiryApi.deleteInquiry(inquiryId);
      
      // Remove from local state
      const updatedInquiries = inquiries.filter(inquiry => inquiry.id !== inquiryId);
      setInquiries(updatedInquiries);
      setFilteredInquiries(updatedInquiries.filter(inquiry =>
        !searchQuery.trim() ||
        inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inquiry.email && inquiry.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inquiry.block?.block_name && inquiry.block.block_name.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
      
      setAlert({show: true, message: 'Inquiry deleted successfully!', type: 'success'});
      
      // Hide alert after 3 seconds
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      if (error instanceof ApiError) {
        setAlert({show: true, message: `Failed to delete inquiry: ${error.message}`, type: 'error'});
      } else {
        setAlert({show: true, message: 'Failed to delete inquiry. Please try again.', type: 'error'});
      }
      
      // Hide error alert after 5 seconds
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 5000);
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({show: false, inquiryId: null});
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Inquiries</h1>
          <p className="text-sm text-gray-500 mt-1">Loading inquiries...</p>
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
        title="Delete Inquiry"
        message="Are you sure you want to delete this inquiry? This action cannot be undone."
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
          <h1 className="text-xl font-medium text-gray-900">Inquiries</h1>
          <p className="text-sm text-gray-500 mt-1">{inquiries.length} total inquiries</p>
        </div>
        <Button
          onClick={() => router.push('/admin/inquiry/create')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>}
          className="bg-[#235999] hover:bg-[#1e4d87]"
        >
          Add Inquiry
        </Button>
      </div>

      {/* Compact Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search inquiries..."
        />
      </div>

      {/* Clean List View */}
      {filteredInquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery ? 'No inquiries found' : 'No inquiries yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first inquiry to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => router.push('/admin/inquiry/create')}
              className="bg-[#235999] hover:bg-[#1e4d87]"
            >
              Create Inquiry
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Inquiry Details</div>
              <div className="col-span-2">Contact Info</div>
              <div className="col-span-2">Block</div>
              <div className="col-span-2">Seater</div>
              <div className="col-span-1 text-center">Rooms</div>
              <div className="col-span-1 text-center">Created</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredInquiries.map((inquiry) => (
              <div key={inquiry.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Inquiry Details */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-gray-900">{inquiry.name}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {inquiry.description || 'No description'}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900">{inquiry.phone}</div>
                    {inquiry.email && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {inquiry.email}
                      </div>
                    )}
                  </div>

                  {/* Block */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900">
                      {inquiry.block?.block_name || '-'}
                    </div>
                  </div>

                  {/* Seater */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-700">
                      {inquiry.seater ? `${inquiry.seater}-seater` : 'Not specified'}
                    </div>
                  </div>

                  {/* Rooms Count */}
                  <div className="col-span-1">
                    <div className="text-xs text-gray-500 text-center">
                      {inquiry.inquirySeaters?.length || 0} room(s)
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="col-span-1">
                    <div className="text-xs text-gray-500 text-center">
                      {formatDate(inquiry.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex justify-center">
                      <ActionButtons 
                        viewUrl={`/admin/inquiry/${inquiry.id}`}
                        editUrl={`/admin/inquiry/${inquiry.id}/edit`}
                        onDelete={() => handleDeleteInquiry(inquiry.id)}
                        isDeleting={isDeleting === inquiry.id}
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
      {filteredInquiries.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {filteredInquiries.length} of {inquiries.length} inquiries
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}
