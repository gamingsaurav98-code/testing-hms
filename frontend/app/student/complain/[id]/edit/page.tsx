"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { studentApi } from '@/lib/api/student.api';
import { ApiError } from '@/lib/api/core';
import { 
  Button, 
  FormField, 
  SuccessToast,
  TableSkeleton,
  SingleImageUploadEdit
} from '@/components/ui';
import { getImageUrl } from '@/lib/utils';

interface ComplainFormData {
  title: string;
  description: string;
  complain_attachment?: File;
}

export default function EditComplain() {
  const router = useRouter();
  const params = useParams();
  const complainId = params.id as string;

  const [complain, setComplain] = useState<any | null>(null);
  const [formData, setFormData] = useState<ComplainFormData>({
    title: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<string | null>(null);

  // Fetch complain data
  useEffect(() => {
    const fetchComplain = async () => {
      try {
        setIsLoading(true);
        
        const complainData = await studentApi.getStudentComplaint(complainId);
        setComplain(complainData);
        
        // Populate form with existing data
        setFormData({
          title: complainData.title,
          description: complainData.description,
        });
        
        if (complainData.complain_attachment) {
          setExistingAttachment(complainData.complain_attachment);
        }
        
      } catch (error) {
        console.error('Error fetching complain:', error);
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setAlert({
              show: true, 
              message: `Complain with ID ${complainId} not found.`, 
              type: 'error'
            });
          } else {
            setAlert({
              show: true, 
              message: `Failed to load complain: ${error.message}`, 
              type: 'error'
            });
          }
        } else {
          setAlert({
            show: true, 
            message: 'Failed to load complain data. Please try again.', 
            type: 'error'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (complainId) {
      fetchComplain();
    }
  }, [complainId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData: ComplainFormData = {
        ...formData,
        complain_attachment: attachment || undefined
      };

      await studentApi.updateStudentComplaint(complainId, submitData);
      
      setAlert({
        show: true, 
        message: 'Complain updated successfully!', 
        type: 'success'
      });

      // Redirect to the complain detail page after a short delay - optimized
      setTimeout(() => {
        router.push(`/student/complain/${complainId}`);
      }, 1500); // Reduced from 2000ms

    } catch (error) {
      console.error('Error updating complain:', error);
      if (error instanceof ApiError) {
        setAlert({
          show: true, 
          message: `Failed to update complain: ${error.message}`, 
          type: 'error'
        });
      } else {
        setAlert({
          show: true, 
          message: 'Failed to update complain. Please try again.', 
          type: 'error'
        });
      }
      
      // Hide error alert after 3 seconds - optimized
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 3000); // Reduced from 5000ms
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ComplainFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Edit Complain</h1>
          <p className="text-sm text-gray-500 mt-1">Loading complain details...</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (!complain) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">Complain not found or failed to load</p>
          </div>
          <div className="mt-3 space-x-2">
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

  // Check if complain can be edited
  if (complain.status === 'resolved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full px-6 py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-amber-800">Cannot Edit Resolved Complain</h3>
                <p className="text-amber-700 mt-1">
                  This complain has been marked as resolved and cannot be edited anymore.
                  If you have additional concerns, please create a new complain.
                </p>
              </div>
            </div>
            <div className="mt-4 space-x-3">
              <Button
                onClick={() => router.push(`/student/complain/${complainId}`)}
                variant="secondary"
              >
                View Complain
              </Button>
              <Button
                onClick={() => router.push('/student/complain/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create New Complain
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Alert Notifications */}
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Complain</h1>
              <div className="flex items-center gap-4 mt-2">
                {getStatusBadge(complain.status)}
                <span className="text-sm text-gray-600 font-medium">ID: #{complain.id}</span>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/student/complain/${complainId}`)}
              variant="secondary"
              className="text-gray-600 hover:text-gray-800"
            >
              Cancel Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {/* Form Header */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Update Complain Details</h2>
              <p className="text-sm text-gray-600">
                Modify your complain information. Note that editing is not allowed for resolved complains.
              </p>
            </div>

            <div className="space-y-6">
              {/* Title Field */}
              <FormField
                label="Complain Title"
                name="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
                placeholder="e.g., Room WiFi not working, Broken window glass, Food quality issue..."
                required
              />
              <div className="mt-1 text-xs text-gray-500 text-right">
                {formData.title.length}/255 characters
              </div>

              {/* Description Field */}
              <FormField
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
                type="textarea"
                rows={6}
                placeholder="Please describe your issue in detail..."
                required
              />
              <div className="mt-1 text-xs text-gray-500 text-right">
                {formData.description.length}/1000 characters
              </div>

              {/* Attachment Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-900">
                  Attachment (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload an image or document to help illustrate your issue
                </p>
                <SingleImageUploadEdit
                  existingImageUrl={existingAttachment ? getImageUrl(existingAttachment) : null}
                  imagePreview={attachment ? URL.createObjectURL(attachment) : null}
                  onFileSelect={setAttachment}
                  onRemove={() => {
                    setAttachment(null);
                    setExistingAttachment(null);
                  }}
                  onImageClick={(url, alt) => {
                    window.open(url, '_blank');
                  }}
                  label=""
                />
              </div>

              {/* Status Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Current Status: {getStatusBadge(complain.status)}
                    </p>
                    <p className="text-xs text-blue-700">
                      Status is managed by admin team and cannot be changed by students.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={() => router.push(`/student/complain/${complainId}`)}
              variant="secondary"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Updating...' : 'Update Complain'}
            </Button>
          </div>
        </form>

        {/* Status Info */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-amber-900 mb-3">📝 Edit Guidelines</h3>
          <ul className="text-sm text-amber-800 space-y-2">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>You can edit complains that are in 'pending' or 'in progress' status</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Resolved complains cannot be edited - create a new one if needed</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Admins will be notified of your updates through the chat system</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}