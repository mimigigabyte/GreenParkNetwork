'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: number // 百分比变化，正数为增长，负数为下降
  description?: string
  isLoading?: boolean
  className?: string
  monthlyNew?: number // 本月新增数量
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  isLoading = false,
  className,
  monthlyNew
}: StatsCardProps) {
  const formatValue = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return null
    return trend > 0 ? TrendingUp : TrendingDown
  }

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-gray-500'
    return trend > 0 ? 'text-green-600' : 'text-red-600'
  }

  const TrendIcon = getTrendIcon()

  if (isLoading) {
    return (
      <div className={cn('p-6 rounded-lg border', className)}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-6 rounded-lg transition-all duration-200 hover:shadow-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 opacity-80" />
        {/* 优先显示本月新增，如果没有则显示趋势 */}
        {monthlyNew !== undefined && monthlyNew > 0 ? (
          <div className="text-right">
            <div className="text-xs opacity-60 mb-1">本月新增</div>
            <div className="text-sm font-bold">+{monthlyNew}</div>
          </div>
        ) : TrendIcon && (
          <div className={cn('flex items-center text-sm font-medium', getTrendColor())}>
            <TrendIcon className="w-4 h-4 mr-1" />
            {Math.abs(trend!).toFixed(1)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-3xl font-bold">
          {formatValue(value)}
        </h3>
        <p className="text-sm opacity-80">
          {title}
        </p>
        {description && (
          <p className="text-xs opacity-60 mt-2">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}