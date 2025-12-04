"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { staffApi, type StaffWithAmenities } from '@/lib/api/staff.api';
import { ApiError } from '@/lib/api/core';
import { Button, TableSkeleton, ActionButtons, ConfirmModal, ImageModal } from '@/components/ui';
import { formatDate, getImageUrl } from '@/lib/utils';

export default function StaffDetail() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id || '';

  const [staff, setStaff] = useState<StaffWithAmenities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        
        // Fetch staff data from API
        const data = await staffApi.getStaffMember(id);
        
        setStaff(data);
      } catch (error) {
        console.error('Error fetching staff details:', error);
        if (error instanceof ApiError) {
          setError(`Failed to load staff details: ${error.message}`);
        } else {
          setError('Failed to load staff details. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Delete staff using API
      await staffApi.deleteStaff(id);
      
      // Redirect to staff list
      router.push('/admin/staff');
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError('Failed to delete staff record.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageClick = (imageUrl: string, alt: string) => {
    setSelectedImage({ url: imageUrl, alt });
    setImageModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Staff Details</h1>
          <p className="text-sm text-gray-500 mt-1">Loading staff data...</p>
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
            onClick={() => router.push('/admin/staff')}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
          >
            Back to Staff List
          </button>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-800">Staff record not found.</p>
          </div>
          <button
            onClick={() => router.push('/admin/staff')}
            className="mt-3 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded text-sm"
          >
            Back to Staff List
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
            <h1 className="text-xl font-semibold text-gray-900">Staff Details</h1>
            <p className="text-sm text-gray-600 mt-1">View complete staff information</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button
              onClick={() => router.push(`/admin/staff/${staff.id}/edit`)}
              variant="primary"
            >
              Edit Staff
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              variant="danger"
              loading={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Staff Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            {/* Staff Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start mb-6 pb-6 border-b border-gray-200">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-4xl font-medium overflow-hidden mb-4 md:mb-0 md:mr-6">
                {staff.staff_image ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- server-hosted profile images are safe to render with native <img> here; next/image can be adopted later */
                  <img 
                    src={getImageUrl(staff.staff_image)} 
                    alt={staff.staff_name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  staff.staff_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">{staff.staff_name}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 md:mt-0 ${
                    staff.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-2 text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    ID: {staff.staff_id || 'Not assigned'}
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {staff.email}
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {staff.contact_number}
                  </div>
                  {staff.position && (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0h2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6h2" />
                      </svg>
                      {staff.position} {staff.department && `(${staff.department})`}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Staff Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Personal Information</h3>
                <dl className="divide-y divide-gray-100">
                  {staff.staff_id && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Staff ID #</dt>
                      <dd className="text-sm text-gray-900">{staff.staff_id}</dd>
                    </div>
                  )}
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-gray-600">Full Name</dt>
                    <dd className="text-sm text-gray-900">{staff.staff_name}</dd>
                  </div>
                  {staff.date_of_birth && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Date of Birth</dt>
                      <dd className="text-sm text-gray-900">{formatDate(staff.date_of_birth)}</dd>
                    </div>
                  )}
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                    <dd className="text-sm text-gray-900">{staff.contact_number}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{staff.email}</dd>
                  </div>
                  {staff.blood_group && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Blood Group</dt>
                      <dd className="text-sm text-gray-900">{staff.blood_group}</dd>
                    </div>
                  )}
                  {staff.food && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Food Preference</dt>
                      <dd className="text-sm text-gray-900">{staff.food}</dd>
                    </div>
                  )}
                  {staff.disease && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Medical Conditions</dt>
                      <dd className="text-sm text-gray-900">{staff.disease}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {/* Address Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Address Information</h3>
                <dl className="divide-y divide-gray-100">
                  {staff.district && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">District</dt>
                      <dd className="text-sm text-gray-900">{staff.district}</dd>
                    </div>
                  )}
                  {staff.city_name && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">City</dt>
                      <dd className="text-sm text-gray-900">{staff.city_name}</dd>
                    </div>
                  )}
                  {staff.ward_no && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Ward No.</dt>
                      <dd className="text-sm text-gray-900">{staff.ward_no}</dd>
                    </div>
                  )}
                  {staff.street_name && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Street</dt>
                      <dd className="text-sm text-gray-900">{staff.street_name}</dd>
                    </div>
                  )}
                  
                  {/* Show full address if all components are present */}
                  {staff.street_name && staff.ward_no && staff.city_name && staff.district && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Full Address</dt>
                      <dd className="text-sm text-gray-900 text-right">
                        {`${staff.street_name}, Ward ${staff.ward_no}, ${staff.city_name}, ${staff.district}`}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Citizenship & Identity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Citizenship & Identity</h3>
                <dl className="divide-y divide-gray-100">
                  {staff.citizenship_no && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Citizenship No.</dt>
                      <dd className="text-sm text-gray-900">{staff.citizenship_no}</dd>
                    </div>
                  )}
                  {staff.date_of_issue && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Date of Issue</dt>
                      <dd className="text-sm text-gray-900">{formatDate(staff.date_of_issue)}</dd>
                    </div>
                  )}
                  {staff.citizenship_issued_district && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Issued District</dt>
                      <dd className="text-sm text-gray-900">{staff.citizenship_issued_district}</dd>
                    </div>
                  )}
                  {staff.staff_citizenship_image && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Citizenship Document</dt>
                      <dd className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => handleImageClick(getImageUrl(staff.staff_citizenship_image!), 'Citizenship Document')}>View Document</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Job Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Job Information</h3>
                <dl className="divide-y divide-gray-100">
                  {staff.position && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Position</dt>
                      <dd className="text-sm text-gray-900">{staff.position}</dd>
                    </div>
                  )}
                  {staff.department && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Department</dt>
                      <dd className="text-sm text-gray-900">{staff.department}</dd>
                    </div>
                  )}
                  {staff.employment_type && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                      <dd className="text-sm text-gray-900">{staff.employment_type}</dd>
                    </div>
                  )}
                  {staff.joining_date && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Joining Date</dt>
                      <dd className="text-sm text-gray-900">{formatDate(staff.joining_date)}</dd>
                    </div>
                  )}
                  {staff.salary_amount && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Salary Amount</dt>
                      <dd className="text-sm text-gray-900">Rs {staff.salary_amount}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Education Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Education Information</h3>
                <dl className="divide-y divide-gray-100">
                  {staff.educational_institution && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Institution</dt>
                      <dd className="text-sm text-gray-900">{staff.educational_institution}</dd>
                    </div>
                  )}
                  {staff.level_of_study && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Level of Study</dt>
                      <dd className="text-sm text-gray-900">{staff.level_of_study}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {/* Family Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Family Information</h3>
                {(staff.father_name || staff.father_contact || staff.father_occupation || 
                  staff.mother_name || staff.mother_contact || staff.mother_occupation) ? (
                  <dl className="divide-y divide-gray-100">
                    {/* Father's Information */}
                    {(staff.father_name || staff.father_contact || staff.father_occupation) && (
                      <>
                        <div className="py-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Father's Details</h4>
                        </div>
                        {staff.father_name && (
                          <div className="py-2 flex justify-between">
                            <dt className="text-sm font-medium text-gray-600">Father's Name</dt>
                            <dd className="text-sm text-gray-900">{staff.father_name}</dd>
                          </div>
                        )}
                        {staff.father_contact && (
                          <div className="py-2 flex justify-between">
                            <dt className="text-sm font-medium text-gray-600">Father's Contact</dt>
                            <dd className="text-sm text-gray-900">{staff.father_contact}</dd>
                          </div>
                        )}
                        {staff.father_occupation && (
                          <div className="py-2 flex justify-between">
                            <dt className="text-sm font-medium text-gray-600">Father's Occupation</dt>
                            <dd className="text-sm text-gray-900">{staff.father_occupation}</dd>
                          </div>
                        )}
                      </>
                    )}

                    {/* Mother's Information */}
                    {(staff.mother_name || staff.mother_contact || staff.mother_occupation) && (
                      <>
                        <div className="py-2 pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Mother's Details</h4>
                        </div>
                        {staff.mother_name && (
                          <div className="py-2 flex justify-between">
                            <dt className="text-sm font-medium text-gray-600">Mother's Name</dt>
                            <dd className="text-sm text-gray-900">{staff.mother_name}</dd>
                          </div>
                        )}
                        {staff.mother_contact && (
                          <div className="py-2 flex justify-between">
                            <dt className="text-sm font-medium text-gray-600">Mother's Contact</dt>
                            <dd className="text-sm text-gray-900">{staff.mother_contact}</dd>
                          </div>
                        )}
                        {staff.mother_occupation && (
                          <div className="py-2 flex justify-between">
                            <dt className="text-sm font-medium text-gray-600">Mother's Occupation</dt>
                            <dd className="text-sm text-gray-900">{staff.mother_occupation}</dd>
                          </div>
                        )}
                      </>
                    )}
                  </dl>
                ) : (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No family information</h3>
                    <p className="mt-1 text-sm text-gray-500">No family details have been provided for this staff member.</p>
                  </div>
                )}
              </div>

              {/* Spouse Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Spouse Information</h3>
                {(staff.spouse_name || staff.spouse_contact || staff.spouse_occupation) ? (
                  <dl className="divide-y divide-gray-100">
                    {staff.spouse_name && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Spouse's Name</dt>
                        <dd className="text-sm text-gray-900">{staff.spouse_name}</dd>
                      </div>
                    )}
                    {staff.spouse_contact && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Spouse's Contact</dt>
                        <dd className="text-sm text-gray-900">{staff.spouse_contact}</dd>
                      </div>
                    )}
                    {staff.spouse_occupation && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Spouse's Occupation</dt>
                        <dd className="text-sm text-gray-900">{staff.spouse_occupation}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No spouse information</h3>
                    <p className="mt-1 text-sm text-gray-500">No spouse details have been provided for this staff member.</p>
                  </div>
                )}
              </div>

              {/* Local Guardian Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Local Guardian Information</h3>
                {(staff.local_guardian_name || staff.local_guardian_contact || staff.local_guardian_address || staff.local_guardian_occupation || staff.local_guardian_relation) ? (
                  <dl className="divide-y divide-gray-100">
                    {staff.local_guardian_name && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Guardian's Name</dt>
                        <dd className="text-sm text-gray-900">{staff.local_guardian_name}</dd>
                      </div>
                    )}
                    {staff.local_guardian_relation && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Relation</dt>
                        <dd className="text-sm text-gray-900">{staff.local_guardian_relation}</dd>
                      </div>
                    )}
                    {staff.local_guardian_contact && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Contact</dt>
                        <dd className="text-sm text-gray-900">{staff.local_guardian_contact}</dd>
                      </div>
                    )}
                    {staff.local_guardian_address && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Address</dt>
                        <dd className="text-sm text-gray-900 text-right">{staff.local_guardian_address}</dd>
                      </div>
                    )}
                    {staff.local_guardian_occupation && (
                      <div className="py-2 flex justify-between">
                        <dt className="text-sm font-medium text-gray-600">Occupation</dt>
                        <dd className="text-sm text-gray-900">{staff.local_guardian_occupation}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0121 12a8.966 8.966 0 00-2.037-5.725M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No guardian information</h3>
                    <p className="mt-1 text-sm text-gray-500">No local guardian details have been provided for this staff member.</p>
                  </div>
                )}
              </div>

              {/* Financial Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">Financial Information</h3>
                <dl className="divide-y divide-gray-100">
                  {staff.salary_amount && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Current Salary</dt>
                      <dd className="text-sm text-green-600 font-medium">Rs {staff.salary_amount}</dd>
                    </div>
                  )}
                  
                  {/* Display financial information from the latest financial record */}
                  {staff.financials && staff.financials.length > 0 && (() => {
                    // Get the latest financial record
                    const latestFinancial = staff.financials.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                    
                    return (
                      <>
                        {latestFinancial.bonus_amount && (
                          <div className="py-3 flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Latest Bonus</dt>
                            <dd className="text-sm text-gray-900">Rs {latestFinancial.bonus_amount}</dd>
                          </div>
                        )}
                        {latestFinancial.deduction_amount && (
                          <div className="py-3 flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Latest Deduction</dt>
                            <dd className="text-sm text-red-600">Rs {latestFinancial.deduction_amount}</dd>
                          </div>
                        )}
                        {latestFinancial.net_salary && (
                          <div className="py-3 flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Net Salary</dt>
                            <dd className="text-sm text-gray-900">Rs {latestFinancial.net_salary}</dd>
                          </div>
                        )}
                        {latestFinancial.payment_date && (
                          <div className="py-3 flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Last Payment Date</dt>
                            <dd className="text-sm text-gray-900">{formatDate(latestFinancial.payment_date)}</dd>
                          </div>
                        )}
                        {latestFinancial.payment_type && (
                          <div className="py-3 flex justify-between">
                            <dt className="text-sm font-medium text-gray-500">Payment Type</dt>
                            <dd className="text-sm text-gray-900">
                              {typeof latestFinancial.payment_type === 'object' && latestFinancial.payment_type.name 
                                ? latestFinancial.payment_type.name 
                                : String(latestFinancial.payment_type)}
                            </dd>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </dl>
              </div>
              
              {/* System Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200">System Information</h3>
                <dl className="divide-y divide-gray-100">
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-gray-600">Staff ID</dt>
                    <dd className="text-sm text-gray-900 font-mono">{staff.id}</dd>
                  </div>
                  {staff.user_id && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">User ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{staff.user_id}</dd>
                    </div>
                  )}
                  {staff.declaration_agreed !== undefined && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Declaration Agreed</dt>
                      <dd className="text-sm text-gray-900">{staff.declaration_agreed ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {staff.contract_agreed !== undefined && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Contract Agreed</dt>
                      <dd className="text-sm text-gray-900">{staff.contract_agreed ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {staff.verified_on && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Verified On</dt>
                      <dd className="text-sm text-gray-900">{formatDate(staff.verified_on)}</dd>
                    </div>
                  )}
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">{formatDate(staff.created_at)}</dd>
                  </div>
                  {staff.updated_at && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="text-sm text-gray-900">{formatDate(staff.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            {/* Staff Amenities */}
            {staff.amenities && staff.amenities.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Staff Amenities</h3>
                <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staff.amenities.map((amenity, index) => (
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
            
            {/* Staff Documents */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Staff Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {staff.staff_image && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-w-4 aspect-h-3 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element -- server-hosted images shown as gallery/preview; keep native <img> to avoid layout shifts and support simple click handlers */}
                      <img 
                        src={getImageUrl(staff.staff_image)} 
                        alt="Staff Photo" 
                        className="object-cover w-full h-full cursor-pointer"
                        onClick={() => handleImageClick(getImageUrl(staff.staff_image!), 'Staff Photo')}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <p className="text-sm font-medium text-gray-800">Staff Photo</p>
                      <p className="text-xs text-gray-500 mt-1">Profile photo of the staff member</p>
                    </div>
                  </div>
                )}
                
                {staff.staff_citizenship_image && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-w-4 aspect-h-3 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element -- server-hosted document previews; keep native <img> for direct preview and click-to-open behavior */}
                      <img 
                        src={getImageUrl(staff.staff_citizenship_image)} 
                        alt="Citizenship Document" 
                        className="object-contain w-full h-full cursor-pointer"
                        onClick={() => handleImageClick(getImageUrl(staff.staff_citizenship_image!), 'Citizenship Document')}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <p className="text-sm font-medium text-gray-800">Citizenship Document</p>
                      <p className="text-xs text-gray-500 mt-1">Citizenship ID proof</p>
                    </div>
                  </div>
                )}
                
                {staff.staff_contract_image && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-w-4 aspect-h-3 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element -- server-hosted document previews; native <img> provides predictable behavior for click previews */}
                      <img 
                        src={getImageUrl(staff.staff_contract_image)} 
                        alt="Employment Contract" 
                        className="object-contain w-full h-full cursor-pointer"
                        onClick={() => handleImageClick(getImageUrl(staff.staff_contract_image!), 'Employment Contract')}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 border-t">
                      <p className="text-sm font-medium text-gray-800">Employment Contract</p>
                      <p className="text-xs text-gray-500 mt-1">Signed employment contract</p>
                    </div>
                  </div>
                )}
                
                {!staff.staff_image && !staff.staff_citizenship_image && !staff.staff_contract_image && (
                  <div className="col-span-3 text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                    <p className="mt-1 text-sm text-gray-500">No documents have been uploaded for this staff member.</p>
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
        title="Delete Staff"
        message="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />

      {/* Image Modal */}
      <ImageModal
        show={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={selectedImage.url}
        alt={selectedImage.alt}
      />
    </div>
  );
}
