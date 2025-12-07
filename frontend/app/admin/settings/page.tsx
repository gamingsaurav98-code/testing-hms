'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
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
  label?: string; // Add this line
}
type StudentOption = Student & {
  label: string;
};

const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const role = user?.role;
  return role === 'admin' || role === 'staff' || role === 'student' ? role : 'admin';
};

export default function FinancialSettingsPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const [students, setStudents] = useState<Student[]>([]);
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [monthlyFee, setMonthlyFee] = useState('0');

  const [searchQuery, setSearchQuery] = useState('');
  const userRole = useUserRole();
  const isAdmin = userRole === 'admin';

  // Fetch active students with optional search
 const fetchStudents = async (searchTerm = '') => {
  try {
    const url = searchTerm
      ? `/api/students?active=true&all=true&search=${encodeURIComponent(searchTerm)}`
      : '/api/students?active=true&all=true';
    
    const response = await safeFetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await handleResponse<Student[]>(response);
    setStudents(data);
  } catch (error) {
    console.error('Error fetching students:', error);
  }
};
  // Fetch monthly fee for selected student
  const fetchMonthlyFee = async (studentId: number) => {
    try {
      const response = await safeFetch(`/api/admin/setting/checkincheckout/financialcalculation/student?id=${studentId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await handleResponse<{monthly_fee: string}>(response);
      setMonthlyFee(data.monthly_fee || '0');
    } catch (error) {
      console.error('Failed to fetch monthly fee:', error);
      setMonthlyFee('0');
    }
  };

  // Handle student selection
  const handleStudentSelect = (student: StudentOption) => {
    setSelectedStudent(student);
    fetchMonthlyFee(student.id);
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
                <Combobox<Student>
  options={students.map(student => ({
    ...student,
    label: `${student.student_name} - ${student.email}${student.student_id ? ` (${student.student_id})` : ''}`
  }))}
  value={selectedStudent}
  onChange={(student) => {
    if (student) {
      handleStudentSelect(student);
    } else {
      setSelectedStudent(null);
      setMonthlyFee('0');
    }
  }}
  onSearch={setSearchQuery}
  placeholder="Search by name, email, or student ID..."
  displayValue={(student) => 
    student ? 
    `${student.student_name} - ${student.email}${student.student_id ? ` (${student.student_id})` : ''}` : 
    ''
  }
/>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-neutral-900">
                        Monthly Fee
                      </label>
                      <input
                        type="text"
                        value={monthlyFee}
                        readOnly
                        disabled
                        className="w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 bg-gray-100 cursor-not-allowed"
                        placeholder="Monthly fee will be displayed here"
                      />
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
