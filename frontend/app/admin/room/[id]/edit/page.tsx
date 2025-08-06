"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { roomApi, RoomFormData, Room, ApiError } from '@/lib/api/index';
import { 
  Button, 
  FormField, 
  SubmitButton, 
  CancelButton, 
  TableSkeleton, 
  ImageModal,
  SingleImageUploadEdit
} from '@/components/ui';
import { getImageUrl } from '@/lib/utils';

export default function EditRoom() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const [formData, setFormData] = useState<RoomFormData>({
    room_name: '',
    block_id: '',
    capacity: 0,
    room_type: '',
    room_attachment: null,
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [blocks, setBlocks] = useState<{id: string, block_name: string}[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' });

  // Fetch room and dropdowns data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch room data
        const room = await roomApi.getRoom(roomId);
        setCurrentRoom(room);
        
        // Fetch blocks for dropdown
        const blocksData = await roomApi.getBlocks();
        // Ensure blocksData is an array
        setBlocks(Array.isArray(blocksData) ? blocksData : []);
        
        // Set form data
        setFormData({
          room_name: room.room_name,
          block_id: room.block_id,
          capacity: room.capacity,
          room_type: room.room_type,
          room_attachment: null,
        });

        // Set existing image preview if available
        if (room.room_attachment) {
          const imageUrl = getImageUrl(room.room_attachment);
          setImagePreview(imageUrl);
        }
        
      } catch (error) {
        console.error('Error fetching room data:', error);
        if (error instanceof ApiError) {
          setErrors({
            fetch: `Failed to load room: ${error.message}`
          });
        } else {
          setErrors({
            fetch: 'Failed to load room data. Please try again.'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'room_type') {
      // Auto-set capacity based on room type
      let capacity = 0;
      switch (value) {
        case 'single':
          capacity = 1;
          break;
        case 'double':
          capacity = 2;
          break;
        case 'triple':
          capacity = 3;
          break;
        case 'quad':
          capacity = 4;
          break;
        default:
          capacity = 0;
      }
      
      // Only auto-update capacity if there are no students or if the new capacity is greater
      const currentOccupancy = currentRoom?.students?.length || 0;
      if (currentOccupancy === 0 || capacity >= currentOccupancy) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          capacity: capacity
        }));
      } else {
        // Just update the room type, not the capacity (can't reduce below occupancy)
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        
        // Add an error to notify user
        setErrors(prev => ({
          ...prev,
          capacity: `Cannot reduce capacity below current occupancy (${currentOccupancy} students)`
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'capacity' ? parseInt(value) || 0 : value
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

  const processFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        room_attachment: 'Please select a valid image file (JPG, JPEG, PNG)'
      }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        room_attachment: 'File size must be less than 5MB'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      room_attachment: file
    }));

    // Create preview for images
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear file error
    if (errors.room_attachment) {
      setErrors(prev => ({
        ...prev,
        room_attachment: ''
      }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      room_attachment: null
    }));
    setImagePreview(null);
    const fileInput = document.getElementById('room_attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.room_name.trim()) {
      newErrors.room_name = 'Room name is required';
    }

    if (!formData.block_id) {
      newErrors.block_id = 'Block is required';
    }

    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }

    // Status is now handled automatically

    if (!formData.room_type) {
      newErrors.room_type = 'Room type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageClick = (url: string, alt: string) => {
    setSelectedImage({ url, alt });
    setImageModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await roomApi.updateRoom(roomId, formData);
      
      // Redirect to rooms list on success
      router.push('/admin/room');
      
    } catch (error) {
      console.error('Error updating room:', error);
      if (error instanceof ApiError) {
        setErrors({
          submit: `Failed to update room: ${error.message}`
        });
      } else {
        setErrors({
          submit: 'An error occurred while updating the room. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Edit Room</h1>
          <p className="text-sm text-gray-500 mt-1">Loading room data...</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{errors.fetch}</p>
          </div>
          <button
            onClick={() => router.push('/admin/room')}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-5xl mx-auto">
        {/* Clean Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Room</h1>
        </div>

        {/* Modern Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-4">
            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Room Name */}
              <FormField
                name="room_name"
                label="Room Name"
                required
                value={formData.room_name}
                onChange={handleInputChange}
                error={errors.room_name}
                placeholder="Enter room name"
              />

              {/* Room Type */}
              <div>
                <label htmlFor="room_type" className="block text-sm font-semibold text-neutral-900">
                  Room Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="room_type"
                  name="room_type"
                  value={formData.room_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                >
                  <option value="">Select room type</option>
                  <option value="single">Single Seater</option>
                  <option value="double">Double Seater</option>
                  <option value="triple">Three Seater</option>
                  <option value="quad">Four Seater</option>
                </select>
                {errors.room_type && (
                  <div className="flex items-center mt-1.5 text-xs text-red-600">
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.room_type}
                  </div>
                )}
              </div>

              {/* Block */}
              <div>
                <label htmlFor="block_id" className="block text-sm font-semibold text-neutral-900">
                  Block <span className="text-red-500">*</span>
                </label>
                <select
                  id="block_id"
                  name="block_id"
                  value={formData.block_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                >
                  <option value="">Select block</option>
                  {Array.isArray(blocks) && blocks.map(block => (
                    <option key={block.id} value={block.id}>{block.block_name}</option>
                  ))}
                </select>
                {errors.block_id && (
                  <div className="flex items-center mt-1.5 text-xs text-red-600">
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.block_id}
                  </div>
                )}
              </div>

              {/* Capacity - Now spans 1.5 columns */}
              <div className="lg:col-span-2">
                <label htmlFor="capacity" className="block text-sm font-semibold text-neutral-900">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity.toString()}
                  onChange={handleInputChange}
                  disabled={formData.room_type === 'single' || formData.room_type === 'double' || formData.room_type === 'triple' || formData.room_type === 'quad'}
                  min={currentRoom?.students?.length || 1}
                  placeholder="Enter room capacity"
                  className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                />
                {errors.capacity && (
                  <div className="flex items-center mt-1.5 text-xs text-red-600">
                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.capacity}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {currentRoom?.students?.length 
                    ? `Current occupancy: ${currentRoom.students.length} students. Capacity cannot be reduced below this.`
                    : 'Capacity is automatically set based on room type.'}
                </p>
              </div>



              {/* File Upload - Full Width */}
              <div className="lg:col-span-3 space-y-1">
                <label className="block text-sm font-medium text-gray-900">Room Image</label>
                
                <SingleImageUploadEdit
                  imagePreview={imagePreview}
                  existingImageUrl={currentRoom?.room_attachment ? getImageUrl(currentRoom.room_attachment) : null}
                  onFileSelect={processFile}
                  onRemove={removeImage}
                  error={errors.room_attachment}
                  label=""
                  onImageClick={(imageUrl, alt) => {
                    setSelectedImage({ url: imageUrl, alt });
                    setImageModalOpen(true);
                  }}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
              <CancelButton onClick={() => router.push('/admin/room')} />
              <SubmitButton 
                loading={isSubmitting}
                loadingText="Updating..."
              >
                Update Room
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
