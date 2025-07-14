"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { staffApi, type StaffFormData, type StaffAmenity } from '@/lib/api/staff.api';
import { ApiError } from '@/lib/api/core';
import { Button, FormField, CancelButton, SubmitButton, ImageModal } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

export default function EditStaff() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  
  // Form state
  const [formData, setFormData] = useState<StaffFormData>({
    staff_name: '',
    contact_number: '',
    email: '',
    date_of_birth: '',
    district: '',
    city_name: '',
    ward_no: '',
    street_name: '',
    citizenship_no: '',
    date_of_issue: '',
    citizenship_issued_district: '',
    educational_institution: '',
    level_of_study: '',
    blood_group: '',
    food: '',
    disease: '',
    father_name: '',
    father_contact: '',
    father_occupation: '',
    mother_name: '',
    mother_contact: '',
    mother_occupation: '',
    spouse_name: '',
    spouse_contact: '',
    spouse_occupation: '',
    local_guardian_name: '',
    local_guardian_address: '',
    local_guardian_contact: '',
    local_guardian_occupation: '',
    local_guardian_relation: '',
    is_active: true,
    staff_id: '',
    position: '',
    department: '',
    joining_date: '',
    salary_amount: '',
    employment_type: '',
    declaration_agreed: false,
    contract_agreed: false,
    verified_by: '',
    verified_on: '',
    amenities: []
  });
  
  // Form processing state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' });
  
  // Document state - Multiple file uploads
  const [citizenshipDocuments, setCitizenshipDocuments] = useState<File[]>([]);
  const [contractDocuments, setContractDocuments] = useState<File[]>([]);
  
  // Amenities state
  const [amenities, setAmenities] = useState<StaffAmenity[]>([]);

  // Load staff data
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        setIsLoading(true);
        const staff = await staffApi.getStaffMember(staffId);
        
        // Populate form data
        setFormData({
          staff_name: staff.staff_name || '',
          contact_number: staff.contact_number || '',
          email: staff.email || '',
          date_of_birth: staff.date_of_birth || '',
          district: staff.district || '',
          city_name: staff.city_name || '',
          ward_no: staff.ward_no || '',
          street_name: staff.street_name || '',
          citizenship_no: staff.citizenship_no || '',
          date_of_issue: staff.date_of_issue || '',
          citizenship_issued_district: staff.citizenship_issued_district || '',
          educational_institution: staff.educational_institution || '',
          level_of_study: staff.level_of_study || '',
          blood_group: staff.blood_group || '',
          food: staff.food || '',
          disease: staff.disease || '',
          father_name: staff.father_name || '',
          father_contact: staff.father_contact || '',
          father_occupation: staff.father_occupation || '',
          mother_name: staff.mother_name || '',
          mother_contact: staff.mother_contact || '',
          mother_occupation: staff.mother_occupation || '',
          spouse_name: staff.spouse_name || '',
          spouse_contact: staff.spouse_contact || '',
          spouse_occupation: staff.spouse_occupation || '',
          local_guardian_name: staff.local_guardian_name || '',
          local_guardian_address: staff.local_guardian_address || '',
          local_guardian_contact: staff.local_guardian_contact || '',
          local_guardian_occupation: staff.local_guardian_occupation || '',
          local_guardian_relation: staff.local_guardian_relation || '',
          is_active: staff.is_active !== undefined ? staff.is_active : true,
          staff_id: staff.staff_id || '',
          position: staff.position || '',
          department: staff.department || '',
          joining_date: staff.joining_date || '',
          salary_amount: staff.salary_amount || '',
          employment_type: staff.employment_type || '',
          declaration_agreed: staff.declaration_agreed || false,
          contract_agreed: staff.contract_agreed || false,
          verified_by: staff.verified_by || '',
          verified_on: staff.verified_on || '',
          amenities: []
        });

        // Set existing amenities
        if (staff.amenities && staff.amenities.length > 0) {
          setAmenities(staff.amenities);
        }

        // Set existing image preview
        if (staff.staff_image) {
          setImagePreview(staff.staff_image);
        }

      } catch (error) {
        console.error('Error loading staff data:', error);
        setErrors({
          submit: 'Failed to load staff data. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (staffId) {
      loadStaffData();
    }
  }, [staffId]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle amenity changes
  const handleAmenityChange = (index: number, field: keyof StaffAmenity, value: string) => {
    const updatedAmenities = [...amenities];
    updatedAmenities[index] = {
      ...updatedAmenities[index],
      [field]: value
    };
    setAmenities(updatedAmenities);
  };

  // Add new amenity field
  const addAmenity = () => {
    setAmenities([...amenities, { name: '', description: '' }]);
  };

  // Remove amenity field
  const removeAmenity = (index: number) => {
    const updatedAmenities = [...amenities];
    updatedAmenities.splice(index, 1);
    setAmenities(updatedAmenities);
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.staff_name.trim()) {
      newErrors.staff_name = 'Staff name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contact_number.trim())) {
      newErrors.contact_number = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Filter out empty amenities
    const filteredAmenities = amenities.filter(item => item.name.trim() !== '');
    
    try {
      // Update the staff member
      const staffFormData = {
        ...formData,
        amenities: filteredAmenities
      };
      
      const updatedStaff = await staffApi.updateStaff(staffId, staffFormData);

      // Redirect to staff detail on success
      router.push(`/admin/staff/${staffId}`);
    } catch (error) {
      console.error('Error updating staff:', error);
      
      if (error instanceof ApiError) {
        if (error.validation && Object.keys(error.validation).length > 0) {
          // Convert validation errors to our format
          const formattedErrors: Record<string, string> = {};
          
          Object.entries(error.validation).forEach(([field, messages]) => {
            formattedErrors[field] = Array.isArray(messages) ? messages[0] : messages;
          });
          
          setErrors({
            ...formattedErrors,
            submit: `Failed to update staff: ${error.message}`
          });
        } else {
          setErrors({
            submit: `Failed to update staff: ${error.message}`
          });
        }
      } else {
        setErrors({
          submit: 'An unexpected error occurred. Please try again later.'
        });
      }
      
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Clean Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Staff Member</h1>
          <p className="text-sm text-gray-600 mt-1">Update staff member information</p>
        </div>

        {/* Error Alert */}
        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{errors.submit}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Staff Name */}
                <FormField
                  name="staff_name"
                  label="Staff Name"
                  required
                  value={formData.staff_name}
                  onChange={handleInputChange}
                  error={errors.staff_name}
                  placeholder="Enter full name"
                />
                
                {/* Email */}
                <FormField
                  name="email"
                  label="Email Address"
                  required
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  placeholder="Enter email address"
                />
                
                {/* Contact Number */}
                <FormField
                  name="contact_number"
                  label="Contact Number"
                  required
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  error={errors.contact_number}
                  placeholder="Enter 10-digit phone number"
                />

                {/* Active Status */}
                <div className="flex items-center mt-4">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.is_active || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-semibold text-neutral-900">Active Staff Member</label>
                </div>
              </div>
            </div>

            {/* Staff Amenities */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Staff Amenities</h2>
                <Button 
                  type="button" 
                  onClick={addAmenity}
                  variant="secondary"
                  size="sm"
                >
                  Add Amenity
                </Button>
              </div>
              
              <div className="space-y-4">
                {amenities.length > 0 ? (
                  amenities.map((amenity, index) => (
                    <div key={index} className="flex space-x-4 items-start">
                      <div className="flex-1">
                        <FormField
                          name={`amenity_name_${index}`}
                          label={`Amenity ${index + 1} Name`}
                          placeholder="Enter amenity name"
                          value={amenity.name}
                          onChange={(e) => handleAmenityChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <FormField
                          name={`amenity_description_${index}`}
                          label={`Amenity ${index + 1} Description`}
                          placeholder="Enter amenity description"
                          value={amenity.description || ''}
                          onChange={(e) => handleAmenityChange(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          variant="secondary"
                          size="sm"
                          className="mb-2"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic">No amenities added. Click "Add Amenity" to add staff amenities.</p>
                )}
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-4">
              <CancelButton onClick={() => router.push(`/admin/staff/${staffId}`)} />
              <SubmitButton 
                loading={isSubmitting} 
                loadingText="Updating..."
              >
                Update Staff Member
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
