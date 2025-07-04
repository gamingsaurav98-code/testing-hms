"use client"

import React from "react"
import { AlertCircle } from "lucide-react"

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
  error?: string
  disabled?: boolean
}

export function Checkbox({ 
  label, 
  checked, 
  onChange, 
  description, 
  error, 
  disabled = false 
}: CheckboxProps) {
  return (
    <div className="space-y-1.5">
      <label className={`flex items-start space-x-3 cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-5 w-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 focus:ring-2 focus:ring-offset-0 transition-all duration-200 disabled:cursor-not-allowed"
        />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-neutral-900">{label}</span>
          {description && (
            <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>
      </label>
      {error && (
        <div className="flex items-center mt-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}
