"use client"

import { useState } from "react"

export function useFormErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setError = (field: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }))
  }

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const clearAllErrors = () => {
    setErrors({})
  }

  const hasErrors = () => {
    return Object.keys(errors).length > 0
  }

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors
  }
}
