"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { blockApi, BlockFormData, ApiError } from '@/lib/api/index';
import { 
  Button, 
  FormField, 
  SubmitButton, 
  CancelButton, 
  SingleImageUploadCreate 
} from '@/components/ui';

export default function CreateBlock() {
  const router = useRouter();
  const [formData, setFormData] = useState<BlockFormData>({
    block_name: '',
    location: '',
    manager_name: '',
    manager_contact: '',
    remarks: '',
    block_attachment: null,
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        block_attachment: 'Please select a valid image file (JPG, JPEG, PNG)'
      }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        block_attachment: 'File size must be less than 5MB'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      block_attachment: file
    }));

    // Create preview for images
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear file error
    if (errors.block_attachment) {
      setErrors(prev => ({
        ...prev,
        block_attachment: ''
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      block_attachment: null
    }));
    setImagePreview(null);
    
    // Reset file input
    const fileInput = document.getElementById('block_attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.block_name.trim()) {
      newErrors.block_name = 'Block name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.manager_name.trim()) {
      newErrors.manager_name = 'Manager name is required';
    }

    if (!formData.manager_contact.trim()) {
      newErrors.manager_contact = 'Manager contact is required';
    } else if (!/^\d{10}$/.test(formData.manager_contact.trim())) {
      newErrors.manager_contact = 'Please enter a valid 10-digit phone number';
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
      await blockApi.createBlock(formData);
      
      // Redirect to blocks list on success
      router.push('/admin/block');
      
    } catch (error) {
      console.error('Error creating block:', error);
      if (error instanceof ApiError) {
        setErrors({
          submit: `Failed to create block: ${error.message}`
        });
      } else {
        setErrors({
          submit: 'An error occurred while creating the block. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-5xl mx-auto">
        {/* Clean Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create Block</h1>
        </div>

        {/* Modern Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-4">
            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Block Name */}
                <FormField
                  name="block_name"
                  label="Block Name"
                  required
                  value={formData.block_name}
                  onChange={handleInputChange}
                  error={errors.block_name}
                  placeholder="Enter block name"
                />

                {/* Location */}
                <FormField
                  name="location"
                  label="Location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  error={errors.location}
                  placeholder="Enter location"
                />

                {/* Manager Name */}
                <FormField
                  name="manager_name"
                  label="Manager Name"
                  required
                  value={formData.manager_name}
                  onChange={handleInputChange}
                  error={errors.manager_name}
                  placeholder="Enter manager name"
                />

                {/* Manager Contact */}
                <FormField
                  name="manager_contact"
                  label="Manager Contact"
                  required
                  value={formData.manager_contact}
                  onChange={handleInputChange}
                  error={errors.manager_contact}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Block Description - Full Width */}
              <FormField
                name="remarks"
                label="Description"
                value={formData.remarks || ''}
                onChange={handleInputChange}
                placeholder="Block description (optional)"
                type="textarea"
                rows={3}
              />

              {/* Image Upload Component */}
              <div>
                <SingleImageUploadCreate
                  imagePreview={imagePreview}
                  onFileSelect={(file) => {
                    setFormData(prev => ({
                      ...prev,
                      block_attachment: file
                    }));
                    
                    // Create preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setImagePreview(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                    
                    if (errors.block_attachment) {
                      setErrors(prev => ({
                        ...prev,
                        block_attachment: ''
                      }));
                    }
                  }}
                  onRemove={removeImage}
                  error={errors.block_attachment}
                  label="Block Image"
                  onImageClick={(imageUrl) => {
                    // Simply preview the image, or implement a modal if needed
                    console.log('Image clicked:', imageUrl);
                  }}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
              <CancelButton onClick={() => router.back()} />
              <SubmitButton 
                loading={isSubmitting} 
                loadingText="Creating..."
              >
                Create Block
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}