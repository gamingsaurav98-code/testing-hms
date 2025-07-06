"use client"

import React from "react"
import { useRouter } from "next/navigation"

export interface ActionButtonsProps {
  viewUrl?: string
  editUrl?: string
  onDelete?: () => void
  onView?: () => void
  onEdit?: () => void
  isDeleting?: boolean
  hideView?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
  style?: 'default' | 'compact'
  className?: string
}

export function ActionButtons({
  viewUrl,
  editUrl,
  onDelete,
  onView,
  onEdit,
  isDeleting = false,
  hideView = false,
  hideEdit = false,
  hideDelete = false,
  style = 'default',
  className = ''
}: ActionButtonsProps) {
  const router = useRouter();
  
  // Handle view action
  const handleViewClick = () => {
    if (onView) {
      onView();
    } else if (viewUrl) {
      router.push(viewUrl);
    }
  };
  
  // Handle edit action
  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    } else if (editUrl) {
      router.push(editUrl);
    }
  };
  
  if (style === 'compact') {
    return (
      <div className={`flex flex-nowrap gap-2 justify-center ${className}`}>
        {/* View Button */}
        {!hideView && (viewUrl || onView) && (
          <button
            onClick={handleViewClick}
            className="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}
        
        {/* Edit Button */}
        {!hideEdit && (editUrl || onEdit) && (
          <button
            onClick={handleEditClick}
            className="bg-blue-100 text-blue-700 p-1.5 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        
        {/* Delete Button */}
        {!hideDelete && onDelete && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className={`bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Delete"
          >
            {isDeleting ? (
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
        )}
      </div>
    );
  }
  
  // Default style with larger buttons
  return (
    <div className={`flex space-x-2 ${className}`}>
      {/* View Button */}
      {!hideView && (viewUrl || onView) && (
        <button
          onClick={handleViewClick}
          className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#235999]"
          title="View Details"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>
      )}
      
      {/* Edit Button */}
      {!hideEdit && (editUrl || onEdit) && (
        <button
          onClick={handleEditClick}
          className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md bg-amber-500 text-sm font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          title="Edit"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      )}
      
      {/* Delete Button */}
      {!hideDelete && onDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Delete"
        >
          {isDeleting ? (
            <>
              <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m6-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </>
          )}
        </button>
      )}
    </div>
  );
}
