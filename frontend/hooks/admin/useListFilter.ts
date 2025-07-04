import { useState } from 'react'

export interface FilterOption {
  key: string
  label: string
  count?: number
}

export interface UseListFilterProps {
  defaultFilter?: string
  options: FilterOption[]
  onFilterChange?: (filterValue: string) => void
}

export function useListFilter({ defaultFilter = 'all', options, onFilterChange }: UseListFilterProps) {
  const [activeFilter, setActiveFilter] = useState(defaultFilter)

  const handleFilterChange = (filterValue: string) => {
    setActiveFilter(filterValue)
    onFilterChange?.(filterValue)
  }

  const getActiveFilterLabel = () => {
    const option = options.find(opt => opt.key === activeFilter)
    return option?.label || 'All'
  }

  const getFilterCount = (filterValue: string) => {
    const option = options.find(opt => opt.key === filterValue)
    return option?.count
  }

  return {
    activeFilter,
    handleFilterChange,
    getActiveFilterLabel,
    getFilterCount,
    options
  }
}
