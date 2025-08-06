"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { roomApi, Room, ApiError } from '@/lib/api/index';
import { Button, ConfirmModal, TableSkeleton, ImageModal } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';

export default function RoomDetail() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const roomData = await roomApi.getRoom(roomId);
        setRoom(roomData);
        
      } catch (error) {
        console.error('Error fetching room:', error);
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setError(`Room with ID ${roomId} not found. It may have been deleted or the ID is incorrect.`);
          } else {
            setError(`Failed to load room: ${error.message}`);
          }
        } else {
          setError('Failed to load room data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  const handleDeleteClick = () => {
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await roomApi.deleteRoom(roomId);
      
      // Redirect to rooms list after successful deletion
      router.push('/admin/room');
    } catch (error) {
      console.error('Error deleting room:', error);
      if (error instanceof ApiError) {
        alert(`Failed to delete room: ${error.message}`);
      } else {
        alert('Failed to delete room. Please try again.');
      }
    } finally {
      setIsDeleting(false);
      setDeleteModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoomStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'occupied':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Occupied</span>;
      case 'vacant':
        return <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Vacant</span>;
      case 'maintenance':
        return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Maintenance</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Room Details</h1>
          <p className="text-sm text-gray-500 mt-1">Loading room information...</p>
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
          <div className="mt-3 space-x-2">
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              size="sm"
            >
              Retry
            </Button>
            <Button
              onClick={() => router.push('/admin/room')}
              variant="ghost"
              size="sm"
            >
              Back to Rooms
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await roomApi.getRooms();
                  const availableIds = response.data.map(r => r.id).join(', ');
                  alert(`Available room IDs: ${availableIds}`);
                } catch (err) {
                  alert('Could not fetch available rooms');
                }
              }}
              variant="secondary"
              size="sm"
            >
              Show Available IDs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Room not found</p>
          <button
            onClick={() => router.push('/admin/room')}
            className="mt-2 text-[#235999] hover:text-[#1e4d87]"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        isLoading={isDeleting}
        variant="danger"
      />
      
      <div className="w-full">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{room.room_name}</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => router.push(`/admin/room/${room.id}/edit`)}
              variant="primary"
            >
              Edit Room
            </Button>
            <Button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              variant="danger"
              loading={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Main Content - Image and Information Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Room Image */}
            {room.room_attachment && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Room Image</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <div className="flex items-center justify-center p-4">
                    <img
                      src={getImageUrl(room.room_attachment)}
                      alt={room.room_name}
                      className="max-w-full max-h-80 object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Room Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Room Information</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Room Name</h4>
                  <p className="text-lg text-gray-900">{room.room_name}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Room Type</h4>
                  <p className="text-lg text-gray-900 capitalize">{room.room_type}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <div className="flex items-center space-x-2">
                    <p className="text-lg text-gray-900">{room.status}</p>
                    {getRoomStatusBadge(room.status)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Capacity</h4>
                  <p className="text-lg text-gray-900">{room.capacity} beds</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Vacant Beds</h4>
                  <div className="flex items-center">
                    <p className="text-lg text-gray-900">
                      {room.vacant_beds !== undefined ? room.vacant_beds : 'Unknown'}
                    </p>
                    {room.vacant_beds !== undefined && (
                      <span className={`ml-2 inline-block w-3 h-3 rounded-full ${room.vacant_beds > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                  <p className="text-lg text-gray-900">
                    {room.block?.block_name ? `${room.block.block_name}` : 'No Block'} 
                    {''}
                  </p>
                </div>
                
                {/* Add any additional room properties here if needed */}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(room.created_at)}</span>
              </div>
              {room.updated_at && (
                <div>
                  <span className="font-medium text-gray-500">Last Updated:</span>
                  <span className="ml-2 text-gray-900">{formatDate(room.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
