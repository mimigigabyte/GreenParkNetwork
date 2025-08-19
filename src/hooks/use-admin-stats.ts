'use client'

import { useState, useEffect } from 'react'

export interface AdminStats {
  pendingContacts: number      // 待处理联系消息数
  pendingTechnologies: number  // 待审核技术数
  unreadMessages: number       // 未读管理员消息数
  totalNotifications: number   // 总通知数（用于小铃铛）
}

export function useAdminStats(refreshInterval: number = 30000) {
  const [stats, setStats] = useState<AdminStats>({
    pendingContacts: 0,
    pendingTechnologies: 0,
    unreadMessages: 0,
    totalNotifications: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats')
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error('获取管理员统计数据失败:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 初始加载
    fetchStats()

    // 设置定时刷新
    const interval = setInterval(fetchStats, refreshInterval)

    // 页面获得焦点时刷新
    const handleFocus = () => {
      fetchStats()
    }
    window.addEventListener('focus', handleFocus)

    // 清理
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshInterval])

  return { stats, loading, error, refresh: fetchStats }
}