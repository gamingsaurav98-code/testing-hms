"use client"

import { useState, useCallback } from "react"

interface UseCheckboxOptions {
  initialChecked?: boolean
  onChange?: (checked: boolean) => void
}

export function useCheckbox({ 
  initialChecked = false, 
  onChange 
}: UseCheckboxOptions = {}) {
  const [checked, setChecked] = useState(initialChecked)

  const handleChange = useCallback((newChecked: boolean) => {
    setChecked(newChecked)
    onChange?.(newChecked)
  }, [onChange])

  const toggle = useCallback(() => {
    const newChecked = !checked
    setChecked(newChecked)
    onChange?.(newChecked)
  }, [checked, onChange])

  const reset = useCallback(() => {
    setChecked(initialChecked)
  }, [initialChecked])

  return {
    checked,
    handleChange,
    toggle,
    reset,
    setChecked
  }
}
