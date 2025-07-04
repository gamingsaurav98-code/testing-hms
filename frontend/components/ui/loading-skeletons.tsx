"use client"

import React from "react"

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Table Header - Desktop only */}
      <div className="hidden md:block px-6 py-4 border-b border-neutral-200/60 bg-neutral-50/30">
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-4">
            <div className="h-2.5 bg-neutral-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="col-span-6">
            <div className="h-2.5 bg-neutral-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="col-span-2">
            <div className="h-2.5 bg-neutral-200 rounded w-12 ml-auto animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-neutral-200/60">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-5 animate-pulse">
            {/* Mobile skeleton */}
            <div className="md:hidden space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-neutral-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-neutral-200 rounded w-24"></div>
                  <div className="h-3 bg-neutral-200 rounded w-16"></div>
                  <div className="h-3 bg-neutral-200 rounded w-full"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-3 border-t border-neutral-100">
                <div className="flex-1 h-6 bg-neutral-200 rounded-lg"></div>
                <div className="flex-1 h-6 bg-neutral-200 rounded-lg"></div>
                <div className="w-6 h-6 bg-neutral-200 rounded-lg"></div>
              </div>
            </div>

            {/* Desktop skeleton */}
            <div className="hidden md:grid grid-cols-12 gap-6 items-center">
              <div className="col-span-4 flex items-center space-x-4">
                <div className="w-10 h-10 bg-neutral-200 rounded-lg flex-shrink-0"></div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-neutral-200 rounded w-24"></div>
                  <div className="h-3 bg-neutral-200 rounded w-16"></div>
                </div>
              </div>
              <div className="col-span-6">
                <div className="space-y-2">
                  <div className="h-3 bg-neutral-200 rounded w-full"></div>
                  <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-end space-x-2">
                <div className="w-10 h-6 bg-neutral-200 rounded-lg"></div>
                <div className="w-10 h-6 bg-neutral-200 rounded-lg"></div>
                <div className="w-6 h-6 bg-neutral-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="h-8 bg-neutral-200 rounded-lg flex-1 sm:max-w-md animate-pulse"></div>
      <div className="h-8 bg-neutral-200 rounded-lg w-full sm:w-32 animate-pulse"></div>
    </div>
  )
}
