"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supplierApi, SupplierFormData, ApiError } from '@/lib/api/index';
import { 
  FormField, 
  SubmitButton, 
  CancelButton
} from '@/components/ui';

export default function CreateSupplier() {
  const router = useRouter();
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    email: '',
    contact_number: '',
    address: '',
    description: '',
    pan_number: '',
    opening_balance: 0,
    balance_type: 'due',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'opening_balance') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseFloat(value) : 0
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contact_number.trim())) {
      newErrors.contact_number = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
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
      await supplierApi.createSupplier(formData);
      
      // Redirect to suppliers list on success
      router.push('/admin/supplier');
      
    } catch (error) {
      console.error('Error creating supplier:', error);
      if (error instanceof ApiError) {
        // Handle validation errors from API
        if (error.validation) {
          const validationErrors: Record<string, string> = {};
          
          // Convert validation errors from API to form errors
          Object.entries(error.validation).forEach(([field, messages]) => {
            validationErrors[field] = Array.isArray(messages) ? messages[0] : messages;
          });
          
          setErrors({
            ...validationErrors,
            submit: `Failed to create supplier: ${error.message}`
          });
        } else {
          setErrors({
            submit: `Failed to create supplier: ${error.message}`
          });
        }
      } else {
        setErrors({
          submit: 'An error occurred while creating the supplier. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Add New Supplier</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-4">
            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Basic Information Section */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Name */}
                <FormField
                  name="name"
                  label="Supplier Name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                  placeholder="Enter supplier name"
                />

                {/* Email Address */}
                <FormField
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email || ''}
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
                  placeholder="Enter contact number"
                />

                {/* PAN Number */}
                <FormField
                  name="pan_number"
                  label="PAN Number"
                  value={formData.pan_number || ''}
                  onChange={handleInputChange}
                  error={errors.pan_number}
                  placeholder="Enter PAN number"
                />

                {/* Address - Full Width */}
                <div className="md:col-span-2">
                  <FormField
                    name="address"
                    label="Address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    error={errors.address}
                    placeholder="Enter address"
                    type="textarea"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Balance Information Section */}
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Balance Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opening Balance */}
                <FormField
                  name="opening_balance"
                  label="Opening Balance"
                  type="text"
                  value={formData.opening_balance?.toString() || '0'}
                  onChange={handleInputChange}
                  error={errors.opening_balance}
                  placeholder="Enter opening balance"
                />

                {/* Balance Type */}
                <div>
                  <label htmlFor="balance_type" className="block text-sm font-semibold text-neutral-900">
                    Balance Type
                  </label>
                  <select
                    id="balance_type"
                    name="balance_type"
                    value={formData.balance_type || 'due'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                  >
                    <option value="due">Due (Payable)</option>
                    <option value="advance">Advance (Receivable)</option>
                  </select>
                  {errors.balance_type && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.balance_type}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
              <CancelButton onClick={() => router.push('/admin/supplier')} />
              <SubmitButton 
                loading={isSubmitting}
                loadingText="Creating..."
              >
                Create Supplier
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
