"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supplierApi, Supplier, ApiError } from '@/lib/api/index';
import { Button, ConfirmModal, TableSkeleton, SuccessToast } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';

export default function SupplierDetail() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteAttachmentModalOpen, setDeleteAttachmentModalOpen] = useState(false);
  const [attachmentIdToDelete, setAttachmentIdToDelete] = useState<string>('');
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch supplier data
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const supplierData = await supplierApi.getSupplier(supplierId);
        setSupplier(supplierData);
        
      } catch (error) {
        console.error('Error fetching supplier:', error);
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setError(`Supplier with ID ${supplierId} not found. It may have been deleted or the ID is incorrect.`);
          } else {
            setError(`Failed to load supplier: ${error.message}`);
          }
        } else {
          setError('Failed to load supplier data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  const [deleteModal, setDeleteModal] = useState<boolean>(false);

  const handleDeleteClick = () => {
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await supplierApi.deleteSupplier(supplierId);
      
      // Redirect to suppliers list after successful deletion
      router.push('/admin/supplier');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      if (error instanceof ApiError) {
        setAlert({
          show: true,
          message: `Failed to delete supplier: ${error.message}`,
          type: 'error'
        });
      } else {
        setAlert({
          show: true,
          message: 'Failed to delete supplier. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteModal(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadName || !uploadType) return;
    
    try {
      setIsUploading(true);
      await supplierApi.uploadAttachment(supplierId, selectedFile, uploadName, uploadType);
      
      // Refresh data
      const updatedSupplier = await supplierApi.getSupplier(supplierId);
      setSupplier(updatedSupplier);
      
      // Reset form
      setSelectedFile(null);
      setUploadName('');
      setUploadType('');
      setUploadModalOpen(false);
      
      // Show success message
      setAlert({
        show: true,
        message: 'Attachment uploaded successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        setAlert({ show: false, message: '', type: 'success' });
      }, 3000);
      
    } catch (error) {
      console.error('Error uploading attachment:', error);
      if (error instanceof ApiError) {
        setAlert({
          show: true,
          message: `Failed to upload attachment: ${error.message}`,
          type: 'error'
        });
      } else {
        setAlert({
          show: true,
          message: 'Failed to upload attachment. Please try again.',
          type: 'error'
        });
      }
      
      setTimeout(() => {
        setAlert({ show: false, message: '', type: 'success' });
      }, 5000);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleEditAttachment = (attachment: any) => {
    setSelectedAttachment(attachment);
    setUploadName(attachment.name);
    setUploadType(attachment.type);
    setSelectedFile(null);
    setEditModalOpen(true);
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttachment) return;
    
    try {
      setIsUploading(true);
      
      const data: { file?: File, name?: string, type?: string } = {};
      
      if (uploadName !== selectedAttachment.name) {
        data.name = uploadName;
      }
      
      if (uploadType !== selectedAttachment.type) {
        data.type = uploadType;
      }
      
      if (selectedFile) {
        data.file = selectedFile;
      }
      
      await supplierApi.updateAttachment(supplierId, selectedAttachment.id.toString(), data);
      
      // Refresh data
      const updatedSupplier = await supplierApi.getSupplier(supplierId);
      setSupplier(updatedSupplier);
      
      // Reset form
      setSelectedFile(null);
      setUploadName('');
      setUploadType('');
      setSelectedAttachment(null);
      setEditModalOpen(false);
      
      // Show success message
      setAlert({
        show: true,
        message: 'Attachment updated successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        setAlert({ show: false, message: '', type: 'success' });
      }, 3000);
      
    } catch (error) {
      console.error('Error updating attachment:', error);
      if (error instanceof ApiError) {
        setAlert({
          show: true,
          message: `Failed to update attachment: ${error.message}`,
          type: 'error'
        });
      } else {
        setAlert({
          show: true,
          message: 'Failed to update attachment. Please try again.',
          type: 'error'
        });
      }
      
      setTimeout(() => {
        setAlert({ show: false, message: '', type: 'success' });
      }, 5000);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachmentIdToDelete(attachmentId);
    setDeleteAttachmentModalOpen(true);
  };
  
  const confirmDeleteAttachment = async () => {
    if (!attachmentIdToDelete) return;
    
    try {
      setIsUploading(true);
      await supplierApi.deleteAttachment(supplierId, attachmentIdToDelete);
      
      // Refresh data
      const updatedSupplier = await supplierApi.getSupplier(supplierId);
      setSupplier(updatedSupplier);
      
      // Reset state
      setAttachmentIdToDelete('');
      setDeleteAttachmentModalOpen(false);
      
      // Show success message
      setAlert({
        show: true,
        message: 'Attachment deleted successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        setAlert({ show: false, message: '', type: 'success' });
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting attachment:', error);
      if (error instanceof ApiError) {
        setAlert({
          show: true,
          message: `Failed to delete attachment: ${error.message}`,
          type: 'error'
        });
      } else {
        setAlert({
          show: true,
          message: 'Failed to delete attachment. Please try again.',
          type: 'error'
        });
      }
      
      setTimeout(() => {
        setAlert({ show: false, message: '', type: 'success' });
      }, 5000);
    } finally {
      setIsUploading(false);
    }
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
          <h1 className="text-xl font-medium text-gray-900">Supplier Details</h1>
          <p className="text-sm text-gray-500 mt-1">Loading supplier details...</p>
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
          <div className="mt-3 space-x-2">
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              size="sm"
            >
              Retry
            </Button>
            <Button
              onClick={() => router.push('/admin/supplier')}
              variant="ghost"
              size="sm"
            >
              Back to Suppliers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Supplier not found</p>
          <button
            onClick={() => router.push('/admin/supplier')}
            className="mt-2 text-[#235999] hover:text-[#1e4d87]"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={isDeleting}
        variant="danger"
      />
      
      {/* File Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Attachment</h3>
              <form onSubmit={handleUploadSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="upload-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input 
                      type="text"
                      id="upload-name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="upload-type" className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <select
                      id="upload-type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      required
                    >
                      <option value="">Select type...</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Contract">Contract</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Agreement">Agreement</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="attachment-file" className="block text-sm font-medium text-gray-700 mb-1">
                      File
                    </label>
                    <input 
                      type="file"
                      id="attachment-file"
                      className="w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#235999] rounded-md hover:bg-[#1e4d87]"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Attachment Modal */}
      {editModalOpen && selectedAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Attachment</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input 
                      type="text"
                      id="edit-name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <select
                      id="edit-type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      required
                    >
                      <option value="">Select type...</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Contract">Contract</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Agreement">Agreement</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-attachment-file" className="block text-sm font-medium text-gray-700 mb-1">
                      Replace File (optional)
                    </label>
                    <input 
                      type="file"
                      id="edit-attachment-file"
                      className="w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                      onChange={handleFileChange}
                    />
                    <p className="mt-1 text-xs text-gray-500">Current file: {selectedAttachment.path.split('/').pop()}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setSelectedAttachment(null);
                      setUploadName('');
                      setUploadType('');
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#235999] rounded-md hover:bg-[#1e4d87]"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Attachment Confirmation Modal */}
      {deleteAttachmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Attachment</h3>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this attachment? This action cannot be undone.</p>
              
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDeleteAttachmentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAttachment}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  disabled={isUploading}
                >
                  {isUploading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{supplier.name}</h1>
              {supplier.email && (
                <p className="text-sm text-gray-500">{supplier.email}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setUploadModalOpen(true)}
                variant="secondary"
              >
                Upload Attachment
              </Button>
              <Button
                onClick={() => router.push(`/admin/supplier/${supplier.id}/edit`)}
                variant="primary"
              >
                Edit Supplier
              </Button>
              <Button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                variant="danger"
                loading={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-medium text-[#235999]">Basic Information</h3>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">Name</h4>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{supplier.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">Contact</h4>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{supplier.contact_number}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">Email</h4>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{supplier.email || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">Address</h4>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{supplier.address}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">PAN</h4>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{supplier.pan_number || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">Current Balance</h4>
                  </div>
                  <div className="col-span-2">
                    <p className={`text-sm px-3 py-1 inline-block rounded-full ${
                      supplier.balance_type === 'due'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      NPR {supplier.opening_balance || '0.00'} ({supplier.balance_type === 'due' ? 'Due' : 'Advance'})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transaction Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-medium text-[#235999]">Transaction Summary</h3>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">Total Purchases</h4>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-900">
                      NPR {supplier.financials?.reduce((acc, f) => acc + parseFloat(f.amount || 0), 0).toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">Total Payments</h4>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-900">
                      NPR {supplier.supplierPayments?.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0).toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 py-2">
                  <div className="col-span-1">
                    <h4 className="text-sm font-medium text-gray-700">Last Transaction</h4>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">
                      {supplier.financials && supplier.financials.length > 0 
                        ? `${formatDate(supplier.financials[0].payment_date)} (${getDaysAgo(supplier.financials[0].payment_date)})`
                        : 'No transactions yet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        {supplier.attachments && supplier.attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplier.attachments.map((attachment) => (
                <div key={attachment.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4">
                    <p className="font-medium text-gray-900">{attachment.name}</p>
                    <p className="text-sm text-gray-500">{attachment.type}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <a 
                        href={getImageUrl(attachment.path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#235999] hover:text-[#1e4d87] text-sm"
                      >
                        View Attachment
                      </a>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditAttachment(attachment)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id.toString())}
                          className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Transaction History - Placeholder for future implementation */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          <p className="text-gray-500 italic">Transaction history will be displayed here in future updates.</p>
        </div>

        {/* Metadata */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Created:</span>
              <span className="ml-2 text-gray-900">{formatDate(supplier.created_at)}</span>
            </div>
            {supplier.updated_at && (
              <div>
                <span className="font-medium text-gray-500">Last Updated:</span>
                <span className="ml-2 text-gray-900">{formatDate(supplier.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} // End of component
