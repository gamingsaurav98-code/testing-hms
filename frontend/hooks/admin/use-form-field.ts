"use client"

import { useState, useCallback } from "react"

interface UseFormFieldOptions {
  initialValue?: string
  required?: boolean
  validation?: (value: string) => string | null
}

export function useFormField({ 
  initialValue = "", 
  required = false, 
  validation 
}: UseFormFieldOptions = {}) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }, [error])

  const handleBlur = useCallback(() => {
    setTouched(true)
    validate()
  }, [])

  const validate = useCallback(() => {
    let errorMessage: string | null = null
    
    // Required validation
    if (required && !value.trim()) {
      errorMessage = "This field is required"
    }
    
    // Custom validation
    if (!errorMessage && validation && value) {
      errorMessage = validation(value)
    }
    
    setError(errorMessage)
    return !errorMessage
  }, [value, required, validation])

  const reset = useCallback(() => {
    setValue(initialValue)
    setError(null)
    setTouched(false)
  }, [initialValue])

  return {
    value,
    error,
    touched,
    isValid: !error,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValue,
    setError
  }
}
