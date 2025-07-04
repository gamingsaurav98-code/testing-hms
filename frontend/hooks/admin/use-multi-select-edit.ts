"use client"

import { useState, useEffect, useMemo, useCallback } from "react"

export interface SelectOption {
  id: number | string
  label: string
  value: any
}

export function useMultiSelectEdit<T extends { id: number | string }>(
  items: T[] = [],
  selectedIds: (number | string)[] = [],
  labelKey: keyof T = 'name' as keyof T
) {
  // Create option objects from items - memoized to prevent recreation on every render
  const options = useMemo(
    () => items.map(item => ({
      id: item.id,
      label: String(item[labelKey]),
      value: item
    })),
    [items, labelKey]
  );
  
  // Initial selected state for edit forms
  const [selected, setSelected] = useState<SelectOption[]>([]);

  // Update selected when items or selectedIds change (only for edit forms with existing data)
  useEffect(() => {
    // Only run if we have both items and selectedIds
    if (items.length > 0 && selectedIds.length > 0) {
      const newSelected = selectedIds
        .map(id => {
          const item = items.find(i => i.id === id)
          if (!item) return null;
          return {
            id: item.id,
            label: String(item[labelKey]),
            value: item
          }
        })
        .filter((item): item is SelectOption => item !== null);
      
      // Only update if we actually found matching items
      if (newSelected.length > 0) {
        setSelected(newSelected);
      }
    } else if (selectedIds.length === 0 && selected.length > 0) {
      // Clear selection if selectedIds becomes empty
      setSelected([]);
    }
  }, [items, selectedIds, labelKey]);

  // Handle selection change
  const handleSelectionChange = useCallback((newSelected: SelectOption[]) => {
    setSelected(newSelected)
  }, []);

  // Get selected IDs (useful for form submission)
  const getSelectedIds = useCallback(
    () => selected.map(item => item.id),
    [selected]
  )

  // Get selected items (the original data objects)
  const getSelectedItems = useCallback(
    () => selected.map(item => item.value),
    [selected]
  )

  // Reset selection
  const resetSelection = useCallback(
    () => setSelected([]),
    []
  )

  // Set selection by IDs (useful for programmatic updates)
  const setSelectionByIds = useCallback(
    (ids: (number | string)[]) => {
      if (options.length === 0) return;
      
      const newSelected = ids
        .map(id => {
          const option = options.find(o => o.id === id)
          return option || null
        })
        .filter((item): item is SelectOption => item !== null)
      
      setSelected(newSelected)
    },
    [options]
  )

  return {
    options,
    selected,
    handleSelectionChange,
    getSelectedIds,
    getSelectedItems,
    resetSelection,
    setSelectionByIds
  }
}
