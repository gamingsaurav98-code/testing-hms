"use client"

import { useState, useEffect, useRef } from "react"

interface AdditionalImage {
  id: number
  image: string
  is_primary: boolean
  product_id?: number
  created_at?: string
  updated_at?: string
}

export function useMultipleImageUpload(existingImages: AdditionalImage[] = []) {
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [existingImagesState, setExistingImagesState] = useState<AdditionalImage[]>(existingImages)
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([])
  const prevExistingImagesRef = useRef<AdditionalImage[]>(existingImages)

  useEffect(() => {
    // Only update if the content actually changed, not just the reference
    if (JSON.stringify(prevExistingImagesRef.current) !== JSON.stringify(existingImages)) {
      setExistingImagesState(existingImages)
      prevExistingImagesRef.current = existingImages
    }
  }, [existingImages])

  const handleAddImages = (files: File[]) => {
    setAdditionalImages(prev => [...prev, ...files])
  }

  const handleRemoveImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (id: number) => {
    setExistingImagesState(prev => prev.filter(img => img.id !== id))
    setRemovedImageIds(prev => [...prev, id])
  }

  const resetImages = () => {
    setAdditionalImages([])
    setExistingImagesState(existingImages)
    setRemovedImageIds([])
  }

  return {
    additionalImages,
    existingImages: existingImagesState,
    removedImageIds,
    handleAddImages,
    handleRemoveImage,
    handleRemoveExistingImage,
    resetImages
  }
}
