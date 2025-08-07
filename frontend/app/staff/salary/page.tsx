'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  SearchBar, 
  TableSkeleton 
} from '@/components/ui';
import { SalaryApi, Salary } from '@/lib/api/salary.api';
import { 
  Calendar, 
  User,
  Search,
  AlertCircle,
  Eye
} from 'lucide-react';

export default function StaffSalaryPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [filteredSalaries, setFilteredSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    thisMonthSalary: 0,
    lastMonthSalary: 0
  });

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Optimized API call with timeout
      const fetchWithTimeout = async () => {
        return await Promise.race([
          SalaryApi.getMySalaryHistory(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout after 3 seconds')), 3000)
          )
        ]);
      };
      
      const response = await fetchWithTimeout().catch(() => []);
      const salariesArray = Array.isArray(response) ? response : [];
      
      // No need to filter since getMySalaryHistory() already returns only current staff's salaries
      const mySalaries = salariesArray;
      
      setSalaries(mySalaries);
      setFilteredSalaries(mySalaries);
      calculateStats(mySalaries);
    } catch (err) {
      console.error('Error fetching salaries:', err);
      setError('Failed to load salary information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter salaries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSalaries(salaries);
    } else {
      const filtered = salaries.filter(salary =>
        getMonthName(salary.month).toLowerCase().includes(searchQuery.toLowerCase()) ||
        salary.year.toString().includes(searchQuery) ||
        salary.status?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSalaries(filtered);
    }
  }, [searchQuery, salaries]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const calculateStats = (salariesData: Salary[]) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const thisMonthSalary = salariesData.find(salary => 
      salary.month === currentMonth && salary.year === currentYear
    );

    const lastMonthSalary = salariesData.find(salary => 
      salary.month === lastMonth && salary.year === lastMonthYear
    );

    setStats({
      thisMonthSalary: thisMonthSalary ? parseFloat(String(thisMonthSalary.amount || '0')) : 0,
      lastMonthSalary: lastMonthSalary ? parseFloat(String(lastMonthSalary.amount || '0')) : 0
    });
  };

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };

  if (loading && filteredSalaries.length === 0) {
    return (
      <div className="p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Salary Information</h1>
          <p className="text-gray-600">Your earnings and payment history</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Salary Information</h1>
          <p className="text-gray-600">Your earnings and payment history</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
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
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Salary Information</h1>
            <p className="text-gray-600">Your earnings and payment history</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Month Salary</p>
            <p className="text-2xl font-bold text-green-600">
              Rs.{Math.round(stats.thisMonthSalary).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs.{Math.round(stats.thisMonthSalary).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Month</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs.{Math.round(stats.lastMonthSalary).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by month, year, or status..."
        />
      </div>

      {/* Salary History */}
      {filteredSalaries.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No salary records found</h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search criteria' 
              : 'Your salary information will appear here once it\'s processed'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSalaries.map((salary) => (
            <div
              key={salary.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Salary Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getMonthName(salary.month)} {salary.year}
                        </h3>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        salary.status === 'paid'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : salary.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {salary.status || 'pending'}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-gray-900">
                        Rs.{parseFloat(String(salary.amount || '0')).toLocaleString()}
                      </p>
                    </div>

                    {/* Meta Information */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Payment Date: {
                          salary.status === 'paid' 
                            ? new Date(salary.updated_at || salary.created_at).toLocaleDateString()
                            : 'Pending'
                        }</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
