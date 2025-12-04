"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { complainApi, Complain } from '@/lib/api/complain.api';
import { ApiError } from '@/lib/api/core';
import { Button, ConfirmModal, TableSkeleton, ImageModal } from '@/components/ui';
import ChatInterface from '@/components/ui/ChatInterface';
import { ChevronDown } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

export default function ComplainDetail() {
  const router = useRouter();
  const params = useParams();
  const complainId = params.id as string;

  const [complain, setComplain] = useState<Complain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch complain data
  useEffect(() => {
    const fetchComplain = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const complainData = await complainApi.getComplain(complainId);
        setComplain(complainData);
        
      } catch (error) {
        console.error('Error fetching complain:', error);
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setError(`Complain with ID ${complainId} not found. It may have been deleted or the ID is incorrect.`);
          } else {
            setError(`Failed to load complain: ${error.message}`);
          }
        } else {
          setError('Failed to load complain data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (complainId) {
      fetchComplain();
    }
  }, [complainId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const [deleteModal, setDeleteModal] = useState<boolean>(false);

  const handleDeleteClick = () => {
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await complainApi.deleteComplain(complainId);
      
      // Redirect to complains list after successful deletion
      router.push('/admin/complain');
    } catch (error) {
      console.error('Error deleting complain:', error);
      if (error instanceof ApiError) {
        alert(`Failed to delete complain: ${error.message}`);
      } else {
        alert('Failed to delete complain. Please try again.');
      }
    } finally {
      setIsDeleting(false);
      setDeleteModal(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!complain) return;
    
    try {
      setStatusUpdating(true);
      await complainApi.updateComplain(complainId, {
        title: complain.title,
        description: complain.description,
        student_id: complain.student_id,
        staff_id: complain.staff_id,
        status: newStatus as any
      });
      
      // Update local state
      setComplain({
        ...complain,
        status: newStatus as any
      });
      
    } catch (error) {
      console.error('Error updating status:', error);
      if (error instanceof ApiError) {
        alert(`Failed to update status: ${error.message}`);
      } else {
        alert('Failed to update status. Please try again.');
      }
    } finally {
      setStatusUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Complain Details</h1>
          <p className="text-sm text-gray-500 mt-1">Loading complain details...</p>
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
          </div>
        </div>
      </div>
    );
  }

  if (!complain) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Complain not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal}
        title="Delete Complain"
        message="Are you sure you want to delete this complain? This action cannot be undone and will also delete all chat messages."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{complain.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                  {getStatusBadge(complain.status)}
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{formatDate(complain.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Status Update Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <span>Update Status</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown menu */}
                {showStatusDropdown && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                    {['pending', 'in_progress', 'resolved'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          handleStatusUpdate(status);
                          setShowStatusDropdown(false);
                        }}
                        disabled={statusUpdating || complain.status === status}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          complain.status === status
                            ? 'bg-blue-50 text-blue-700 cursor-not-allowed font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        } ${statusUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                        {complain.status === status && <span className="text-xs ml-2">✓ Current</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                variant="danger"
                size="sm"
                loading={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Complain"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Left Sidebar - Complain Details */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden" style={{height: '550px'}}>
              {/* Info Section */}
              <div className="p-5 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Complain Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block flex items-center">
                      <svg className="w-3 h-3 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Title
                    </label>
                    <p className="text-sm text-gray-900 leading-relaxed font-medium bg-gray-50 p-2 rounded-lg border-l-4 border-blue-500">{complain.title}</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block flex items-center">
                      <svg className="w-3 h-3 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Description
                    </label>
                    <div className="bg-gray-50 p-2 rounded-lg border-l-4 border-green-500">
                      <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{complain.description}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block flex items-center">
                      <svg className="w-3 h-3 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Submitted By
                    </label>
                    <div className="mt-1">
                      {complain.student && (
                        <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-white">S</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{complain.student.student_name}</p>
                            <p className="text-xs text-blue-700 font-medium">Student • {complain.student.contact_number}</p>
                          </div>
                        </div>
                      )}
                      {complain.staff && (
                        <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-white">ST</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{complain.staff.staff_name}</p>
                            <p className="text-xs text-green-700 font-medium">Staff • {complain.staff.contact_number}</p>
                          </div>
                        </div>
                      )}
                      {!complain.student && !complain.staff && (
                        <p className="text-xs text-gray-500 italic">Unknown user</p>
                      )}
                    </div>
                  </div>

                  {/* Attachment */}
                  {complain.complain_attachment && (
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block flex items-center">
                        <svg className="w-3 h-3 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Attachment
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                              {complain.complain_attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">
                                {complain.complain_attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? 'Image File' : 'Document File'}
                              </p>
                              <p className="text-xs text-gray-500">Click to view attachment</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => setShowImageModal(true)}
                            variant="secondary"
                            size="sm"
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            }
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center">
                      <svg className="w-3 h-3 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium block text-xs mb-1">Created</span>
                        <span className="text-gray-900 font-semibold text-xs">{formatDate(complain.created_at)}</span>
                      </div>
                      {complain.updated_at && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium block text-xs mb-1">Updated</span>
                          <span className="text-gray-900 font-semibold text-xs">{formatDate(complain.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Area - Chat Interface */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden" style={{height: '550px'}}>
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Chat Messages</h3>
                    <p className="text-xs text-gray-600 mt-1">Communicate directly with the complainant about this complaint</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-600">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatInterface
                  complainId={parseInt(complainId)}
                  currentUserId={1} // This should come from auth context
                  currentUserType="admin"
                  currentUserName="Admin"
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attachment Modal */}
      {complain?.complain_attachment && showImageModal && (
        <div 
          className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-full bg-white rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {complain.complain_attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {complain.complain_attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? 'Image Attachment' : 'Document Attachment'}
                  </h3>
                </div>
                <Button
                  onClick={() => setShowImageModal(false)}
                  variant="ghost"
                  size="sm"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                >
                  Close
                </Button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="max-h-[70vh] overflow-auto">
              {complain.complain_attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <div className="p-6 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- complaint attachment preview uses native <img> for onClick zoom and onError behavior */}
                  <img
                    src={getImageUrl(complain.complain_attachment)}
                    alt="Complaint Attachment"
                    className="max-w-full max-h-[60vh] object-contain rounded-lg cursor-zoom-in hover:scale-105 transition-transform duration-200"
                    onClick={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.style.transform === 'scale(2)') {
                        img.style.transform = 'scale(1)';
                        img.style.cursor = 'zoom-in';
                        img.parentElement!.style.overflow = 'hidden';
                      } else {
                        img.style.transform = 'scale(2)';
                        img.style.cursor = 'zoom-out';
                        img.parentElement!.style.overflow = 'auto';
                      }
                    }}
                    onError={(e) => {
                      console.error('Image failed to load');
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Document File</h4>
                  <p className="text-gray-600 mb-6">This file cannot be previewed directly. You can download it to view.</p>
                </div>
              )}
            </div>
            
            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = getImageUrl(complain.complain_attachment);
                  link.download = 'attachment';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                variant="primary"
                size="sm"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
