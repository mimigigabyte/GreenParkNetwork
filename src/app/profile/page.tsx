'use client'

import { useState } from 'react'
import { User, Shield, Heart, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BasicInfo from './components/basic-info'
import AccountSecurity from './components/account-security'
import Favorites from './components/favorites'

const tabs = [
  { id: 'profile', label: '基本信息', icon: User },
  { id: 'security', label: '账户安全', icon: Shield },
  { id: 'favorites', label: '我的收藏', icon: Heart },
]

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const router = useRouter()

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <BasicInfo />
      case 'security':
        return <AccountSecurity />
      case 'favorites':
        return <Favorites />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回主页
        </button>
      </div>
      <div className="flex flex-col md:flex-row md:space-x-8">
        <aside className="md:w-1/4 mb-8 md:mb-0">
          <h2 className="text-xl font-bold mb-4">个人中心</h2>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-2 text-left rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="md:w-3/4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}
