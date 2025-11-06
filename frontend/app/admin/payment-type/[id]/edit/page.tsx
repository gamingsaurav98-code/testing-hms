"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { paymentTypeApi, PaymentTypeFormData, PaymentTypeModel, ApiError } from '@/lib/api/index';
import { FormField, TableSkeleton, SubmitButton, CancelButton } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

export default function EditPaymentType() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [formData, setFormData] = useState<PaymentTypeFormData>({
    name: '',
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPaymentType();
    }
  }, [id]);

  const fetchPaymentType = async () => {
    try {
      setIsLoading(true);
      const data = await paymentTypeApi.getPaymentType(id);
      setFormData({
        name: data.name,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Error fetching payment type:', error);
      setSubmitError(error instanceof ApiError ? error.message : 'Failed to load payment method');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Payment method name is required';
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
      await paymentTypeApi.updatePaymentType(id, formData);
      router.push('/admin/payment-type');
    } catch (error) {
      console.error('Error updating payment type:', error);
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
        setSubmitError('Failed to update payment method. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Payment Method</h1>
        <p className="text-sm text-gray-600 mt-1">Update payment method information</p>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{submitError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Payment Method Name */}
          <FormField
            name="name"
            label="Payment Method Name"
            required
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            placeholder="e.g., Cash, Bank Transfer, Credit Card"
          />

          {/* Status */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active
              </span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Inactive payment methods will not be available for selection
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <CancelButton onClick={() => router.back()} />
          <SubmitButton loading={isSubmitting} loadingText="Updating...">
            Update Payment Method
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
