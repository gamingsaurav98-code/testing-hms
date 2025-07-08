"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  inquiryApi, 
  blockApi, 
  roomApi, 
  Block, 
  InquiryFormData,
  ApiError,
  Room
} from '@/lib/api/index';
import { 
  FormField, 
  SubmitButton, 
  CancelButton, 
  MultipleImageUploadCreate,
  SuccessToast,
} from '@/components/ui';

export default function CreateInquiry() {
  const router = useRouter();
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '',
    email: '',
    phone: '',
    block_id: '',
    seater: undefined,
    description: '',
    notes: '', // Adding notes field instead of inquiry_seaters
    attachments: []
  });
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load blocks for dropdown
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const response = await blockApi.getBlocks();
        setBlocks(response.data);
      } catch (error) {
        console.error('Error fetching blocks:', error);
        setError('Failed to load blocks. Please try refreshing the page.');
      }
    };
    
    fetchBlocks();
  }, []);
  
  // No longer fetching rooms data for inquiry creation
  useEffect(() => {
    // Reset rooms state when block changes
    if (!formData.block_id) {
      setRooms([]);
      setAvailableRooms([]);
    }
  }, [formData.block_id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'seater') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value) : undefined
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Room seater options have been removed
  // No helper functions needed for room selection
  
  const handleAttachmentsChange = (files: File[]) => {
    // Limit to 5 files maximum
    const limitedFiles = files.slice(0, 5);
    setAttachments(limitedFiles);
    setFormData({
      ...formData,
      attachments: limitedFiles
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.phone || !formData.block_id) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await inquiryApi.createInquiry(formData);
      
      setSuccess('Inquiry created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        block_id: '',
        seater: undefined,
        description: '',
        notes: '',
        attachments: []
      });
      
      // Redirect after delay
      setTimeout(() => {
        router.push('/admin/inquiry');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating inquiry:', error);
      if (error instanceof ApiError) {
        setError(`Failed to create inquiry: ${error.message}`);
      } else {
        setError('Failed to create inquiry. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Success Toast */}
      {success && (
        <SuccessToast
          show={!!success}
          message={success}
          progress={100}
          onClose={() => setSuccess(null)}
        />
      )}
      
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Create New Inquiry</h1>
        <p className="text-sm text-gray-500 mt-1">Record a new student inquiry for accommodation</p>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
          {/* Student Name */}
          <FormField
            label="Student Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter student name"
            required
            error={!formData.name && error ? 'Name is required' : ''}
          />
          
          {/* Phone */}
          <FormField
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Enter phone number"
            required
            error={!formData.phone && error ? 'Phone number is required' : ''}
          />
          
          {/* Email */}
          <FormField
            label="Email Address"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            type="email"
            placeholder="Enter email address (optional)"
          />
          
          {/* Block */}
          <FormField
            label="Block"
            name="block_id"
            value={formData.block_id}
            onChange={handleInputChange}
            type="select"
            options={blocks.map(block => ({ value: block.id, label: block.block_name }))}
            required
            error={!formData.block_id && error ? 'Block is required' : ''}
          />
          
          {/* Seater */}
          <FormField
            label="Seater Preference"
            name="seater"
            value={formData.seater?.toString() || ''}
            onChange={handleInputChange}
            type="select"
            options={[
              { value: '1', label: '1-Seater' },
              { value: '2', label: '2-Seater' },
              { value: '3', label: '3-Seater' },
              { value: '4', label: '4-Seater' },
              { value: '6', label: '6-Seater' }
            ]}
          />
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <FormField 
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            type="textarea"
            placeholder="Enter any additional details about the inquiry"
          />
        </div>
        
        {/* Simple Inquiry Notes - replacing Room Options */}
        <div className="mb-6">
          <FormField 
            label="Notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            type="textarea"
            placeholder="Enter any specific requirements or notes about room preferences"
          />
        </div>
        
        {/* File Attachments */}
        <div className="mb-6">
          <h3 className="block text-sm font-semibold text-neutral-900 mb-2">Attachments</h3>
          <MultipleImageUploadCreate
            images={attachments}
            onAddImages={handleAttachmentsChange}
            onRemoveImage={(index) => {
              const newAttachments = [...attachments];
              newAttachments.splice(index, 1);
              handleAttachmentsChange(newAttachments);
            }}
            onImageClick={(url, alt) => {
              // Preview functionality could be added here
              console.log('Preview image:', url, alt);
            }}
            label="Supporting Documents"
          />
          <p className="text-xs text-neutral-500 mt-1">Upload any supporting documents (max 5 files, 10MB each)</p>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-5">
          <CancelButton 
            onClick={() => router.push('/admin/inquiry')} 
            children="Cancel"
          />
          <SubmitButton 
            loading={isSubmitting} 
            loadingText="Creating..."
          >
            Create Inquiry
          </SubmitButton>
        </div>
      </form>
    </div>
  );
  
  // No helper functions needed as room selection has been removed
}
