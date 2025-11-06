"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { incomeTypeApi, IncomeTypeModel, ApiError } from '@/lib/api/index';
import { Button, TableSkeleton, ConfirmModal } from '@/components/ui';
import { ArrowLeft, Edit, Trash } from 'lucide-react';

export default function ViewIncomeType() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [incomeType, setIncomeType] = useState<IncomeTypeModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIncomeType();
    }
  }, [id]);

  const fetchIncomeType = async () => {
    try {
      setIsLoading(true);
      const data = await incomeTypeApi.getIncomeType(id);
      setIncomeType(data);
    } catch (error) {
      console.error('Error fetching income type:', error);
      setError(error instanceof ApiError ? error.message : 'Failed to load Income Type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await incomeTypeApi.deleteIncomeType(id);
      router.push('/admin/income-type');
    } catch (error) {
      console.error('Error deleting income type:', error);
      setError(error instanceof ApiError ? error.message : 'Failed to delete Income Type');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <TableSkeleton />
      </div>
    );
  }

  if (error || !incomeType) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error || 'Payment purpose not found'}</p>
          </div>
          <button
            onClick={() => router.push('/admin/income-type')}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Back to Payment Purposes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{incomeType.title}</h1>
            <p className="text-sm text-gray-600 mt-1">Payment purpose details</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push(`/admin/income-type/${id}/edit`)}
              icon={<Edit className="w-4 h-4" />}
              variant="edit"
            >
              Edit
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              icon={<Trash className="w-4 h-4" />}
              variant="delete"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Purpose Information</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{incomeType.title}</dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{incomeType.description || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Created Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(incomeType.created_at)}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(incomeType.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        title="Delete Payment Purpose"
        message="Are you sure you want to delete this payment purpose? This action cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />
    </div>
  );
}
