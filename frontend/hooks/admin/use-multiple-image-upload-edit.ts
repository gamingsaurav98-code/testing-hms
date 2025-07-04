"use client"

import { useState, useEffect, useRef } from "react"

interface AdditionalImageEdit {
  id: number
  image: string
  is_primary: boolean
  product_id?: number
  created_at?: string
  updated_at?: string
}

export function useMultipleImageUploadEdit(existingImages: AdditionalImageEdit[] = []) {
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [existingImagesState, setExistingImagesState] = useState<AdditionalImageEdit[]>(existingImages)
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([])
  const prevExistingImagesRef = useRef<AdditionalImageEdit[]>(existingImages)

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
    // Directly remove from the existing images state and add to removed list for API
    setExistingImagesState(prev => prev.filter(img => img.id !== id))
    if (!removedImageIds.includes(id)) {
      setRemovedImageIds(prev => [...prev, id])
    }
  }

  // Get images that are currently visible (all images in state)
  const getActiveExistingImages = () => {
    return existingImagesState
  }

  // Get total count of images after changes
  const getTotalImageCount = () => {
    return getActiveExistingImages().length + additionalImages.length
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
    resetImages,
    getActiveExistingImages,
    getTotalImageCount
  }
}
