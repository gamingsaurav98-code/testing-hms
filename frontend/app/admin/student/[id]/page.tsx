"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { studentApi, type StudentWithAmenities } from '@/lib/api';
import { ApiError } from '@/lib/api/core';
import { Button, TableSkeleton, ActionButtons, ConfirmModal } from '@/components/ui';
import { formatDate, getImageUrl } from '@/lib/utils';

export default function StudentDetail() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id || '';

  const [student, setStudent] = useState<StudentWithAmenities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsLoading(true);
        
        // Fetch student data from API
        const data = await studentApi.getStudent(id);
        
        setStudent(data);
      } catch (error) {
        console.error('Error fetching student details:', error);
        if (error instanceof ApiError) {
          setError(`Failed to load student details: ${error.message}`);
        } else {
          setError('Failed to load student details. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Delete student using API
      await studentApi.deleteStudent(id);
      
      // Redirect to students list
      router.push('/admin/student');
    } catch (error) {
      console.error('Error deleting student:', error);
      setError('Failed to delete student record.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Student Details</h1>
          <p className="text-sm text-gray-500 mt-1">Loading student data...</p>
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
            onClick={() => router.push('/admin/student')}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Back to Students List
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-800">Student record not found.</p>
          </div>
          <button
            onClick={() => router.push('/admin/student')}
            className="mt-3 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded text-sm"
          >
            Back to Students List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Student Details</h1>
            <p className="text-sm text-gray-600 mt-1">View complete student information</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button
              onClick={() => router.push(`/admin/student/${student.id}/edit`)}
              variant="edit"
            >
              Edit Student
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              variant="delete"
              loading={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Student Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${student.is_active ? 'bg-green-50' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {student.is_active ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">{student.is_active ? 'Active Student' : 'Inactive Student'}</h3>
              <p className="text-sm">
                {student.is_active 
                  ? 'This student is currently active in the hostel.' 
                  : 'This student is currently inactive.'}
              </p>
            </div>
          </div>
        </div>

        {/* Student Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            {/* Student Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start mb-6 pb-6 border-b border-gray-200">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-4xl font-medium overflow-hidden mb-4 md:mb-0 md:mr-6">
                {student.student_image ? (
                  <img 
                    src={getImageUrl(student.student_image)} 
                    alt={student.student_name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  student.student_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-semibold text-gray-900">{student.student_name}</h2>
                <div className="mt-2 text-gray-600">
                  <div className="flex flex-col md:flex-row md:items-center mb-1">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {student.email}
                    </div>
                    <span className="hidden md:inline mx-2">•</span>
                    <div className="flex items-center mt-1 md:mt-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {student.contact_number}
                    </div>
                  </div>
                  {student.room ? (
                    <div className="flex items-center justify-center md:justify-start mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Room {student.room.room_name} ({student.room.block?.block_name || 'Unknown Block'})
                    </div>
                  ) : (
                    <div className="flex items-center justify-center md:justify-start mt-1 text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No room assigned
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Student Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Personal Information</h3>
                <dl className="divide-y divide-gray-200">
                  {student.date_of_birth && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="text-sm text-gray-900">{formatDate(student.date_of_birth)}</dd>
                    </div>
                  )}
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                    <dd className="text-sm text-gray-900">{student.contact_number}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{student.email}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
              
              {/* Room Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Room Information</h3>
                <dl className="divide-y divide-gray-200">
                  {student.room ? (
                    <>
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Room Name</dt>
                        <dd className="text-sm text-gray-900">{student.room.room_name}</dd>
                      </div>
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Block</dt>
                        <dd className="text-sm text-gray-900">{student.room.block?.block_name || 'N/A'}</dd>
                      </div>
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Room Type</dt>
                        <dd className="text-sm text-gray-900">{student.room.room_type}</dd>
                      </div>
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Room Capacity</dt>
                        <dd className="text-sm text-gray-900">{student.room.capacity} beds</dd>
                      </div>
                    </>
                  ) : (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Room</dt>
                      <dd className="text-sm text-amber-600">No room assigned</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Information</h3>
                <dl className="divide-y divide-gray-200">
                  {student.due_amount !== undefined && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Due Amount</dt>
                      <dd className={`text-sm ${student.due_amount > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {student.due_amount > 0 
                          ? `Rs ${student.due_amount.toFixed(2)}` 
                          : 'No dues'}
                      </dd>
                    </div>
                  )}
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Registered On</dt>
                    <dd className="text-sm text-gray-900">{formatDate(student.created_at)}</dd>
                  </div>
                </dl>
              </div>
              
              {/* System Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">System Information</h3>
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Student ID</dt>
                    <dd className="text-sm text-gray-900 font-mono">{student.id}</dd>
                  </div>
                  {student.user_id && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">User ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{student.user_id}</dd>
                    </div>
                  )}
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">{formatDate(student.created_at)}</dd>
                  </div>
                  {student.updated_at && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="text-sm text-gray-900">{formatDate(student.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            {/* Student Amenities */}
            {student.amenities && student.amenities.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Student Amenities</h3>
                <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {student.amenities.map((amenity, index) => (
                        <tr key={amenity.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{amenity.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{amenity.description || 'No description'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Student Documents */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Student Image</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {student.student_image && (
                  <div>
                    <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden shadow-md mb-2">
                      <img 
                        src={getImageUrl(student.student_image)} 
                        alt="Student Photo" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-500">Student Photo</p>
                  </div>
                )}
                
                {!student.student_image && (
                  <p className="text-sm text-gray-500">No student image uploaded</p>
                )}
              </div>
            </div>
          </div>
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
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />
    </div>
  );
}
