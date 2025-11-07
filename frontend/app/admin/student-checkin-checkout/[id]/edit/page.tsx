'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { studentCheckInCheckOutApi, StudentCheckInCheckOut, StudentCheckInCheckOutFormData } from '@/lib/api/student-checkincheckout.api';
import { 
  SubmitButton, 
  CancelButton 
} from '@/components/ui';

export default function EditStudentCheckinCheckout() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;
  
  const [record, setRecord] = useState<StudentCheckInCheckOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<StudentCheckInCheckOutFormData>({
    student_id: '',
    block_id: '',
    date: '',
    checkin_time: '',
    checkout_time: '',
    remarks: '',
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch record details - use admin endpoint
        const recordResponse = await studentCheckInCheckOutApi.getStudentCheckInCheckOutRecord(recordId);
        const recordData = recordResponse.data;
        setRecord(recordData);
        
        // Set form data for editable fields only
        setFormData({
          student_id: recordData.student_id,
          block_id: recordData.block_id,
          date: recordData.date,
          checkin_time: recordData.checkin_time || '',
          checkout_time: recordData.checkout_time || '',
          remarks: recordData.remarks || '',
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrors({ fetch: 'Failed to load record data' });
      } finally {
        setLoading(false);
      }
    };

    if (recordId) {
      fetchData();
    }
  }, [recordId]);

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

    try {
      // Only submit the editable fields (times)
      const updateData = {
        checkin_time: formData.checkin_time || undefined,
        checkout_time: formData.checkout_time || undefined,
      };

      await studentCheckInCheckOutApi.updateCheckInCheckOut(recordId, updateData);
      router.push(`/admin/student-checkin-checkout/${recordId}`);
    } catch (error: any) {
      console.error('Error updating record:', error);
      if (error.validation) {
        setErrors(error.validation);
      } else {
        setErrors({ general: error.message || 'Failed to update record' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get original remarks without check-in appended text
  const getOriginalRemarks = (remarks: string | null | undefined) => {
    if (!remarks) return 'No remarks';
    
    // Remove check-in appended text patterns
    const checkInPatterns = [
      /\.\s*Check-in:\s*Student self check-in$/i,
      /Check-in:\s*Student self check-in$/i,
      /\.\s*Check-in:.*$/i,
      /Check-in:.*$/i
    ];
    
    let cleanedRemarks = remarks;
    for (const pattern of checkInPatterns) {
      cleanedRemarks = cleanedRemarks.replace(pattern, '').trim();
    }
    
    return cleanedRemarks || 'No remarks';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{errors.fetch}</p>
          </div>
          <button
            onClick={() => router.push('/admin/student-checkin-checkout')}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4">
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Edit Check-in/Check-out Record</h1>
            <p className="text-gray-600 mt-1">
              Update the check-in/check-out details for {record?.student?.student_name}
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800">{errors.general}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Read-only Information Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Student</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {record?.student?.student_name} ({record?.student?.student_id})
                  </p>
                </div>

                {/* Block */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Block</label>
                  <p className="mt-1 text-sm text-gray-900">{record?.block?.block_name}</p>
                </div>

                {/* Date */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {record?.date ? new Date(record.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not set'}
                  </p>
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{getOriginalRemarks(record?.remarks)}</p>
                </div>
              </div>
            </div>

            {/* Editable Time Fields Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Times</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Checkout Time */}
                <div className="space-y-1.5">
                  <label htmlFor="checkout_time" className="block text-sm font-semibold text-neutral-900">
                    Check-out Time
                  </label>
                  <input
                    type="datetime-local"
                    id="checkout_time"
                    name="checkout_time"
                    value={formData.checkout_time || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                  />
                  {errors.checkout_time && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.checkout_time}
                    </div>
                  )}
                </div>

                {/* Checkin Time */}
                <div className="space-y-1.5">
                  <label htmlFor="checkin_time" className="block text-sm font-semibold text-neutral-900">
                    Check-in Time
                  </label>
                  <input
                    type="datetime-local"
                    id="checkin_time"
                    name="checkin_time"
                    value={formData.checkin_time || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200"
                  />
                  {errors.checkin_time && (
                    <div className="flex items-center mt-1.5 text-xs text-red-600">
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.checkin_time}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <CancelButton onClick={() => router.push(`/admin/student-checkin-checkout/${recordId}`)} />
              <SubmitButton 
                loading={isSubmitting}
                loadingText="Updating..."
              >
                Update Record
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
