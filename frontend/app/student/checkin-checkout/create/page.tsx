'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentCheckInCheckOutApi } from '@/lib/api/student-checkincheckout.api';
import { 
  SubmitButton, 
  CancelButton 
} from '@/components/ui';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export default function CreateStudentCheckout() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get current date for default values
  const currentDate = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    estimated_checkin_date: '',
    remarks: '',
  });

  useEffect(() => {
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
      await studentCheckInCheckOutApi.checkOut({
        estimated_checkin_date: formData.estimated_checkin_date,
        remarks: formData.remarks.trim()
      });
      router.push('/student/checkin-checkout');
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
    <div className="min-h-screen bg-gray-50 px-2 py-4">
      <div className="max-w-5xl mx-auto">
        {/* Clean Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Request Checkout</h1>
          <p className="text-gray-600 mt-1">Submit a checkout request with your expected return date</p>
        </div>

        {/* Modern Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-4">
            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expected Return Date */}
                <div>
                  <label htmlFor="estimated_checkin_date" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Expected Return Date *
                  </label>
                  <input
                    type="date"
                    id="estimated_checkin_date"
                    name="estimated_checkin_date"
                    value={formData.estimated_checkin_date}
                    onChange={handleChange}
                    min={currentDate}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.estimated_checkin_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.estimated_checkin_date}</p>
                  )}
                </div>

                {/* Empty column for spacing consistency */}
                <div></div>
              </div>

              {/* Reason - Full Width */}
              <div>
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Reason for Checkout *
                </label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={6}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Please provide detailed information about why you need to checkout, including purpose, destination, and any relevant context..."
                />
                {errors.remarks && (
                  <p className="text-red-600 text-sm mt-1">{errors.remarks}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Important Information</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Your checkout request will be reviewed by the administration</li>
                      <li>• You will be notified once your request is approved or declined</li>
                      <li>• Please ensure your return date is realistic and accurate</li>
                      <li>• Late returns may affect your future checkout requests</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
              <CancelButton onClick={() => router.push('/student/checkin-checkout')} />
              <SubmitButton 
                loading={isSubmitting} 
                loadingText="Submitting..."
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
