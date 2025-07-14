"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { staffApi, type StaffWithAmenities } from '@/lib/api/staff.api';
import { ApiError } from '@/lib/api/core';
import { 
  TableSkeleton, 
  SearchBar, 
  Button,
  ActionButtons,
  ConfirmModal
} from '@/components/ui';
import { formatDate, getImageUrl } from '@/lib/utils';

export default function StaffList() {
  const router = useRouter();
  
  const [staff, setStaff] = useState<StaffWithAmenities[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffWithAmenities[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        
        // Get staff data from API
        const response = await staffApi.getStaff(currentPage);
        console.log('Staff API Response:', response); // Debug log to see API response
        
        // Check if we have data before setting state
        if (response && response.data) {
          setStaff(response.data);
          setFilteredStaff(response.data);
          setTotalPages(response.last_page || 1);
        } else {
          console.error('No data returned from API');
          setError('No staff data available. The API may be unavailable.');
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        if (error instanceof ApiError) {
          setError(`Failed to load staff: ${error.message}`);
        } else {
          setError('Failed to load staff data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [currentPage]);

  // Apply filters when searchTerm, statusFilter, departmentFilter, or positionFilter changes
  useEffect(() => {
    if (!staff.length) return;

    let result = [...staff];
    
    console.log('Original staff:', staff.length);
    console.log('Status filter:', statusFilter);
    console.log('Department filter:', departmentFilter);
    console.log('Position filter:', positionFilter);

    // Filter by search term
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(staffMember => 
        staffMember.staff_name.toLowerCase().includes(lowercasedTerm) || 
        staffMember.email.toLowerCase().includes(lowercasedTerm) ||
        staffMember.contact_number.toLowerCase().includes(lowercasedTerm) ||
        (staffMember.staff_id && staffMember.staff_id.toLowerCase().includes(lowercasedTerm)) ||
        (staffMember.position && staffMember.position.toLowerCase().includes(lowercasedTerm)) ||
        (staffMember.department && staffMember.department.toLowerCase().includes(lowercasedTerm))
      );
    }

    // Filter by status
    if (statusFilter) {
      console.log('Applying status filter:', statusFilter);
      
      if (statusFilter === 'active') {
        result = result.filter(staffMember => {
          const isActiveValue: any = staffMember.is_active;
          const isActive = isActiveValue === true || 
                          isActiveValue === 1 || 
                          isActiveValue === '1' || 
                          String(isActiveValue).toLowerCase() === 'true';
          return isActive;
        });
      } else if (statusFilter === 'inactive') {
        result = result.filter(staffMember => {
          const isActiveValue: any = staffMember.is_active;
          const isInactive = isActiveValue === false || 
                            isActiveValue === 0 || 
                            isActiveValue === '0' || 
                            String(isActiveValue).toLowerCase() === 'false' ||
                            isActiveValue === null ||
                            isActiveValue === undefined;
          return isInactive;
        });
      }
      
      console.log('Staff after status filtering:', result.length);
    }

    // Filter by department
    if (departmentFilter) {
      result = result.filter(staffMember => 
        staffMember.department && staffMember.department.toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    // Filter by position
    if (positionFilter) {
      result = result.filter(staffMember => 
        staffMember.position && staffMember.position.toLowerCase() === positionFilter.toLowerCase()
      );
    }
    
    console.log('Filtered staff:', result.length);
    setFilteredStaff(result);
  }, [searchTerm, statusFilter, departmentFilter, positionFilter, staff]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
  };

  const handlePositionFilterChange = (value: string) => {
    setPositionFilter(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const confirmDelete = (staffId: string) => {
    setStaffToDelete(staffId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;

    try {
      setIsDeleting(true);
      
      // Delete staff using API
      await staffApi.deleteStaff(staffToDelete);
      
      // Remove from local state
      const updatedStaff = staff.filter(staffMember => staffMember.id !== staffToDelete);
      setStaff(updatedStaff);
      setFilteredStaff(updatedStaff);
      
      // Close modal
      setShowDeleteModal(false);
      setStaffToDelete(null);
    } catch (error) {
      console.error('Error deleting staff:', error);
      if (error instanceof ApiError) {
        setError(`Failed to delete staff: ${error.message}`);
      } else {
        setError('Failed to delete staff. Please try again.');
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

  // Get unique departments for filter
  const getUniqueDepartments = () => {
    const departments = staff
      .map(s => s.department)
      .filter(d => d && d.trim() !== '')
      .filter((dept, index, arr) => arr.indexOf(dept) === index)
      .sort();
    return departments;
  };

  // Get unique positions for filter
  const getUniquePositions = () => {
    const positions = staff
      .map(s => s.position)
      .filter(p => p && p.trim() !== '')
      .filter((pos, index, arr) => arr.indexOf(pos) === index)
      .sort();
    return positions;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-medium text-gray-900">Staff Management</h1>
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
            <h1 className="text-2xl font-semibold text-gray-900">Staff</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all staff members</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              onClick={() => router.push('/admin/staff/create')}
              variant="primary"
            >
              Add New Staff
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {!isLoading && staff.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{staff.length}</p>
                  <p className="text-sm text-gray-500">Total Staff</p>
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
                    {staff.filter(s => s.is_active).length}
                  </p>
                  <p className="text-sm text-gray-500">Active Staff</p>
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
                    {staff.filter(s => !s.is_active).length}
                  </p>
                  <p className="text-sm text-gray-500">Inactive Staff</p>
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
                    {getUniqueDepartments().length}
                  </p>
                  <p className="text-sm text-gray-500">Departments</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <SearchBar
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by name, email, phone, ID, position, or department..."
              />
            </div>
            <div className="w-full md:w-1/6">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="w-full md:w-1/6">
              <select
                value={departmentFilter}
                onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
              >
                <option value="">All Departments</option>
                {getUniqueDepartments().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/6">
              <select
                value={positionFilter}
                onChange={(e) => handlePositionFilterChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-[#235999] focus:border-[#235999] outline-none transition-all duration-200"
              >
                <option value="">All Positions</option>
                {getUniquePositions().map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredStaff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-800">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Staff Member</th>
                    <th className="px-6 py-3">Position/Department</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joining Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(staffMember => (
                    <tr 
                      key={staffMember.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm mr-3 overflow-hidden cursor-pointer"
                            onClick={() => {
                              if (staffMember.staff_image) {
                                setSelectedPhoto(getImageUrl(staffMember.staff_image));
                                setShowPhotoModal(true);
                              }
                            }}
                            title={staffMember.staff_image ? "Click to enlarge" : "No photo available"}
                          >
                            {staffMember.staff_image ? (
                              <img 
                                src={getImageUrl(staffMember.staff_image)} 
                                alt={staffMember.staff_name}
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              staffMember.staff_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{staffMember.staff_name}</div>
                            <div className="text-xs text-gray-500">
                              {staffMember.staff_id ? `ID: ${staffMember.staff_id}` : staffMember.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{staffMember.position || 'Not specified'}</div>
                          <div className="text-xs text-gray-500">
                            {staffMember.department || 'No Department'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div>{staffMember.contact_number}</div>
                          <div className="text-xs text-gray-500">{staffMember.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(staffMember.is_active)}
                      </td>
                      <td className="px-6 py-4">
                        {staffMember.joining_date ? formatDate(staffMember.joining_date) : formatDate(staffMember.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionButtons
                          viewUrl={`/admin/staff/${staffMember.id}`}
                          editUrl={`/admin/staff/${staffMember.id}/edit`}
                          onDelete={() => confirmDelete(staffMember.id)}
                          isDeleting={isDeleting && staffToDelete === staffMember.id}
                          style="compact"
                        />
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter || departmentFilter || positionFilter ? 'Try adjusting your search or filter criteria.' : 'Get started by adding a new staff member.'}
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
        title="Delete Staff Member"
        message="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setStaffToDelete(null);
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
              alt="Staff Photo" 
              className="max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
