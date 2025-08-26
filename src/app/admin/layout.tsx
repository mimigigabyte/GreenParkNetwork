import { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/dashboard/sidebar'
import { AdminHeader } from '@/components/admin/dashboard/header'
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard'
import { AuthProvider } from '@/components/auth/auth-provider'

export const metadata: Metadata = {
  title: '管理员控制台 - 绿色技术平台',
  description: '绿色技术平台管理员控制台，管理基础数据、轮播图、企业信息和技术信息',
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthProvider>
      <AdminAuthGuard>
        <div className="min-h-screen bg-gray-50">
          {/* 顶部导航 */}
          <AdminHeader />
          
          <div className="flex pt-16">
            {/* 侧边栏 */}
            <AdminSidebar />
            
            {/* 主内容区域 */}
            <main className="flex-1 ml-64 p-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </AdminAuthGuard>
    </AuthProvider>
  )
}