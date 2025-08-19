'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { AuthModal } from '../auth/auth-modal';
import { useAuthContext } from '../auth/auth-provider';
import { UserNav } from '../user/user-nav';
import { getUnreadInternalMessageCount } from '@/lib/supabase/contact-messages';

export function Header() {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, loading } = useAuthContext();

  // 加载未读消息数量
  useEffect(() => {
    if (user) {
      const loadUnreadCount = async () => {
        try {
          const count = await getUnreadInternalMessageCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('加载未读消息数量失败:', error);
        }
      };
      
      loadUnreadCount();
      
      // 设置定时刷新未读消息数量
      const interval = setInterval(loadUnreadCount, 30000); // 每30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo和标题 */}
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="relative">
              <Image
                src="/images/logo/绿盟logo.png"
                alt="绿色技术平台Logo"
                width={40}
                height={40}
                className="rounded-full object-cover"
                priority
                onError={(e) => {
                  // 如果图片加载失败，显示默认的绿色圆形Logo
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* 备用绿色圆形Logo */}
              <div className="hidden w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                国家级经开区绿色低碳技术推广平台
              </h1>
              <p className="text-xs text-gray-500">
                National Economic Development Zone Green Low-Carbon Technology Promotion Platform
              </p>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex items-center space-x-6">
            {/* 语言选择 */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>简体中文</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isLanguageDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      简体中文
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      English
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 用户功能链接 - 只在用户登录后显示 */}
            {user && (
              <>
                <Link 
                  href="/user/companies"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <span>控制台</span>
                </Link>
                
                <Link 
                  href="/user/messages"
                  className="relative flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* 登录/注册 */}
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : user ? (
              <UserNav user={user} />
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>登录/注册</span>
              </button>
            )}
          </nav>
        </div>
      </div>
      
      {/* 登录注册弹窗 */}
      {!user && <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />}
    </header>
  );
} 