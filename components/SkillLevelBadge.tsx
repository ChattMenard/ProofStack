'use client'

import React from 'react'

type SkillLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'unverified'

interface SkillLevelBadgeProps {
  level: SkillLevel
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const levelConfig = {
  junior: {
    label: 'Junior',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🌱',
    description: '1-2 years experience'
  },
  mid: {
    label: 'Mid-Level',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🌿',
    description: '2-5 years experience'
  },
  senior: {
    label: 'Senior',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '🌳',
    description: '5-10 years experience'
  },
  lead: {
    label: 'Lead',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '⭐',
    description: '10+ years, leadership'
  },
  unverified: {
    label: 'Unverified',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: '❓',
    description: 'Complete assessments to verify'
  }
}

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-2'
}

export default function SkillLevelBadge({
  level,
  size = 'md',
  showLabel = true,
  className = ''
}: SkillLevelBadgeProps) {
  const config = levelConfig[level]
  const sizeClass = sizeConfig[size]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClass} ${className}`}
      title={config.description}
    >
      <span className="leading-none">{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

export function SkillLevelProgress({ level }: { level: SkillLevel }) {
  const levels: SkillLevel[] = ['unverified', 'junior', 'mid', 'senior', 'lead']
  const currentIndex = levels.indexOf(level)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Skill Level Progress</span>
        <SkillLevelBadge level={level} size="sm" />
      </div>
      <div className="flex gap-1">
        {levels.map((lvl, idx) => (
          <div
            key={lvl}
            className={`h-2 flex-1 rounded-full transition-colors ${
              idx <= currentIndex
                ? levelConfig[lvl].color.split(' ')[0]
                : 'bg-gray-200'
            }`}
            title={levelConfig[lvl].label}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600">{levelConfig[level].description}</p>
    </div>
  )
}
