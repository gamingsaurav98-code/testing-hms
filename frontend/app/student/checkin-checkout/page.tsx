'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { studentCheckInCheckOutApi, StudentCheckInCheckOut } from '@/lib/api/student-checkincheckout.api';
import { Button } from '@/components/ui';
import { 
  Plus, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Eye
} from 'lucide-react';

export default function StudentCheckinCheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<StudentCheckInCheckOut[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StudentCheckInCheckOut[]>([]);
  const [currentStatus, setCurrentStatus] = useState<StudentCheckInCheckOut | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudentRecords();
  }, []);

  // Live search effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(records);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = records.filter(record => 
        record.status?.toLowerCase().includes(searchLower) ||
        record.block?.block_name?.toLowerCase().includes(searchLower) ||
        record.remarks?.toLowerCase().includes(searchLower)
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records]);

  const fetchStudentRecords = async () => {
    try {
      setLoading(true);
      
      // Optimized API call with timeout - improved error handling
      const fetchWithTimeout = async () => {
        return await Promise.race([
          studentCheckInCheckOutApi.getMyRecords(),
          new Promise<{ data: StudentCheckInCheckOut[] }>((resolve) => 
            setTimeout(() => {
              resolve({ data: [] });
            }, 10000) // Increased timeout to 10 seconds
          )
        ]);
      };
      
      const response = await fetchWithTimeout();
      
      setRecords(response.data);
      setFilteredRecords(response.data);
      
      // Find the most recent active record (checked_in, pending, or approved)
      const activeRecord = response.data.find(record => 
        record.status === 'checked_in' || record.status === 'pending' || record.status === 'approved'
      );
      
      setCurrentStatus(activeRecord || null);
    } catch (err) {
      console.error('Failed to fetch records:', err);
      setError('Failed to load check-in/checkout data');
      // Don't let API failures prevent the page from loading
      setRecords([]);
      setFilteredRecords([]);
      setCurrentStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckin = async () => {
    try {
      setCheckingIn(true);
      setError(null);
      
      // Student check-in (backend will get student info from auth)
      await studentCheckInCheckOutApi.checkIn({
        remarks: "Student self check-in"
      });
      
      await fetchStudentRecords();
    } catch (err: any) {
      console.error('Check-in failed:', err);
      setError(err.message || 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleQuickCheckout = async () => {
    // This method is no longer used since we have a dedicated create page
    // Redirect to create page instead
    router.push('/student/checkin-checkout/create');
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Live search handles filtering, no need to fetch again
  };

  const formatTime = (dateTime: string | null | undefined) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateTime: string | null | undefined) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDuration = (checkinTime: string | null | undefined, checkoutTime: string | null | undefined) => {
    if (!checkinTime || !checkoutTime) return '-';
    
    const checkin = new Date(checkinTime);
    const checkout = new Date(checkoutTime);
    const diffMs = checkin.getTime() - checkout.getTime();
    
    // Handle negative duration (if checkout is after checkin)
    const absDiffMs = Math.abs(diffMs);
    const diffHours = Math.floor(absDiffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getStatusBadge = (record: StudentCheckInCheckOut) => {
    // Check admin approval status first
    if (record.status === 'approved') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Approved
        </span>
      );
    } else if (record.status === 'declined') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="w-3 h-3 mr-1" />
          Declined
        </span>
      );
    } else if (record.status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </span>
      );
    } else if (record.checkout_time && record.checkin_time) {
      // If both checkout and checkin exist and status is not pending/approved/declined
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Complete
        </span>
      );
    } else if (record.checkout_time) {
      // Only checkout exists
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <ArrowLeft className="w-3 h-3 mr-1" />
          Checked Out
        </span>
      );
    } else if (record.checkin_time) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <ArrowRight className="w-3 h-3 mr-1" />
          Checked In
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unknown
        </span>
      );
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

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check-in / Checkout</h1>
        <Button
          onClick={() => router.push('/student/checkin-checkout/create')}
          className="bg-[#235999] hover:bg-[#1e4d87] text-white"
          icon={<Plus className="w-4 h-4" />}
        >
          Request Checkout
        </Button>
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

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by status, block, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-600 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 outline-none transition-all duration-200 bg-white"
            />
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Checkout Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? `No records found matching "${searchTerm}"` : 'No check-in/checkout records found.'}
                  </td>
                </tr>
              ) : (
                filteredRecords
                  .sort((a, b) => {
                    // Sort by priority: active statuses first, then by date (newest first)
                    const priorityOrder = { 'checked_in': 1, 'pending': 2, 'approved': 3, 'declined': 4 };
                    const aPriority = priorityOrder[a.status as keyof typeof priorityOrder] || 5;
                    const bPriority = priorityOrder[b.status as keyof typeof priorityOrder] || 5;
                    
                    if (aPriority !== bPriority) {
                      return aPriority - bPriority;
                    }
                    
                    // If same priority, sort by date (newest first)
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                  })
                  .map((record) => (
                    <tr key={record.id} className={`hover:bg-gray-50 ${
                      ['checked_in', 'pending'].includes(record.status) ? 'bg-blue-50' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {['checked_in', 'pending'].includes(record.status) && (
                            <div className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded mr-2">
                              ACTIVE
                            </div>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(record.date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.block?.block_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-500">
                            {formatDate(record.checkout_time)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatTime(record.checkout_time)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-500">
                            {formatDate(record.checkin_time)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatTime(record.checkin_time)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {calculateDuration(record.checkin_time, record.checkout_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link href={`/student/checkin-checkout/${record.id}`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Eye className="w-3 h-3" />}
                            >
                              View
                            </Button>
                          </Link>
                          
                          {/* Quick Actions for Active Records */}
                          {record.status === 'checked_in' && (
                            <Button
                              onClick={() => router.push('/student/checkin-checkout/create')}
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1"
                            >
                              Request Checkout
                            </Button>
                          )}
                          
                          {record.status === 'approved' && (
                            <Button
                              onClick={handleQuickCheckin}
                              disabled={checkingIn}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                              icon={checkingIn ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                              ) : (
                                <ArrowRight className="w-3 h-3" />
                              )}
                            >
                              {checkingIn ? 'Checking In...' : 'Check In'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
