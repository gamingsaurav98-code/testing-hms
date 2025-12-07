'use client';

import React, { useState, useEffect, useCallback, ErrorInfo, Component } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox-component';
import { FinancialSettingsForm } from '@/components/financial/FinancialSettingsForm';
import { StudentDeductionProcessor } from '@/components/admin/StudentDeductionProcessor';
import { StaffDeductionProcessor } from '@/components/admin/StaffDeductionProcessor';
import { useAuth } from '@/lib/auth';
import { safeFetch, handleResponse } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';

// User role types
type UserRole = 'admin' | 'staff' | 'student';

// Student type
interface Student {
  id: number;
  student_name: string;
  email: string;
  contact_number: string;
  student_id?: string;
  is_active: boolean;
}

type StudentOption = Student & {
  label: string;
  value: string;
};

const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const role = user?.role;
  return role === 'admin' || role === 'staff' || role === 'student' ? role : 'admin';
};

// Error Boundary Component
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Financial Settings Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-muted-foreground">
              We encountered an error while loading the financial settings. Please try refreshing the page.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  If this problem persists, please contact support.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

function FinancialSettingsPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [monthlyFee, setMonthlyFee] = useState('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const userRole = useUserRole();
  const isAdmin = userRole === 'admin';

  // Memoize the fetchStudents function to prevent unnecessary re-renders
  const fetchStudents = useCallback(async (searchTerm: string = '') => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);
      setError(null);

      const url = searchTerm
        ? `/api/students?active=true&paginate=false&search=${encodeURIComponent(searchTerm)}`
        : '/api/students?active=true&paginate=false';

      const response = await safeFetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await handleResponse<Student[]>(response);

      // Transform students to the format expected by Combobox
      const formattedStudents = data.map(student => ({
        ...student,
        label: `${student.student_name} - ${student.email}${student.student_id ? ` (${student.student_id})` : ''}`,
        value: student.id.toString()
      }));

      setStudents(formattedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students. Please try again.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);
  // Fetch monthly fee for selected student
  const fetchMonthlyFee = useCallback(async (studentId: number) => {
    if (!studentId) {
      setMonthlyFee('0');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await safeFetch(
        `/api/students/${studentId}/financials/latest`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      const data = await handleResponse<{ monthly_fee: string }>(response);
      setMonthlyFee(data.monthly_fee || '0');
    } catch (err) {
      console.error('Failed to fetch monthly fee:', err);
      setError('Failed to fetch monthly fee. Please try again.');
      setMonthlyFee('0');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle student selection
  const handleStudentSelect = (student: StudentOption | null) => {
    setSelectedStudent(student);
    if (student) {
      fetchMonthlyFee(student.id);
    } else {
      setMonthlyFee('0');
    }
  };

  // Load students on component mount and when search query changes
  useEffect(() => {
    if (isAdmin) {
      fetchStudents(searchQuery);
    }
  }, [isAdmin, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Financial Settings</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Manage financial settings and deduction rules'
            : 'View your financial information and deduction rules'}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="settings">Student</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Student deduction form</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? 'Manage student-related financial operations and transactions.'
                    : 'View the current deduction rules applied to your account.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdmin && (
                  <div className="space-y-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Search and Select Student
                      </label>
                      <Combobox
                        options={students}
                        value={selectedStudent}
                        onChange={handleStudentSelect}
                        onSearch={setSearchQuery}
                        placeholder="Search by name, email, or student ID..."
                        isLoading={isLoading}
                        emptyMessage="No students found"
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-600">{error}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-neutral-900">
                        Monthly Fee
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={monthlyFee}
                          readOnly
                          disabled
                          className="w-full px-4 py-2 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 bg-gray-100 cursor-not-allowed"
                          placeholder={isLoading ? 'Loading...' : 'Monthly fee will be displayed here'}
                        />
                        {isLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <FinancialSettingsForm isAdmin={isAdmin} />

                {isAdmin && (
                  <StudentDeductionProcessor />
                )}
              </CardContent>
            </Card>

        
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff deduction form</CardTitle>
              <CardDescription>
                Manage staff-related financial operations and transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
             <FinancialSettingsForm isAdmin={isAdmin} />

             {isAdmin && (
               <StaffDeductionProcessor />
             )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    
    </div>
  );
}

export default function FinancialSettingsPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <FinancialSettingsPage />
    </ErrorBoundary>
  );
}
