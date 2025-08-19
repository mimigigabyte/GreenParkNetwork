'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthContext } from '../auth/auth-provider'
import { User as UserIcon } from 'lucide-react';
import type { User } from '@/types';

interface UserNavProps {
  user: User
}

export function UserNav({ user }: UserNavProps) {
  const { logout } = useAuthContext()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      // 退出登录后跳转到首页
      window.location.href = '/'
    } catch (error) {
      console.error('登出失败:', error)
      // 即使登出失败也跳转到首页
      window.location.href = '/'
    }
  }

  // 获取用户名（邮箱或手机号）
  const getUserName = () => {
    return user.email || user.phone || user.name || 'User'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
      >
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-green-600" />
        </div>
        <span className="text-sm text-gray-700 font-medium max-w-32 truncate">
          {getUserName()}
        </span>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900">{user.company_name || user.name || 'User'}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              个人中心
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
