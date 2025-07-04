"use client"

import { useEffect, useState } from 'react'
import { formatDate, formatDateClient } from '@/lib/utils'

interface SafeDateProps {
  date: string
  fallback?: string
  className?: string
}

/**
 * A hydration-safe date component that prevents server/client mismatch
 * Initially renders with a simple server-safe format, then hydrates with client format
 */
export function SafeDate({ date, fallback, className }: SafeDateProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Use simple format for SSR, then client format after hydration
  const formattedDate = isClient ? formatDateClient(date) : formatDate(date)

  return (
    <span className={className}>
      {formattedDate || fallback || date}
    </span>
  )
}
