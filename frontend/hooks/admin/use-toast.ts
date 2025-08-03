"use client"

import { useState } from "react"

export function useToast() {
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastProgress, setToastProgress] = useState(100)

  const showSuccess = (duration = 1500) => { // Reduced from 2000ms to 1500ms for faster feedback
    setShowSuccessToast(true)
    setToastProgress(100)
    
    // Animate progress bar from 100% to 0% over specified duration
    const frames = 20
    const interval = duration / frames
    const progressDecrement = 100 / frames

    const progressInterval = setInterval(() => {
      setToastProgress(prev => {
        const newProgress = prev - progressDecrement
        if (newProgress <= 0) {
          clearInterval(progressInterval)
          setShowSuccessToast(false)
          setToastProgress(100)
          return 0
        }
        return newProgress
      })
    }, interval)
  }

  const hideToast = () => {
    setShowSuccessToast(false)
    setToastProgress(100)
  }

  return {
    showSuccessToast,
    toastProgress,
    showSuccess,
    hideToast
  }
}
