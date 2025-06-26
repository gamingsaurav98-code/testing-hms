"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { blockApi, Block, ApiError } from '@/lib/api';

export default function BlockDetail() {
  const router = useRouter();
  const params = useParams();
  const blockId = params.id as string;

  const [block, setBlock] = useState<Block | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch block data
  useEffect(() => {
    const fetchBlock = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const blockData = await blockApi.getBlock(blockId);
        setBlock(blockData);
        
      } catch (error) {
        console.error('Error fetching block:', error);
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setError(`Block with ID ${blockId} not found. It may have been deleted or the ID is incorrect.`);
          } else {
            setError(`Failed to load block: ${error.message}`);
          }
        } else {
          setError('Failed to load block data. Please try again.');
        }
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
      setIsDeleting(true);
      await blockApi.deleteBlock(blockId);
      
      // Redirect to blocks list after successful deletion
      router.push('/admin/block');
    } catch (error) {
      console.error('Error deleting block:', error);
      if (error instanceof ApiError) {
        alert(`Failed to delete block: ${error.message}`);
      } else {
        alert('Failed to delete block. Please try again.');
      }
    } finally {
      setIsDeleting(false);
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
            <button
              onClick={() => window.location.reload()}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/admin/block')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm"
            >
              Back to Blocks
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await blockApi.getBlocks();
                  const availableIds = response.data.map(b => b.id).join(', ');
                  alert(`Available block IDs: ${availableIds}`);
                } catch (err) {
                  alert('Could not fetch available blocks');
                }
              }}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm"
            >
              Show Available IDs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Block not found</p>
          <button
            onClick={() => router.push('/admin/block')}
            className="mt-2 text-[#235999] hover:text-[#1e4d87]"
          >
            Back to Blocks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{block.block_name}</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/admin/block/${block.id}/edit`)}
                className="px-3 py-2 text-sm bg-[#235999] hover:bg-[#1e4d87] text-white rounded-lg transition-colors"
              >
                Edit Block
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Main Content - Image and Information Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Block Image */}
              {block.block_attachment && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Block Image</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <div className="flex items-center justify-center p-4">
                      <img
                        src={block.block_attachment.startsWith('http') 
                          ? block.block_attachment 
                          : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}/storage/${block.block_attachment}`}
                        alt={block.block_name}
                        className="max-w-full max-h-80 object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Block Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Block Information</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Block Name</h4>
                    <p className="text-lg text-gray-900">{block.block_name}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                    <p className="text-lg text-gray-900">{block.location}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Manager Name</h4>
                    <p className="text-lg text-gray-900">{block.manager_name}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Manager Contact</h4>
                    <p className="text-lg text-gray-900">{block.manager_contact}</p>
                  </div>

                  {block.remarks && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Remarks</h4>
                      <p className="text-gray-900">{block.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 mt-8 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">{formatDate(block.created_at)}</span>
                </div>
                {block.updated_at && (
                  <div>
                    <span className="font-medium text-gray-500">Last Updated:</span>
                    <span className="ml-2 text-gray-900">{formatDate(block.updated_at)}</span>
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