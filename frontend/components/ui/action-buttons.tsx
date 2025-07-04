"use client"

import React from "react"
import { Button } from './button'

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
  size?: 'sm' | 'md' | 'lg'
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
  size = 'sm',
  className = ''
}: ActionButtonsProps) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {!hideView && (viewUrl || onView) && (
        <Button
          onClick={onView ? onView : () => window.location.href = viewUrl!}
          variant="secondary"
          size={size}
          title="View Details"
          icon={<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>}
        >
          <span className="sr-only">View</span>
        </Button>
      )}
      
      {!hideEdit && (editUrl || onEdit) && (
        <Button
          onClick={onEdit ? onEdit : () => window.location.href = editUrl!}
          variant="primary"
          size={size}
          title="Edit"
          icon={<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>}
        >
          <span className="sr-only">Edit</span>
        </Button>
      )}
      
      {!hideDelete && onDelete && (
        <Button
          onClick={onDelete}
          disabled={isDeleting}
          variant="danger"
          size={size}
          title="Delete"
          loading={isDeleting}
          className="!bg-red-600 !text-white hover:!bg-red-700 min-w-8"
          icon={<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m6-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>}
        >
          Delete
        </Button>
      )}
    </div>
  )
}
