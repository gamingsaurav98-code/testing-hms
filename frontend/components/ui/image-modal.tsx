"use client"

/* eslint-disable @next/next/no-img-element -- This file intentionally uses native <img> for previews and object URLs; next/image interferes with onError and blob/object URL workflows */

import React from "react"
import { X, Download, File, ExternalLink } from "lucide-react"

interface ImageModalProps {
  show: boolean
  imageUrl: string
  alt: string
  onClose: () => void
}

export function ImageModal({ show, imageUrl, alt, onClose }: ImageModalProps) {
  if (!show) return null
  
  console.log('ImageModal:', { imageUrl, alt });
  
  // Check file type from the extension or URL
  const isPDF = /\.pdf$/i.test(imageUrl) || /\.pdf$/i.test(alt);
  const isImage = !isPDF; // Default to image if not PDF
  
  // For image URLs from the server, ensure it's a complete URL
  const fullImageUrl = imageUrl;
  
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
        
        {/* Download button */}
        <a
          href={fullImageUrl}
          download={alt}
          className="absolute -top-3 -left-3 w-8 h-8 bg-white rounded-full shadow-lg text-green-600 hover:text-green-800 hover:shadow-xl transition-all duration-200 flex items-center justify-center border border-neutral-200/60"
          style={{ zIndex: 100000 }}
          title="Download file"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-4 w-4" />
        </a>
        
        {isImage ? (
          
          <img
            src={fullImageUrl}
            alt={alt}
            onError={(e) => {
              console.error('Image failed to load:', fullImageUrl);
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loops
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgOUgxOSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMyAxNUgxOSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yMiAxOUMyMiAxOS41MzA0IDIxLjc4OTMgMjAuMDM5MSAyMS40MTQyIDIwLjQxNDJDMjEuMDM5MSAyMC43ODkzIDIwLjUzMDQgMjEgMjAgMjFINEMzLjQ2OTU3IDIxIDIuOTYwODYgMjAuNzg5MyAyLjU4NTc5IDIwLjQxNDJDMi4yMTA3MSAyMC4wMzkxIDIgMTkuNTMwNCAyIDE5VjVDMiA0LjQ2OTU3IDIuMjEwNzEgMy45NjA4NiAyLjU4NTc5IDMuNTg1NzlDMi45NjA4NiAzLjIxMDcxIDMuNDY5NTcgMyA0IDNIMjBDMjAuNTMwNCAzIDIxLjAzOTEgMy4yMTA3MSAyMS40MTQyIDMuNTg1NzlDMjEuNzg5MyAzLjk2MDg2IDIyIDQuNDY5NTcgMjIgNVYxOVoiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNOSA5SDdWMTVIOVY5WiIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==';
            }}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            draggable={false}
          />
        ) : isPDF ? (
          // For PDFs
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-gray-100 p-4 flex justify-between items-center border-b">
              <div className="flex items-center">
                <File className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-medium truncate max-w-[300px]">{alt}</span>
              </div>
              <a 
                href={fullImageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </a>
            </div>
            <iframe 
              src={fullImageUrl} 
              className="w-full h-[70vh]"
              title={alt}
            />
          </div>
        ) : (
          // For other files
          <div className="bg-white p-6 rounded-lg shadow-2xl text-center max-w-md">
            <File className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 break-all">{alt}</h3>
            <p className="text-gray-600 mb-6">This file type cannot be previewed</p>
            <div className="flex justify-center">
              <a
                href={fullImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors mr-3 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </a>
              <a
                href={fullImageUrl}
                download={alt}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
