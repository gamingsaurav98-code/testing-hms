"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { staffApi, type StaffFormData, type StaffAmenity } from '@/lib/api/staff.api';
import { ApiError } from '@/lib/api/core';
import { Button, FormField, CancelButton, SubmitButton, ImageModal } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

export default function CreateStaff() {
  const router = useRouter();
  
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

  // Process staff image file
  const processFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        staff_image: 'Please select a valid image file (JPG, JPEG, PNG)'
      }));
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        staff_image: 'File size must be less than 2MB'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      staff_image: file
    }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear any existing error
    setErrors(prev => ({
      ...prev,
      staff_image: ''
    }));
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Validate citizenship file
  const validateCitizenshipFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        staff_citizenship_image: 'Please select a valid image file (JPG, JPEG, PNG)'
      }));
      return false;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        staff_citizenship_image: 'File size must be less than 2MB'
      }));
      return false;
    }

    // Clear citizenship error
    if (errors.staff_citizenship_image) {
      setErrors(prev => ({
        ...prev,
        staff_citizenship_image: ''
      }));
    }
    
    return true;
  };

  // Add citizenship documents
  const addCitizenshipDocuments = (files: File[]) => {
    const validFiles = files.filter(file => validateCitizenshipFile(file));
    if (validFiles.length > 0) {
      setCitizenshipDocuments(prev => [...prev, ...validFiles]);
    }
  };

  // Remove citizenship image
  const removeCitizenshipImage = (index: number) => {
    setCitizenshipDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Validate contract file
  const validateContractFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        staff_contract_image: 'Please select a valid image file (JPG, JPEG, PNG)'
      }));
      return false;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        staff_contract_image: 'File size must be less than 2MB'
      }));
      return false;
    }

    // Clear contract error
    if (errors.staff_contract_image) {
      setErrors(prev => ({
        ...prev,
        staff_contract_image: ''
      }));
    }
    
    return true;
  };

  // Add contract documents
  const addContractDocuments = (files: File[]) => {
    const validFiles = files.filter(file => validateContractFile(file));
    if (validFiles.length > 0) {
      setContractDocuments(prev => [...prev, ...validFiles]);
    }
  };

  // Remove contract image
  const removeContractImage = (index: number) => {
    setContractDocuments(prev => prev.filter((_, i) => i !== index));
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
    
    // Staff amenities are optional - no validation required

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
      // Create the staff member
      const staffFormData = {
        ...formData,
        amenities: filteredAmenities,
        staff_citizenship_image: citizenshipDocuments.length > 0 ? citizenshipDocuments[0] : null,
        staff_contract_image: contractDocuments.length > 0 ? contractDocuments[0] : null
      };
      
      const createdStaff = await staffApi.createStaff(staffFormData);

      // Redirect to staff list on success
      router.push('/admin/staff');
    } catch (error) {
      console.error('Error creating staff:', error);
      
      if (error instanceof ApiError) {
        if (error.validation && Object.keys(error.validation).length > 0) {
          // Convert validation errors to our format
          const formattedErrors: Record<string, string> = {};
          
          Object.entries(error.validation).forEach(([field, messages]) => {
            formattedErrors[field] = Array.isArray(messages) ? messages[0] : messages;
          });
          
          setErrors({
            ...formattedErrors,
            submit: `Failed to create staff: ${error.message}`
          });
        } else {
          setErrors({
            submit: `Failed to create staff: ${error.message}`
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

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Clean Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Add New Staff Member</h1>
          <p className="text-sm text-gray-600 mt-1">Enter staff details to register a new staff member</p>
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
          <form onSubmit={handleSubmit} className="p-4">
          <div className="p-6">
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
                
                {/* Date of Birth */}
                <FormField
                  name="date_of_birth"
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={handleInputChange}
                  error={errors.date_of_birth}
                  placeholder="YYYY-MM-DD"
                />
                
                {/* Blood Group */}
                <FormField
                  name="blood_group"
                  label="Blood Group"
                  type="select"
                  value={formData.blood_group || ''}
                  onChange={handleInputChange}
                  error={errors.blood_group}
                  options={[
                    { value: '', label: 'Select Blood Group' },
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' }
                  ]}
                />

                {/* Staff Photo Upload */}
                <div className="form-field">
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Staff Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {errors.staff_image && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-2" />
                      {errors.staff_image}
                    </div>
                  )}
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Staff Preview"
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => {
                          setSelectedImage({ url: imagePreview, alt: 'Staff Photo Preview' });
                          setImageModalOpen(true);
                        }}
                      />
                    </div>
                  )}
                </div>

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

            {/* Job Information */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Job Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Staff ID */}
                <FormField
                  name="staff_id"
                  label="Staff ID"
                  value={formData.staff_id || ''}
                  onChange={handleInputChange}
                  error={errors.staff_id}
                  placeholder="Enter staff ID"
                />
                
                {/* Position */}
                <FormField
                  name="position"
                  label="Position"
                  value={formData.position || ''}
                  onChange={handleInputChange}
                  error={errors.position}
                  placeholder="e.g., Manager, Assistant, Guard"
                />
                
                {/* Department */}
                <FormField
                  name="department"
                  label="Department"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  error={errors.department}
                  placeholder="e.g., Administration, Security, Maintenance"
                />
                
                {/* Employment Type */}
                <FormField
                  name="employment_type"
                  label="Employment Type"
                  type="select"
                  value={formData.employment_type || ''}
                  onChange={handleInputChange}
                  error={errors.employment_type}
                  options={[
                    { value: '', label: 'Select Employment Type' },
                    { value: 'full-time', label: 'Full-time' },
                    { value: 'part-time', label: 'Part-time' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'intern', label: 'Intern' }
                  ]}
                />
                
                {/* Joining Date */}
                <FormField
                  name="joining_date"
                  label="Joining Date"
                  type="date"
                  value={formData.joining_date || ''}
                  onChange={handleInputChange}
                  error={errors.joining_date}
                />
                
                {/* Salary Amount */}
                <FormField
                  name="salary_amount"
                  label="Salary Amount"
                  value={formData.salary_amount || ''}
                  onChange={handleInputChange}
                  error={errors.salary_amount}
                  placeholder="Enter monthly salary"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* District */}
                <FormField
                  name="district"
                  label="District"
                  value={formData.district || ''}
                  onChange={handleInputChange}
                  error={errors.district}
                  placeholder="Enter district"
                />
                
                {/* City */}
                <FormField
                  name="city_name"
                  label="City"
                  value={formData.city_name || ''}
                  onChange={handleInputChange}
                  error={errors.city_name}
                  placeholder="Enter city name"
                />
                
                {/* Ward No */}
                <FormField
                  name="ward_no"
                  label="Ward No."
                  value={formData.ward_no || ''}
                  onChange={handleInputChange}
                  error={errors.ward_no}
                  placeholder="Enter ward number"
                />
                
                {/* Street Name */}
                <FormField
                  name="street_name"
                  label="Street Name"
                  value={formData.street_name || ''}
                  onChange={handleInputChange}
                  error={errors.street_name}
                  placeholder="Enter street name"
                />
              </div>
            </div>

            {/* Citizenship Information */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Citizenship Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Citizenship Number */}
                <FormField
                  name="citizenship_no"
                  label="Citizenship Number"
                  value={formData.citizenship_no || ''}
                  onChange={handleInputChange}
                  error={errors.citizenship_no}
                  placeholder="Enter citizenship number"
                />
                
                {/* Date of Issue */}
                <FormField
                  name="date_of_issue"
                  label="Date of Issue"
                  type="date"
                  value={formData.date_of_issue || ''}
                  onChange={handleInputChange}
                  error={errors.date_of_issue}
                />
                
                {/* Issued District */}
                <FormField
                  name="citizenship_issued_district"
                  label="Issued District"
                  value={formData.citizenship_issued_district || ''}
                  onChange={handleInputChange}
                  error={errors.citizenship_issued_district}
                  placeholder="Enter district where citizenship was issued"
                />
              </div>
            </div>

            {/* Education Information */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Education Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Educational Institution */}
                <FormField
                  name="educational_institution"
                  label="Educational Institution"
                  value={formData.educational_institution || ''}
                  onChange={handleInputChange}
                  error={errors.educational_institution}
                  placeholder="e.g., Tribhuvan University"
                />
                
                {/* Level of Study */}
                <FormField
                  name="level_of_study"
                  label="Level of Study"
                  value={formData.level_of_study || ''}
                  onChange={handleInputChange}
                  error={errors.level_of_study}
                  placeholder="e.g., Bachelors, Masters"
                />
              </div>
            </div>

            {/* Health Information */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Health Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Food Preference */}
                <FormField
                  name="food"
                  label="Food Preference"
                  type="select"
                  value={formData.food || ''}
                  onChange={handleInputChange}
                  error={errors.food}
                  options={[
                    { value: 'vegetarian', label: 'Vegetarian' },
                    { value: 'non-vegetarian', label: 'Non-vegetarian' },
                    { value: 'egg-only', label: 'Egg Only' }
                  ]}
                />
                
                {/* Disease/Health Issues */}
                <div className="md:col-span-2">
                  <FormField
                    name="disease"
                    label="Disease or Health Issues (if any)"
                    type="textarea"
                    value={formData.disease || ''}
                    onChange={handleInputChange}
                    error={errors.disease}
                    placeholder="Enter any health conditions or allergies"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Family Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Father's Information */}
                <FormField
                  name="father_name"
                  label="Father's Name"
                  value={formData.father_name || ''}
                  onChange={handleInputChange}
                  error={errors.father_name}
                  placeholder="Enter father's full name"
                />
                
                <FormField
                  name="father_contact"
                  label="Father's Contact"
                  value={formData.father_contact || ''}
                  onChange={handleInputChange}
                  error={errors.father_contact}
                  placeholder="Enter father's phone number"
                />
                
                <FormField
                  name="father_occupation"
                  label="Father's Occupation"
                  value={formData.father_occupation || ''}
                  onChange={handleInputChange}
                  error={errors.father_occupation}
                  placeholder="Enter father's occupation"
                />

                {/* Mother's Information */}
                <FormField
                  name="mother_name"
                  label="Mother's Name"
                  value={formData.mother_name || ''}
                  onChange={handleInputChange}
                  error={errors.mother_name}
                  placeholder="Enter mother's full name"
                />
                
                <FormField
                  name="mother_contact"
                  label="Mother's Contact"
                  value={formData.mother_contact || ''}
                  onChange={handleInputChange}
                  error={errors.mother_contact}
                  placeholder="Enter mother's phone number"
                />
                
                <FormField
                  name="mother_occupation"
                  label="Mother's Occupation"
                  value={formData.mother_occupation || ''}
                  onChange={handleInputChange}
                  error={errors.mother_occupation}
                  placeholder="Enter mother's occupation"
                />

                {/* Spouse Information */}
                <FormField
                  name="spouse_name"
                  label="Spouse's Name"
                  value={formData.spouse_name || ''}
                  onChange={handleInputChange}
                  error={errors.spouse_name}
                  placeholder="Enter spouse's full name (if applicable)"
                />
                
                <FormField
                  name="spouse_contact"
                  label="Spouse's Contact"
                  value={formData.spouse_contact || ''}
                  onChange={handleInputChange}
                  error={errors.spouse_contact}
                  placeholder="Enter spouse's phone number"
                />
                
                <FormField
                  name="spouse_occupation"
                  label="Spouse's Occupation"
                  value={formData.spouse_occupation || ''}
                  onChange={handleInputChange}
                  error={errors.spouse_occupation}
                  placeholder="Enter spouse's occupation"
                />

                {/* Local Guardian Information */}
                <FormField
                  name="local_guardian_name"
                  label="Local Guardian's Name"
                  value={formData.local_guardian_name || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_name}
                  placeholder="Enter local guardian's name"
                />
                
                <FormField
                  name="local_guardian_relation"
                  label="Relation with Guardian"
                  value={formData.local_guardian_relation || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_relation}
                  placeholder="e.g., Uncle, Friend, Colleague"
                />
                
                <FormField
                  name="local_guardian_contact"
                  label="Local Guardian's Contact"
                  value={formData.local_guardian_contact || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_contact}
                  placeholder="Enter guardian's phone number"
                />
                
                <FormField
                  name="local_guardian_occupation"
                  label="Local Guardian's Occupation"
                  value={formData.local_guardian_occupation || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_occupation}
                  placeholder="Enter guardian's occupation"
                />
                
                <div className="md:col-span-2">
                  <FormField
                    name="local_guardian_address"
                    label="Local Guardian's Address"
                    type="textarea"
                    value={formData.local_guardian_address || ''}
                    onChange={handleInputChange}
                    error={errors.local_guardian_address}
                    placeholder="Enter complete address of local guardian"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document Uploads</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Citizenship Documents */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Citizenship Documents</h3>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      addCitizenshipDocuments(files);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {errors.staff_citizenship_image && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-2" />
                      {errors.staff_citizenship_image}
                    </div>
                  )}
                  
                  {citizenshipDocuments.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {citizenshipDocuments.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Citizenship ${index + 1}`}
                            className="h-20 w-full object-cover rounded border cursor-pointer"
                            onClick={() => {
                              setSelectedImage({ url: URL.createObjectURL(file), alt: `Citizenship Document ${index + 1}` });
                              setImageModalOpen(true);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeCitizenshipImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contract Documents */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Contract Documents</h3>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      addContractDocuments(files);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {errors.staff_contract_image && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-2" />
                      {errors.staff_contract_image}
                    </div>
                  )}
                  
                  {contractDocuments.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {contractDocuments.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Contract ${index + 1}`}
                            className="h-20 w-full object-cover rounded border cursor-pointer"
                            onClick={() => {
                              setSelectedImage({ url: URL.createObjectURL(file), alt: `Contract Document ${index + 1}` });
                              setImageModalOpen(true);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeContractImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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

            {/* Verification */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Verification</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="declaration_agreed"
                    name="declaration_agreed"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.declaration_agreed || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="declaration_agreed" className="ml-2 text-sm text-neutral-800">
                    I declare that all information provided is correct and accurate.
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="contract_agreed"
                    name="contract_agreed"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.contract_agreed || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="contract_agreed" className="ml-2 text-sm text-neutral-800">
                    I agree to abide by all the terms and conditions of employment.
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    name="verified_by"
                    label="Verified By"
                    value={formData.verified_by || ''}
                    onChange={handleInputChange}
                    error={errors.verified_by}
                    placeholder="Name of verifying officer"
                  />
                  
                  <FormField
                    name="verified_on"
                    label="Verification Date"
                    type="date"
                    value={formData.verified_on || ''}
                    onChange={handleInputChange}
                    error={errors.verified_on}
                  />
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-4">
              <CancelButton onClick={() => router.push('/admin/staff')} />
              <SubmitButton 
                loading={isSubmitting} 
                loadingText="Creating..."
              >
                Create Staff Member
              </SubmitButton>
            </div>
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
