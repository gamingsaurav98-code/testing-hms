"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { incomeApi } from '@/lib/api/income.api';
import { IncomeFormData, Student, IncomeType, PaymentType } from '@/lib/api/types';
import { ApiError } from '@/lib/api/core';
import { 
  Button,
  FormField,
  TableSkeleton,
  ActionButtons,
  SingleImageUploadCreate,
  ImageModal
} from '@/components/ui';

export default function CreateIncome() {
  const router = useRouter();
  // Format the current date and time for the datetime-local input
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}T${hours}:${minutes}`;
  
  const [formData, setFormData] = useState<IncomeFormData>({
    student_id: '',
    income_type_id: '',
    payment_type_id: '',
    amount: 0,
    income_date: currentDate.split('T')[0], // Only keep the date part
    received_amount: 0,
    due_amount: 0,
    payment_status: 'paid'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Image upload states
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const [imageModalAlt, setImageModalAlt] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch data from API
        const [studentsData, incomeTypesData, paymentTypesData] = await Promise.all([
          incomeApi.getStudents(),
          incomeApi.getIncomeTypes(),
          incomeApi.getPaymentTypes()
        ]);
        
        setStudents(studentsData);
        setIncomeTypes(incomeTypesData);
        setPaymentTypes(paymentTypesData);
        
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        if (error instanceof ApiError) {
          setErrors({
            fetch: `Failed to load data: ${error.message}`
          });
        } else {
          setErrors({
            fetch: 'Failed to load form data. Please try again.'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'student_id') {
      // When student is selected, fetch their monthly fee if available
      const selectedStudent = students.find(student => student.id === value);
      console.log('Selected student:', selectedStudent);
      
      setFormData(prev => {
        const newState = {
          ...prev,
          [name]: value
        };
        
        // Auto-fill amount with student's monthly fee if available
        if (selectedStudent?.monthly_fee) {
          const monthlyFee = parseFloat(selectedStudent.monthly_fee) || 0;
          if (monthlyFee > 0) {
            newState.amount = monthlyFee;
            newState.received_amount = monthlyFee; // Default to full payment
            newState.due_amount = 0;
            newState.payment_status = 'paid';
            
            // Find and select the monthly fee income type if available
            const monthlyFeeType = incomeTypes.find(type => 
              type.title.toLowerCase().includes('monthly') || 
              type.title.toLowerCase().includes('rent') || 
              type.title.toLowerCase().includes('fee')
            );
            if (monthlyFeeType) {
              newState.income_type_id = monthlyFeeType.id;
            }
          }
        }
        
        return newState;
      });
    } else if (name === 'amount' || name === 'received_amount') {
      const numValue = parseFloat(value) || 0;
      
      setFormData(prev => {
        const newState = {
          ...prev,
          [name]: numValue
        };
        
        // Auto-calculate due amount when amount or received_amount changes
        if (name === 'amount' || name === 'received_amount') {
          newState.due_amount = Math.max(0, newState.amount - (newState.received_amount || 0));
          
          // Auto-update payment status based on due amount
          if (newState.due_amount > 0) {
            newState.payment_status = 'partial';
          } else {
            newState.payment_status = 'paid';
          }
        }
        
        return newState;
      });
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

    if (!formData.student_id) {
      newErrors.student_id = 'Student is required';
    }

    if (!formData.payment_type_id) {
      newErrors.payment_type_id = 'Payment method is required';
    }
    
    if (!formData.income_type_id) {
      newErrors.income_type_id = 'Income Type is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.income_date) {
      newErrors.income_date = 'Payment date is required';
    }

    if (formData.received_amount !== undefined && formData.received_amount < 0) {
      newErrors.received_amount = 'Received amount cannot be negative';
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
      // Create income record using API
      await incomeApi.createIncome(formData);
      
      // Redirect to incomes list on success
      router.push('/admin/income');
      
    } catch (error) {
      console.error('Error creating income:', error);
      if (error instanceof ApiError) {
        setErrors({
          submit: `Failed to create payment record: ${error.message}`
        });
      } else {
        setErrors({
          submit: 'An error occurred while creating the payment record. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Record New Income</h1>
          <p className="text-sm text-gray-500 mt-1">Loading form data...</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{errors.fetch}</p>
          </div>
          <button
            onClick={() => router.push('/admin/income')}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full p-4 md:p-6">
      <div className="w-full">
        {/* Clean Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Record Payment</h1>
          <p className="text-sm text-gray-600 mt-1">Create a new payment record in the system</p>
        </div>

        {/* Modern Form Card - Full Width */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* Student Selection */}
              <div>
                <label htmlFor="student_id" className="block text-sm font-medium text-gray-900 mb-1">
                  Select Student <span className="text-red-500">*</span>
                </label>
                <select
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
                >
                  <option value="">-- Select a Student --</option>
                  {students.map(student => {
                    // We can't style part of an option element directly with CSS
                    // But we can indicate due amounts clearly in the text
                    const displayText = student.due_amount && student.due_amount > 0
                      ? `${student.student_name} ⚠️ (Due: Rs. ${student.due_amount})`
                      : student.student_name;
                      
                    return (
                      <option key={student.id} value={student.id}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
                {errors.student_id && (
                  <div className="mt-1.5 text-xs text-red-600">
                    {errors.student_id}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Select the student for whom you are recording the payment.</p>
              </div>

              {/* Payment Method */}
              <div>
                <label htmlFor="payment_type_id" className="block text-sm font-medium text-gray-900 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment_type_id"
                  name="payment_type_id"
                  value={formData.payment_type_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
                >
                  <option value="">Select Payment Method</option>
                  {paymentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {errors.payment_type_id && (
                  <div className="mt-1.5 text-xs text-red-600">
                    {errors.payment_type_id}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Choose the method of payment.</p>
              </div>
              
              {/* Income Type (Optional) */}
              <div>
                <label htmlFor="income_type_id" className="block text-sm font-medium text-gray-900 mb-1">
                  Payment For <span className="text-red-500">*</span>
                </label>
                <select
                  id="income_type_id"
                  name="income_type_id"
                  value={formData.income_type_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
                >
                  <option value="">-- Select Income Type --</option>
                  {incomeTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.title}</option>
                  ))}
                </select>
                {errors.income_type_id && (
                  <div className="mt-1.5 text-xs text-red-600">
                    {errors.income_type_id}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-900 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter amount in Rs."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
                  />
                </div>
                {errors.amount && (
                  <div className="mt-1.5 text-xs text-red-600">
                    {errors.amount}
                  </div>
                )}
              </div>
              
              {/* Received Amount */}
              <div>
                <label htmlFor="received_amount" className="block text-sm font-medium text-gray-900 mb-1">
                  Received Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="received_amount"
                    name="received_amount"
                    value={formData.received_amount || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Amount received"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
                  />
                </div>
                {errors.received_amount && (
                  <div className="mt-1.5 text-xs text-red-600">
                    {errors.received_amount}
                  </div>
                )}
              </div>
              
              {/* Due Amount (Calculated) */}
              <div>
                <label htmlFor="due_amount" className="block text-sm font-medium text-gray-900 mb-1">
                  Due Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="due_amount"
                    name="due_amount"
                    value={formData.due_amount || 0}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-300 bg-gray-50 rounded-md text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This amount is automatically calculated.</p>
              </div>
              
              {/* Payment Status */}
              <div>
                <label htmlFor="payment_status" className="block text-sm font-medium text-gray-900 mb-1">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment_status"
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
                >
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              {/* Payment Date (Date Only) */}
              <div>
                <label htmlFor="income_date" className="block text-sm font-medium text-gray-900 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="income_date"
                  name="income_date"
                  value={formData.income_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
                />
                {errors.income_date && (
                  <div className="mt-1.5 text-xs text-red-600">
                    {errors.income_date}
                  </div>
                )}
              </div>

              {/* Notes - Full Width */}
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter any additional notes here..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* File Attachment using SingleImageUploadCreate - Full Width */}
            <div className="mt-5 col-span-1 md:col-span-2">
              <SingleImageUploadCreate
                imagePreview={attachmentPreview}
                onFileSelect={(file) => {
                  // Create a preview URL
                  const previewUrl = URL.createObjectURL(file);
                  setAttachmentPreview(previewUrl);
                  
                  // Update form data
                  setFormData(prev => ({
                    ...prev,
                    income_attachment: file
                  }));
                }}
                onRemove={() => {
                  // Clear the preview and form data
                  setAttachmentPreview(null);
                  setFormData(prev => ({
                    ...prev,
                    income_attachment: undefined
                  }));
                }}
                error={errors.income_attachment}
                label="Receipt/Attachment (Optional)"
                onImageClick={(url, alt) => {
                  setImageModalSrc(url);
                  setImageModalAlt(alt);
                  setIsImageModalOpen(true);
                }}
              />
            </div>

            {/* Form Actions - Full Width */}
            <div className="flex justify-end space-x-3 mt-8 pt-5 border-t border-gray-200 col-span-1 md:col-span-2">
              <button
                type="button"
                onClick={() => router.push('/admin/income')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#235999] hover:bg-[#1c4a82] text-white px-6 py-2 rounded-md text-sm font-medium flex items-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Save Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Image Preview Modal */}
      <ImageModal
        show={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={imageModalSrc}
        alt={imageModalAlt}
      />
    </div>
  );
}
