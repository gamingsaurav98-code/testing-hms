"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { staffApi } from '@/lib/api/staff.api';
import { Complain } from '@/lib/api/complain.api';
import { ApiError } from '@/lib/api/core';
import { Button, ConfirmModal, TableSkeleton } from '@/components/ui';
import ChatInterface from '@/components/ui/ChatInterface';
import { 
  ArrowLeft, 
  ChevronDown, 
  Download, 
  Calendar, 
  User, 
  Clock,
  Upload,
  AlertCircle,
  Check,
  X,
  Loader
} from 'lucide-react';

export default function StaffComplainDetail() {
  const router = useRouter();
  const params = useParams();
  const complainId = params.id as string;

  const [complain, setComplain] = useState<Complain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch complain data
  useEffect(() => {
    const fetchComplain = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const complainData = await staffApi.getStaffComplaint(complainId);
        setComplain(complainData);
        
      } catch (error) {
        console.error('Error fetching complain:', error);
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setError(`Complaint with ID ${complainId} not found. It may have been deleted or the ID is incorrect.`);
          } else {
            setError(`Failed to load complaint: ${error.message}`);
          }
        } else {
          setError('Failed to load complaint data. Please try again.');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'in_progress':
        return <Loader className="w-4 h-4 text-blue-600" />;
      case 'resolved':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1";
    
    switch (status) {
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            {getStatusIcon(status)}
            Pending Review
          </span>
        );
      case 'in_progress':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            {getStatusIcon(status)}
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            {getStatusIcon(status)}
            Resolved
          </span>
        );
      case 'rejected':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            {getStatusIcon(status)}
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {getStatusIcon(status)}
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadAttachment = () => {
    if (complain?.complain_attachment) {
      // Create download link
      const link = document.createElement('a');
      link.href = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/storage/${complain.complain_attachment}`;
      link.download = complain.complain_attachment.split('/').pop() || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="secondary"
              onClick={() => router.push('/staff/complain')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Complaints
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Complaint</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!complain) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Complaint Not Found</h2>
              <p className="text-gray-600 mb-4">The requested complaint could not be found.</p>
              <Button onClick={() => router.push('/staff/complain')}>
                Back to Complaints
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/staff/complain')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Complaints
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complaint Details</h1>
              <p className="text-gray-600">ID: {complain.id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(complain.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {complain.title}
                  </h2>
                  {getStatusBadge(complain.status)}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {complain.description}
                    </p>
                  </div>
                </div>

                {/* Attachment */}
                {complain.complain_attachment && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachment</h3>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            📎
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {complain.complain_attachment.split('/').pop()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Supporting document
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleDownloadAttachment}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Communication
                  </h2>
                  {complain.unread_messages > 0 && (
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {complain.unread_messages} new
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Communicate with the administration about this complaint
                </p>
              </div>
              
              <div className="p-6">
                <ChatInterface
                  complainId={complain.id}
                  currentUserId={complain.staff?.id || 0}
                  currentUserType="staff"
                  currentUserName={complain.staff?.staff_name || 'Staff Member'}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Complaint Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Complaint Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(complain.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(complain.updated_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submitted By</p>
                    <p className="text-sm text-gray-600">
                      {complain.staff?.staff_name || 'Staff Member'}
                    </p>
                    {complain.staff?.contact_number && (
                      <p className="text-xs text-gray-500">
                        {complain.staff.contact_number}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Upload className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Messages</p>
                    <p className="text-sm text-gray-600">
                      {complain.total_messages || 0} total
                    </p>
                    {complain.unread_messages > 0 && (
                      <p className="text-xs text-red-600">
                        {complain.unread_messages} unread
                      </p>
                    )}
                  </div>
                </div>

                {complain.last_message_at && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Message</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(complain.last_message_at)}
                      </p>
                      {complain.last_message_by && (
                        <p className="text-xs text-gray-500">
                          by {complain.last_message_by}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Status Information
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(complain.status)}
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {complain.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {complain.status === 'pending' && 'Your complaint is awaiting review by the administration.'}
                    {complain.status === 'in_progress' && 'Your complaint is being actively addressed.'}
                    {complain.status === 'resolved' && 'Your complaint has been resolved.'}
                    {complain.status === 'rejected' && 'Your complaint was reviewed but could not be addressed.'}
                  </p>
                </div>

                <div className="text-xs text-gray-500">
                  <p>Only administrators can update the complaint status.</p>
                  <p className="mt-1">Use the chat to communicate about this complaint.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
