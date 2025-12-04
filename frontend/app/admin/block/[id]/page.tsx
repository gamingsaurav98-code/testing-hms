"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { blockApi, Block, ApiError } from '@/lib/api/index';
import { Button, ConfirmModal, TableSkeleton, ImageModal } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';

export default function BlockDetail() {
  const router = useRouter();
  const params = useParams();
  const blockId = params.id as string;

  const [block, setBlock] = useState<Block | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function for placeholder image
  const getPlaceholderImageUrl = (): string => {
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f3f4f6"/>
        <path d="M50 150l25-25 25 25 50-50 25 25v25H50v-25z" fill="#d1d5db"/>
        <circle cx="75" cy="75" r="15" fill="#d1d5db"/>
        <text x="100" y="180" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="12">No Image</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

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

  const [deleteModal, setDeleteModal] = useState<boolean>(false);

  const handleDeleteClick = () => {
    setDeleteModal(true);
  };

  const handleDelete = async () => {
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
      setDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Block Details</h1>
          <p className="text-sm text-gray-500 mt-1">Loading block details...</p>
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
              onClick={() => router.push('/admin/block')}
              variant="ghost"
              size="sm"
            >
              Back to Blocks
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await blockApi.getBlocks();
                  const availableIds = response.data.map(b => b.id).join(', ');
                  alert(`Available block IDs: ${availableIds}`);
                } catch (err) {
                  alert('Could not fetch available blocks');
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
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal}
        title="Delete Block"
        message="Are you sure you want to delete this block? This action cannot be undone."
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
              <h1 className="text-2xl font-semibold text-gray-900">{block.block_name}</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => router.push(`/admin/block/${block.id}/edit`)}
                variant="primary"
              >
                Edit Block
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
              {/* Block Image */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Block Image</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <div className="flex items-center justify-center p-4 min-h-[300px]">
                    {block.block_attachment ? (
                      {/* eslint-disable-next-line @next/next/no-img-element -- server-hosted block images use onError and object fallback; native <img> is intentional here */}
                      <img
                        src={getImageUrl(block.block_attachment) || getPlaceholderImageUrl()}
                        alt={block.block_name}
                        className="max-w-full max-h-80 object-contain rounded"
                        onError={(e) => {
                          console.error('Image failed to load for path:', block.block_attachment);
                          if (block.block_attachment) {
                            const fullUrl = getImageUrl(bvislock.block_attachment);
                            console.error('Full image URL:', fullUrl);
                          }
                          const target = e.target as HTMLImageElement;
                          target.src = getPlaceholderImageUrl();
                        }}
                      />
                     
                    ) : (
                      <div className="text-center text- gray-500">
                        <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>No image available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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