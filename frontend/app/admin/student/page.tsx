"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { studentApi, type StudentWithAmenities } from '@/lib/api';
import { ApiError } from '@/lib/api/core';
import { 
  TableSkeleton, 
  SearchBar, 
  Button,
  ActionButtons,
  ConfirmModal
} from '@/components/ui';
import { formatDate, getImageUrl } from '@/lib/utils';

export default function StudentList() {
  const router = useRouter();
  
  const [students, setStudents] = useState<StudentWithAmenities[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithAmenities[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        
        // Get students data from API
        const response = await studentApi.getStudents(currentPage);
        console.log('API Response:', response); // Debug log to see API response
        
        // Check if we have data before setting state
        if (response && response.data) {
          setStudents(response.data);
          setFilteredStudents(response.data);
          setTotalPages(response.last_page || 1);
        } else {
          console.error('No data returned from API');
          setError('No student data available. The API may be unavailable.');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        if (error instanceof ApiError) {
          setError(`Failed to load students: ${error.message}`);
        } else {
          setError('Failed to load student data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [currentPage]);

  // Apply filters when searchTerm or statusFilter changes
  useEffect(() => {
    if (!students.length) return;

    let result = [...students];

    // Filter by search term
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(student => 
        student.student_name.toLowerCase().includes(lowercasedTerm) || 
        student.email.toLowerCase().includes(lowercasedTerm) ||
        student.contact_number.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Filter by status
    if (statusFilter) {
      const isActive = statusFilter === 'active';
      result = result.filter(student => student.is_active === isActive);
    }

    setFilteredStudents(result);
  }, [searchTerm, statusFilter, students]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const confirmDelete = (studentId: string) => {
    setStudentToDelete(studentId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;

    try {
      setIsDeleting(true);
      
      // Delete student using API
      await studentApi.deleteStudent(studentToDelete);
      
      // Remove from local state
      const updatedStudents = students.filter(student => student.id !== studentToDelete);
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
      
      // Close modal
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      if (error instanceof ApiError) {
        setError(`Failed to delete student: ${error.message}`);
      } else {
        setError('Failed to delete student. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-medium text-gray-900">Student Management</h1>
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
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all students in the hostel</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              onClick={() => router.push('/admin/student/create')}
              variant="primary"
            >
              Add New Student
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <SearchBar
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by name, email, or phone number..."
              />
            </div>
            <div className="w-full md:w-1/2 md:flex md:justify-end">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-800">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Room</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joined Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr 
                      key={student.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm mr-3 overflow-hidden">
                            {student.student_image ? (
                              <img 
                                src={getImageUrl(student.student_image)} 
                                alt={student.student_name}
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              student.student_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.student_name}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.room ? (
                          <div>
                            <div className="font-medium">{student.room.room_name}</div>
                            <div className="text-xs text-gray-500">
                              {student.room.block ? student.room.block.block_name : 'No Block'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>{student.contact_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(student.is_active)}
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(student.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionButtons
                          onView={() => router.push(`/admin/student/${student.id}`)}
                          onEdit={() => router.push(`/admin/student/${student.id}/edit`)}
                          onDelete={() => confirmDelete(student.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="text-gray-500">No students found matching your filters</div>
              {searchTerm || statusFilter ? (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-3 bg-gray-50">
              <div className="text-sm text-gray-500">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setStudentToDelete(null);
        }}
        variant="danger"
      />
    </div>
  );
}
