"use client"

import { useState } from "react"

export function useImageModal() {
  const [showModal, setShowModal] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [altText, setAltText] = useState("")

  const openModal = (url: string, alt: string = "Image") => {
    setImageUrl(url)
    setAltText(alt)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setImageUrl("")
    setAltText("")
  }

  return {
    showModal,
    imageUrl,
    altText,
    openModal,
    closeModal
  }
}
