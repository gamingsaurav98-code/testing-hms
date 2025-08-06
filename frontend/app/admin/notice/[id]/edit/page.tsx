"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  noticeApi, 
  NoticeFormData, 
  Notice, 
  blockApi, 
  studentApi, 
  StudentForNotice, 
  StaffForNotice, 
  BlockForNotice 
} from '@/lib/api';
import { 
  FormField, 
  SubmitButton, 
  CancelButton, 
  MultipleImageUploadEdit,
  ImageModal
} from '@/components/ui';
import { AlertCircle } from 'lucide-react';

interface ExistingAttachment {
  id: number;
  image: string;
  is_primary: boolean;
  name?: string;
  type?: string;
}

export default function EditNotice() {
  const router = useRouter();
  const { id } = useParams();
  const noticeId = Array.isArray(id) ? id[0] : id || '';
  
  // Initialize states for students, staff, and blocks
  const [students, setStudents] = useState<StudentForNotice[]>([]);
  const [staff, setStaff] = useState<StaffForNotice[]>([]);
  const [blocks, setBlocks] = useState<BlockForNotice[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<{
    students: boolean;
    staff: boolean;
    blocks: boolean;
  }>({ students: false, staff: false, blocks: false });
  
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    description: '',
    schedule_time: new Date().toISOString().split('T')[0] + 'T' + 
      new Date().toTimeString().split(' ')[0].substring(0, 5),
    target_type: 'all',
    notice_type: 'general',
    status: 'active',
    notice_attachments: [],
    student_id: 0,
    staff_id: 0,
    block_id: 0,
  });
  
  const [showScheduleDate, setShowScheduleDate] = useState(false);
  const [originalNotice, setOriginalNotice] = useState<Notice | null>(null);
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' });

  // Fetch notice data on component mount
  useEffect(() => {
    if (!noticeId) {
      setErrors({ submit: 'Notice ID is missing' });
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoadingData({
          students: true,
          staff: true,
          blocks: true
        });
        
        // Fetch notice data first
        const noticeData = await noticeApi.getNotice(noticeId);
        setOriginalNotice(noticeData);
        
        // Check if we should show schedule date field
        let formattedScheduleTime = '';
        let shouldShowScheduleDate = false;
        
        if (noticeData.schedule_time) {
          const scheduleDate = new Date(noticeData.schedule_time);
          const currentDate = new Date();
          
          // Only show schedule date if it's in the future
          if (scheduleDate > currentDate) {
            shouldShowScheduleDate = true;
            formattedScheduleTime = scheduleDate.toISOString().slice(0, 16);
          }
        }
        
        setShowScheduleDate(shouldShowScheduleDate);
        
        // Now fetch the students, staff, and blocks data using the appropriate API methods
        try {
          const studentsResponse = await noticeApi.getStudentsForNotice('');
          setStudents(studentsResponse.data);
        } catch (error) {
          console.error('Error fetching students:', error);
        } finally {
          setIsLoadingData(prev => ({ ...prev, students: false }));
        }
        
        try {
          const staffResponse = await noticeApi.getStaffForNotice('');
          setStaff(staffResponse.data);
        } catch (error) {
          console.error('Error fetching staff:', error);
        } finally {
          setIsLoadingData(prev => ({ ...prev, staff: false }));
        }
        
        try {
          const blocksResponse = await noticeApi.getBlocksForNotice('');
          setBlocks(blocksResponse.data);
        } catch (error) {
          console.error('Error fetching blocks:', error);
        } finally {
          setIsLoadingData(prev => ({ ...prev, blocks: false }));
        }
        
        // Set form data
        setFormData({
          title: noticeData.title,
          description: noticeData.description,
          schedule_time: shouldShowScheduleDate ? formattedScheduleTime : undefined,
          target_type: noticeData.target_type,
          notice_type: noticeData.notice_type || 'general',
          status: noticeData.status || 'active',
          notice_attachments: [],
          student_id: noticeData.student_id || null,
          staff_id: noticeData.staff_id || null,
          block_id: noticeData.block_id || null,
        });

        // Set existing attachments
        if (noticeData.attachments && noticeData.attachments.length > 0) {
          const mappedAttachments = noticeData.attachments.map(attachment => ({
            id: attachment.id,
            image: attachment.path,
            is_primary: false,
            name: attachment.name,
            type: attachment.type,
          }));
          
          setExistingAttachments(mappedAttachments);
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setErrors({
          submit: error.message || 'Error loading data. Please try again.'
        });
        setIsLoading(false);
      }
    };

    fetchData();
  }, [noticeId]);

  // Auto-resize textarea function
  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${Math.max(element.scrollHeight, 56)}px`;
  };

  // Auto-resize description textarea when data is loaded
  useEffect(() => {
    const textarea = document.getElementById('description') as HTMLTextAreaElement;
    if (textarea && formData.description) {
      setTimeout(() => {
        autoResizeTextarea(textarea);
      }, 0);
    }
  }, [formData.description]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert ID fields to numbers if they're not empty
    if (['student_id', 'staff_id', 'block_id'].includes(name) && value) {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addAttachments = (files: File[]) => {
    setAttachments(prev => [...prev, ...files]);
    setFormData(prev => ({
      ...prev,
      notice_attachments: [...(prev.notice_attachments || []), ...files]
    }));
    
    // Clear error if it exists
    if (errors.notice_attachments) {
      setErrors(prev => ({
        ...prev,
        notice_attachments: ''
      }));
    }
  };

  const removeAttachment = (index: number) => {
    const updatedAttachments = [...attachments];
    updatedAttachments.splice(index, 1);
    setAttachments(updatedAttachments);
    
    setFormData(prev => ({
      ...prev,
      notice_attachments: updatedAttachments
    }));
  };

  const removeExistingAttachment = (id: number) => {
    setRemovedAttachmentIds(prev => [...prev, id]);
    setExistingAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (showScheduleDate && !formData.schedule_time) {
      newErrors.schedule_time = 'Schedule time is required';
    }

    if (!formData.target_type) {
      newErrors.target_type = 'Target audience is required';
    }
    
    // Validate specific target selections
    if (formData.target_type === 'specific_student' && !formData.student_id) {
      newErrors.student_id = 'Please select a student';
    }
    
    if (formData.target_type === 'specific_staff' && !formData.staff_id) {
      newErrors.staff_id = 'Please select a staff member';
    }
    
    if (formData.target_type === 'block' && !formData.block_id) {
      newErrors.block_id = 'Please select a block';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!noticeId) {
      setErrors({ submit: 'Notice ID is missing. Cannot update.' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Make sure IDs are properly formatted
      const processedFormData: any = {
        title: formData.title,
        description: formData.description,
        target_type: formData.target_type,
        notice_type: formData.notice_type,
        status: formData.status,
        notice_attachments: formData.notice_attachments,
        // Make sure null or empty string IDs are sent as null
        student_id: formData.target_type === 'specific_student' ? formData.student_id || null : null,
        staff_id: formData.target_type === 'specific_staff' ? formData.staff_id || null : null,
        block_id: formData.target_type === 'block' ? formData.block_id || null : null,
        removed_attachments: removedAttachmentIds
      };
      
      // Only include schedule_time if it should be shown and updated
      if (showScheduleDate && formData.schedule_time) {
        processedFormData.schedule_time = formData.schedule_time;
      }
      
      console.log('Submitting notice data:', processedFormData);
      await noticeApi.updateNotice(noticeId, processedFormData as any);
      
      // Redirect back to notice details page
      router.push(`/admin/notice/${noticeId}`);
      
    } catch (error: any) {
      console.error('Error updating notice:', error);
      if (error.validation) {
        // Handle validation errors from the API
        const validationErrors: Record<string, string> = {};
        Object.entries(error.validation).forEach(([field, messages]) => {
          validationErrors[field] = Array.isArray(messages) ? messages[0] : messages as string;
        });
        setErrors(validationErrors);
      } else {
        setErrors({
          submit: error.message || 'An error occurred while updating the notice. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Notice</h1>
          
          {/* Status Switch - Only Toggle */}
          <div className="flex items-center space-x-3">
            <span className={`text-sm transition-colors ${formData.status === 'inactive' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Inactive
            </span>
            <button
              type="button"
              onClick={() => {
                const newStatus = formData.status === 'active' ? 'inactive' : 'active';
                setFormData(prev => ({ ...prev, status: newStatus }));
                if (errors.status) {
                  setErrors(prev => ({ ...prev, status: '' }));
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:shadow-md ${
                formData.status === 'active' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title={`Switch to ${formData.status === 'active' ? 'inactive' : 'active'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                  formData.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm transition-colors ${formData.status === 'active' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Active
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Notice Title */}
                <FormField
                  name="title"
                  label="Notice Title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  error={errors.title}
                  placeholder="Enter notice title"
                />

                {/* Notice Description */}
                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-semibold text-neutral-900">
                    Notice Description <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => {
                      handleInputChange(e);
                      const target = e.target as HTMLTextAreaElement;
                      if (target.scrollHeight > 56) {
                        autoResizeTextarea(target);
                      } else {
                        target.style.height = '56px';
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      if (target.scrollHeight > 56) {
                        autoResizeTextarea(target);
                      } else {
                        target.style.height = '56px';
                      }
                    }}
                    placeholder="Enter notice description"
                    className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200 resize-none overflow-hidden"
                    style={{ minHeight: '56px', height: '56px' }}
                    rows={1}
                  />
                  {errors.description && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-2" />
                      {errors.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Schedule Date/Time - Only show if notice originally had schedule time and it's in the future */}
                {showScheduleDate && (
                  <div className="space-y-1.5">
                    <label htmlFor="schedule_time" className="block text-sm font-semibold text-neutral-900">
                      Schedule Date <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="schedule_time"
                      name="schedule_time"
                      value={formData.schedule_time || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                    />
                    {errors.schedule_time && (
                      <div className="flex items-center mt-1.5 text-xs text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 mr-2" />
                        {errors.schedule_time}
                      </div>
                    )}
                  </div>
                )}

                {/* Target Audience */}
                <FormField
                  name="target_type"
                  label="Send Notice To"
                  type="select"
                  required
                  value={formData.target_type}
                  onChange={handleInputChange}
                  error={errors.target_type}
                  options={[
                    { value: 'all', label: 'Everyone' },
                    { value: 'student', label: 'All Students' },
                    { value: 'staff', label: 'All Staff' },
                    { value: 'specific_student', label: 'Specific Student' },
                    { value: 'specific_staff', label: 'Specific Staff' },
                    { value: 'block', label: 'Specific Block' }
                  ]}
                />

                {/* Notice Type */}
                <FormField
                  name="notice_type"
                  label="Notice Type"
                  type="select"
                  value={formData.notice_type || ''}
                  onChange={handleInputChange}
                  error={errors.notice_type}
                  options={[
                    { value: 'general', label: 'General' },
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'event', label: 'Event' },
                    { value: 'announcement', label: 'Announcement' }
                  ]}
                />
              </div>
            </div>

            {/* Full Width Sections */}
            <div className="space-y-6 mt-8">
              {/* Conditional Field for Specific Student */}
              {formData.target_type === 'specific_student' && (
                <FormField
                  name="student_id"
                  label="Select Student"
                  type="select"
                  required
                  value={formData.student_id ? formData.student_id.toString() : ''}
                  onChange={handleInputChange}
                  error={errors.student_id}
                  options={[
                    { value: '', label: '-- Select a student --' },
                    ...students.map(student => ({
                      value: student.id.toString(),
                      label: `${student.name} ${student.room && student.room.block ? `(${student.room.block.name}, Room: ${student.room.room_number})` : ''}`
                    }))
                  ]}
                />
              )}

              {/* Conditional Field for Specific Staff */}
              {formData.target_type === 'specific_staff' && (
                <FormField
                  name="staff_id"
                  label="Select Staff"
                  type="select"
                  required
                  value={formData.staff_id ? formData.staff_id.toString() : ''}
                  onChange={handleInputChange}
                  error={errors.staff_id}
                  options={[
                    { value: '', label: '-- Select a staff member --' },
                    ...staff.map(staffMember => ({
                      value: staffMember.id.toString(),
                      label: `${staffMember.name} (${staffMember.staff_id || 'No ID'})`
                    }))
                  ]}
                />
              )}

              {/* Conditional Field for Block */}
              {formData.target_type === 'block' && (
                <FormField
                  name="block_id"
                  label="Select Block"
                  type="select"
                  required
                  value={formData.block_id ? formData.block_id.toString() : ''}
                  onChange={handleInputChange}
                  error={errors.block_id}
                  options={[
                    { value: '', label: '-- Select a block --' },
                    ...blocks.map(block => ({
                      value: block.id.toString(),
                      label: `${block.name} - ${block.location || 'No location'}`
                    }))
                  ]}
                />
              )}

              {/* Attachments */}
              <div>
                <MultipleImageUploadEdit
                  images={attachments}
                  existingImages={existingAttachments}
                  removedImageIds={removedAttachmentIds}
                  onAddImages={addAttachments}
                  onRemoveImage={removeAttachment}
                  onRemoveExistingImage={removeExistingAttachment}
                  error={errors.notice_attachments}
                  label="Attachments"
                  onImageClick={(imageUrl, alt) => {
                    setSelectedImage({ url: imageUrl, alt });
                    setImageModalOpen(true);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, Images - Max 2MB each
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
              <CancelButton onClick={() => router.back()} />
              <SubmitButton 
                loading={isSubmitting} 
                loadingText="Updating..."
              >
                Update Notice
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        show={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={selectedImage.url}
        alt={selectedImage.alt}
      />
    </div>
  );
}
