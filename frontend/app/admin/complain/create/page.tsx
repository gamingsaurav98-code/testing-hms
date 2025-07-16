"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { complainApi, Complain } from '@/lib/api/complain.api';
import { ApiError } from '@/lib/api/core';
import { 
  Button, 
  SearchBar, 
  TableSkeleton 
} from '@/components/ui';
import ChatInterface from '@/components/ui/ChatInterface';

export default function ComplainChatPage() {
  const router = useRouter();
  const [complains, setComplains] = useState<Complain[]>([]);
  const [filteredComplains, setFilteredComplains] = useState<Complain[]>([]);
  const [selectedComplain, setSelectedComplain] = useState<Complain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch complains from API
  useEffect(() => {
    const fetchComplains = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await complainApi.getAllComplains();
        setComplains(response);
        setFilteredComplains(response);
      } catch (error) {
        console.error('Error fetching complains:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch complains: ${error.message}`);
        } else {
          setError('Failed to fetch complains. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplains();
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredComplains(complains);
    } else {
      const filtered = complains.filter(complain =>
        complain.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complain.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complain.student?.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complain.staff?.staff_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredComplains(filtered);
    }
  }, [searchQuery, complains]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const handleSelectComplain = (complain: Complain) => {
    setSelectedComplain(complain);
  };

  const handleBackToList = () => {
    setSelectedComplain(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Chat with Users</h1>
          <p className="text-sm text-gray-500 mt-1">Loading complains...</p>
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
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show chat interface when a complain is selected
  if (selectedComplain) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Chat: {selectedComplain.title}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                {getStatusBadge(selectedComplain.status)}
                <span className="text-sm text-gray-500">
                  ID: #{selectedComplain.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* User Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Name</h4>
                  {selectedComplain.student && (
                    <div>
                      <p className="text-gray-900">{selectedComplain.student.student_name}</p>
                      <p className="text-sm text-gray-500">Student</p>
                    </div>
                  )}
                  {selectedComplain.staff && (
                    <div>
                      <p className="text-gray-900">{selectedComplain.staff.staff_name}</p>
                      <p className="text-sm text-gray-500">Staff</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Contact</h4>
                  {selectedComplain.student && (
                    <p className="text-gray-900">{selectedComplain.student.contact_number}</p>
                  )}
                  {selectedComplain.staff && (
                    <p className="text-gray-900">{selectedComplain.staff.contact_number}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Complain Title</h4>
                  <p className="text-gray-900">{selectedComplain.title}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedComplain.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                  <p className="text-gray-700 text-sm">{formatDate(selectedComplain.created_at)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Messages</h4>
                  <p className="text-gray-700 text-sm">
                    {selectedComplain.total_messages || 0} total
                    {(selectedComplain.unread_admin_messages > 0) && (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                        {selectedComplain.unread_admin_messages} unread
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Chat Messages</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Communicate directly with the user about their complain
                </p>
              </div>
              <div className="p-4">
                <ChatInterface
                  complainId={selectedComplain.id}
                  currentUserId={1} // This should come from auth context
                  currentUserType="admin"
                  currentUserName="Admin"
                  className="h-96"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show complain list when no complain is selected
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Chat with Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a complain to start chatting with the user who submitted it
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search complains to chat..."
        />
      </div>

      {/* Complain List */}
      {filteredComplains.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery ? 'No complains found' : 'No complains available'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchQuery ? 'Try a different search term' : 'No complaints have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Complain Details</div>
              <div className="col-span-2">User</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Chat Activity</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredComplains.map((complain) => (
              <div 
                key={complain.id} 
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleSelectComplain(complain)}
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Complain Details */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-gray-900">{complain.title}</div>
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {complain.description}
                    </div>
                  </div>

                  {/* User */}
                  <div className="col-span-2">
                    {complain.student && (
                      <div>
                        <div className="text-sm text-gray-900">{complain.student.student_name}</div>
                        <div className="text-xs text-gray-500">Student</div>
                      </div>
                    )}
                    {complain.staff && (
                      <div>
                        <div className="text-sm text-gray-900">{complain.staff.staff_name}</div>
                        <div className="text-xs text-gray-500">Staff</div>
                      </div>
                    )}
                    {!complain.student && !complain.staff && (
                      <span className="text-xs text-gray-400">Unknown</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    {getStatusBadge(complain.status)}
                  </div>

                  {/* Chat Activity */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-600">
                        {complain.total_messages || 0} messages
                      </div>
                      {complain.unread_admin_messages > 0 && (
                        <div className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                          {complain.unread_admin_messages} unread
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">
                      {formatDate(complain.created_at)}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 text-center">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-medium"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleSelectComplain(complain);
                      }}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {filteredComplains.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {filteredComplains.length} of {complains.length} complains available for chat
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}
