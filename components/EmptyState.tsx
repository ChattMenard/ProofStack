'use client'

import { ReactNode } from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  showPlaceholders?: boolean
  placeholderCount?: number
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  showPlaceholders = false,
  placeholderCount = 3
}: EmptyStateProps) {
  return (
    <div className="w-full">
      {!showPlaceholders ? (
        // Regular empty state message
        <div className="text-center py-12 px-4">
          {icon && (
            <div className="mx-auto w-16 h-16 mb-4 text-forest-400 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h3 className="text-xl font-semibold text-forest-100 mb-2">{title}</h3>
          <p className="text-forest-400 mb-6 max-w-md mx-auto">{description}</p>
          
          {(actionLabel && (actionHref || onAction)) && (
            <>
              {actionHref ? (
                <Link
                  href={actionHref}
                  className="inline-flex items-center px-6 py-3 bg-sage-600 hover:bg-sage-500 text-white rounded-lg font-medium transition"
                >
                  {actionLabel}
                </Link>
              ) : (
                <button
                  onClick={onAction}
                  className="inline-flex items-center px-6 py-3 bg-sage-600 hover:bg-sage-500 text-white rounded-lg font-medium transition"
                >
                  {actionLabel}
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        // Placeholder cards
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={i}
              className="relative bg-forest-900/50 border-2 border-dashed border-forest-700 rounded-lg p-6 hover:border-sage-500/50 transition-colors group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sage-500/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative space-y-4">
                {/* Icon/Avatar placeholder */}
                <div className="w-16 h-16 bg-forest-800 rounded-full animate-pulse" />
                
                {/* Title placeholder */}
                <div className="space-y-2">
                  <div className="h-4 bg-forest-800 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-forest-800 rounded w-1/2 animate-pulse" />
                </div>
                
                {/* Description placeholder */}
                <div className="space-y-2">
                  <div className="h-3 bg-forest-800 rounded animate-pulse" />
                  <div className="h-3 bg-forest-800 rounded w-5/6 animate-pulse" />
                </div>
                
                {/* Action placeholder */}
                <div className="h-10 bg-forest-800 rounded animate-pulse" />
              </div>
              
              {/* Overlay message */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-forest-950/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-sage-500">
                  <p className="text-sm text-sage-400 font-medium">
                    {i === 0 && actionLabel ? actionLabel : 'Be the first!'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
