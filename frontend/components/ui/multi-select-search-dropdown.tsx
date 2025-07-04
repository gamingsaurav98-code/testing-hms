"use client"

import React, { useState, useRef } from "react"
import { Search, X, Check, AlertCircle } from "lucide-react"

interface Option {
  id: number | string
  label: string
  value: any
}

interface MultiSelectSearchDropdownProps {
  label: string
  options: Option[]
  selectedOptions: Option[]
  onChange: (options: Option[]) => void
  placeholder?: string
  error?: string
  required?: boolean
  maxHeight?: number
  disabled?: boolean
}

export function MultiSelectSearchDropdown({
  label,
  options,
  selectedOptions,
  onChange,
  placeholder = "Search and select options...",
  error,
  required = false,
  maxHeight = 200,
  disabled = false
}: MultiSelectSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Reset search query when options or selected options change
  React.useEffect(() => {
    setSearchQuery('')
  }, [options.length, selectedOptions.length])

  // Filter options based on search query - memoized to prevent unnecessary recalculations
  const filteredOptions = React.useMemo(() => {
    return options.filter(
      (option) => option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Handle option selection
  const handleOptionSelect = React.useCallback((option: Option) => {
    const isSelected = selectedOptions.some((item) => item.id === option.id)
    
    if (isSelected) {
      onChange(selectedOptions.filter((item) => item.id !== option.id))
    } else {
      onChange([...selectedOptions, option])
    }
  }, [selectedOptions, onChange]);

  // Handle option removal (from the tag)
  const handleRemoveOption = React.useCallback((optionId: number | string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent dropdown from opening
    onChange(selectedOptions.filter((item) => item.id !== optionId))
  }, [selectedOptions, onChange]);

  // Handle key down events for accessibility
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isOpen && filteredOptions.length > 0) {
      handleOptionSelect(filteredOptions[0])
      e.preventDefault()
    } else if (e.key === "Escape") {
      setIsOpen(false)
    } else if (e.key === "ArrowDown" && isOpen) {
      const list = containerRef.current?.querySelector("ul")
      const firstItem = list?.querySelector("li button") as HTMLButtonElement
      if (firstItem) {
        firstItem.focus()
        e.preventDefault()
      }
    }
  }, [isOpen, filteredOptions, handleOptionSelect]);

  // Focus the input when dropdown opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-neutral-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div ref={containerRef} className="relative">
        {/* Main container that displays selected options and input */}
        <div
          className={`
            flex flex-wrap items-center gap-1.5 p-2 min-h-[56px] w-full border rounded-lg 
            transition-all duration-200 cursor-text
            ${disabled ? 'bg-neutral-50 cursor-not-allowed' : 'bg-white'} 
            ${error ? 'border-red-300' : 'border-neutral-200/60 focus-within:border-neutral-400'} 
            ${isOpen ? 'border-neutral-400 ring-1 ring-neutral-100' : ''}
          `}
          onClick={() => {
            if (!disabled) {
              setIsOpen(true)
              inputRef.current?.focus()
            }
          }}
        >
          {/* Selected options as chips/tags */}
          {selectedOptions.map((option) => (
            <div
              key={option.id}
              className="
                flex items-center rounded bg-neutral-100 px-2 py-1
                text-xs text-neutral-700 space-x-1 group
                border border-neutral-200/60
              "
            >
              <span className="max-w-[120px] truncate font-medium">{option.label}</span>
              {!disabled && (
                <button 
                  type="button"
                  className="p-0.5 text-neutral-500 hover:text-neutral-700 rounded-full focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  onClick={(e) => handleRemoveOption(option.id, e)}
                  tabIndex={-1}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          
          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={selectedOptions.length === 0 ? placeholder : ""}
            className="
              flex-grow p-1 text-sm text-neutral-700 bg-transparent 
              border-none focus:outline-none focus:ring-0 min-w-[40px] disabled:cursor-not-allowed
            "
            disabled={disabled}
          />
        </div>
        
        {/* Dropdown container */}
        {isOpen && !disabled && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden">
            {/* Search icon and counter */}
            <div className="flex items-center px-3 py-2 border-b border-neutral-100">
              <Search className="h-4 w-4 text-neutral-400 mr-2" />
              {searchQuery && (
                <span className="text-xs text-neutral-500">
                  {filteredOptions.length} {filteredOptions.length === 1 ? "result" : "results"}
                </span>
              )}
            </div>
            
            {/* Options list */}
            <div className="overflow-y-auto" style={{ maxHeight: `${maxHeight}px` }}>
              {filteredOptions.length > 0 ? (
                <ul className="py-1">
                  {filteredOptions.map((option) => {
                    const isSelected = selectedOptions.some((item) => item.id === option.id)
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          className={`
                            flex items-center w-full px-3 py-2 text-sm text-left 
                            hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none
                            ${isSelected ? "text-neutral-900 font-medium" : "text-neutral-700"}
                          `}
                          onClick={() => handleOptionSelect(option)}
                        >
                          <span className="flex-grow truncate">{option.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-green-600 ml-2 flex-shrink-0" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-neutral-500">
                  {searchQuery ? "No results found" : "No options available"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="flex items-center mt-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}
