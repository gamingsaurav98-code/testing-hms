"use client"

import { useState, useCallback } from "react"

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface UseListFilterProps {
  options: FilterOption[]
  defaultFilter?: string
}

export function useListFilter({ options, defaultFilter }: UseListFilterProps) {
  const [activeFilter, setActiveFilter] = useState<string>(
    defaultFilter || options[0]?.value || ''
  )

  const handleFilterChange = useCallback((filterValue: string) => {
    setActiveFilter(filterValue)
  }, [])

  const getActiveFilterLabel = useCallback(() => {
    const activeOption = options.find(option => option.value === activeFilter)
    return activeOption?.label || ''
  }, [options, activeFilter])

  const getFilterCount = useCallback((filterValue: string) => {
    const option = options.find(opt => opt.value === filterValue)
    return option?.count
  }, [options])

  return {
    activeFilter,
    handleFilterChange,
    getActiveFilterLabel,
    getFilterCount,
    options
  }
}
