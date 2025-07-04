"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { apiClient, type Product } from "@/lib/api"
import { getErrorMessage } from "@/lib/utils"
import { useToast, useConfirmModal, useImageModal } from "@/hooks/admin"

export function useProductList() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const { showSuccessToast, toastProgress, showSuccess, hideToast } = useToast()
  const { confirmModal, showConfirm, hideConfirm } = useConfirmModal<Product>()
  const { showModal, imageUrl, altText, openModal, closeModal } = useImageModal()

  // Filter system with dynamic counts
  const getAllProductsCount = useCallback(() => products.length, [products])
  const getActiveProductsCount = useCallback(() => products.filter(p => p.is_active).length, [products])
  const getInactiveProductsCount = useCallback(() => products.filter(p => !p.is_active).length, [products])

  const filterOptions = [
    { value: 'all', label: 'All Products', count: getAllProductsCount() },
    { value: 'active', label: 'Active', count: getActiveProductsCount() },
    { value: 'inactive', label: 'Inactive', count: getInactiveProductsCount() }
  ]

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getProducts()
      setProducts(response.data || [])
    } catch (error) {
      console.error("Error loading products:", error)
      alert(`Error loading products: ${getErrorMessage(error)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Filter products
  const getFilteredProducts = useCallback((activeFilter: string) => {
    return products
      .filter(product => {
        // Filter by status
        if (activeFilter === 'active') return product.is_active
        if (activeFilter === 'inactive') return !product.is_active
        return true // 'all' shows everything
      })
      .filter(product =>
        // Filter by search query
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.short_description.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [products, searchQuery])

  // Product actions
  const handleView = useCallback((product: Product) => {
    router.push(`/admin/product/${product.id}`)
  }, [router])

  const handleEdit = useCallback((product: Product) => {
    router.push(`/admin/product/${product.id}/edit`)
  }, [router])

  const handleDelete = useCallback((product: Product) => {
    showConfirm(
      product,
      "Delete Product",
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    )
  }, [showConfirm])

  const confirmDelete = useCallback(async () => {
    if (!confirmModal.item) return
    setIsDeleting(true)
    try {
      await apiClient.deleteProduct(confirmModal.item.id)
      setProducts(prev => prev.filter(item => item.id !== confirmModal.item?.id))
      showSuccess()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert(`Error deleting product: ${getErrorMessage(error)}`)
    } finally {
      setIsDeleting(false)
      hideConfirm()
    }
  }, [confirmModal.item, showSuccess, hideConfirm])

  const handleCreateProduct = useCallback(() => {
    router.push('/admin/product/create')
  }, [router])

  const handleImageClick = useCallback((imageUrl: string, altText: string) => {
    openModal(imageUrl, altText)
  }, [openModal])

  return {
    // State
    products,
    searchQuery,
    isLoading,
    isDeleting,
    
    // Filter options
    filterOptions,
    
    // Functions
    setSearchQuery,
    getFilteredProducts,
    loadProducts,
    
    // Product actions
    handleView,
    handleEdit,
    handleDelete,
    handleCreateProduct,
    handleImageClick,
    confirmDelete,
    
    // Modal states
    confirmModal,
    hideConfirm,
    showModal,
    imageUrl,
    altText,
    closeModal,
    
    // Toast states
    showSuccessToast,
    toastProgress,
    hideToast
  }
}
