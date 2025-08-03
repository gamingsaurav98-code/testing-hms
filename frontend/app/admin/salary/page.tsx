'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SalaryApi, type Salary, type SalaryFilters } from '@/lib/api';
import { Button, SearchBar, ConfirmModal, SuccessToast, TableSkeleton, ActionButtons } from '@/components/ui';
import { Trash, Edit, Plus } from 'lucide-react';
import Link from 'next/link';

export default function SalaryList() {
  const router = useRouter();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [filteredSalaries, setFilteredSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{show: boolean, salaryId: number | null}>({
    show: false,
    salaryId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await SalaryApi.getAll({});
      const salaryData = Array.isArray(response) ? response : response.data;
      setSalaries(salaryData);
      setFilteredSalaries(salaryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load salaries');
      console.error('Error fetching salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSalaries(salaries);
    } else {
      const filtered = salaries.filter(salary =>
        salary.staff?.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salary.staff?.staff_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salary.month_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSalaries(filtered);
    }
  }, [searchQuery, salaries]);

  const handleDelete = async (id: number) => {
    setDeleteModal({show: true, salaryId: id});
  };

  const confirmDelete = async () => {
    const salaryId = deleteModal.salaryId;
    if (!salaryId) return;

    try {
      setIsDeleting(salaryId);
      setDeleteModal({show: false, salaryId: null});
      
      await SalaryApi.delete(salaryId);
      
      const updatedSalaries = salaries.filter(salary => salary.id !== salaryId);
      setSalaries(updatedSalaries);
      setFilteredSalaries(updatedSalaries.filter(salary =>
        !searchQuery.trim() ||
        salary.staff?.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salary.staff?.staff_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salary.month_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
      setAlert({show: true, message: 'Salary deleted successfully!', type: 'success'});
      
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 2000); // Reduced from 3000ms
      
    } catch (err) {
      setAlert({
        show: true, 
        message: err instanceof Error ? err.message : 'Failed to delete salary', 
        type: 'error'
      });
      
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 3000); // Reduced from 5000ms
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({show: false, salaryId: null});
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Salary Management</h1>
          <p className="text-sm text-gray-500 mt-1">Loading salaries...</p>
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
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Salary"
        message="Are you sure you want to delete this salary record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting !== null}
        variant="danger"
      />

      {/* Alert Notification */}
      {alert.type === 'success' && alert.show && (
        <SuccessToast
          show={alert.show}
          message={alert.message}
          progress={100}
          onClose={() => setAlert({show: false, message: '', type: 'success'})}
        />
      )}
      {alert.type === 'error' && alert.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-red-100 border-red-500 text-red-700 border-l-4 p-4 rounded-lg shadow-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setAlert({show: false, message: '', type: 'success'})}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Salary Management</h1>
          <p className="text-sm text-gray-500 mt-1">{salaries.length} total salary records</p>
        </div>
        <Button
          onClick={() => router.push('/admin/salary/create')}
          icon={<Plus className="w-4 h-4" />}
          className="bg-[#235999] hover:bg-[#1e4d87]"
        >
          Create Salary
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search salaries by staff name or ID..."
        />
      </div>

      {/* Salary List */}
      {filteredSalaries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery ? 'No salaries found' : 'No salary records yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first salary record to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => router.push('/admin/salary/create')}
              className="bg-[#235999] hover:bg-[#1e4d87]"
            >
              Create Salary
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Staff Details</div>
              <div className="col-span-2">Period</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Created Date</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredSalaries.map((salary) => (
              <div key={salary.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Staff Details */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-gray-900">{salary.staff?.staff_name}</div>
                    <div className="text-xs text-gray-500">{salary.staff?.staff_id}</div>
                  </div>

                  {/* Period */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900">
                      {salary.month_name} {salary.year}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(salary.amount)}</div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    {getStatusBadge(salary.status)}
                  </div>

                  {/* Created Date */}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">
                      {new Date(salary.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <ActionButtons 
                      viewUrl={`/admin/salary/${salary.id}`}
                      editUrl={`/admin/salary/${salary.id}/edit`}
                      onDelete={() => handleDelete(salary.id)}
                      isDeleting={isDeleting === salary.id}
                      style="compact"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {filteredSalaries.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {filteredSalaries.length} of {salaries.length} salary records
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}
