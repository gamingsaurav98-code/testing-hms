"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { complainApi, ComplainFormData } from '@/lib/api/complain.api';
import { ApiError } from '@/lib/api/core';
import { 
  Button, 
  FormField, 
  SuccessToast,
  SingleImageUploadCreate
} from '@/components/ui';

export default function CreateComplain() {
  const router = useRouter();
  const [formData, setFormData] = useState<ComplainFormData>({
    title: '',
    description: '',
    student_id: 1, // This would come from auth context in real app
    status: 'pending'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [attachment, setAttachment] = useState<File | null>(null);

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

      const newComplain = await complainApi.createComplain(submitData);
      
      setAlert({
        show: true, 
        message: 'Complain submitted successfully! You can now chat with admin about this issue.', 
        type: 'success'
      });

      // Redirect to the new complain detail page after a short delay
      setTimeout(() => {
        router.push(`/student/complain/${newComplain.id}`);
      }, 2000);

    } catch (error) {
      console.error('Error creating complain:', error);
      if (error instanceof ApiError) {
        setAlert({
          show: true, 
          message: `Failed to submit complain: ${error.message}`, 
          type: 'error'
        });
      } else {
        setAlert({
          show: true, 
          message: 'Failed to submit complain. Please try again.', 
          type: 'error'
        });
      }
      
      // Hide error alert after 5 seconds
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 5000);
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
              <h1 className="text-2xl font-bold text-gray-900">Submit New Complain</h1>
              <p className="text-sm text-gray-600 mt-1">
                Describe your issue and we'll help you resolve it quickly
              </p>
            </div>
            <Button
              onClick={() => router.push('/student/complain')}
              variant="secondary"
              className="text-gray-600 hover:text-gray-800"
            >
              Back to My Complains
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Complain Details</h2>
              <p className="text-sm text-gray-600">
                Please provide clear and detailed information about your issue so we can assist you better.
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
              <p className="text-sm text-gray-600">
                Provide a brief, clear title that summarizes your issue (max 255 characters)
              </p>

              {/* Description Field */}
              <FormField
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
                type="textarea"
                rows={6}
                placeholder="Please describe your issue in detail. For example:&#10;- What exactly is the problem?&#10;- When did it start?&#10;- How is it affecting you?&#10;- Have you tried any solutions?&#10;- Any other relevant details..."
                required
              />
              <div className="mt-1 text-xs text-gray-500 text-right">
                {formData.description.length}/1000 characters
              </div>
              <p className="text-sm text-gray-600">
                Describe your issue in detail. Include when it started, how it affects you, and any relevant information (max 1000 characters)
              </p>

              {/* Attachment Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-900">
                  Attachment (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload an image or document to help illustrate your issue (JPG, PNG, PDF supported)
                </p>
                <SingleImageUploadCreate
                  imagePreview={attachment ? URL.createObjectURL(attachment) : null}
                  onFileSelect={setAttachment}
                  onRemove={() => setAttachment(null)}
                  onImageClick={(url, alt) => {
                    // Simple image preview in new tab
                    window.open(url, '_blank');
                  }}
                  label=""
                />
              </div>

              {/* Status Display */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Initial Status: Pending</p>
                    <p className="text-xs text-amber-700">Your complain will be reviewed by our admin team and status will be updated accordingly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={() => router.push('/student/complain')}
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
              {isSubmitting ? 'Submitting...' : 'Submit Complain'}
            </Button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 Tips for Better Resolution</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Be specific about the problem and include relevant details like room number, time, etc.</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Upload photos or documents if they help illustrate the issue</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Check your complain status regularly and respond to admin messages promptly</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Use the chat feature to provide additional information if requested</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}