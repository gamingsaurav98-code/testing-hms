'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { studentCheckInCheckOutApi, StudentCheckInCheckOut } from '@/lib/api/student-checkincheckout.api';
import { Button } from '@/components/ui';
import { 
  ArrowLeft, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  Calendar,
  User,
  Home
} from 'lucide-react';

export default function StudentCheckinCheckoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<StudentCheckInCheckOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const response = await studentCheckInCheckOutApi.getCheckInCheckOut(recordId);
      setRecord(response.data);
    } catch (err: any) {
      console.error('Failed to fetch record:', err);
      setError(err.message || 'Failed to load record details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!record) return null;
    
    switch (record.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-4 h-4 mr-2" />
            Checkout Pending Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <Check className="w-4 h-4 mr-2" />
            Checkout Approved
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
            <X className="w-4 h-4 mr-2" />
            Checkout Declined
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <ArrowRight className="w-4 h-4 mr-2" />
            Checked In
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <AlertCircle className="w-4 h-4 mr-2" />
            Unknown Status
          </span>
        );
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = () => {
    if (!record || !record.checkin_time || !record.checkout_time) {
      return 'N/A';
    }
    
    const checkinTime = new Date(record.checkin_time);
    const checkoutTime = new Date(record.checkout_time);
    const diffMs = checkoutTime.getTime() - checkinTime.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="w-full">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Check-in/Checkout
          </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Record Not Found</h3>
              <p className="text-gray-600 mb-4">{error || 'The requested record could not be found.'}</p>
              <Button
                onClick={() => router.push('/student/checkin-checkout')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Back to Check-in/Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Check-in/Checkout
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Check-in/Checkout Details</h1>
              <p className="text-gray-600 mt-1">Record ID: {record.id}</p>
            </div>
            <div>{getStatusBadge()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(record.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge()}</div>
                </div>
                {record.block && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Block</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Home className="w-4 h-4 mr-1" />
                      {record.block.block_name}
                    </p>
                  </div>
                )}
                {record.checkout_duration && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{record.checkout_duration}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Time Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Time Details
              </h2>
              <div className="space-y-4">
                {record.checkin_time && (
                  <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <ArrowRight className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Check-in Time</p>
                        <p className="text-lg font-semibold text-blue-800">{formatDateTime(record.checkin_time)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {record.checkout_time && (
                  <div className="flex items-start justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <ArrowLeft className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-900">Checkout Time</p>
                        <p className="text-lg font-semibold text-orange-800">{formatDateTime(record.checkout_time)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {record.checkin_time && record.checkout_time && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Total Duration</p>
                      <p className="text-lg font-semibold text-gray-900">{calculateDuration()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            {record.remarks && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Remarks
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{record.remarks}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Information */}
            {record.student && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Student Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{record.student.student_name}</p>
                  </div>
                  {record.student.student_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Student ID</label>
                      <p className="mt-1 text-sm text-gray-900">{record.student.student_id}</p>
                    </div>
                  )}
                  {record.student.contact_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact</label>
                      <p className="mt-1 text-sm text-gray-900">{record.student.contact_number}</p>
                    </div>
                  )}
                  {record.student.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="mt-1 text-sm text-gray-900 break-words">{record.student.email}</p>
                    </div>
                  )}
                  {record.student.room && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Room</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {record.student.room.room_name}
                        {record.student.room.block && (
                          <span className="text-gray-500"> ({record.student.room.block.block_name})</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/student/checkin-checkout')}
                  variant="secondary"
                  className="w-full"
                >
                  View All Records
                </Button>
                <Button
                  onClick={() => router.push('/student/checkin-checkout/create')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create New Record
                </Button>
              </div>
            </div>

            {/* Record Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">{formatDateTime(record.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-900">{formatDateTime(record.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Record ID</span>
                  <span className="text-gray-900 font-mono">{record.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
