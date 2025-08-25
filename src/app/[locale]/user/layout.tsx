import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { I18nUserSidebar } from '@/components/user/dashboard/i18n-sidebar';
import { I18nUserHeader } from '@/components/user/dashboard/i18n-header';

export const metadata: Metadata = {
  title: '用户控制台 - 绿色技术平台',
  description: '绿色技术平台用户控制台，管理企业信息和技术信息',
};

interface UserLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function UserLayout({ children, params }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <I18nUserHeader locale={params.locale} />
      
      <div className="flex pt-16">
        {/* 侧边栏 */}
        <I18nUserSidebar locale={params.locale} />
        
        {/* 主内容区域 */}
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}