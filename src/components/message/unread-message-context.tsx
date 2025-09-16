'use client'

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react'
import { useAuthContext } from '@/components/auth/auth-provider'
import { getUnreadInternalMessageCount } from '@/lib/supabase/contact-messages'

interface UnreadMessageContextType {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
  decrementUnreadCount: (amount?: number) => void
  setUnreadCount: (count: number) => void
}

const UnreadMessageContext = createContext<UnreadMessageContextType | undefined>(undefined)

export function UnreadMessageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    try {
      const count = await getUnreadInternalMessageCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to load unread count:', error)
      setUnreadCount(0)
    }
  }, [user])

  const decrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount))
  }, [])

  // 初始加载和定期刷新
  useEffect(() => {
    refreshUnreadCount()

    // 定期更新未读数量（每30秒）
    const interval = setInterval(refreshUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [refreshUnreadCount])

  const value: UnreadMessageContextType = {
    unreadCount,
    refreshUnreadCount,
    decrementUnreadCount,
    setUnreadCount
  }

  return (
    <UnreadMessageContext.Provider value={value}>
      {children}
    </UnreadMessageContext.Provider>
  )
}

export function useUnreadMessage() {
  const context = useContext(UnreadMessageContext)
  if (context === undefined) {
    throw new Error('useUnreadMessage must be used within an UnreadMessageProvider')
  }
  return context
}