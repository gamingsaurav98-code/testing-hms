"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { complainApi, Complain } from '@/lib/api/complain.api';
import { ApiError } from '@/lib/api/core';
import { Button, ConfirmModal, TableSkeleton } from '@/components/ui';
import ChatInterface from '@/components/ui/ChatInterface';

export default function StudentComplainDetail() {
  const router = useRouter();
  const params = useParams();
  const complainId = params.id as string;

  const [complain, setComplain] = useState<Complain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);

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
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      resolved: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      pending: 'Your complain has been submitted and is waiting for admin review.',
      in_progress: 'Admin is actively working on resolving your issue.',
      resolved: 'Your issue has been resolved by the admin team.'
    };
    
    return descriptions[status as keyof typeof descriptions] || 'Status unknown';
  };

  const handleDeleteClick = () => {
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await complainApi.deleteComplain(complainId);
      
      // Redirect to complains list after successful deletion
      router.push('/student/complain');
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
              onClick={() => router.push('/student/complain')}
              variant="secondary"
              size="sm"
            >
              Back to My Complains
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
        <div className="w-full px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{complain.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                  {getStatusBadge(complain.status)}
                  <span className="text-sm text-gray-600 font-medium">ID: #{complain.id}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{formatDate(complain.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/student/complain')}
                variant="secondary"
                size="sm"
              >
                Back to My Complains
              </Button>
              <Button
                onClick={() => router.push(`/student/complain/${complain.id}/edit`)}
                variant="secondary"
                size="sm"
                disabled={complain.status === 'resolved'}
              >
                Edit
              </Button>
              <Button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                variant="danger"
                size="sm"
                loading={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Sidebar - Complain Details */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Status Info Section */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
                    <p className="text-sm text-gray-600 mt-1">{getStatusDescription(complain.status)}</p>
                  </div>
                  {getStatusBadge(complain.status)}
                </div>
              </div>

              {/* Details Section */}
              <div className="p-7">
                <div className="space-y-8">
                  <div>
                    <label className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 block flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Title
                    </label>
                    <p className="text-lg text-gray-900 leading-relaxed font-medium bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">{complain.title}</p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 block flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Description
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">
                      <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{complain.description}</p>
                    </div>
                  </div>

                  {/* Attachment */}
                  {complain.complain_attachment && (
                    <div>
                      <label className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 block flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Attachment
                      </label>
                      <div className="mt-3 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-6">
                          {complain.complain_attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img
                              src={complain.complain_attachment.startsWith('http') 
                                ? complain.complain_attachment 
                                : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}/storage/${complain.complain_attachment}`}
                              alt="Attachment"
                              className="max-w-full max-h-48 object-contain mx-auto rounded-lg shadow-md"
                            />
                          ) : (
                            <div className="flex items-center justify-center space-x-3 py-4">
                              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm text-gray-700 font-medium">View File</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Submitted</span>
                        <span className="text-gray-900 font-semibold">{formatDate(complain.created_at)}</span>
                      </div>
                      {complain.updated_at && (
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700 font-medium">Last Updated</span>
                          <span className="text-gray-900 font-semibold">{formatDate(complain.updated_at)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700 font-medium">Messages</span>
                        <span className="text-gray-900 font-semibold">
                          {complain.total_messages || 0} total
                          {complain.unread_student_messages > 0 && (
                            <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                              {complain.unread_student_messages} unread
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Area - Chat Interface */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Chat with Admin</h3>
                    <p className="text-sm text-gray-600 mt-1">Get updates and discuss your complain</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-600">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0" style={{height: 'calc(100vh - 340px)'}}>
                <ChatInterface
                  complainId={parseInt(complainId)}
                  currentUserId={1} // This would come from auth context - should be student ID
                  currentUserType="student"
                  currentUserName="Student" // This would come from auth context
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}