"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { studentApi, studentFinancialApi, roomApi, type Room, type StudentFormData, type StudentFinancialFormData, type StudentAmenity } from '@/lib/api';
import { ApiError } from '@/lib/api/core';
import { 
  Button, 
  FormField, 
  SubmitButton, 
  CancelButton, 
  SingleImageUploadCreate,
  MultipleImageUploadCreate,
  ImageModal
} from '@/components/ui';

export default function CreateStudent() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<StudentFormData>({
    student_name: '',
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
    class_time: '',
    level_of_study: '',
    expected_stay_duration: '',
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
    room_id: '',
    is_active: true,
    student_id: '',
    is_existing_student: false,
    declaration_agreed: false,
    rules_agreed: false,
    verified_on: '',
    amenities: []
  });
  
  // Financial form state
  const [financialData, setFinancialData] = useState<StudentFinancialFormData>({
    admission_fee: '',
    form_fee: '',
    security_deposit: '',
    monthly_fee: '',
    joining_date: '',
    payment_date: new Date().toISOString().split('T')[0], // Default to today
    amount: '',
    payment_type_id: '',
    remark: '',
    is_existing_student: false
  });
  
  // Form processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' });
  
  // Document state - Multiple file uploads
  const [citizenshipDocuments, setCitizenshipDocuments] = useState<File[]>([]);
  const [registrationFormDocuments, setRegistrationFormDocuments] = useState<File[]>([]);
  
  // Amenities state
  const [amenities, setAmenities] = useState<StudentAmenity[]>([]);

  // Fetch available rooms for selection
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Use the proper API client to fetch rooms
        const roomsData = await roomApi.getRooms();
        setRooms(roomsData.data || []);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        // Don't show this error in the UI, just log it
      }
    };

    fetchRooms();
  }, []);

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

  // Handle financial form field changes
  const handleFinancialInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFinancialData({
        ...financialData,
        [name]: checkbox.checked
      });
    } else {
      setFinancialData({
        ...financialData,
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

  // Process student image file
  const processFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        student_image: 'Please select a valid image file (JPG, JPEG, PNG)'
      }));
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        student_image: 'File size must be less than 2MB'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      student_image: file
    }));

    // Create preview for images
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear file error
    if (errors.student_image) {
      setErrors(prev => ({
        ...prev,
        student_image: ''
      }));
    }
  };

  // Remove student image
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      student_image: null
    }));
    setImagePreview(null);
  };
  
  // Validate citizenship document file
  const validateCitizenshipFile = (file: File): boolean => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        student_citizenship_image: 'Please select a valid file (JPG, JPEG, PNG, PDF)'
      }));
      return false;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        student_citizenship_image: 'File size must be less than 5MB'
      }));
      return false;
    }

    // Clear file error
    if (errors.student_citizenship_image) {
      setErrors(prev => ({
        ...prev,
        student_citizenship_image: ''
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

  // Remove citizenship document
  const removeCitizenshipImage = (index: number) => {
    setCitizenshipDocuments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Validate registration form file
  const validateRegistrationFormFile = (file: File): boolean => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        registration_form_image: 'Please select a valid file (JPG, JPEG, PNG, PDF)'
      }));
      return false;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        registration_form_image: 'File size must be less than 5MB'
      }));
      return false;
    }

    // Clear file error
    if (errors.registration_form_image) {
      setErrors(prev => ({
        ...prev,
        registration_form_image: ''
      }));
    }
    
    return true;
  };

  // Add registration form documents
  const addRegistrationFormDocuments = (files: File[]) => {
    const validFiles = files.filter(file => validateRegistrationFormFile(file));
    if (validFiles.length > 0) {
      setRegistrationFormDocuments(prev => [...prev, ...validFiles]);
    }
  };

  // Remove registration form
  const removeRegistrationFormImage = (index: number) => {
    setRegistrationFormDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle amenity changes
  const handleAmenityChange = (index: number, field: keyof StudentAmenity, value: string) => {
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

    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Student name is required';
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
    
    // Student amenities are now optional - no validation required

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
      // Check authentication before making API call
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setErrors({
          submit: 'Authentication token not found. Please log in again.'
        });
        setIsSubmitting(false);
        return;
      }

      // Step 1: Create the student first (without financial data)
      const studentFormData = {
        ...formData,
        amenities: filteredAmenities,
        student_citizenship_image: citizenshipDocuments.length > 0 ? citizenshipDocuments[0] : null,
        registration_form_image: registrationFormDocuments.length > 0 ? registrationFormDocuments[0] : null
      };
      
      const createdStudent = await studentApi.createStudent(studentFormData);
      
      // Step 2: Create financial record if any financial data is provided
      const hasFinancialData = Object.entries(financialData).some(([key, value]) => {
        if (key === 'payment_date' || key === 'is_existing_student') return false; // These always have values
        return value !== null && value !== undefined && value !== '';
      });
      
      if (hasFinancialData) {
        // Calculate total amount from individual fees
        const admissionFee = parseFloat(financialData.admission_fee || '0');
        const formFee = parseFloat(financialData.form_fee || '0');
        const securityDeposit = parseFloat(financialData.security_deposit || '0');
        const monthlyFee = parseFloat(financialData.monthly_fee || '0');
        const totalAmount = (admissionFee + formFee + securityDeposit + monthlyFee).toString();
        
        const financialFormData = {
          ...financialData,
          student_id: createdStudent.id,
          amount: financialData.amount || totalAmount // Use provided amount or calculated total
        };
        
        await studentFinancialApi.createStudentFinancial(financialFormData);
      }

      // Redirect to student list on success
      router.push('/admin/student');
    } catch (error) {
      console.error('Error creating student:', error);
      
      if (error instanceof ApiError) {
        // Handle specific authentication errors
        if (error.status === 401) {
          setErrors({
            submit: 'Authentication failed. Please log out and log back in, then try again.'
          });
        } else if (error.status === 403) {
          setErrors({
            submit: 'You do not have permission to create students. Please contact an administrator.'
          });
        } else if (error.validation && Object.keys(error.validation).length > 0) {
          // Convert validation errors to our format
          const formattedErrors: Record<string, string> = {};
          
          Object.entries(error.validation).forEach(([field, messages]) => {
            formattedErrors[field] = Array.isArray(messages) ? messages[0] : messages;
          });
          
          setErrors({
            ...formattedErrors,
            submit: `Failed to create student: ${error.message}`
          });
        } else {
          setErrors({
            submit: `Failed to create student: ${error.message}`
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
          <h1 className="text-2xl font-semibold text-gray-900">Add New Student</h1>
          <p className="text-sm text-gray-600 mt-1">Enter student details to register a new student</p>
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
                {/* Student Name */}
                <FormField
                  name="student_name"
                  label="Student Name"
                  required
                  value={formData.student_name}
                  onChange={handleInputChange}
                  error={errors.student_name}
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
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                  ]}
                />

                {/* Room Selection */}
                <FormField
                  name="room_id"
                  label="Room"
                  type="select"
                  value={formData.room_id || ''}
                  onChange={handleInputChange}
                  error={errors.room_id}
                  options={rooms.map(room => ({ value: room.id, label: room.room_name }))}
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
                  <label htmlFor="is_active" className="ml-2 text-sm font-semibold text-neutral-900">Active Student</label>
                </div>
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
                  placeholder="Enter district name"
                />
                
                {/* City Name */}
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
                  label="Ward Number"
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
                {/* Citizenship No */}
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
                
                {/* Citizenship Issued District */}
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

            {/* Educational Information */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Educational Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Educational Institution */}
                <FormField
                  name="educational_institution"
                  label="Educational Institution"
                  value={formData.educational_institution || ''}
                  onChange={handleInputChange}
                  error={errors.educational_institution}
                  placeholder="Enter school/college name"
                />
                
                {/* Class Time */}
                <FormField
                  name="class_time"
                  label="Class Time"
                  value={formData.class_time || ''}
                  onChange={handleInputChange}
                  error={errors.class_time}
                  placeholder="e.g., Morning, Evening"
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
                
                {/* Expected Stay Duration */}
                <FormField
                  name="expected_stay_duration"
                  label="Expected Stay Duration"
                  value={formData.expected_stay_duration || ''}
                  onChange={handleInputChange}
                  error={errors.expected_stay_duration}
                  placeholder="e.g., 6 months, 2 years"
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
              <div className="grid grid-cols-1 gap-4">
                {/* Father's Information */}
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Father's Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      name="father_name"
                      label="Father's Name"
                      value={formData.father_name || ''}
                      onChange={handleInputChange}
                      error={errors.father_name}
                      placeholder="Enter father's name"
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
                  </div>
                </div>

                {/* Mother's Information */}
                <div className="border-b border-gray-100 py-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Mother's Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      name="mother_name"
                      label="Mother's Name"
                      value={formData.mother_name || ''}
                      onChange={handleInputChange}
                      error={errors.mother_name}
                      placeholder="Enter mother's name"
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
                  </div>
                </div>

                {/* Spouse's Information */}
                <div className="py-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Spouse's Details (if applicable)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      name="spouse_name"
                      label="Spouse's Name"
                      value={formData.spouse_name || ''}
                      onChange={handleInputChange}
                      error={errors.spouse_name}
                      placeholder="Enter spouse's name"
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
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Local Guardian Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="local_guardian_name"
                  label="Guardian's Name"
                  value={formData.local_guardian_name || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_name}
                  placeholder="Enter local guardian's name"
                />
                <FormField
                  name="local_guardian_relation"
                  label="Relation with Student"
                  value={formData.local_guardian_relation || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_relation}
                  placeholder="e.g., Uncle, Aunt"
                />
                <FormField
                  name="local_guardian_contact"
                  label="Guardian's Contact"
                  value={formData.local_guardian_contact || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_contact}
                  placeholder="Enter guardian's phone number"
                />
                <FormField
                  name="local_guardian_occupation"
                  label="Guardian's Occupation"
                  value={formData.local_guardian_occupation || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_occupation}
                  placeholder="Enter guardian's occupation"
                />
                <FormField
                  name="local_guardian_address"
                  label="Guardian's Address"
                  value={formData.local_guardian_address || ''}
                  onChange={handleInputChange}
                  error={errors.local_guardian_address}
                  placeholder="Enter guardian's address"
                />
              </div>
            </div>

            {/* Document Uploads */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document Uploads</h2>
              
              {/* Student Photo */}
              <div className="mb-6">
                <div className="w-full">
                  <SingleImageUploadCreate
                    imagePreview={imagePreview}
                    onFileSelect={processFile}
                    onRemove={removeImage}
                    error={errors.student_image}
                    label="Student Photo"
                    onImageClick={(imageUrl, alt) => {
                      setSelectedImage({ url: imageUrl, alt });
                      setImageModalOpen(true);
                    }}
                  />
                </div>
              </div>
              
              {/* Citizenship Documents */}
              <div className="mb-6 pt-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">Citizenship Documents</h3>
                <div className="w-full">
                  <MultipleImageUploadCreate
                    images={citizenshipDocuments}
                    onAddImages={addCitizenshipDocuments}
                    onRemoveImage={removeCitizenshipImage}
                    error={errors.student_citizenship_image}
                    label="Citizenship Documents"
                    onImageClick={(imageUrl, alt) => {
                      setSelectedImage({ url: imageUrl, alt });
                      setImageModalOpen(true);
                    }}
                  />
                </div>
              </div>
              
              {/* Registration Forms */}
              <div className="pt-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">Registration Forms</h3>
                <div className="w-full">
                  <MultipleImageUploadCreate
                    images={registrationFormDocuments}
                    onAddImages={addRegistrationFormDocuments}
                    onRemoveImage={removeRegistrationFormImage}
                    error={errors.registration_form_image}
                    label="Registration Forms"
                    onImageClick={(imageUrl, alt) => {
                      setSelectedImage({ url: imageUrl, alt });
                      setImageModalOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Administrative Details */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Administrative Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student ID */}
                <FormField
                  name="student_id"
                  label="Student ID"
                  value={formData.student_id || ''}
                  onChange={handleInputChange}
                  error={errors.student_id}
                />
                
                <div className="flex items-center mt-4">
                  <input
                    id="is_existing_student"
                    name="is_existing_student"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.is_existing_student || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="is_existing_student" className="ml-2 text-sm font-semibold text-neutral-900">
                    This is an existing student (staying before system implementation)
                  </label>
                </div>
              </div>
              
              {/* Financial Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Admission Fee */}
                <div className="form-field">
                  <label className="block text-sm font-semibold text-neutral-900">Admission Fee</label>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">Rs.</span>
                    <input
                      type="text"
                      name="admission_fee"
                      value={financialData.admission_fee || ''}
                      onChange={handleFinancialInputChange}
                      className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                    />
                  </div>
                  {errors.admission_fee && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-2" />
                      {errors.admission_fee}
                    </div>
                  )}
                </div>
                
                {/* Form Fee */}
                <div className="form-field">
                  <label className="block text-sm font-semibold text-neutral-900">Form Fee</label>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">Rs.</span>
                    <input
                      type="text"
                      name="form_fee"
                      value={financialData.form_fee || ''}
                      onChange={handleFinancialInputChange}
                      className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                    />
                  </div>
                  {errors.form_fee && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-2" />
                      {errors.form_fee}
                    </div>
                  )}
                </div>
                
                {/* Security Deposit */}
                <div className="form-field">
                  <label className="block text-sm font-semibold text-neutral-900">Security Deposit</label>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">Rs.</span>
                    <input
                      type="text"
                      name="security_deposit"
                      value={financialData.security_deposit || ''}
                      onChange={handleFinancialInputChange}
                      className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                    />
                  </div>
                  {errors.security_deposit && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-2" />
                      {errors.security_deposit}
                    </div>
                  )}
                </div>
                
                {/* Monthly Hostel Fee */}
                <div className="form-field">
                  <label className="block text-sm font-semibold text-neutral-900">Monthly Hostel Fee</label>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">Rs.</span>
                    <input
                      type="text"
                      name="monthly_fee"
                      value={financialData.monthly_fee || ''}
                      onChange={handleFinancialInputChange}
                      className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                    />
                  </div>
                  {errors.monthly_fee && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-2" />
                      {errors.monthly_fee}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Joining Date */}
              <div className="mt-4">
                <FormField
                  name="joining_date"
                  label="Joining Date"
                  type="date"
                  value={financialData.joining_date || ''}
                  onChange={handleFinancialInputChange}
                  error={errors.joining_date}
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-8 border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Student Amenities</h2>
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
                          label="Description (Optional)"
                          placeholder="Enter description"
                          value={amenity.description || ''}
                          onChange={(e) => handleAmenityChange(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="pt-8">
                        <button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic">No amenities added. Click "Add Amenity" to add student amenities.</p>
                )}
              </div>
            </div>
          </div>            {/* Verification */}
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
                    I hereby declare that all the information provided above is true and correct to the best of my knowledge.
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="rules_agreed"
                    name="rules_agreed"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.rules_agreed || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="rules_agreed" className="ml-2 text-sm text-neutral-800">
                    I agree to abide by all the rules and regulations of the hostel.
                  </label>
                </div>
                
                <div className="mt-4">
                  <FormField
                    name="verified_on"
                    label="Verification Date (YYYY/MM/DD) AD"
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
              <CancelButton onClick={() => router.push('/admin/student')} />
              <SubmitButton 
                loading={isSubmitting} 
                loadingText="Creating..."
              >
                Create Student
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
