"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  block_name: string;
  location: string;
  manager_name: string;
  manager_contact: string;
  remarks: string;
  block_attachment: File | null;
}

export default function CreateBlock() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
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
      const submitData = new FormData();
      
      // Append all form fields
      submitData.append('block_name', formData.block_name.trim());
      submitData.append('location', formData.location.trim());
      submitData.append('manager_name', formData.manager_name.trim());
      submitData.append('manager_contact', formData.manager_contact.trim());
      submitData.append('remarks', formData.remarks.trim());
      
      // Append file if selected
      if (formData.block_attachment) {
        submitData.append('block_attachment', formData.block_attachment);
      }

      const response = await fetch('/api/blocks', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create block');
      }

      const result = await response.json();
      console.log('Block created successfully:', result);
      
      // Redirect to blocks list or show success message
      router.push('/admin/block');
      
    } catch (error) {
      console.error('Error creating block:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'An error occurred while creating the block'
      });
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
                <div>
                  <label htmlFor="block_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Block Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="block_name"
                    name="block_name"
                    value={formData.block_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#235999] focus:border-transparent transition-colors ${
                      errors.block_name ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Enter block name"
                  />
                  {errors.block_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.block_name}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#235999] focus:border-transparent transition-colors ${
                      errors.location ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Enter location"
                  />
                  {errors.location && (
                    <p className="text-sm text-red-600 mt-1">{errors.location}</p>
                  )}
                </div>

                {/* Manager Name */}
                <div>
                  <label htmlFor="manager_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Manager Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="manager_name"
                    name="manager_name"
                    value={formData.manager_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#235999] focus:border-transparent transition-colors ${
                      errors.manager_name ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Enter manager name"
                  />
                  {errors.manager_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.manager_name}</p>
                  )}
                </div>

                {/* Manager Contact */}
                <div>
                  <label htmlFor="manager_contact" className="block text-sm font-medium text-gray-700 mb-1">
                    Manager Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="manager_contact"
                    name="manager_contact"
                    value={formData.manager_contact}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#235999] focus:border-transparent transition-colors ${
                      errors.manager_contact ? 'border-red-300' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.manager_contact && (
                    <p className="text-sm text-red-600 mt-1">{errors.manager_contact}</p>
                  )}
                </div>
              </div>

              {/* Block Description - Full Width */}
              <div>
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#235999] focus:border-transparent transition-colors resize-none hover:border-gray-400"
                  placeholder="Block description (optional)"
                />
              </div>

              {/* Simple Image Upload with Drag & Drop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block Image</label>
                
                {!formData.block_attachment ? (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                      isDragOver 
                        ? 'border-[#235999] bg-blue-50 scale-105' 
                        : 'border-gray-300 hover:border-[#235999] hover:bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('block_attachment')?.click()}
                  >
                    <input
                      type="file"
                      id="block_attachment"
                      name="block_attachment"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <div className="space-y-2">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center transition-colors ${
                        isDragOver ? 'bg-[#235999] text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      
                      <div>
                        <p className={`font-medium transition-colors ${
                          isDragOver ? 'text-[#235999]' : 'text-gray-700'
                        }`}>
                          {isDragOver ? 'Drop image here' : 'Click or drag image here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Image Preview */}
                    <div className="relative rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={imagePreview || ''}
                        alt="Block preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                        <button
                          type="button"
                          onClick={removeImage}
                          className="bg-white text-gray-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors shadow-lg"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                    
                    {/* File Info */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-[#235999] rounded flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">{formData.block_attachment.name}</p>
                          <p className="text-xs text-gray-500">{(formData.block_attachment.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {errors.block_attachment && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.block_attachment}
                  </p>
                )}
              </div>
            </div>

            {/* Proper Form Actions */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#235999] hover:bg-[#1e4d87] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Block'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}