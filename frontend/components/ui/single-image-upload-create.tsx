"use client"

import React, { useState, useRef } from "react"
import { Upload, X, AlertCircle, Eye } from "lucide-react"

interface SingleImageUploadCreateProps {
  imagePreview: string | null
  onFileSelect: (file: File) => void
  onRemove: () => void
  error?: string
  label?: string
  onImageClick: (imageUrl: string, alt: string) => void
}

export function SingleImageUploadCreate({ 
  imagePreview, 
  onFileSelect, 
  onRemove, 
  error, 
  label = "Image",
  onImageClick
}: SingleImageUploadCreateProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleImageClick = (url: string, alt: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onImageClick(url, alt)
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove()
  }

  const handleUploadAreaClick = (e: React.MouseEvent) => {
    // Only trigger file input if clicking on the upload area, not the images
    if ((e.target as HTMLElement).tagName === 'IMG') {
      return // Don't trigger file input when clicking on images
    }
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-neutral-900">
        {label}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? "border-neutral-300 bg-neutral-50/50"
            : error
              ? "border-red-300 bg-red-50/50"
              : "border-neutral-200/60 hover:border-neutral-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!imagePreview ? (
          // No image - show upload prompt
          <div className="space-y-3 cursor-pointer">
            <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-lg border border-neutral-200/60 flex items-center justify-center">
              <Upload className="h-6 w-6 text-neutral-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-600 font-medium">
                Drop image here or <span className="font-semibold underline">browse files</span>
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        ) : (
          // Image preview
          <div className="space-y-3">
            <div className="relative inline-block group">
              <img
                src={imagePreview}
                alt="New image"
                className="max-w-56 max-h-40 rounded-lg border border-neutral-200/60 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                onClick={handleImageClick(imagePreview, "New image")}
              />
              <button
                type="button"
                onClick={handleRemoveClick}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Eye className="h-5 w-5 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-500">Click image to preview • Click area to replace</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center mt-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}
