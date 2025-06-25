"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Block {
  id: string;
  block_name: string;
  location: string;
  manager_name: string;
  manager_contact: string;
  remarks: string;
  block_attachment_url?: string;
  created_at: string;
  updated_at: string;
}

export default function BlockDetail() {
  const router = useRouter();
  const params = useParams();
  const blockId = params.id as string;

  const [block, setBlock] = useState<Block | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch block data
  useEffect(() => {
    const fetchBlock = async () => {
      try {
        setIsLoading(true);
        
        // Mock data for demonstration - replace with actual API call
        const mockBlock: Block = {
          id: blockId,
          block_name: 'Block A',
          location: 'North Campus',
          manager_name: 'John Smith',
          manager_contact: '9876543210',
          remarks: 'Main accommodation block with modern facilities and updated infrastructure. This block houses 120 students across 4 floors with common areas and study rooms.',
          block_attachment_url: 'https://via.placeholder.com/400x300/235999/ffffff?text=Block+A',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-06-20T14:45:00Z'
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setBlock(mockBlock);
      } catch (error) {
        console.error('Error fetching block:', error);
        setError('Failed to load block data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (blockId) {
      fetchBlock();
    }
  }, [blockId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this block? This action cannot be undone.')) {
      return;
    }

    try {
      // Replace with actual API call
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete block');
      }

      router.push('/admin/block');
    } catch (error) {
      console.error('Error deleting block:', error);
      alert('Failed to delete block. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#235999]"></div>
          <span className="ml-2 text-gray-600">Loading block details...</span>
        </div>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Block Not Found</h3>
          <p className="text-gray-600 mb-4">{error || 'The requested block could not be found.'}</p>
          <button
            onClick={() => router.push('/admin/block')}
            className="bg-[#235999] hover:bg-[#1e4d87] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Blocks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header with Actions */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Go Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-medium text-gray-900">{block.block_name}</h1>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {block.location}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/admin/block/${block.id}/edit`)}
            className="bg-[#235999] hover:bg-[#1e4d87] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Block</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block Image */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Block Image</h3>
            {block.block_attachment_url ? (
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={block.block_attachment_url}
                  alt={block.block_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Block Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Block Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Basic Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Block Name</label>
                  <p className="text-sm text-gray-900 mt-1">{block.block_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</label>
                  <p className="text-sm text-gray-900 mt-1">{block.location}</p>
                </div>
              </div>

              {/* Manager Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Name</label>
                  <p className="text-sm text-gray-900 mt-1">{block.manager_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Contact</label>
                  <p className="text-sm text-gray-900 mt-1">{block.manager_contact}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                {block.remarks || 'No description provided.'}
              </p>
            </div>

            {/* Timestamps */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-medium text-gray-500 uppercase tracking-wider">Created</label>
                  <p className="text-gray-700 mt-1">{formatDate(block.created_at)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500 uppercase tracking-wider">Last Updated</label>
                  <p className="text-gray-700 mt-1">{formatDate(block.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => router.push('/admin/block')}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          ← Back to All Blocks
        </button>
      </div>
    </div>
  );
}