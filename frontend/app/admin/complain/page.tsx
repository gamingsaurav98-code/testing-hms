"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { complainApi, Complain } from '@/lib/api/complain.api';
import { ApiError } from '@/lib/api/core';
import { 
  Button, 
  SearchBar, 
  ConfirmModal, 
  SuccessToast, 
  TableSkeleton,
  ActionButtons 
} from '@/components/ui';

export default function ComplainList() {
  const router = useRouter();
  const [complains, setComplains] = useState<Complain[]>([]);
  const [filteredComplains, setFilteredComplains] = useState<Complain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, complainId: string | null}>({
    show: false,
    complainId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch complains from API
  useEffect(() => {
    const fetchComplains = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await complainApi.getComplains(currentPage);
        setComplains(response.data);
        setFilteredComplains(response.data);
        setTotalPages(response.last_page);
      } catch (error) {
        console.error('Error fetching complains:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch complains: ${error.message}`);
        } else {
          setError('Failed to fetch complains. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplains();
  }, [currentPage]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredComplains(complains);
    } else {
      const filtered = complains.filter(complain =>
        complain.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complain.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complain.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complain.student?.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complain.staff?.staff_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredComplains(filtered);
    }
  }, [searchQuery, complains]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const handleDeleteComplain = async (complainId: string) => {
    setDeleteModal({show: true, complainId});
  };

  const confirmDelete = async () => {
    const complainId = deleteModal.complainId;
    if (!complainId) return;

    try {
      setIsDeleting(complainId);
      setDeleteModal({show: false, complainId: null});
      setAlert({show: true, message: 'Deleting complain...', type: 'success'});
      
      await complainApi.deleteComplain(complainId);
      
      // Remove from local state
      const updatedComplains = complains.filter(complain => complain.id !== parseInt(complainId));
      setComplains(updatedComplains);
      setFilteredComplains(updatedComplains.filter(complain =>
        !searchQuery.trim() ||
        complain.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complain.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complain.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complain.student?.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complain.staff?.staff_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
      setAlert({show: true, message: 'Complain deleted successfully!', type: 'success'});
      
      // Hide alert after 2 seconds - optimized
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting complain:', error);
      if (error instanceof ApiError) {
        setAlert({show: true, message: `Failed to delete complain: ${error.message}`, type: 'error'});
      } else {
        setAlert({show: true, message: 'Failed to delete complain. Please try again.', type: 'error'});
      }
      
      // Hide error alert after 3 seconds - optimized
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 3000);
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({show: false, complainId: null});
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Complains</h1>
          <p className="text-sm text-gray-500 mt-1">Loading complains...</p>
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
        title="Delete Complain"
        message="Are you sure you want to delete this complain? This action cannot be undone and will also delete all chat messages."
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
          <h1 className="text-xl font-medium text-gray-900">Complains</h1>
          <p className="text-sm text-gray-500 mt-1">{complains.length} total complains</p>
        </div>
      </div>

      {/* Compact Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search complains..."
        />
      </div>

      {/* Clean List View */}
      {filteredComplains.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery ? 'No complains found' : 'No complains yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'No complaints have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Complain By</div>
              <div className="col-span-4">Complain Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredComplains.map((complain) => (
              <div key={complain.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Complain By */}
                  <div className="col-span-3">
                    {complain.student && (
                      <div>
                        <div className="text-sm text-gray-900">{complain.student.student_name}</div>
                        <div className="text-xs text-gray-500">Student</div>
                      </div>
                    )}
                    {complain.staff && (
                      <div>
                        <div className="text-sm text-gray-900">{complain.staff.staff_name}</div>
                        <div className="text-xs text-gray-500">Staff</div>
                      </div>
                    )}
                    {!complain.student && !complain.staff && (
                      <span className="text-xs text-gray-400">Unknown</span>
                    )}
                  </div>

                  {/* Complain Details */}
                  <div className="col-span-4">
                    <div className="font-medium text-sm text-gray-900">
                      {complain.title.length > 50 ? `${complain.title.substring(0, 50)}...` : complain.title}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    {getStatusBadge(complain.status)}
                  </div>

                  {/* Date */}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">
                      {formatDate(complain.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <ActionButtons 
                      viewUrl={`/admin/complain/${complain.id}`}
                      onDelete={() => handleDeleteComplain(complain.id.toString())}
                      isDeleting={isDeleting === complain.id.toString()}
                      style="compact"
                      hideEdit={true}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      {filteredComplains.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {filteredComplains.length} of {complains.length} complains
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}
