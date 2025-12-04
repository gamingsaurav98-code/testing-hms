"use client"

import React, { useState, useRef } from "react"
import { Upload, X, AlertCircle, Eye } from "lucide-react"

interface SingleImageUploadEditProps {
  imagePreview: string | null
  existingImageUrl?: string | null
  onFileSelect: (file: File) => void
  onRemove: () => void
  error?: string
  label?: string
  onImageClick: (imageUrl: string, alt: string) => void
}

export function SingleImageUploadEdit({ 
  imagePreview, 
  existingImageUrl,
  onFileSelect, 
  onRemove, 
  error, 
  label = "Image",
  onImageClick
}: SingleImageUploadEditProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validFileTypes.includes(file.type)) {
        console.error('Invalid file type:', file.type);
        alert(`Invalid file type. Please select JPG, PNG, GIF, or PDF file.`);
        return;
      }

      // Validate file size
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        console.error('File too large:', file.size);
        alert(`File size exceeds 5MB limit. Please select a smaller file.`);
        return;
      }

      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)}KB`
      });
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
      // Validate file type
      const validFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validFileTypes.includes(file.type)) {
        console.error('Invalid file type:', file.type);
        alert(`Invalid file type. Please select JPG, PNG, GIF, or PDF file.`);
        return;
      }

      // Validate file size
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        console.error('File too large:', file.size);
        alert(`File size exceeds 5MB limit. Please select a smaller file.`);
        return;
      }

      console.log('File dropped:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)}KB`
      });
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

  const hasExistingImage = existingImageUrl && !imagePreview
  const hasNewImage = imagePreview
  const hasBothImages = existingImageUrl && imagePreview

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
          accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!hasExistingImage && !hasNewImage ? (
          // No images - show upload prompt
          <div className="space-y-3 cursor-pointer">
            <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-lg border border-neutral-200/60 flex items-center justify-center">
              <Upload className="h-6 w-6 text-neutral-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-600 font-medium">
                Drop image here or <span className="font-semibold underline">browse files</span>
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">PNG, JPG, GIF, PDF up to 5MB</p>
            </div>
          </div>
        ) : hasBothImages ? (
          // Both existing and new images - show comparison
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Current Image */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Current</p>
                <div className="relative inline-block group">
                  {/* eslint-disable-next-line @next/next/no-img-element -- existing image preview uses server URL and needs native <img> for straightforward preview and onClick */}
                  <img
                    src={existingImageUrl!}
                    alt="Current image"
                    className="w-full max-h-32 object-cover rounded-lg border border-blue-200 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    onClick={handleImageClick(existingImageUrl!, "Current image")}
                  />
                  <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Eye className="h-4 w-4 text-white drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* New Image */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">New</p>
                <div className="relative inline-block group">
                  {/* eslint-disable-next-line @next/next/no-img-element -- new image preview (object URL) — next/image does not support blob/object URLs here */}
                  <img
                    src={imagePreview!}
                    alt="New image"
                    className="w-full max-h-32 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    onClick={handleImageClick(imagePreview!, "New image")}
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
                      <Eye className="h-4 w-4 text-white drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-neutral-600 pt-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>New</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500">Click images to preview • Click area to replace • The new image will be saved</p>
          </div>
        ) : hasNewImage ? (
          // Only new image
          <div className="space-y-3">
            <div className="relative inline-block group">
                    {/* eslint-disable-next-line @next/next/no-img-element -- using native <img> for previews (object URLs / remote previews) */}
                    <img
                src={imagePreview!}
                alt="New image"
                className="max-w-56 max-h-40 rounded-lg border border-green-200 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                onClick={handleImageClick(imagePreview!, "New image")}
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
        ) : (
          // Only existing image
          <div className="space-y-3">
            <div className="relative inline-block group">
                    {/* eslint-disable-next-line @next/next/no-img-element -- using native <img> for previews (object URLs / remote previews) */}
                    <img
                src={existingImageUrl!}
                alt="Current image"
                className="max-w-56 max-h-40 rounded-lg border border-blue-200 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                onClick={handleImageClick(existingImageUrl!, "Current image")}
              />
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
