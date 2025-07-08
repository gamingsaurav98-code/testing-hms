"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  inquiryApi, 
  blockApi, 
  roomApi, 
  Block, 
  Inquiry,
  InquiryFormData,
  ApiError,
  Room,
  InquirySeater,
  InquiryAttachment
} from '@/lib/api/index';
import { 
  FormField, 
  SubmitButton, 
  CancelButton, 
  MultipleImageUploadEdit,
  SuccessToast,
  TableSkeleton
} from '@/components/ui';

export default function EditInquiry({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '',
    email: '',
    phone: '',
    block_id: '',
    inquiry_seaters: [],
    description: '',
    notes: '',
    attachments: []
  });
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<InquiryAttachment[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load inquiry data
  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        setIsLoading(true);
        const inquiryData = await inquiryApi.getInquiry(params.id);
        setInquiry(inquiryData);
        
        // Initialize form data
        setFormData({
          name: inquiryData.name,
          email: inquiryData.email || '',
          phone: inquiryData.phone,
          block_id: inquiryData.block_id,
          inquiry_seaters: inquiryData.inquirySeaters || [],
          description: inquiryData.description || '',
          notes: inquiryData.notes || '',
          attachments: []
        });
        
        if (inquiryData.attachments) {
          setExistingAttachments(inquiryData.attachments);
        }
      } catch (error) {
        console.error('Error fetching inquiry:', error);
        setError('Failed to load inquiry data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInquiry();
  }, [params.id]);
  
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
  
  // No longer fetching rooms data for inquiry
  useEffect(() => {
    // Reset rooms state when block changes
    if (!formData.block_id) {
      setRooms([]);
      setAvailableRooms([]);
    }
  }, [formData.block_id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Helper for inquiry_seaters (number of seaters)
  const handleSeaterAdd = () => {
    const newSeaters = [...(formData.inquiry_seaters || [])];
    newSeaters.push({ room_id: '', capacity: 1 });
    setFormData({ ...formData, inquiry_seaters: newSeaters });
  };

  const handleSeaterRemove = (index: number) => {
    const newSeaters = [...(formData.inquiry_seaters || [])];
    newSeaters.splice(index, 1);
    setFormData({ ...formData, inquiry_seaters: newSeaters });
  };

  const handleSeaterChange = (index: number, field: 'room_id' | 'capacity', value: string | number) => {
    const newSeaters = [...(formData.inquiry_seaters || [])];
    if (field === 'room_id') {
      newSeaters[index].room_id = value as string;
    } else {
      newSeaters[index].capacity = value as number;
    }
    setFormData({ ...formData, inquiry_seaters: newSeaters });
  };
  
  const handleAttachmentsChange = (files: File[]) => {
    setAttachments(files);
    setFormData({
      ...formData,
      attachments: files
    });
  };
  
  const handleAttachmentDelete = async (attachmentId: string) => {
    try {
      await inquiryApi.deleteAttachment(params.id, attachmentId);
      setExistingAttachments(existingAttachments.filter(a => a.id !== attachmentId));
      setSuccess('Attachment deleted successfully');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setError('Failed to delete attachment');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name || !formData.phone || !formData.block_id) {
      setError('Please fill in all required fields.');
      return;
    }
    // Validate inquiry_seaters if any are provided
    if (formData.inquiry_seaters && formData.inquiry_seaters.length > 0) {
      for (const seater of formData.inquiry_seaters) {
        if (!seater.room_id || !seater.capacity || seater.capacity < 1) {
          setError('Please provide valid room and capacity for all seater options.');
          return;
        }
      }
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await inquiryApi.updateInquiry(params.id, formData);
      setSuccess('Inquiry updated successfully!');
      setTimeout(() => {
        router.push('/admin/inquiry');
      }, 2000);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      if (error instanceof ApiError) {
        setError(`Failed to update inquiry: ${error.message}`);
      } else {
        setError('Failed to update inquiry. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Edit Inquiry</h1>
          <p className="text-sm text-gray-500 mt-1">Loading inquiry data...</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error && !inquiry) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
        <h1 className="text-xl font-medium text-gray-900">Edit Inquiry</h1>
        <p className="text-sm text-gray-500 mt-1">Modify inquiry details for {formData.name}</p>
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
          
          {/* Seater Options */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">Seater Options</h3>
              <button
                type="button"
                onClick={handleSeaterAdd}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Seater Option
              </button>
            </div>
            {formData.inquiry_seaters && formData.inquiry_seaters.length > 0 ? (
              <div className="space-y-3">
                {formData.inquiry_seaters.map((seater, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded bg-gray-50">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`room_id_${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                          Room
                        </label>
                        <input
                          type="text"
                          id={`room_id_${index}`}
                          value={seater.room_id}
                          onChange={(e) => handleSeaterChange(index, 'room_id', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`capacity_${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                          Beds Required
                        </label>
                        <input
                          type="number"
                          id={`capacity_${index}`}
                          value={seater.capacity}
                          min={1}
                          onChange={(e) => handleSeaterChange(index, 'capacity', parseInt(e.target.value) || 1)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleSeaterRemove(index)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="sr-only">Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                No seater options added. Use the button above to add seaters the student is interested in.
              </div>
            )}
          </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          
          {/* Existing Attachments */}
          {existingAttachments.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Current Files</h4>
              <ul className="space-y-2">
                {existingAttachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 truncate max-w-xs">{attachment.file_name}</span>
                    </div>
                    <div className="flex items-center">
                      <a 
                        href={`/storage/${attachment.file_path}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs mr-3"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => handleAttachmentDelete(attachment.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Add New Files */}
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-600 mb-2">Add New Files</h4>
            <div className="mt-1 sm:col-span-2">
              <div className="flex max-w-lg justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleAttachmentsChange(Array.from(e.target.files));
                          }
                        }}
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, JPEG, PNG up to 10MB</p>
                </div>
              </div>
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map((file, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-center">
                      <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-5">
          <CancelButton 
            onClick={() => router.push('/admin/inquiry')} 
            children="Cancel"
          />
          <SubmitButton 
            loading={isSubmitting} 
            loadingText="Updating..."
          >
            Update Inquiry
          </SubmitButton>
        </div>
      </form>
    </div>
  );
  
  // No helper functions needed as room selection has been removed
}
