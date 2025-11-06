"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { incomeTypeApi, IncomeTypeFormData, ApiError } from '@/lib/api/index';
import { FormField, SubmitButton, CancelButton } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

export default function CreateIncomeType() {
  const router = useRouter();
  const [formData, setFormData] = useState<IncomeTypeFormData>({
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await incomeTypeApi.createIncomeType(formData);
      router.push('/admin/income-type');
    } catch (error) {
      console.error('Error creating income type:', error);
      if (error instanceof ApiError) {
        if (error.validation) {
          // Convert validation errors array to string
          const validationErrors: Record<string, string> = {};
          Object.entries(error.validation).forEach(([key, value]) => {
            validationErrors[key] = Array.isArray(value) ? value[0] : value;
          });
          setErrors(validationErrors);
        } else {
          setSubmitError(error.message);
        }
      } else {
        setSubmitError('Failed to create Income Type. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add Payment Purpose</h1>
        <p className="text-sm text-gray-600 mt-1">Create a new payment purpose for income recording</p>
      </div>

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <FormField
            name="title"
            label="Title"
            required
            value={formData.title}
            onChange={handleInputChange}
            error={errors.title}
            placeholder="e.g., Monthly Rent, Security Deposit, Mess Fee"
          />

          <FormField
            name="description"
            label="Description"
            value={formData.description || ''}
            onChange={handleInputChange}
            error={errors.description}
            placeholder="Optional description"
            type="textarea"
            rows={3}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <CancelButton onClick={() => router.back()} />
          <SubmitButton loading={isSubmitting} loadingText="Creating...">
            Create Payment Purpose
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
