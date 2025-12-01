"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentApi, type StudentWithAmenities } from '@/lib/api';
import { roomApi } from '@/lib/api/room.api';
import { ApiError } from '@/lib/api/core';
import { 
  TableSkeleton, 
  SearchBar, 
  Button,
  ActionButtons,
  ConfirmModal
} from '@/components/ui';
import { formatDate, getImageUrl } from '@/lib/utils';

export default function Page() {
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
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch both students and rooms data
        const [studentsResponse, roomsResponse] = await Promise.all([
          studentApi.getStudents(currentPage),
          roomApi.getRooms(1, { per_page: 1000 }) // Fetch all rooms
        ]);
        
        console.log('API Response:', studentsResponse); // Debug log to see API response
        
        // Check if we have data before setting state
        if (studentsResponse && studentsResponse.data) {
          setStudents(studentsResponse.data);
          setFilteredStudents(studentsResponse.data);
          setTotalPages(studentsResponse.last_page || 1);
        } else {
          console.error('No data returned from API');
          setError('No student data available. The API may be unavailable.');
        }
        
        // Set rooms data
        if (roomsResponse && roomsResponse.data) {
          setRooms(roomsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error instanceof ApiError) {
          setError(`Failed to load data: ${error.message}`);
        } else {
          setError('Failed to load data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  // Apply filters when searchTerm or statusFilter changes
  useEffect(() => {
    if (!students.length) return;

    let result = [...students];
    
    console.log('Original students:', students.length);
    console.log('Status filter:', statusFilter);
    console.log('Sample student is_active values:', students.slice(0, 3).map(s => ({ name: s.student_name, is_active: s.is_active, type: typeof s.is_active })));

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
      console.log('Applying status filter:', statusFilter);
      console.log('Sample students before filtering:', result.slice(0, 5).map(s => ({ 
        name: s.student_name, 
        is_active: s.is_active, 
        type: typeof s.is_active,
        stringValue: String(s.is_active)
      })));
      
      if (statusFilter === 'active') {
        result = result.filter(student => {
          // Handle different possible values for is_active
          const isActiveValue: any = student.is_active;
          const isActive = isActiveValue === true || 
                          isActiveValue === 1 || 
                          isActiveValue === '1' || 
                          String(isActiveValue).toLowerCase() === 'true';
          return isActive;
        });
      } else if (statusFilter === 'inactive') {
        result = result.filter(student => {
          // Handle different possible values for is_active
          const isActiveValue: any = student.is_active;
          const isInactive = isActiveValue === false || 
                            isActiveValue === 0 || 
                            isActiveValue === '0' || 
                            String(isActiveValue).toLowerCase() === 'false' ||
                            isActiveValue === null ||
                            isActiveValue === undefined;
          return isInactive;
        });
      }
      
      console.log('Students after status filtering:', result.length);
    }
    
    console.log('Filtered students:', result.length);
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

  const handleToggleStatus = async (studentId: string) => {
    try {
      setTogglingStatusId(studentId);
      
      // Toggle status using API
      const response = await studentApi.toggleStudentStatus(studentId);
      
      // Update local state with new status and room information
      const updatedStudents = (Array.isArray(students) ? students : []).map(student => 
        student.id === studentId 
          ? { 
              ...student, 
              is_active: response.is_active,
              room_id: response.student.room_id,
              room: response.student.room
            }
          : student
      );
      
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
      
      // Show a success message if room was removed
      if (response.room_removed) {
        // You could add a toast notification here
        console.log('Student deactivated and room assignment removed');
      }
    } catch (error) {
      console.error('Error toggling student status:', error);
      if (error instanceof ApiError) {
        setError(`Failed to update student status: ${error.message}`);
      } else {
        setError('Failed to update student status. Please try again.');
      }
    } finally {
      setTogglingStatusId(null);
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

  const getTotalAvailableBeds = () => {
    // Calculate total available beds from all rooms based on their capacity and occupied beds
    let totalAvailable = 0;
    
    rooms.forEach(room => {
      const capacity = parseInt(String(room.capacity || 0));
      // Use occupied_beds if available from backend, otherwise count students
      const occupied = room.occupied_beds || students.filter(s => s.room_id === room.id && s.is_active).length;
      const available = Math.max(0, capacity - occupied);
      totalAvailable += available;
    });
    
    return totalAvailable;
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

        {/* Summary Stats */}
        {!isLoading && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
                  <p className="text-sm text-gray-500">Total Students</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {students.filter(s => s.is_active).length}
                  </p>
                  <p className="text-sm text-gray-500">Active Students</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {students.filter(s => !s.is_active).length}
                  </p>
                  <p className="text-sm text-gray-500">Inactive Students</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">
                    {getTotalAvailableBeds()}
                  </p>
                  <p className="text-sm text-gray-500">Available Beds</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  {(Array.isArray(filteredStudents) ? filteredStudents : []).map(student => (
                    <tr 
                      key={student.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm mr-3 overflow-hidden cursor-pointer"
                            onClick={() => {
                              if (student.student_image) {
                                setSelectedPhoto(getImageUrl(student.student_image));
                                setShowPhotoModal(true);
                              }
                            }}
                            title={student.student_image ? "Click to enlarge" : "No photo available"}
                          >
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
                        <div className="flex items-center justify-end space-x-2">
                          {/* Toggle Status Button */}
                          <button
                            onClick={() => handleToggleStatus(student.id)}
                            disabled={togglingStatusId === student.id}
                            className={`p-2 rounded-lg transition-colors ${
                              student.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            } ${togglingStatusId === student.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={student.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {togglingStatusId === student.id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : student.is_active ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          
                          <ActionButtons
                            viewUrl={`/admin/student/${student.id}`}
                            editUrl={`/admin/student/${student.id}/edit`}
                            onDelete={() => confirmDelete(student.id)}
                            isDeleting={isDeleting && studentToDelete === student.id}
                            style="compact"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter ? 'Try adjusting your search or filter criteria.' : 'Get started by adding a new student.'}
              </p>
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

      {/* Photo Popup Modal */}
      {showPhotoModal && selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div 
            className="relative max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              onClick={() => setShowPhotoModal(false)}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedPhoto} 
              alt="Student Photo" 
              className="max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
