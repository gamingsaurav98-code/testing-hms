"use client"

import React from "react"
import { Check, X } from "lucide-react"

interface SuccessToastProps {
  show: boolean
  message: string
  progress: number
  onClose: () => void
}

export function SuccessToast({ show, message, progress, onClose }: SuccessToastProps) {
  if (!show) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 transform transition-all duration-300 ease-in-out">
      <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg border border-green-500 min-w-80 relative overflow-hidden">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Check className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-green-400 transition-all duration-100 ease-linear"
             style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
