"use client"

import { useState } from "react"

export function useConfirmModal<T = any>() {
  const [confirmModal, setConfirmModal] = useState<{ 
    show: boolean
    item: T | null
    title?: string
    message?: string
  }>({
    show: false,
    item: null
  })

  const showConfirm = (item: T, title?: string, message?: string) => {
    setConfirmModal({ 
      show: true, 
      item,
      title,
      message
    })
  }

  const hideConfirm = () => {
    setConfirmModal({ 
      show: false, 
      item: null 
    })
  }

  return {
    confirmModal,
    showConfirm,
    hideConfirm
  }
}
