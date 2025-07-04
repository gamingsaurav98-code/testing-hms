"use client"

import React from "react"
import { FilterOption } from "@/hooks/admin/use-list-filter"

interface ListPageFilterProps {
  options: FilterOption[]
  activeFilter: string
  onFilterChange: (filterValue: string) => void
  className?: string
  showCounts?: boolean
}

export function ListPageFilter({ 
  options, 
  activeFilter, 
  onFilterChange, 
  className = "",
  showCounts = true 
}: ListPageFilterProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeFilter === option.value
              ? "bg-neutral-900 text-white shadow-sm"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          {option.label}
          {showCounts && typeof option.count === 'number' && (
            <span className={`ml-1.5 text-xs ${
              activeFilter === option.value 
                ? "text-neutral-300" 
                : "text-neutral-400"
            }`}>
              ({option.count})
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
