"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { blockApi, Block, ApiError } from '@/lib/api';

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
    if (window.confirm('Are you sure you want to delete this block? This action cannot be undone.')) {
      try {
        setIsDeleting(blockId);
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
        
      } catch (error) {
        console.error('Error deleting block:', error);
        if (error instanceof ApiError) {
          alert(`Failed to delete block: ${error.message}`);
        } else {
          alert('Failed to delete block. Please try again.');
        }
      } finally {
        setIsDeleting(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#235999]"></div>
          <span className="ml-2 text-gray-600">Loading blocks...</span>
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
      {/* Minimal Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Blocks</h1>
          <p className="text-sm text-gray-500 mt-1">{blocks.length} total blocks</p>
        </div>
        <button
          onClick={() => router.push('/admin/block/create')}
          className="bg-[#235999] hover:bg-[#1e4d87] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Block</span>
        </button>
      </div>

      {/* Compact Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#235999] focus:border-transparent"
          />
        </div>
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
            <button
              onClick={() => router.push('/admin/block/create')}
              className="bg-[#235999] hover:bg-[#1e4d87] text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Create Block
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Block Details</div>
              <div className="col-span-2">Manager</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Created</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {filteredBlocks.map((block) => (
              <div key={block.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
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
                    <div className="text-xs text-gray-500">
                      {formatDate(block.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => router.push(`/admin/block/${block.id}`)}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                        title="View Block"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/block/${block.id}/edit`)}
                        className="p-1.5 bg-[#235999] hover:bg-[#1e4d87] text-white rounded transition-colors"
                        title="Edit Block"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        disabled={isDeleting === block.id}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
                        title="Delete Block"
                      >
                        {isDeleting === block.id ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border border-red-700 border-t-transparent"></div>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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