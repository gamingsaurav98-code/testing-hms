"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { staffApi, type StaffWithAmenities } from '@/lib/api/staff.api';
import { ApiError } from '@/lib/api/core';
import { Button, ImageModal } from '@/components/ui';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Edit
} from 'lucide-react';

export default function StaffDetail() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  
  // State
  const [staff, setStaff] = useState<StaffWithAmenities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Load staff data
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        setIsLoading(true);
        const staffData = await staffApi.getStaffMember(staffId);
        setStaff(staffData);
      } catch (error) {
        console.error('Error loading staff data:', error);
        setError('Failed to load staff data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (staffId) {
      loadStaffData();
    }
  }, [staffId]);

  // Handle delete
  const handleDelete = async () => {
    if (!staff || !confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await staffApi.deleteStaff(staff.id);
      router.push('/admin/staff');
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError('Failed to delete staff member. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Staff member not found'}</p>
          <Button onClick={() => router.push('/admin/staff')}>
            Back to Staff List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/staff')}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Staff List
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{staff.staff_name}</h1>
              <p className="text-sm text-gray-600">Staff ID: {staff.staff_id || 'Not set'}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => router.push(`/admin/staff/${staff.id}/edit`)}
              variant="secondary"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              ❌
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Staff Photo and Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              {/* Staff Photo */}
              <div className="text-center mb-6">
                {staff.staff_image ? (
                  <img
                    src={staff.staff_image}
                    alt={staff.staff_name}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200 cursor-pointer"
                    onClick={() => {
                      setSelectedImage({ url: staff.staff_image!, alt: staff.staff_name });
                      setImageModalOpen(true);
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <h2 className="text-xl font-semibold text-gray-900 mt-4">{staff.staff_name}</h2>
                <p className="text-gray-600">{staff.position || 'Position not set'}</p>
                <p className="text-sm text-gray-500">{staff.department || 'Department not set'}</p>
              </div>

              {/* Status */}
              <div className="text-center mb-6">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  staff.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {staff.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Quick Contact */}
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  📧
                  <span className="text-gray-600">{staff.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  📱
                  <span className="text-gray-600">{staff.contact_number}</span>
                </div>
                {staff.date_of_birth && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">{new Date(staff.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                {(staff.district || staff.city_name) && (
                  <div className="flex items-center text-sm">
                    📍
                    <span className="text-gray-600">
                      {[staff.district, staff.city_name].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            {/* Job Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-4">
                💼
                <h3 className="text-lg font-medium text-gray-900">Job Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="text-gray-900">{staff.position || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-gray-900">{staff.department || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employment Type</label>
                  <p className="text-gray-900">{staff.employment_type || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Joining Date</label>
                  <p className="text-gray-900">
                    {staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                {staff.salary_amount && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Salary</label>
                    <p className="text-gray-900">NPR {staff.salary_amount}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{staff.staff_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{staff.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Number</label>
                  <p className="text-gray-900">{staff.contact_number}</p>
                </div>
                {staff.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">{new Date(staff.date_of_birth).toLocaleDateString()}</p>
                  </div>
                )}
                {staff.blood_group && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Blood Group</label>
                    <p className="text-gray-900">{staff.blood_group}</p>
                  </div>
                )}
                {staff.food && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Food Preference</label>
                    <p className="text-gray-900 capitalize">{staff.food}</p>
                  </div>
                )}
              </div>
              {staff.disease && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Health Information</label>
                  <p className="text-gray-900">{staff.disease}</p>
                </div>
              )}
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-4">
                📍
                <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">District</label>
                  <p className="text-gray-900">{staff.district || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-gray-900">{staff.city_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ward No.</label>
                  <p className="text-gray-900">{staff.ward_no || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Street</label>
                  <p className="text-gray-900">{staff.street_name || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Staff Amenities */}
            {staff.amenities && staff.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center mb-4">
                  ❤️
                  <h3 className="text-lg font-medium text-gray-900">Staff Amenities</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staff.amenities.map((amenity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{amenity.name}</h4>
                      {amenity.description && (
                        <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
