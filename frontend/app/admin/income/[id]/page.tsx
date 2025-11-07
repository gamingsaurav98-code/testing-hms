"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { incomeApi } from '@/lib/api/income.api';
import { Income } from '@/lib/api/types';
import { ApiError } from '@/lib/api/core';
import { TableSkeleton, ActionButtons, Button, ConfirmModal } from '@/components/ui';
import { formatCurrency, formatDate, getImageUrl } from '@/lib/utils';

export default function IncomeDetail() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id || '';

  const [income, setIncome] = useState<Income | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        setIsLoading(true);
        
        // Fetch income data from API
        const data = await incomeApi.getIncome(id);
        
        setIncome(data);
      } catch (error) {
        console.error('Error fetching income details:', error);
        if (error instanceof ApiError) {
          setError(`Failed to load income details: ${error.message}`);
        } else {
          setError('Failed to load income details. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncome();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Delete income record using API
      await incomeApi.deleteIncome(id);
      
      router.push('/admin/income');
    } catch (error) {
      console.error('Error deleting income:', error);
      setError('Failed to delete income record.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partial Payment';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Income Details</h1>
          <p className="text-sm text-gray-500 mt-1">Loading income data...</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => router.push('/admin/income')}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Back to Income List
          </button>
        </div>
      </div>
    );
  }

  if (!income) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-800">Income record not found.</p>
          </div>
          <button
            onClick={() => router.push('/admin/income')}
            className="mt-3 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded text-sm"
          >
            Back to Income List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="w-full">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Income Details</h1>
            <p className="text-sm text-gray-600 mt-1">View complete payment information</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button
              onClick={() => router.push(`/admin/income/${income.id}/edit`)}
              variant="edit"
            >
              Edit Payment
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              variant="delete"
              loading={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Payment Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${getStatusBadgeClass(income.payment_status)} bg-opacity-20`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${getStatusBadgeClass(income.payment_status)}`}>
              {income.payment_status === 'paid' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {income.payment_status === 'partial' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">{getStatusText(income.payment_status)}</h3>
              <p className="text-sm">
                {income.payment_status === 'paid' && 'Full payment has been received.'}
                {income.payment_status === 'partial' && 'Partial payment has been received. The remaining amount is due.'}
              </p>
            </div>
          </div>
        </div>

        {/* Income Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Information</h3>
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment ID</dt>
                    <dd className="text-sm text-gray-900">{income.id}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
                    <dd className="text-sm text-gray-900">{formatDate(income.income_date)}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                    <dd className="text-sm text-gray-900">{income.payment_type?.name || 'N/A'}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment For</dt>
                    <dd className="text-sm text-gray-900">{income.income_type?.title || 'N/A'}</dd>
                  </div>
                  {income.title && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Title</dt>
                      <dd className="text-sm text-gray-900">{income.title}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Amount Information</h3>
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                    <dd className="text-sm text-gray-900 font-medium">Rs. {Number(income.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Received Amount</dt>
                    <dd className="text-sm text-green-600 font-medium">Rs. {Number(income.received_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Due Amount</dt>
                    <dd className="text-sm text-red-600 font-medium">Rs. {Number(income.due_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="text-sm text-gray-900">{formatDate(income.created_at)}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-sm text-gray-900">{formatDate(income.updated_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Student Information */}
            {income.student && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Student Information</h3>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-lg font-medium">
                    {income.student.student_image ? (
                      <img 
                        src={getImageUrl(income.student.student_image)} 
                        alt={income.student.student_name}
                        className="h-12 w-12 rounded-full object-cover" 
                      />
                    ) : (
                      income.student.student_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-base font-medium text-gray-900">{income.student.student_name}</h4>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span className="truncate">{income.student.email}</span>
                      <span className="mx-2 inline-block h-1 w-1 rounded-full bg-gray-400"></span>
                      <span>{income.student.contact_number}</span>
                    </div>
                    {income.student.room && (
                      <p className="mt-1 text-xs text-gray-500">
                        Room: {income.student.room.room_name} ({income.student.room.block?.block_name || 'Unknown Block'})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {income.description && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{income.description}</p>
              </div>
            )}

            {/* Attachment if available */}
            {income.income_attachment && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
                <a 
                  href={getImageUrl(income.income_attachment)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  View Attachment
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Income Record</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this income record? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
