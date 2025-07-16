"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { complainApi, Complain } from '@/lib/api/complain.api';
import { ApiError } from '@/lib/api/core';
import { Button, ConfirmModal, TableSkeleton } from '@/components/ui';
import ChatInterface from '@/components/ui/ChatInterface';

export default function ComplainDetail() {
  const router = useRouter();
  const params = useParams();
  const complainId = params.id as string;

  const [complain, setComplain] = useState<Complain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

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
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
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
            <Button
              onClick={() => router.push('/admin/complain')}
              variant="ghost"
              size="sm"
            >
              Back to Complains
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
          <button
            onClick={() => router.push('/admin/complain')}
            className="mt-2 text-[#235999] hover:text-[#1e4d87]"
          >
            Back to Complains
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
        title="Delete Complain"
        message="Are you sure you want to delete this complain? This action cannot be undone and will also delete all chat messages."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={isDeleting}
        variant="danger"
      />

      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{complain.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(complain.status)}
                <span className="text-sm text-gray-500">
                  ID: #{complain.id}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => router.push('/admin/complain')}
                variant="secondary"
              >
                Back to List
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complain Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Complain Information</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Title</h4>
                  <p className="text-gray-900">{complain.title}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                  <p className="text-gray-900 whitespace-pre-wrap">{complain.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Submitted By</h4>
                  {complain.student && (
                    <div>
                      <p className="text-gray-900">{complain.student.student_name}</p>
                      <p className="text-sm text-gray-500">Student • {complain.student.contact_number}</p>
                    </div>
                  )}
                  {complain.staff && (
                    <div>
                      <p className="text-gray-900">{complain.staff.staff_name}</p>
                      <p className="text-sm text-gray-500">Staff • {complain.staff.contact_number}</p>
                    </div>
                  )}
                  {!complain.student && !complain.staff && (
                    <p className="text-gray-500">Unknown</p>
                  )}
                </div>

                {/* Status Update */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Update Status</h4>
                  <div className="space-y-2">
                    {['pending', 'in_progress', 'resolved', 'rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        disabled={statusUpdating || complain.status === status}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          complain.status === status
                            ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        } ${statusUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {status.replace('_', ' ')}
                        {complain.status === status && ' (Current)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attachment */}
                {complain.complain_attachment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Attachment</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <div className="p-4">
                        {complain.complain_attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <img
                            src={complain.complain_attachment.startsWith('http') 
                              ? complain.complain_attachment 
                              : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}/storage/${complain.complain_attachment}`}
                            alt="Attachment"
                            className="max-w-full max-h-48 object-contain"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-600">View Attachment</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">{formatDate(complain.created_at)}</span>
                  </div>
                  {complain.updated_at && (
                    <div>
                      <span className="font-medium text-gray-500">Last Updated:</span>
                      <span className="ml-2 text-gray-900">{formatDate(complain.updated_at)}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-500">Messages:</span>
                    <span className="ml-2 text-gray-900">{complain.total_messages || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Chat with User</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Communicate directly with the person who submitted this complain
                </p>
              </div>
              <div className="p-4">
                <ChatInterface
                  complainId={parseInt(complainId)}
                  currentUserId={1} // This should come from auth context
                  currentUserType="admin"
                  currentUserName="Admin"
                  className="h-96"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
