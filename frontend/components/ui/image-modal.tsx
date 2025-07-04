"use client"

import React from "react"
import { X } from "lucide-react"

interface ImageModalProps {
  show: boolean
  imageUrl: string
  alt: string
  onClose: () => void
}

export function ImageModal({ show, imageUrl, alt, onClose }: ImageModalProps) {
  if (!show) return null

  return (
    <div 
      className="fixed inset-0 bg-black/75 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
        {/* Consistent close button design */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg text-neutral-600 hover:text-neutral-900 hover:shadow-xl transition-all duration-200 flex items-center justify-center border border-neutral-200/60"
          style={{ zIndex: 100000 }}
          title="Close preview"
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          draggable={false}
        />
      </div>
    </div>
  )
}
