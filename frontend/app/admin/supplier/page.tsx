"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supplierApi, Supplier, ApiError } from '@/lib/api/index';
import { 
  Button, 
  SearchBar, 
  ConfirmModal, 
  SuccessToast, 
  TableSkeleton,
  ActionButtons 
} from '@/components/ui';

export default function SupplierList() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, supplierId: string | null}>({
    show: false,
    supplierId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch suppliers from API
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await supplierApi.getSuppliers(currentPage);
        setSuppliers(response.data);
        setFilteredSuppliers(response.data);
        setTotalPages(response.last_page);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch suppliers: ${error.message}`);
        } else {
          setError('Failed to fetch suppliers. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [currentPage]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        supplier.contact_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchQuery, suppliers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    setDeleteModal({show: true, supplierId});
  };

  const confirmDelete = async () => {
    const supplierId = deleteModal.supplierId;
    if (!supplierId) return;

    try {
      setIsDeleting(supplierId);
      setDeleteModal({show: false, supplierId: null});
      setAlert({show: true, message: 'Deleting supplier...', type: 'success'});
      
      await supplierApi.deleteSupplier(supplierId);
      
      // Remove from local state
      const updatedSuppliers = suppliers.filter(supplier => supplier.id !== supplierId);
      setSuppliers(updatedSuppliers);
      setFilteredSuppliers(updatedSuppliers.filter(supplier =>
        !searchQuery.trim() ||
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        supplier.contact_number.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
      setAlert({show: true, message: 'Supplier deleted successfully!', type: 'success'});
      
      // Hide alert after 2 seconds - optimized for faster UX
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting supplier:', error);
      if (error instanceof ApiError) {
        setAlert({show: true, message: `Failed to delete supplier: ${error.message}`, type: 'error'});
      } else {
        setAlert({show: true, message: 'Failed to delete supplier. Please try again.', type: 'error'});
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
    setDeleteModal({show: false, supplierId: null});
  };

  const getBalanceTypeDisplay = (type?: string) => {
    if (type === 'due') return 'Due (Payable)';
    if (type === 'advance') return 'Advance (Receivable)';
    return 'Not Set';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Loading suppliers...</p>
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
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
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
          <h1 className="text-xl font-medium text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">{suppliers.length} total suppliers</p>
        </div>
        <Button
          onClick={() => router.push('/admin/supplier/create')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>}
          className="bg-[#235999] hover:bg-[#1e4d87]"
        >
          Add Supplier
        </Button>
      </div>

      {/* Compact Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search suppliers..."
        />
      </div>

      {/* Clean List View */}
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery ? 'No suppliers found' : 'No suppliers yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first supplier to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => router.push('/admin/supplier/create')}
              className="bg-[#235999] hover:bg-[#1e4d87]"
            >
              Create Supplier
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">PAN Number</div>
              <div className="col-span-2">Balance</div>
              <div className="col-span-1 text-center pr-2">Created</div>
              <div className="col-span-2 text-center pl-2">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Supplier Details */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-gray-900">{supplier.name}</div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {supplier.email || 'No email provided'}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-700">{supplier.contact_number}</div>
                  </div>

                  {/* PAN Number */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-700">{supplier.pan_number || 'Not provided'}</div>
                  </div>

                  {/* Balance */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-700">
                      <span className={
                        supplier.balance_type === 'due'
                          ? 'text-orange-600'
                          : supplier.balance_type === 'advance'
                            ? 'text-green-600'
                            : 'text-gray-600'
                      }>
                        {supplier.opening_balance ? `Rs. ${supplier.opening_balance}` : 'Rs. 0'} 
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        ({getBalanceTypeDisplay(supplier.balance_type)})
                      </span>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="col-span-1">
                    <div className="text-xs text-gray-500 text-center pr-2">
                      {formatDate(supplier.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2">
                    <div className="pl-2 flex justify-center">
                      <ActionButtons 
                        viewUrl={`/admin/supplier/${supplier.id}`}
                        editUrl={`/admin/supplier/${supplier.id}/edit`}
                        onDelete={() => handleDeleteSupplier(supplier.id)}
                        isDeleting={isDeleting === supplier.id}
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
      {filteredSuppliers.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {filteredSuppliers.length} of {suppliers.length} suppliers
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}
