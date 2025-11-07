"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { roomApi, Room, ApiError } from '@/lib/api/index';
import { 
  Button, 
  SearchBar, 
  ConfirmModal, 
  SuccessToast, 
  TableSkeleton,
  ActionButtons
} from '@/components/ui';

export default function RoomList() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, roomId: string | null}>({
    show: false,
    roomId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await roomApi.getRooms(currentPage);
        setRooms(response.data);
        setFilteredRooms(response.data);
        setTotalPages(response.last_page);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch rooms: ${error.message}`);
        } else {
          setError('Failed to fetch rooms. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [currentPage]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter(room =>
        room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.room_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(room.capacity).includes(searchQuery) ||
        (room.block?.block_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [searchQuery, rooms]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const handleDeleteRoom = async (roomId: string) => {
    setDeleteModal({show: true, roomId});
  };

  const confirmDelete = async () => {
    const roomId = deleteModal.roomId;
    if (!roomId) return;

    try {
      setIsDeleting(roomId);
      setDeleteModal({show: false, roomId: null});
      setAlert({show: true, message: 'Deleting room...', type: 'success'});
      
      await roomApi.deleteRoom(roomId);
      
      // Remove from local state
      const updatedRooms = rooms.filter(room => room.id !== roomId);
      setRooms(updatedRooms);
      setFilteredRooms(updatedRooms.filter(room =>
        !searchQuery.trim() ||
        room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.room_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(room.capacity).includes(searchQuery)
      ));
      
      setAlert({show: true, message: 'Room deleted successfully!', type: 'success'});
      
      // Hide alert after 2 seconds - optimized
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting room:', error);
      if (error instanceof ApiError) {
        setAlert({show: true, message: `Failed to delete room: ${error.message}`, type: 'error'});
      } else {
        setAlert({show: true, message: 'Failed to delete room. Please try again.', type: 'error'});
      }
      
      // Hide error alert after 3 seconds - optimized
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 3000);
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({show: false, roomId: null});
  };

  const getRoomStatusBadge = (status: string, vacantBeds?: number, capacity?: number) => {
    if (vacantBeds !== undefined && capacity !== undefined) {
      // Display occupancy ratio along with status
      if (vacantBeds <= 0) {
        // Fully occupied - Red
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Occupied ({capacity}/{capacity})</span>;
      } else if (vacantBeds === capacity) {
        // Fully vacant - Green
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Vacant (0/{capacity})</span>;
      } else {
        // Partially vacant - Yellow
        const occupiedBeds = capacity - vacantBeds;
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            Occupied ({occupiedBeds}/{capacity})
          </span>
        );
      }
    }
    
    // Simpler status display (just vacant or occupied)
    switch(status.toLowerCase()) {
      case 'occupied':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Occupied</span>;
      case 'vacant':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Vacant</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">Loading rooms...</p>
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
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            size="sm"
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting !== null}
        variant="danger"
      />

      {/* Alert Notification */}
      {alert.type === 'success' && alert.show && (
        <SuccessToast
          show={alert.show}
          message={alert.message}
          progress={100}
          onClose={() => setAlert({show: false, message: '', type: 'success'})}
        />
      )}
      {alert.type === 'error' && alert.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-red-100 border-red-500 text-red-700 border-l-4 p-4 rounded-lg shadow-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setAlert({show: false, message: '', type: 'success'})}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">{rooms.length} total rooms</p>
        </div>
        <Button
          onClick={() => router.push('/admin/room/create')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>}
          className="bg-[#235999] hover:bg-[#1e4d87]"
        >
          Add Room
        </Button>
      </div>

      {/* Compact Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search rooms by name, type, block or capacity..."
        />
      </div>

      {/* Clean List View */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery ? 'No rooms found' : 'No rooms yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first room to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => router.push('/admin/room/create')}
              className="bg-[#235999] hover:bg-[#1e4d87]"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>}
            >
              Create Room
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Room Details</div>
              <div className="col-span-2">Block</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Capacity</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-center pl-2">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredRooms.map((room) => (
              <div key={room.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Room Details */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-gray-900">{room.room_name}</div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Room
                    </div>
                  </div>

                  {/* Block */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900">{room.block?.block_name || 'No Block'}</div>
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-700 capitalize">{room.room_type}</div>
                  </div>

                  {/* Capacity */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{room.capacity}</span>
                      {room.vacant_beds !== undefined && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({room.vacant_beds} vacant)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 text-center">
                    {getRoomStatusBadge(room.status, room.vacant_beds, room.capacity)}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex flex-nowrap gap-2 justify-center pl-2">
                      <button
                        onClick={() => router.push(`/admin/room/${room.id}`)}
                        className="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        title="View Room"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/room/${room.id}/edit`)}
                        className="bg-blue-100 text-blue-700 p-1.5 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        title="Edit Room"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        disabled={isDeleting === room.id}
                        className={`bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 ${isDeleting === room.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete Room"
                      >
                        {isDeleting === room.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m6-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      {filteredRooms.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {filteredRooms.length} of {rooms.length} rooms
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}
