"use client"

import React from "react"

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'edit' | 'delete'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  className?: string
  title?: string
}

export function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
  title
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-800",
    secondary: "border border-neutral-200 text-neutral-700 hover:bg-neutral-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-neutral-700 hover:bg-neutral-100",
    edit: "bg-[#235999] hover:bg-[#1c4a82] text-white",
    delete: "bg-red-600 text-white hover:bg-red-700"
  }
  
  const sizes = {
    sm: "px-3 py-2 text-xs rounded-lg h-8 space-x-1.5",
    md: "px-4 py-2.5 text-xs rounded-lg h-9 space-x-2",
    lg: "px-6 py-3 text-sm rounded-lg h-10 space-x-2"
  }

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      title={title}
    >
      {loading ? (
        <>
          <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && icon}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}
