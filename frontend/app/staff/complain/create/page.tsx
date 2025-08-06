"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { staffApi } from '@/lib/api/staff.api';
import { ApiError } from '@/lib/api/core';
import { 
  Button, 
  FormField, 
  SuccessToast
} from '@/components/ui';
import { ArrowLeft, Save, File, AlertCircle, Plus } from 'lucide-react';

export default function StaffCreateComplain() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: ''
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

    setIsSubmitting(true);
    try {
      const complainDataToSubmit = {
        title: formData.title,
        description: formData.description,
        complain_attachment: attachment || undefined
      };

      await staffApi.createStaffComplaint(complainDataToSubmit);
      
      setAlert({
        show: true,
        message: 'Complaint submitted successfully! You will be redirected to the complaints list.',
        type: 'success'
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/staff/complain');
      }, 2000);

    } catch (error) {
      console.error('Error creating complain:', error);
      
      if (error instanceof ApiError) {
        if (error.validation) {
          const validationErrors: Record<string, string> = {};
          Object.entries(error.validation).forEach(([key, value]) => {
            validationErrors[key] = Array.isArray(value) ? value[0] : value;
          });
          setErrors(validationErrors);
        } else {
          setAlert({
            show: true,
            message: `Failed to create complaint: ${error.message}`,
            type: 'error'
          });
        }
      } else {
        setAlert({
          show: true,
          message: 'Failed to create complaint. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAttachmentChange = (file: File | null) => {
    setAttachment(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/staff/complain')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Complaints
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Submit New Complaint</h1>
          <p className="text-gray-600 mt-1">
            Report an issue or concern that needs administrative attention
          </p>
        </div>

        {/* Alert */}
        {alert.show && (
          <SuccessToast
            show={alert.show}
            message={alert.message}
            progress={alert.type === 'success' ? 100 : 0}
            onClose={() => setAlert({ ...alert, show: false })}
          />
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Information Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900">Complaint Guidelines</h3>
                  <div className="mt-2 text-sm text-blue-800">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Provide a clear and descriptive title for your complaint</li>
                      <li>Include detailed information about the issue in the description</li>
                      <li>Attach relevant documents or images if applicable</li>
                      <li>You will be able to communicate with admin through chat messages</li>
                      <li>Track the status of your complaint in the complaints list</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Title Field */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-sm font-semibold text-neutral-900">
                Complaint Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief summary of your complaint"
                className="w-full px-4 py-3 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                maxLength={255}
                required
              />
              {errors.title && (
                <div className="flex items-center mt-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 mr-2" />
                  {errors.title}
                </div>
              )}
              <div className="text-xs text-gray-500">
                {formData.title.length}/255 characters
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-sm font-semibold text-neutral-900">
                Detailed Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed information about your complaint, including when it occurred, what happened, and any relevant context..."
                rows={6}
                className="w-full px-4 py-3 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200 resize-none"
                maxLength={1000}
                required
              />
              {errors.description && (
                <div className="flex items-center mt-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 mr-2" />
                  {errors.description}
                </div>
              )}
              <div className="text-xs text-gray-500">
                {formData.description.length}/1000 characters
              </div>
            </div>

            {/* Attachment Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-neutral-900 flex items-center">
                <File className="w-4 h-4 mr-2" />
                Supporting Document (Optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => handleAttachmentChange(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
              />
              {attachment && (
                <div className="text-sm text-green-600">
                  Selected: {attachment.name}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Upload images, PDFs, or documents that support your complaint (max 5MB)
              </p>
            </div>

            {/* Status Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Initial Status: Pending</h4>
                  <p className="text-xs text-gray-600">
                    Your complaint will be reviewed by the administration and status will be updated accordingly
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/staff/complain')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Submit Complaint
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
