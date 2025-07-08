"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { inquiryApi, Inquiry, ApiError, InquiryAttachment } from '@/lib/api/index';
import { TableSkeleton, Button, ConfirmModal, SuccessToast } from '@/components/ui';
import Image from 'next/image';

export default function InquiryDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, attachmentId: string | null}>({
    show: false,
    attachmentId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        setIsLoading(true);
        const data = await inquiryApi.getInquiry(params.id);
        setInquiry(data);
      } catch (error) {
        console.error('Error fetching inquiry:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch inquiry: ${error.message}`);
        } else {
          setError('Failed to fetch inquiry data. Please try refreshing the page.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiry();
  }, [params.id]);

  const handleDeleteAttachment = (attachmentId: string) => {
    setDeleteModal({show: true, attachmentId});
  };

  const confirmDeleteAttachment = async () => {
    const attachmentId = deleteModal.attachmentId;
    if (!attachmentId || !inquiry) return;

    try {
      setIsDeleting(true);
      setDeleteModal({show: false, attachmentId: null});
      
      await inquiryApi.deleteAttachment(inquiry.id, attachmentId);
      
      // Remove from local state
      if (inquiry.attachments) {
        setInquiry({
          ...inquiry,
          attachments: inquiry.attachments.filter(a => a.id !== attachmentId)
        });
      }
      
      setAlert({show: true, message: 'Attachment deleted successfully!', type: 'success'});
      
      // Hide alert after 3 seconds
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setAlert({show: true, message: 'Failed to delete attachment. Please try again.', type: 'error'});
      
      // Hide error alert after 5 seconds
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteAttachment = () => {
    setDeleteModal({show: false, attachmentId: null});
  };

  const openImageModal = (path: string) => {
    setSelectedImage(path);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Inquiry Details</h1>
          <p className="text-sm text-gray-500 mt-1">Loading inquiry data...</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error || 'Inquiry not found'}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAttachment}
        onCancel={cancelDeleteAttachment}
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2">
            <button 
              onClick={closeImageModal} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
            <img 
              src={`/storage/${selectedImage}`} 
              alt="Attachment Preview" 
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Alert Notification */}
      {alert.show && (
        <SuccessToast
          show={alert.show}
          message={alert.message}
          progress={100}
          onClose={() => setAlert({show: false, message: '', type: 'success'})}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Inquiry Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Viewing inquiry from {inquiry.name} • Created on {formatDate(inquiry.created_at)}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => router.push(`/admin/inquiry/${params.id}/edit`)}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Edit Inquiry
          </Button>
          <Button
            onClick={() => router.push('/admin/inquiry')}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
          >
            Back to List
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Inquiry Info */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Inquiry Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dl className="divide-y divide-gray-200">
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Student Name</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{inquiry.name}</dd>
                </div>
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{inquiry.phone}</dd>
                </div>
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {inquiry.email || '-'}
                  </dd>
                </div>
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Seater Preference</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {inquiry.seater ? `${inquiry.seater}-seater` : 'Not specified'}
                  </dd>
                </div>
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{formatDate(inquiry.created_at)}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <dl className="divide-y divide-gray-200">
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Block</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {inquiry.block?.block_name || '-'}
                  </dd>
                </div>
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Block Location</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {inquiry.block?.location || '-'}
                  </dd>
                </div>
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Block Manager</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {inquiry.block?.manager_name || '-'}
                  </dd>
                </div>
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500">Manager Contact</dt>
                  <dd className="text-sm text-gray-900 col-span-2">
                    {inquiry.block?.manager_contact || '-'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {inquiry.description && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.description}</p>
            </div>
          )}
        </div>
        
        {/* Room Options */}
        <div className="px-6 py-5 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Room Options</h2>
          
          {inquiry.inquirySeaters && inquiry.inquirySeaters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beds Required
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inquiry.inquirySeaters.map((seater) => (
                    <tr key={seater.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {seater.room?.room_name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {seater.room?.capacity || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {seater.capacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No specific room options were selected for this inquiry.
            </div>
          )}
        </div>
        
        {/* Attachments */}
        <div className="px-6 py-5 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
          
          {inquiry.attachments && inquiry.attachments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inquiry.attachments.map((attachment) => (
                <div key={attachment.id} className="border rounded-lg overflow-hidden bg-gray-50">
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 truncate">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{attachment.file_name}</h3>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024 / 1024).toFixed(2)} MB • {attachment.file_type}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200">
                    {isImageFile(attachment.file_type) ? (
                      <div className="h-32 bg-gray-100 relative">
                        <button
                          className="w-full h-full flex items-center justify-center cursor-pointer"
                          onClick={() => openImageModal(attachment.file_path)}
                        >
                          <img
                            src={`/storage/${attachment.file_path}`}
                            alt={attachment.file_name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </button>
                      </div>
                    ) : (
                      <div className="h-32 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <a
                            href={`/storage/${attachment.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No attachments were uploaded for this inquiry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to check if file is an image
function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/');
}
