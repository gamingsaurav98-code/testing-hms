"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { incomeTypeApi, IncomeTypeModel, ApiError } from '@/lib/api/index';
import { 
  Button, 
  SearchBar, 
  ConfirmModal, 
  SuccessToast, 
  TableSkeleton,
  ActionButtons 
} from '@/components/ui';
import { Plus } from 'lucide-react';

export default function IncomeTypeList() {
  const router = useRouter();
  const [incomeTypes, setIncomeTypes] = useState<IncomeTypeModel[]>([]);
  const [filteredIncomeTypes, setFilteredIncomeTypes] = useState<IncomeTypeModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, typeId: string | null}>({
    show: false,
    typeId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch income types from API
  useEffect(() => {
    const fetchIncomeTypes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await incomeTypeApi.getAllIncomeTypes();
        setIncomeTypes(response);
        setFilteredIncomeTypes(response);
      } catch (error) {
        console.error('Error fetching income types:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch Income Types: ${error.message}`);
        } else {
          setError('Failed to fetch Income Types. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncomeTypes();
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredIncomeTypes(incomeTypes);
    } else {
      const filtered = incomeTypes.filter(type =>
        type.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredIncomeTypes(filtered);
    }
  }, [searchQuery, incomeTypes]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const handleDeleteIncomeType = async (typeId: string) => {
    try {
      setIsDeleting(typeId);
      await incomeTypeApi.deleteIncomeType(typeId);
      
      // Remove from state
      setIncomeTypes(prev => prev.filter(t => t.id !== typeId));
      setFilteredIncomeTypes(prev => prev.filter(t => t.id !== typeId));
      
      setAlert({
        show: true,
        message: 'Income Type deleted successfully',
        type: 'success'
      });
      
      setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
    } catch (error) {
      console.error('Error deleting income type:', error);
      setAlert({
        show: true,
        message: error instanceof ApiError ? error.message : 'Failed to delete Income Type',
        type: 'error'
      });
      
      setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setIsDeleting(null);
      setDeleteModal({ show: false, typeId: null });
    }
  };

  const confirmDelete = (typeId: string) => {
    setDeleteModal({ show: true, typeId });
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, typeId: null });
  };

  return (
    <div className="p-4">
      {/* Success/Error Alert */}
      {alert.show && alert.type === 'success' && (
        <SuccessToast 
          show={alert.show}
          message={alert.message}
          progress={100}
          onClose={() => setAlert({ show: false, message: '', type: 'success' })}
        />
      )}
      {alert.show && alert.type === 'error' && (
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

      {/* Header with balanced spacing */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payment Purposes</h1>
          <p className="text-sm text-gray-600">{incomeTypes.length} total payment purposes</p>
        </div>
        <Button
          onClick={() => router.push('/admin/income-type/create')}
          icon={<Plus className="w-4 h-4" />}
          className="bg-[#235999] hover:bg-[#1e4d87]"
        >
          Add Payment Purpose
        </Button>
      </div>

      {/* Compact Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search payment purposes..."
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
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
      ) : filteredIncomeTypes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment purposes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating a new payment purpose'}
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <Button
                onClick={() => router.push('/admin/income-type/create')}
                icon={<Plus className="w-4 h-4" />}
                className="bg-[#235999] hover:bg-[#1e4d87]"
              >
                Add Payment Purpose
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncomeTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{type.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {type.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(type.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-end">
                        <ActionButtons
                          onView={() => router.push(`/admin/income-type/${type.id}`)}
                          onEdit={() => router.push(`/admin/income-type/${type.id}/edit`)}
                          onDelete={() => confirmDelete(type.id)}
                          isDeleting={isDeleting === type.id}
                          style="compact"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Payment Purpose"
        message="Are you sure you want to delete this payment purpose? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => deleteModal.typeId && handleDeleteIncomeType(deleteModal.typeId)}
        onCancel={cancelDelete}
        variant="danger"
      />
    </div>
  );
}
