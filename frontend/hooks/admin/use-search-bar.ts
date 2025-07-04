"use client"

import { useState, useCallback } from "react"

interface UseSearchBarOptions {
  placeholder?: string
  onSearch?: (query: string) => void
  debounceMs?: number
}

export function useSearchBar({ 
  placeholder = "Search...", 
  onSearch,
  debounceMs = 300 
}: UseSearchBarOptions = {}) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    if (onSearch) {
      setIsSearching(true)
      
      // Debounce the search
      const timeoutId = setTimeout(() => {
        onSearch(newQuery)
        setIsSearching(false)
      }, debounceMs)
      
      return () => clearTimeout(timeoutId)
    }
  }, [onSearch, debounceMs])

  const handleSearch = useCallback(() => {
    if (onSearch) {
      setIsSearching(true)
      onSearch(query)
      setIsSearching(false)
    }
  }, [query, onSearch])

  const clearSearch = useCallback(() => {
    setQuery("")
    if (onSearch) {
      onSearch("")
    }
  }, [onSearch])

  return {
    query,
    isSearching,
    placeholder,
    handleInputChange,
    handleSearch,
    clearSearch,
    setQuery
  }
}
