import React from 'react'

export interface PageSkeletonLoaderProps {
  className?: string
}

export const PageSkeletonLoader: React.FC<PageSkeletonLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col gap-6 w-full p-6 ${className}`}>
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-20 h-3 bg-slate-200 rounded-md animate-pulse" />
        <div className="w-2 h-3 bg-slate-200 rounded-md animate-pulse" />
        <div className="w-24 h-3 bg-slate-200 rounded-md animate-pulse" />
      </div>

      {/* Header Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-44 h-7 bg-slate-200 rounded-xl animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="w-64 h-9 bg-slate-200 rounded-xl animate-pulse" />
          <div className="w-36 h-9 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Sorting Chips Skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-32 h-8 bg-slate-200 rounded-full animate-pulse" />
        <div className="w-24 h-8 bg-slate-200 rounded-full animate-pulse" />
        <div className="w-24 h-8 bg-slate-200 rounded-full animate-pulse" />
      </div>

      {/* Content Card Skeleton */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-6 flex flex-col gap-3">
        {/* Table Header Row Skeleton */}
        <div className="w-full h-10 bg-slate-100 rounded-xl animate-pulse flex items-center px-4 justify-between">
          <div className="w-24 h-4 bg-slate-200 rounded-md animate-pulse" />
          <div className="w-48 h-4 bg-slate-200 rounded-md animate-pulse" />
          <div className="w-20 h-4 bg-slate-200 rounded-md animate-pulse" />
          <div className="w-16 h-4 bg-slate-200 rounded-md animate-pulse" />
        </div>

        {/* 6 Table Rows Skeleton */}
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="w-full h-12 bg-slate-50/80 border border-slate-100 rounded-xl animate-pulse flex items-center px-4 justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
              <div className="w-40 h-3.5 bg-slate-200 rounded-md" />
            </div>
            <div className="w-64 h-3.5 bg-slate-200 rounded-md hidden md:block" />
            <div className="w-16 h-6 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
