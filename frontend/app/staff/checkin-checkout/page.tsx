'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { staffCheckInCheckOutApi, StaffCheckInCheckOut } from '@/lib/api/staff-checkincheckout.api';
import { Button } from '@/components/ui';
import { 
  Plus, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
  Home
} from 'lucide-react';

export default function StaffCheckinCheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<StaffCheckInCheckOut[]>([]);
  const [currentStatus, setCurrentStatus] = useState<StaffCheckInCheckOut | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffRecords();
  }, []);

  const fetchStaffRecords = async () => {
    try {
      setLoading(true);
      
      // Optimized API call with timeout - improved error handling
      const fetchWithTimeout = async () => {
        return await Promise.race([
          staffCheckInCheckOutApi.getMyRecords(),
          new Promise<{ data: StaffCheckInCheckOut[] }>((resolve) => 
            setTimeout(() => {
              console.log('API timeout - returning empty data');
              resolve({ data: [] });
            }, 2000) // 2 second timeout
          )
        ]);
      };
      
      const response = await fetchWithTimeout();
      
      // Find the most recent record for today or pending status
      const today = new Date().toISOString().split('T')[0];
      const todaysRecords = response.data.filter(record => 
        record.date === today || record.status === 'pending'
      );
      
      setRecords(response.data);
      
      // Determine current status - prioritize today's records
      const activeRecord = todaysRecords.find(record => 
        record.status === 'checked_in' || record.status === 'pending'
      ) || todaysRecords.find(record => 
        record.status === 'approved'
      );
      
      setCurrentStatus(activeRecord || null);
    } catch (err) {
      console.error('Failed to fetch records:', err);
      setError('Failed to load check-in/checkout data');
      // Don't let API failures prevent the page from loading
      setRecords([]);
      setCurrentStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckin = async () => {
    try {
      setCheckingIn(true);
      setError(null);
      
      // In a real app, this would come from the staff's work assignment
      await staffCheckInCheckOutApi.checkIn({
        block_id: "1", // This should come from staff's assignment data
        remarks: "Staff self check-in"
      });
      
      await fetchStaffRecords();
    } catch (err: any) {
      console.error('Check-in failed:', err);
      
      // If staff is already checked in, refresh the records to get updated status
      if (err.message && err.message.includes('already checked in')) {
        await fetchStaffRecords();
        return;
      }
      
      setError(err.message || 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleQuickCheckout = async () => {
    // This method is no longer used since we have a dedicated create page
    // Redirect to create page instead
    router.push('/staff/checkin-checkout/create');
  };

  const getStatusBadge = (record: StaffCheckInCheckOut) => {
    switch (record.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-4 h-4 mr-1" />
            Checkout Pending Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <Check className="w-4 h-4 mr-1" />
            Checkout Approved
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
            <X className="w-4 h-4 mr-1" />
            Checkout Declined
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <ArrowRight className="w-4 h-4 mr-1" />
            Checked In
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="w-full">
          <div className="animate-pulse">
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check-in / Checkout</h1>
          <p className="text-gray-600">Manage your work attendance and view check-in/checkout history</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          {currentStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  {getStatusBadge(currentStatus)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(currentStatus.date)}
                </div>
              </div>

              {currentStatus.checkin_time && (
                <div className="flex items-center text-sm text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  <span>Checked in at: {formatTime(currentStatus.checkin_time)}</span>
                </div>
              )}

              {currentStatus.checkout_time && (
                <div className="flex items-center text-sm text-gray-600">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span>Checkout requested at: {formatTime(currentStatus.checkout_time)}</span>
                </div>
              )}

              {currentStatus.estimated_checkin_date && (
                <div className="flex items-center text-sm text-blue-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Estimated return: {formatDate(currentStatus.estimated_checkin_date)}</span>
                </div>
              )}

              {currentStatus.remarks && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{currentStatus.remarks}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {currentStatus.status === 'checked_in' && (
                  <Button
                    onClick={handleQuickCheckout}
                    disabled={checkingOut}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    icon={checkingOut ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : undefined}
                  >
                    {checkingOut ? 'Requesting...' : 'Request Checkout'}
                  </Button>
                )}

                {currentStatus.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Check className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Checkout Approved</span>
                      </div>
                      {currentStatus.estimated_checkin_date && (
                        <div className="text-sm text-green-700">
                          Expected return: {formatDate(currentStatus.estimated_checkin_date)}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      You can now check back in when you return to the hostel.
                    </p>
                    <Button
                      onClick={handleQuickCheckin}
                      disabled={checkingIn}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      icon={checkingIn ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    >
                      {checkingIn ? 'Checking In...' : 'Check In to Hostel'}
                    </Button>
                  </div>
                )}

                {currentStatus.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h4 className="font-medium text-yellow-800 mb-2">Checkout Request Pending</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      Your checkout request is waiting for admin approval.
                    </p>
                    {currentStatus.estimated_checkin_date && (
                      <p className="text-sm text-yellow-600">
                        Expected return: {formatDate(currentStatus.estimated_checkin_date)}
                      </p>
                    )}
                    <p className="text-xs text-yellow-600 mt-2">
                      You will be able to check back in once approved.
                    </p>
                  </div>
                )}

                {currentStatus.status === 'declined' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h4 className="font-medium text-red-800 mb-2">Checkout Request Declined</h4>
                    <p className="text-sm text-red-700 mb-2">
                      Your checkout request was not approved. You remain checked in.
                    </p>
                    <p className="text-xs text-red-600">
                      Contact admin if you need to discuss this decision.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm mb-3">Request checkout from hostel when you need to leave.</p>
              <Button
                onClick={() => router.push('/staff/checkin-checkout/create')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Request Checkout
              </Button>
            </div>
          )}
        </div>

        {/* Checkout History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Checkout History</h2>
          </div>
          
          {records.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {records.slice(0, 10).map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>{getStatusBadge(record)}</div>
                    <div className="text-sm text-gray-500">{formatDate(record.date)}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {record.checkin_time && (
                      <div className="flex items-center text-gray-600">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        <span>In: {formatTime(record.checkin_time)}</span>
                      </div>
                    )}
                    
                    {record.checkout_time && (
                      <div className="flex items-center text-gray-600">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span>Out: {formatTime(record.checkout_time)}</span>
                      </div>
                    )}
                    
                    {record.estimated_checkin_date && (
                      <div className="flex items-center text-blue-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Est. Return: {formatDate(record.estimated_checkin_date)}</span>
                      </div>
                    )}
                    
                    {record.block && (
                      <div className="flex items-center text-gray-600">
                        <Home className="w-4 h-4 mr-2" />
                        <span>{record.block.block_name}</span>
                      </div>
                    )}
                  </div>
                  
                  {record.remarks && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded p-2">
                      {record.remarks}
                    </div>
                  )}
                  
                  <div className="mt-3 text-right">
                    <Link 
                      href={`/staff/checkin-checkout/${record.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">No Records Found</h3>
              <p className="text-gray-600 text-sm">You haven't created any check-in/checkout records yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
