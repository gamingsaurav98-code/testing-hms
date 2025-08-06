'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentCheckInCheckOutApi, StudentCheckInCheckOutFormData } from '@/lib/api/student-checkincheckout.api';
import { blockApi, Block } from '@/lib/api';
import { Button } from '@/components/ui';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

// You would get this from authentication context in a real app
const CURRENT_STUDENT_ID = "1"; // This should come from auth context

export default function CreateCheckinCheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<StudentCheckInCheckOutFormData>({
    student_id: CURRENT_STUDENT_ID,
    block_id: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    checkin_time: '',
    checkout_time: '',
    remarks: ''
  });

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      // Get all blocks (first page with high limit)
      const response = await blockApi.getBlocks(1);
      const blocksData = response.data || [];
      
      setBlocks(blocksData);
      
      // Auto-select first block if available
      if (blocksData.length > 0 && !formData.block_id) {
        setFormData(prev => ({ ...prev, block_id: blocksData[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
      setError('Failed to load blocks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.block_id) {
      setError('Please select a block');
      return;
    }

    if (!formData.date) {
      setError('Please select a date');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await studentCheckInCheckOutApi.createCheckInCheckOut(formData);
      
      router.push('/student/checkin-checkout');
    } catch (err: any) {
      console.error('Failed to create record:', err);
      setError(err.message || 'Failed to create check-in/checkout record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Create Check-in/Checkout Record</h1>
          <p className="text-gray-600 mt-1">Add a manual check-in/checkout record</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Block Selection */}
            <div>
              <label htmlFor="block_id" className="block text-sm font-medium text-gray-700 mb-2">
                Block *
              </label>
              <select
                id="block_id"
                name="block_id"
                value={formData.block_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a block</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.block_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Check-in Time */}
            <div>
              <label htmlFor="checkin_time" className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Time
              </label>
              <input
                type="datetime-local"
                id="checkin_time"
                name="checkin_time"
                value={formData.checkin_time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty if you haven't checked in yet</p>
            </div>

            {/* Checkout Time */}
            <div>
              <label htmlFor="checkout_time" className="block text-sm font-medium text-gray-700 mb-2">
                Checkout Time
              </label>
              <input
                type="datetime-local"
                id="checkout_time"
                name="checkout_time"
                value={formData.checkout_time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Leave empty if you haven't checked out yet</p>
            </div>

            {/* Remarks */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes about this record..."
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>If you set both check-in and checkout times, the record will be marked as pending approval</li>
                    <li>If you only set check-in time, you'll be marked as checked in</li>
                    <li>You can create records for past dates if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              icon={loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            >
              {loading ? 'Creating...' : 'Create Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
