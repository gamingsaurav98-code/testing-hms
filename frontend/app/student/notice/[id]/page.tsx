"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { noticeApi, Notice } from '@/lib/api/notice.api';
import { ApiError } from '@/lib/api/core';
import { Button, TableSkeleton } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { 
  ArrowLeft,
  AlertCircle, 
  Calendar, 
  Clock,
  User,
  Home,
  Settings,
  Download,
  File
} from 'lucide-react';

export default function StudentNoticeDetail() {
  const router = useRouter();
  const params = useParams();
  const noticeId = params.id as string;
  
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await noticeApi.getNotice(noticeId);
      setNotice(response);
    } catch (err) {
      console.error('Error fetching notice:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load notice details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noticeId) {
      fetchNotice();
    }
  }, [noticeId]);

  const getNoticeTypeColor = (type: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      event: 'bg-blue-100 text-blue-800 border-blue-200',
      announcement: 'bg-purple-100 text-purple-800 border-purple-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all':
        return <User className="w-5 h-5" />;
      case 'student':
        return <User className="w-5 h-5" />;
      case 'block':
        return <Home className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getTargetDisplay = (notice: Notice) => {
    if (notice.target_info) {
      return notice.target_info.name;
    }
    
    switch (notice.target_type) {
      case 'all':
        return 'All Users';
      case 'student':
        return 'All Students';
      case 'staff':
        return 'All Staff';
      case 'specific_student':
        return notice.student ? notice.student.name : 'Specific Student';
      case 'specific_staff':
        return notice.staff ? notice.staff.name : 'Specific Staff';
      case 'block':
        return notice.block ? notice.block.name : 'Specific Block';
      default:
        return 'Unknown';
    }
  };

  const handleDownloadAttachment = (attachment: { id: number; path: string; name: string }) => {
    // Create a download link for the attachment
    const link = document.createElement('a');
    link.href = attachment.path;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            onClick={() => router.push('/student/notice')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notices
          </Button>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            onClick={() => router.push('/student/notice')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notices
          </Button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
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

  if (!notice) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            onClick={() => router.push('/student/notice')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notices
          </Button>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Notice not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/student/notice')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notices
          </Button>
        </div>

        {/* Notice Detail Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-8">
            {/* Notice Header */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getTargetIcon(notice.target_type)}
                  <h1 className="text-2xl font-bold text-gray-900">
                    {notice.title}
                  </h1>
                </div>
                
                {/* Notice Type Badge */}
                {notice.notice_type && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getNoticeTypeColor(notice.notice_type)}`}>
                    {notice.notice_type === 'urgent' && <AlertCircle className="w-4 h-4 mr-1" />}
                    {notice.notice_type === 'event' && <Calendar className="w-4 h-4 mr-1" />}
                    {notice.notice_type}
                  </span>
                )}
              </div>

              {/* Notice Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span><strong>For:</strong> {getTargetDisplay(notice)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span><strong>Posted:</strong> {formatDate(notice.created_at)}</span>
                </div>
                
                {notice.schedule_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span><strong>Scheduled:</strong> {formatDate(notice.schedule_time)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notice Content */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {notice.description}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {notice.attachments && notice.attachments.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Attachments ({notice.attachments.length})
                </h2>
                <div className="space-y-3">
                  {notice.attachments.map((attachment, index) => (
                    <div
                      key={attachment.id || index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attachment.type}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleDownloadAttachment(attachment)}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(notice.student || notice.staff || notice.block) && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Information</h2>
                
                {notice.student && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Student Details</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Name:</strong> {notice.student.name}</p>
                      <p><strong>Student ID:</strong> {notice.student.student_id}</p>
                      <p><strong>Contact:</strong> {notice.student.contact}</p>
                      {notice.student.email && (
                        <p><strong>Email:</strong> {notice.student.email}</p>
                      )}
                    </div>
                  </div>
                )}

                {notice.staff && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">Staff Details</h3>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Name:</strong> {notice.staff.name}</p>
                      <p><strong>Staff ID:</strong> {notice.staff.staff_id}</p>
                      <p><strong>Contact:</strong> {notice.staff.contact}</p>
                      {notice.staff.email && (
                        <p><strong>Email:</strong> {notice.staff.email}</p>
                      )}
                    </div>
                  </div>
                )}

                {notice.block && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-medium text-purple-900 mb-2">Block Details</h3>
                    <div className="text-sm text-purple-800 space-y-1">
                      <p><strong>Block Name:</strong> {notice.block.name}</p>
                      <p><strong>Location:</strong> {notice.block.location}</p>
                      <p><strong>Manager:</strong> {notice.block.manager_name}</p>
                      <p><strong>Manager Contact:</strong> {notice.block.manager_contact}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
