"use client"

import React from "react"
import { Button } from "./button"

interface SubmitButtonProps {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export function SubmitButton({ loading, loadingText = "Saving...", children, icon }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="primary"
      loading={loading}
      icon={icon}
    >
      {loading ? loadingText : children}
    </Button>
  )
}

interface CancelButtonProps {
  onClick: () => void
  children?: React.ReactNode
  icon?: React.ReactNode
}

export function CancelButton({ onClick, children = "Cancel", icon }: CancelButtonProps) {
  return (
    <Button
      variant="secondary"
      onClick={onClick}
      icon={icon}
    >
      {children}
    </Button>
  )
}
