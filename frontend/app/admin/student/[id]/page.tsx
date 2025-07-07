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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Student Details</h1>
            <p className="text-sm text-gray-600 mt-1">View complete student information</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button
              onClick={() => router.push('/admin/student')}
              variant="secondary"
              className="px-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </Button>
            <Button
              onClick={() => router.push(`/admin/student/${student.id}/edit`)}
              variant="edit"
              className="px-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              variant="delete"
              loading={isDeleting}
              className="px-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Student Status Banner */}
        <div className={`mb-6 p-4 rounded-lg shadow-sm border ${student.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
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
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">{student.is_active ? 'Active Student' : 'Inactive Student'}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm mt-1">
                {student.is_active 
                  ? 'This student is currently active and residing in the hostel.' 
                  : 'This student is currently inactive and not residing in the hostel.'}
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
              <div className="text-center md:text-left flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">{student.student_name}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 md:mt-0 ${
                    student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-2 text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    ID: {student.student_id || 'Not assigned'}
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {student.email}
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {student.contact_number}
                  </div>
                  {student.room ? (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Room {student.room.room_name} ({student.room.block?.block_name || 'Unknown Block'})
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No room assigned
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Student Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Personal Information</h3>
                <dl className="divide-y divide-gray-100">
                  {student.student_id && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Student ID #</dt>
                      <dd className="text-sm text-gray-900">{student.student_id}</dd>
                    </div>
                  )}
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-gray-600">Full Name</dt>
                    <dd className="text-sm text-gray-900">{student.student_name}</dd>
                  </div>
                  {student.date_of_birth && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Date of Birth</dt>
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
                  {student.blood_group && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Blood Group</dt>
                      <dd className="text-sm text-gray-900">{student.blood_group}</dd>
                    </div>
                  )}
                  {student.food && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Food Preference</dt>
                      <dd className="text-sm text-gray-900">{student.food}</dd>
                    </div>
                  )}
                  {student.disease && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Medical Conditions</dt>
                      <dd className="text-sm text-gray-900">{student.disease}</dd>
                    </div>
                  )}
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
              
              {/* Address Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Address Information</h3>
                <dl className="divide-y divide-gray-100">
                  {student.district && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">District</dt>
                      <dd className="text-sm text-gray-900">{student.district}</dd>
                    </div>
                  )}
                  {student.city_name && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">City</dt>
                      <dd className="text-sm text-gray-900">{student.city_name}</dd>
                    </div>
                  )}
                  {student.ward_no && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Ward No.</dt>
                      <dd className="text-sm text-gray-900">{student.ward_no}</dd>
                    </div>
                  )}
                  {student.street_name && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Street</dt>
                      <dd className="text-sm text-gray-900">{student.street_name}</dd>
                    </div>
                  )}
                  
                  {/* Show full address if all components are present */}
                  {student.street_name && student.ward_no && student.city_name && student.district && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Full Address</dt>
                      <dd className="text-sm text-gray-900 text-right">
                        {`${student.street_name}, Ward ${student.ward_no}, ${student.city_name}, ${student.district}`}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Citizenship & Identity */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Citizenship & Identity</h3>
                <dl className="divide-y divide-gray-200">
                  {student.citizenship_no && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Citizenship No.</dt>
                      <dd className="text-sm text-gray-900">{student.citizenship_no}</dd>
                    </div>
                  )}
                  {student.date_of_issue && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Date of Issue</dt>
                      <dd className="text-sm text-gray-900">{formatDate(student.date_of_issue)}</dd>
                    </div>
                  )}
                  {student.citizenship_issued_district && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Issued District</dt>
                      <dd className="text-sm text-gray-900">{student.citizenship_issued_district}</dd>
                    </div>
                  )}
                  {student.student_citizenship_image && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Citizenship Document</dt>
                      <dd className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => {
                        const url = getImageUrl(student.student_citizenship_image!);
                        // You can open the image in a modal or new tab
                        window.open(url, '_blank');
                      }}>View Document</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Education Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Education Information</h3>
                <dl className="divide-y divide-gray-100">
                  {student.educational_institution && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Institution</dt>
                      <dd className="text-sm text-gray-900">{student.educational_institution}</dd>
                    </div>
                  )}
                  {student.level_of_study && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Level of Study</dt>
                      <dd className="text-sm text-gray-900">{student.level_of_study}</dd>
                    </div>
                  )}
                  {student.class_time && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Class Time</dt>
                      <dd className="text-sm text-gray-900">{student.class_time}</dd>
                    </div>
                  )}
                  {student.expected_stay_duration && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Expected Stay</dt>
                      <dd className="text-sm text-gray-900">{student.expected_stay_duration}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {/* Family Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Family Information</h3>
                <dl className="divide-y divide-gray-100">
                  {student.father_name && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Father's Name</dt>
                      <dd className="text-sm text-gray-900">{student.father_name}</dd>
                    </div>
                  )}
                  {student.father_contact && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Father's Contact</dt>
                      <dd className="text-sm text-gray-900">{student.father_contact}</dd>
                    </div>
                  )}
                  {student.father_occupation && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Father's Occupation</dt>
                      <dd className="text-sm text-gray-900">{student.father_occupation}</dd>
                    </div>
                  )}
                  {student.mother_name && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Mother's Name</dt>
                      <dd className="text-sm text-gray-900">{student.mother_name}</dd>
                    </div>
                  )}
                  {student.mother_contact && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Mother's Contact</dt>
                      <dd className="text-sm text-gray-900">{student.mother_contact}</dd>
                    </div>
                  )}
                  {student.mother_occupation && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Mother's Occupation</dt>
                      <dd className="text-sm text-gray-900">{student.mother_occupation}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Spouse Information (if available) */}
              {(student.spouse_name || student.spouse_contact || student.spouse_occupation) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Spouse Information</h3>
                  <dl className="divide-y divide-gray-100">
                    {student.spouse_name && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Spouse's Name</dt>
                        <dd className="text-sm text-gray-900">{student.spouse_name}</dd>
                      </div>
                    )}
                    {student.spouse_contact && (
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Spouse's Contact</dt>
                        <dd className="text-sm text-gray-900">{student.spouse_contact}</dd>
                      </div>
                    )}
                    {student.spouse_occupation && (
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Spouse's Occupation</dt>
                        <dd className="text-sm text-gray-900">{student.spouse_occupation}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Local Guardian Information */}
              {(student.local_guardian_name || student.local_guardian_contact || student.local_guardian_address) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Local Guardian Information</h3>
                  <dl className="divide-y divide-gray-100">
                    {student.local_guardian_name && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Guardian's Name</dt>
                        <dd className="text-sm text-gray-900">{student.local_guardian_name}</dd>
                      </div>
                    )}
                    {student.local_guardian_relation && (
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Relation</dt>
                        <dd className="text-sm text-gray-900">{student.local_guardian_relation}</dd>
                      </div>
                    )}
                    {student.local_guardian_contact && (
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Contact</dt>
                        <dd className="text-sm text-gray-900">{student.local_guardian_contact}</dd>
                      </div>
                    )}
                    {student.local_guardian_address && (
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Address</dt>
                        <dd className="text-sm text-gray-900 text-right">{student.local_guardian_address}</dd>
                      </div>
                    )}
                    {student.local_guardian_occupation && (
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                        <dd className="text-sm text-gray-900">{student.local_guardian_occupation}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
              
              {/* Room Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Room Information</h3>
                <dl className="divide-y divide-gray-100">
                  {student.room ? (
                    <>
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Room Name</dt>
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

              {/* Payment & Financial Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Financial Information</h3>
                <dl className="divide-y divide-gray-100">
                  {student.due_amount !== undefined && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Due Amount</dt>
                      <dd className={`text-sm ${student.due_amount > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}`}>
                        {student.due_amount > 0 
                          ? `Rs ${student.due_amount.toFixed(2)}` 
                          : 'No dues'}
                      </dd>
                    </div>
                  )}
                  {student.is_existing_student !== undefined && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Existing Student</dt>
                      <dd className="text-sm text-gray-900">{student.is_existing_student ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {student.admission_fee && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Admission Fee</dt>
                      <dd className="text-sm text-gray-900">Rs {student.admission_fee}</dd>
                    </div>
                  )}
                  {student.form_fee && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Form Fee</dt>
                      <dd className="text-sm text-gray-900">Rs {student.form_fee}</dd>
                    </div>
                  )}
                  {student.security_deposit && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Security Deposit</dt>
                      <dd className="text-sm text-gray-900">Rs {student.security_deposit}</dd>
                    </div>
                  )}
                  {student.monthly_fee && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Monthly Fee</dt>
                      <dd className="text-sm text-gray-900">Rs {student.monthly_fee}</dd>
                    </div>
                  )}
                  {student.joining_date && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Joining Date</dt>
                      <dd className="text-sm text-gray-900">{formatDate(student.joining_date)}</dd>
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
                  {student.declaration_agreed !== undefined && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Declaration Agreed</dt>
                      <dd className="text-sm text-gray-900">{student.declaration_agreed ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {student.rules_agreed !== undefined && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Rules Agreed</dt>
                      <dd className="text-sm text-gray-900">{student.rules_agreed ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {student.verified_on && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Verified On</dt>
                      <dd className="text-sm text-gray-900">{formatDate(student.verified_on)}</dd>
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
                <h3 className="text-lg font-medium text-gray-700 mb-4">Student Amenities</h3>
                <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
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
              <h3 className="text-lg font-medium text-gray-700 mb-4">Student Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {student.student_image && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-w-4 aspect-h-3 overflow-hidden">
                      <img 
                        src={getImageUrl(student.student_image)} 
                        alt="Student Photo" 
                        className="object-cover w-full h-full cursor-pointer"
                        onClick={() => {
                          // This could be modified to show the image in a modal instead of a new tab
                          window.open(getImageUrl(student.student_image!), '_blank');
                        }}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <p className="text-sm font-medium text-gray-800">Student Photo</p>
                      <p className="text-xs text-gray-500 mt-1">Profile photo of the student</p>
                    </div>
                  </div>
                )}
                
                {student.student_citizenship_image && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-w-4 aspect-h-3 overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img 
                        src={getImageUrl(student.student_citizenship_image)} 
                        alt="Citizenship Document" 
                        className="object-contain w-full h-full cursor-pointer"
                        onClick={() => {
                          window.open(getImageUrl(student.student_citizenship_image!), '_blank');
                        }}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <p className="text-sm font-medium text-gray-800">Citizenship Document</p>
                      <p className="text-xs text-gray-500 mt-1">Citizenship ID proof</p>
                    </div>
                  </div>
                )}
                
                {student.registration_form_image && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-w-4 aspect-h-3 overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img 
                        src={getImageUrl(student.registration_form_image)} 
                        alt="Registration Form" 
                        className="object-contain w-full h-full cursor-pointer"
                        onClick={() => {
                          window.open(getImageUrl(student.registration_form_image!), '_blank');
                        }}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <p className="text-sm font-medium text-gray-800">Registration Form</p>
                      <p className="text-xs text-gray-500 mt-1">Signed registration form</p>
                    </div>
                  </div>
                )}
                
                {student.physical_copy_image && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-w-4 aspect-h-3 overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img 
                        src={getImageUrl(student.physical_copy_image)} 
                        alt="Financial Document" 
                        className="object-contain w-full h-full cursor-pointer"
                        onClick={() => {
                          window.open(getImageUrl(student.physical_copy_image!), '_blank');
                        }}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <p className="text-sm font-medium text-gray-800">Financial Document</p>
                      <p className="text-xs text-gray-500 mt-1">Payment receipt or financial record</p>
                    </div>
                  </div>
                )}
                
                {!student.student_image && !student.student_citizenship_image && !student.registration_form_image && !student.physical_copy_image && (
                  <div className="col-span-3 text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                    <p className="mt-1 text-sm text-gray-500">No documents have been uploaded for this student.</p>
                  </div>
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
