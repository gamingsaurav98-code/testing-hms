"use client"

import React from "react"
import { AlertCircle } from "lucide-react"

interface FormFieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  error?: string
  placeholder?: string
  type?: 'text' | 'textarea' | 'email' | 'date' | 'select' | 'number'
  rows?: number
  required?: boolean
  options?: { value: string, label: string }[]
  disabled?: boolean
}

export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  rows = 4,
  required = false,
  options = [],
  disabled = false
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-neutral-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 placeholder:text-sm placeholder:text-neutral-400 placeholder:font-normal placeholder:leading-normal focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200 resize-none min-h-[120px] ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-4 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 placeholder:text-sm placeholder:text-neutral-400 placeholder:font-normal placeholder:leading-normal focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      )}
      {error && (
        <div className="flex items-center mt-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}
