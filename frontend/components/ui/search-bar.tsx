"use client"

import React from "react"
import { Search } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="relative flex-1 sm:max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-neutral-200/60 rounded-lg text-sm text-neutral-600 placeholder:text-sm placeholder:text-neutral-400 placeholder:font-normal placeholder:leading-normal focus:border-neutral-400 focus:ring-0 outline-none transition-all duration-200 bg-white"
      />
    </div>
  )
}
