'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { staffCheckInCheckOutApi, StaffCheckInCheckOut } from '@/lib/api/staff-checkincheckout.api';
import { Button, ConfirmModal } from '@/components/ui';
import { Check, X, ArrowLeft, Edit, Trash, Clock } from 'lucide-react';

export default function StaffCheckinCheckoutDetail() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;
  
  const [record, setRecord] = useState<StaffCheckInCheckOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await staffCheckInCheckOutApi.getCheckInCheckOut(recordId);
      setRecord(response.data);
      setError(null);
      
      // Debug logging to understand the record structure
      console.log('Staff Check-in/Checkout Record:', response.data);
      console.log('Status:', response.data.status);
      console.log('Checkout Time:', response.data.checkout_time);
      console.log('Checkin Time:', response.data.checkin_time);
    } catch (error) {
      console.error('Error fetching record:', error);
      setError('Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  const handleApproveCheckout = async () => {
    try {
      setActionLoading('approve');
      await staffCheckInCheckOutApi.approveCheckout(recordId);
      await fetchRecord(); // Refresh data
    } catch (error: any) {
      console.error('Error approving checkout:', error);
      // Show user-friendly error message
      alert(error?.message || 'Failed to approve checkout. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineCheckout = async () => {
    try {
      setActionLoading('decline');
      await staffCheckInCheckOutApi.declineCheckout(recordId, 'Checkout declined by admin');
      await fetchRecord(); // Refresh data
    } catch (error: any) {
      console.error('Error declining checkout:', error);
      // Show user-friendly error message
      alert(error?.message || 'Failed to decline checkout. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      await staffCheckInCheckOutApi.deleteCheckInCheckOut(recordId);
      router.push('/admin/staff-checkin-checkout');
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const formatDateTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return 'Not set';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateTime: string | null | undefined) => {
    if (!dateTime) return 'Not set';
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (estimatedCheckinDate: string | null | undefined, checkoutTime: string | null | undefined) => {
    if (!estimatedCheckinDate || !checkoutTime) return 'N/A';
    
    const estimated = new Date(estimatedCheckinDate);
    const checkout = new Date(checkoutTime);
    const diffMs = estimated.getTime() - checkout.getTime();
    
    // Handle negative duration (if checkout is after estimated checkin)
    const absDiffMs = Math.abs(diffMs);
    const diffDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} days ${diffHours} hours`;
    } else {
      return `${diffHours} hours`;
    }
  };

  const getStatusBadge = () => {
    if (!record) return null;
    
    // Check admin approval status first
    if (record.status === 'approved') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <Check className="w-4 h-4 mr-2" />
          Approved
        </span>
      );
    } else if (record.status === 'declined') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <X className="w-4 h-4 mr-2" />
          Declined
        </span>
      );
    } else if (record.status === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-4 h-4 mr-2" />
          Pending Approval
        </span>
      );
    } else if (record.checkout_time && record.checkin_time) {
      // If both checkout and checkin exist and status is not pending/approved/declined
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <Check className="w-4 h-4 mr-2" />
          Complete
        </span>
      );
    } else if (record.checkout_time) {
      // Only checkout exists, waiting for checkin
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          <Clock className="w-4 h-4 mr-2" />
          Checked Out
        </span>
      );
    } else if (record.checkin_time) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <Clock className="w-4 h-4 mr-2" />
          Checked In
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <X className="w-4 h-4 mr-2" />
          Draft
        </span>
      );
    }
  };

  const needsApproval = () => {
    // Show approval actions if status is pending
    return record?.status === 'pending';
  };

  const isCheckInApproval = () => {
    // If both checkout_time and checkin_time exist, it's a check-in approval
    return record?.checkout_time && record?.checkin_time;
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

  if (error || !record) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Record not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Check-in/Check-out Details
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Staff Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Staff Name</label>
                <p className="mt-1 text-sm text-gray-900">{record.staff?.staff_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Staff ID</label>
                <p className="mt-1 text-sm text-gray-900">{record.staff?.staff_id || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Number</label>
                <p className="mt-1 text-sm text-gray-900">{record.staff?.contact_number || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-sm text-gray-900">{record.staff?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="mt-1 text-sm text-gray-900">{record.staff?.department || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Position</label>
                <p className="mt-1 text-sm text-gray-900">{record.staff?.position || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Block</label>
                <p className="mt-1 text-sm text-gray-900">{record.block?.block_name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Check-in/Check-out Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Check-in/Check-out Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(record.date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Check-out Time</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(record.checkout_time)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Check-in Time</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(record.checkin_time)}</p>
              </div>
              {record.estimated_checkin_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Check-in Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(record.estimated_checkin_date)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <p className="mt-1 text-sm text-gray-900">
                  {calculateDuration(record.estimated_checkin_date, record.checkout_time)}
                </p>
              </div>
              {record.remarks && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{record.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Admin Actions */}
          {needsApproval() && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleApproveCheckout}
                  disabled={actionLoading === 'approve'}
                  loading={actionLoading === 'approve'}
                  className="w-full bg-green-600 text-white hover:bg-green-700 border-0"
                  icon={<Check className="w-4 h-4" />}
                >
                  {actionLoading === 'approve' 
                    ? 'Approving...' 
                    : isCheckInApproval() 
                      ? 'Approve Check-in' 
                      : 'Approve Checkout'}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeclineCheckout}
                  disabled={actionLoading === 'decline'}
                  loading={actionLoading === 'decline'}
                  className="w-full"
                  icon={<X className="w-4 h-4" />}
                >
                  {actionLoading === 'decline' 
                    ? 'Declining...' 
                    : isCheckInApproval() 
                      ? 'Decline Check-in' 
                      : 'Decline Checkout'}
                </Button>
              </div>
            </div>
          )}

          {/* Record Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Actions</h3>
            <div className="space-y-3">
              <Button
                variant="edit"
                onClick={() => router.push(`/admin/staff-checkin-checkout/${record.id}/edit`)}
                className="w-full"
                icon={<Edit className="w-4 h-4" />}
              >
                Edit Record
              </Button>
              <Button
                variant="danger"
                onClick={() => setDeleteModal(true)}
                className="w-full"
                icon={<Trash className="w-4 h-4" />}
              >
                Delete Record
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(record.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(record.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Check-in/Check-out Record"
        message={`Are you sure you want to delete this check-in/check-out record for ${record?.staff?.staff_name || 'this staff member'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
