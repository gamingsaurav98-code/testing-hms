"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"

export interface SelectOption {
  id: number | string
  label: string
  value: any
}

export function useMultiSelectCreate<T extends { id: number | string }>(
  items: T[] = [],
  labelKey: keyof T = 'name' as keyof T
) {
  // Use ref to track if this is the initial render
  const isInitialRender = useRef(true)
  
  // Create option objects from items - memoized to prevent recreation on every render
  const options = useMemo(() => {
    if (items.length === 0) return []
    return items.map(item => ({
      id: item.id,
      label: String(item[labelKey]),
      value: item
    }))
  }, [items, labelKey]);
  
  // Start with empty selection for create forms
  const [selected, setSelected] = useState<SelectOption[]>([]);

  // Mark initial render as complete
  useEffect(() => {
    isInitialRender.current = false
  }, [])

  // Handle selection change - memoized with stable reference
  const handleSelectionChange = useCallback((newSelected: SelectOption[]) => {
    setSelected(newSelected)
  }, []);

  // Get selected IDs (useful for form submission) - memoized
  const getSelectedIds = useCallback(
    () => selected.map(item => item.id),
    [selected]
  )

  // Get selected items (the original data objects) - memoized
  const getSelectedItems = useCallback(
    () => selected.map(item => item.value),
    [selected]
  )

  // Reset selection - stable reference
  const resetSelection = useCallback(
    () => setSelected([]),
    []
  )

  return {
    options,
    selected,
    handleSelectionChange,
    getSelectedIds,
    getSelectedItems,
    resetSelection
  }
}
