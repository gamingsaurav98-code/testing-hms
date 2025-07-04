"use client"

import React, { useState, useRef } from "react"
import { Upload, X, AlertCircle, Eye } from "lucide-react"
import { getImageUrl } from "@/lib/utils"

interface MultipleImageUploadEditProps {
  images: File[]
  existingImages?: { id: number; image: string; is_primary: boolean }[]
  removedImageIds?: number[]
  onAddImages: (files: File[]) => void
  onRemoveImage: (index: number) => void
  onRemoveExistingImage?: (id: number) => void
  error?: string
  label?: string
  onImageClick: (imageUrl: string, alt: string) => void
}

export function MultipleImageUploadEdit({ 
  images, 
  existingImages = [],
  removedImageIds = [],
  onAddImages, 
  onRemoveImage, 
  onRemoveExistingImage,
  error, 
  label = "Additional Images",
  onImageClick
}: MultipleImageUploadEditProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      onAddImages(fileArray)
      
      // Reset the input so the same file can be selected again if needed
      e.target.value = ''
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

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files).filter(file => file.type.startsWith("image/"))
      if (fileArray.length > 0) {
        onAddImages(fileArray)
      }
    }
  }

  const handleUploadAreaClick = (e: React.MouseEvent) => {
    // Only trigger file input if clicking on the upload area, not the images
    if ((e.target as HTMLElement).closest('.image-preview')) {
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
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
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
          multiple
          className="hidden"
        />

        {/* Images preview grid */}
        <div className="space-y-4">
          {(existingImages.length > 0 || images.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {/* Existing images */}
              {existingImages.map((img) => (
                <div key={`existing-${img.id}`} className="image-preview relative group">
                  <div className="aspect-square w-full rounded-lg overflow-hidden border border-neutral-200/60 relative transition-all duration-200 hover:border-neutral-300">
                    <img 
                      src={getImageUrl(img.image)} 
                      alt={`Product image ${img.id}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-200 hover:scale-105"
                      onClick={() => onImageClick(getImageUrl(img.image), `Product image ${img.id}`)}
                    />
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onRemoveExistingImage) {
                          onRemoveExistingImage(img.id)
                        }
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Current badge */}
                    <div className="absolute bottom-2 left-2">
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Current
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Eye className="h-5 w-5 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* New images */}
              {images.map((file, index) => (
                <div key={`new-${index}`} className="image-preview relative group">
                  <div className="aspect-square w-full rounded-lg overflow-hidden border border-amber-300 relative">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`New image ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
                      onClick={() => onImageClick(URL.createObjectURL(file), `New image ${index + 1}`)}
                    />
                    
                    {/* New badge */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                        New
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveImage(index)
                      }}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-sm"
                      title="Remove new image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Eye className="h-5 w-5 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add more images tile */}
              <div 
                className="aspect-square w-full rounded-lg border-2 border-dashed border-neutral-200/60 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-300 transition-all duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-neutral-400 mb-2" />
                <span className="text-xs text-neutral-500 text-center px-2">Add more</span>
              </div>
            </div>
          )}

          {existingImages.length === 0 && images.length === 0 && (
            <div className="space-y-3 cursor-pointer text-center">
              <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-lg border border-neutral-200/60 flex items-center justify-center">
                <Upload className="h-6 w-6 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 font-medium">
                  Drop images here or <span className="font-semibold underline">browse files</span>
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">PNG, JPG, GIF up to 10MB each</p>
              </div>
            </div>
          )}

          {/* Legend */}
          {(existingImages.length > 0 || images.length > 0) && (
            <div className="flex flex-wrap gap-4 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                <span>New</span>
              </div>
            </div>
          )}
        </div>
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
