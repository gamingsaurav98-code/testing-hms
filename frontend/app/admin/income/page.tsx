"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { incomeApi } from '@/lib/api/income.api';
import { Income, PaymentType } from '@/lib/api/types';
import { ApiError } from '@/lib/api/core';
import { TableSkeleton, ActionButtons } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function IncomeList() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);

  // Fetch payment types for filters
  useEffect(() => {
    const fetchPaymentTypes = async () => {
      try {
        // Get payment types from API
        const types = await incomeApi.getPaymentTypes();
        setPaymentTypes(types);
      } catch (error) {
        console.error('Error fetching payment types:', error);
      }
    };
    
    fetchPaymentTypes();
  }, []);

  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        setIsLoading(true);
        
        // Get income data from API
        const response = await incomeApi.getIncomes(currentPage);
        
        setIncomes(response.data);
        setFilteredIncomes(response.data);
        setTotalPages(response.last_page);
      } catch (error) {
        console.error('Error fetching incomes:', error);
        if (error instanceof ApiError) {
          setError(`Failed to load incomes: ${error.message}`);
        } else {
          setError('Failed to load income data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncomes();
  }, [currentPage]);
  
  // Handle income deletion
  const handleDeleteIncome = async (id: string) => {
    if (confirm('Are you sure you want to delete this income record? This action cannot be undone.')) {
      try {
        setIsDeletingId(id);
        
        // Delete income using API
        await incomeApi.deleteIncome(id);
        
        // Update the income list after deletion
        setIncomes(prevIncomes => prevIncomes.filter(income => income.id !== id));
        setFilteredIncomes(prevIncomes => prevIncomes.filter(income => income.id !== id));
        
      } catch (error) {
        console.error('Error deleting income:', error);
        alert('Failed to delete income record. Please try again.');
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  // Filter incomes based on search query and filters
  useEffect(() => {
    if (!incomes.length) return;
    
    let results = [...incomes];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(income => 
        income.student?.student_name.toLowerCase().includes(query) ||
        income.student?.email.toLowerCase().includes(query) ||
        income.payment_type?.name.toLowerCase().includes(query) ||
        income.income_type?.title.toLowerCase().includes(query)
      );
    }
    
    // Filter by payment type
    if (paymentTypeFilter) {
      results = results.filter(income => income.payment_type_id === paymentTypeFilter);
    }
    
    // Filter by payment status
    if (paymentStatusFilter) {
      results = results.filter(income => income.payment_status === paymentStatusFilter);
    }
    
    setFilteredIncomes(results);
  }, [incomes, searchQuery, paymentTypeFilter, paymentStatusFilter]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getPaymentStatusClass = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partial';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Income Records</h1>
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
            onClick={() => setCurrentPage(1)}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Income Records</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all income transactions</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/admin/income/create" className="bg-[#235999] hover:bg-[#1c4a82] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 inline-flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Income
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-[#235999] focus:border-[#235999] sm:text-sm"
                  placeholder="Search by student or payment type"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:ring-[#235999] focus:border-[#235999]"
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
              >
                <option value="">All Payment Types</option>
                {paymentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <select
                className="border border-gray-300 rounded-md text-sm py-2 px-3 bg-white focus:ring-[#235999] focus:border-[#235999]"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Income Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredIncomes.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No income records found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new income record.</p>
              <div className="mt-6">
                <Link
                  href="/admin/income/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#235999] hover:bg-[#1c4a82]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Income
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment For</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIncomes.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {income.student?.student_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{income.student?.student_name}</p>
                            <p className="text-sm text-gray-500">{income.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(income.income_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        Rs. {formatCurrency(income.amount)}
                        {(income.due_amount !== undefined && income.due_amount > 0) && (
                          <p className="text-xs text-red-500">Due: Rs. {formatCurrency(income.due_amount)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {income.payment_type?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {income.income_type?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(income.payment_status)}`}>
                          {getPaymentStatusText(income.payment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionButtons 
                          viewUrl={`/admin/income/${income.id}`}
                          editUrl={`/admin/income/${income.id}/edit`}
                          onDelete={() => handleDeleteIncome(income.id)}
                          isDeleting={isDeletingId === income.id}
                          style="compact"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, filteredIncomes.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredIncomes.length}</span> results
                </p>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${
                    currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${
                    currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
