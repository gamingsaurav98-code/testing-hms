'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentCheckInCheckOutApi, StudentCheckInCheckOutFormData } from '@/lib/api/student-checkincheckout.api';
import { blockApi, Block } from '@/lib/api/index';
import { studentApi, Student } from '@/lib/api/index';
import { 
  Button, 
  FormField, 
  SubmitButton, 
  CancelButton 
} from '@/components/ui';

export default function CreateStudentCheckinCheckout() {
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get current date for default values
  const currentDate = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<StudentCheckInCheckOutFormData>({
    student_id: '',
    block_id: '',
    date: currentDate,
    checkin_time: '',
    checkout_time: '',
    remarks: '',
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch students and blocks
        const [studentsResponse, blocksResponse] = await Promise.all([
          studentApi.getStudents(),
          blockApi.getBlocks()
        ]);
        
        setStudents(studentsResponse.data || []);
        setBlocks(blocksResponse.data || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrors({ fetch: 'Failed to load required data' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

    try {
      await studentCheckInCheckOutApi.createCheckInCheckOut(formData);
      router.push('/admin/student-checkin-checkout');
    } catch (error: any) {
      console.error('Error creating record:', error);
      if (error.validation) {
        setErrors(error.validation);
      } else {
        setErrors({ general: error.message || 'Failed to create record' });
      }
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-2xl font-semibold text-gray-900">Create Check-in/Check-out Record</h1>
            <p className="text-gray-600 mt-1">
              Add a new student check-in/check-out record
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Selection */}
              <FormField
                label="Student"
                name="student_id"
                type="select"
                value={formData.student_id}
                onChange={handleChange}
                required
                error={errors.student_id}
                options={students.map(student => ({
                  value: student.id,
                  label: `${student.student_name} (${student.student_id})`
                }))}
              />

              {/* Block Selection */}
              <FormField
                label="Block"
                name="block_id"
                type="select"
                value={formData.block_id}
                onChange={handleChange}
                required
                error={errors.block_id}
                options={blocks.map(block => ({
                  value: block.id,
                  label: block.block_name
                }))}
              />

              {/* Date */}
              <FormField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                error={errors.date}
              />

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

            {/* Remarks */}
            <FormField
              label="Remarks"
              name="remarks"
              type="textarea"
              value={formData.remarks || ''}
              onChange={handleChange}
              error={errors.remarks}
              placeholder="Any additional notes or comments..."
              rows={3}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <CancelButton onClick={() => router.push('/admin/student-checkin-checkout')} />
              <SubmitButton 
                loading={isSubmitting}
                loadingText="Creating..."
              >
                Create Record
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
