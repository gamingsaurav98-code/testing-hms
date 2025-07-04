"use client"

import { useState } from "react"

export function useImageUpload() {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const resetImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  return {
    image,
    imagePreview,
    handleFileSelect,
    removeImage,
    resetImage
  }
}
