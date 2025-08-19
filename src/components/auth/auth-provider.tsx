"use client"

import React, { createContext, useContext } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  checkUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, checkUser } = useAuth()

  return (
    <AuthContext.Provider value={{ user, loading, logout, checkUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}