"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { blockApi, Block, ApiError } from '@/lib/api/index';
import { 
  Button, 
  SearchBar, 
  ConfirmModal, 
  SuccessToast, 
  TableSkeleton,
  ActionButtons 
} from '@/components/ui';

export default function BlockList() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, blockId: string | null}>({
    show: false,
    blockId: null
  });
  const [alert, setAlert] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch blocks from API
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await blockApi.getBlocks(currentPage);
        setBlocks(response.data);
        setFilteredBlocks(response.data);
        setTotalPages(response.last_page);
      } catch (error) {
        console.error('Error fetching blocks:', error);
        if (error instanceof ApiError) {
          setError(`Failed to fetch blocks: ${error.message}`);
        } else {
          setError('Failed to fetch blocks. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [currentPage]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBlocks(blocks);
    } else {
      const filtered = blocks.filter(block =>
        block.block_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.manager_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBlocks(filtered);
    }
  }, [searchQuery, blocks]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    setDeleteModal({show: true, blockId});
  };

  const confirmDelete = async () => {
    const blockId = deleteModal.blockId;
    if (!blockId) return;

    try {
      setIsDeleting(blockId);
      setDeleteModal({show: false, blockId: null});
      setAlert({show: true, message: 'Deleting block...', type: 'success'});
      
      await blockApi.deleteBlock(blockId);
      
      // Remove from local state
      const updatedBlocks = blocks.filter(block => block.id !== blockId);
      setBlocks(updatedBlocks);
      setFilteredBlocks(updatedBlocks.filter(block =>
        !searchQuery.trim() ||
        block.block_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.manager_name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
      setAlert({show: true, message: 'Block deleted successfully!', type: 'success'});
      
      // Hide alert after 3 seconds
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting block:', error);
      if (error instanceof ApiError) {
        setAlert({show: true, message: `Failed to delete block: ${error.message}`, type: 'error'});
      } else {
        setAlert({show: true, message: 'Failed to delete block. Please try again.', type: 'error'});
      }
      
      // Hide error alert after 5 seconds
      setTimeout(() => {
        setAlert({show: false, message: '', type: 'success'});
      }, 5000);
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({show: false, blockId: null});
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">Blocks</h1>
          <p className="text-sm text-gray-500 mt-1">Loading blocks...</p>
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

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Delete Block"
        message="Are you sure you want to delete this block? This action cannot be undone."
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
          <h1 className="text-xl font-medium text-gray-900">Blocks</h1>
          <p className="text-sm text-gray-500 mt-1">{blocks.length} total blocks</p>
        </div>
        <Button
          onClick={() => router.push('/admin/block/create')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>}
          className="bg-[#235999] hover:bg-[#1e4d87]"
        >
          Add Block
        </Button>
      </div>

      {/* Compact Search */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search blocks..."
        />
      </div>

      {/* Clean List View */}
      {filteredBlocks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery ? 'No blocks found' : 'No blocks yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first block to get started'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => router.push('/admin/block/create')}
              className="bg-[#235999] hover:bg-[#1e4d87]"
            >
              Create Block
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Block Details</div>
              <div className="col-span-2">Manager</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1 text-center pr-2">Created</div>
              <div className="col-span-1 text-center pl-2">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredBlocks.map((block) => (
              <div key={block.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Block Details */}
                  <div className="col-span-3">
                    <div className="font-medium text-sm text-gray-900">{block.block_name}</div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {block.location}
                    </div>
                  </div>

                  {/* Manager */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-900">{block.manager_name}</div>
                  </div>

                  {/* Contact */}
                  <div className="col-span-2">
                    <div className="text-sm text-gray-700">{block.manager_contact}</div>
                  </div>

                  {/* Description */}
                  <div className="col-span-3">
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {block.remarks || 'No description'}
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="col-span-1">
                    <div className="text-xs text-gray-500 text-center pr-2">
                      {formatDate(block.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex flex-nowrap gap-2 justify-center pl-2">
                      <button
                        onClick={() => router.push(`/admin/block/${block.id}`)}
                        className="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        title="View Block"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/block/${block.id}/edit`)}
                        className="bg-blue-100 text-blue-700 p-1.5 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        title="Edit Block"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        disabled={isDeleting === block.id}
                        className={`bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 ${isDeleting === block.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete Block"
                      >
                        {isDeleting === block.id ? (
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
      {filteredBlocks.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {filteredBlocks.length} of {blocks.length} blocks
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
}