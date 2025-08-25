import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '个人中心 - 绿色技术平台 | Profile Center - Green Tech Platform',
  description: '个人中心，管理个人信息和账户设置 | Profile center for managing personal information and account settings',
}

interface ProfileLayoutProps {
  children: React.ReactNode
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}