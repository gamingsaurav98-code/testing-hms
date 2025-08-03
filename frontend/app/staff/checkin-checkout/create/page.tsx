'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { staffCheckInCheckOutApi } from '@/lib/api/staff-checkincheckout.api';
import { 
  SubmitButton, 
  CancelButton 
} from '@/components/ui';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export default function CreateStaffCheckout() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false); // No need to load external data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get current date for default values
  const currentDate = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    estimated_checkin_date: '',
    remarks: '',
  });

  // Fetch blocks data
  useEffect(() => {
    // No external data loading needed
    setLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.estimated_checkin_date) {
      newErrors.estimated_checkin_date = 'Estimated return date is required';
    } else if (formData.estimated_checkin_date < currentDate) {
      newErrors.estimated_checkin_date = 'Return date cannot be in the past';
    }

    if (!formData.remarks.trim()) {
      newErrors.remarks = 'Reason for checkout is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await staffCheckInCheckOutApi.checkOut({
        estimated_checkin_date: formData.estimated_checkin_date,
        remarks: formData.remarks.trim()
      });
      router.push('/staff/checkin-checkout');
    } catch (error: any) {
      console.error('Error creating checkout request:', error);
      if (error.validation) {
        setErrors(error.validation);
      } else {
        setErrors({ general: error.message || 'Failed to create checkout request' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="w-full flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request Checkout</h1>
          <p className="text-gray-600 mt-1">
            Submit a request to checkout from the hostel
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-800">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Information Card */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">Important Information</h3>
                <div className="mt-2 text-sm text-blue-800">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your checkout request will be submitted to admin for approval</li>
                    <li>Checkout time will be recorded as current system time when approved</li>
                    <li>You can check back in once your request is approved and you return</li>
                    <li>Estimated return date is required to track checkout duration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Checkout Date and Time */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-neutral-900 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Checkout Date & Time
              </label>
              <div className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Date: </span>
                    <span>{new Date().toLocaleDateString('en-US', { 
                      month: '2-digit',
                      day: '2-digit', 
                      year: 'numeric'
                    })}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Time: </span>
                    <span>{new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true 
                    })}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                This will be recorded as your checkout time when the request is approved.
              </p>
            </div>

            {/* Estimated Return Date */}
            <div className="space-y-1.5">
              <label htmlFor="estimated_checkin_date" className="block text-sm font-semibold text-neutral-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Estimated Return Date *
              </label>
              <input
                type="date"
                id="estimated_checkin_date"
                name="estimated_checkin_date"
                value={formData.estimated_checkin_date}
                onChange={handleChange}
                min={currentDate}
                className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                required
              />
              <p className="text-xs text-gray-500">
                This helps track your checkout duration and is required for approval.
              </p>
              {errors.estimated_checkin_date && (
                <div className="flex items-center mt-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 mr-2" />
                  {errors.estimated_checkin_date}
                </div>
              )}
            </div>

            {/* Reason/Remarks */}
            <div className="space-y-1.5">
              <label htmlFor="remarks" className="block text-sm font-semibold text-neutral-900">
                Reason for Checkout *
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Please provide the reason for your checkout request (e.g., going home for weekend, medical appointment, family emergency, etc.)"
                rows={4}
                className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200 resize-none"
                required
              />
              <p className="text-xs text-gray-500">
                A clear reason helps admin process your request faster
              </p>
              {errors.remarks && (
                <div className="flex items-center mt-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 mr-2" />
                  {errors.remarks}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <CancelButton onClick={() => router.push('/staff/checkin-checkout')} />
              <SubmitButton 
                loading={isSubmitting}
                loadingText="Submitting Request..."
              >
                Submit Checkout Request
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
