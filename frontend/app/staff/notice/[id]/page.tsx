"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { staffApi } from '@/lib/api/staff.api';
import { Notice, ApiError } from '@/lib/api';
import { Button, ImageModal } from '@/components/ui';
import { 
  ArrowLeft, 
  Calendar, 
  User,
  Clock, 
  File,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  Download,
  Eye
} from 'lucide-react';
import { formatDate, getImageUrl } from '@/lib/utils';

export default function StaffNoticeDetail() {
  const router = useRouter();
  const { id } = useParams();
  const noticeId = Array.isArray(id) ? id[0] : id || '';
  
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' });
  
  // Fetch notice data
  useEffect(() => {
    if (!noticeId) {
      setError('Notice ID is missing');
      setIsLoading(false);
      return;
    }
    
    const fetchNotice = async () => {
      try {
        const data = await staffApi.getStaffNotice(noticeId);
        setNotice(data);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 403) {
            setError('This notice is no longer active and cannot be viewed.');
          } else if (err.status === 404) {
            setError('Notice not found or you do not have permission to view it.');
          } else {
            setError(`Failed to load notice: ${err.message}`);
          }
        } else {
          setError('Failed to load notice details');
        }
        console.error('Error fetching notice:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotice();
  }, [noticeId]);

  const handleAttachmentClick = (url: string, name: string) => {
    // For all file types, show in the modal
    setSelectedImage({ url: getImageUrl(url), alt: name });
    setImageModalOpen(true);
  };

  // Function to get file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return (
          <div className="bg-red-100 rounded p-1">
            <File className="h-4 w-4 text-red-600" />
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className="bg-blue-100 rounded p-1">
            <File className="h-4 w-4 text-blue-600" />
          </div>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <div className="bg-green-100 rounded p-1">
            <File className="h-4 w-4 text-green-600" />
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 rounded p-1">
            <File className="h-4 w-4 text-gray-600" />
          </div>
        );
    }
  };

  // Function to get target audience display text
  const getTargetDisplay = (notice: Notice): string => {
    if (notice.target_info) {
      switch (notice.target_info.type) {
        case 'specific_student':
          return `Specific Student: ${notice.target_info.name}`;
        case 'specific_staff':
          return `Specific Staff: ${notice.target_info.name}`;
        case 'block':
          return `Specific Block: ${notice.target_info.name}`;
        default:
          return notice.target_info.name || notice.target_info.type;
      }
    }
    
    switch (notice.target_type) {
      case 'all':
        return 'Everyone';
      case 'student':
        return 'All Students';
      case 'staff':
        return 'All Staff';
      case 'specific_student':
        return notice.student ? `Specific Student: ${notice.student.name}` : 'Specific Student';
      case 'specific_staff':
        return notice.staff ? `Specific Staff: ${notice.staff.name}` : 'Specific Staff';
      case 'block':
        return notice.block ? `Specific Block: ${notice.block.name}` : 'Specific Block';
      default:
        return notice.target_type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notice details...</p>
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-5xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6">
            <Link 
              href="/staff/notice" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Notices
            </Link>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center text-red-700 mb-4">
              <AlertCircle className="w-6 h-6 mr-2" />
              <h2 className="text-lg font-semibold">Unable to Load Notice</h2>
            </div>
            <p className="text-red-600 mb-4">{error || 'Notice not found'}</p>
            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/staff/notice')}
                variant="secondary"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Notice List
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="ghost"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Notice Details</h1>
            <p className="text-sm text-gray-500">View notice information and attachments</p>
          </div>
        </div>

        {/* Notice Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Notice Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-medium text-gray-900">{notice.title}</h2>
              <div className="flex items-center">
                {notice.status === 'active' ? (
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center text-sm font-medium">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Active
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full flex items-center text-sm font-medium">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Inactive
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notice Content */}
          <div className="p-6">
            {/* Notice Metadata */}
            <div className="grid grid-cols-1 gap-4 mb-6 text-sm">
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Date & Time:</span>
                {new Date(notice.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} at {new Date(notice.created_at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                })}
              </div>
            </div>
            
            {/* Target Details - Show only for specific targets */}
            {(notice.target_type === 'specific_student' || 
              notice.target_type === 'specific_staff' || 
              notice.target_type === 'block') && (
              <div className="mb-6 border-t border-gray-100 pt-6">
                <h3 className="text-md font-medium text-gray-800 mb-2">
                  {notice.target_type === 'specific_student' ? 'Student' : 
                   notice.target_type === 'specific_staff' ? 'Staff' : 'Block'} Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {notice.target_info ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Name:</span>
                        <span>{notice.target_info.name}</span>
                      </div>
                      {notice.target_info.identifier && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">
                            {notice.target_info.type === 'specific_student' ? 'Student ID:' : 'ID:'}
                          </span>
                          <span>{notice.target_info.identifier}</span>
                        </div>
                      )}
                      {notice.target_info.contact && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Contact:</span>
                          <span>{notice.target_info.contact}</span>
                        </div>
                      )}
                      {notice.target_info.location && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Location:</span>
                          <span>{notice.target_info.location}</span>
                        </div>
                      )}
                      {notice.target_info.rooms_count !== undefined && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Rooms:</span>
                          <span>{notice.target_info.rooms_count}</span>
                        </div>
                      )}
                    </div>
                  ) : notice.student && notice.target_type === 'specific_student' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Name:</span>
                        <span>{notice.student.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Student ID:</span>
                        <span>{notice.student.student_id}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Contact:</span>
                        <span>{notice.student.contact}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Email:</span>
                        <span>{notice.student.email}</span>
                      </div>
                      {notice.student.room && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Room:</span>
                          <span>{notice.student.room.room_number}</span>
                        </div>
                      )}
                    </div>
                  ) : notice.staff && notice.target_type === 'specific_staff' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Name:</span>
                        <span>{notice.staff.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Staff ID:</span>
                        <span>{notice.staff.staff_id}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Contact:</span>
                        <span>{notice.staff.contact}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Email:</span>
                        <span>{notice.staff.email}</span>
                      </div>
                    </div>
                  ) : notice.block && notice.target_type === 'block' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Name:</span>
                        <span>{notice.block.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Location:</span>
                        <span>{notice.block.location}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Manager:</span>
                        <span>{notice.block.manager_name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Contact:</span>
                        <span>{notice.block.manager_contact}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No detailed information available.</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Description */}
            <div className="mb-6 border-t border-gray-100 pt-6">
              <h3 className="text-md font-medium text-gray-800 mb-2">Description</h3>
              <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                {notice.description}
              </div>
            </div>

            {/* Attachments */}
            {notice.attachments && notice.attachments.length > 0 && (
              <div className="mb-4 border-t border-gray-100 pt-6">
                <h3 className="text-md font-medium text-gray-800 mb-3">Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notice.attachments.map((attachment) => (
                    <div 
                      key={attachment.id} 
                      className="flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {getFileIcon(attachment.name)}
                      <div 
                        className="ml-3 flex-grow truncate cursor-pointer"
                        onClick={() => handleAttachmentClick(attachment.path, attachment.name)}
                      >
                        <div className="text-sm font-medium text-gray-700 truncate">{attachment.name}</div>
                        <div className="text-xs text-gray-500">Click to view</div>
                      </div>
                      <div className="flex space-x-2 ml-2">
                        <button 
                          className="p-1 rounded hover:bg-blue-100 transition-colors" 
                          title="View"
                          onClick={() => handleAttachmentClick(attachment.path, attachment.name)}
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        <a 
                          href={getImageUrl(attachment.path)} 
                          download={attachment.name}
                          className="p-1 rounded hover:bg-green-100 transition-colors" 
                          title="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4 text-green-500" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Info */}
            <div className="border-t border-gray-100 pt-4 mt-6">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div>
                  Notice ID: #{notice.id}
                </div>
                <div>
                  Last updated: {formatDate(notice.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image/File Modal */}
      <ImageModal
        show={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={selectedImage.url}
        alt={selectedImage.alt}
      />
    </div>
  );
}
