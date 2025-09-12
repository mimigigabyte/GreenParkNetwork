"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/auth/auth-provider'
import { User, Shield, Heart, MessageSquare, LogOut, ChevronRight, Crown } from 'lucide-react'

export default function MobileMePage() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthContext()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  const displayName = user?.name || user?.email || user?.phone || (locale==='en'?'Guest':'访客')
  const initial = displayName?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="pb-20" style={{ backgroundColor: '#edeef7' }}>
      <div className="px-3 pt-4">
        {/* Header card — themed green gradient, no border frame */}
        <div className="rounded-3xl bg-gradient-to-br from-[#10b981] to-[#059669] px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center text-[18px] font-semibold text-[#007f66] shadow">
              {initial}
            </div>
            <div className="min-w-0 text-white">
              <div className="text-[18px] font-semibold truncate">{displayName}</div>
              <div className="text-[12px] opacity-90 truncate">{user?.phone || user?.email || (locale==='en'?'Not bound':'未绑定')}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-[12px] opacity-95">
                <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-white/20">{locale==='en'?'Elite Customer':'尊享用户'} <Crown className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Options as individual rounded tiles */}
        <div className="mt-7 space-y-3">
          <OptionTile icon={<User className="w-5 h-5" />} label={locale==='en'?'Basic Info':'基本信息'} onClick={()=>router.push(`${locale==='en'?'/en':'/zh'}/m/me/basic`)} />
          <OptionTile icon={<Shield className="w-5 h-5" />} label={locale==='en'?'Account Security':'账户安全'} onClick={()=>router.push(`${locale==='en'?'/en':'/zh'}/m/me/security`)} />
          <OptionTile icon={<Heart className="w-5 h-5" />} label={locale==='en'?'My Favorites':'我的收藏'} onClick={()=>router.push(`${locale==='en'?'/en':'/zh'}/m/me/favorites`)} />
          <OptionTile icon={<MessageSquare className="w-5 h-5" />} label={locale==='en'?'Feedback':'问题反馈'} onClick={()=>router.push(`${locale==='en'?'/en':'/zh'}/m/me/feedback`)} />
          <OptionTile icon={<LogOut className="w-5 h-5" />} label={locale==='en'?'Sign Out':'退出登录'} danger onClick={async()=>{ try { await logout(); router.push(`${locale==='en'?'/en':'/zh'}/m/login`) } catch { router.push(`${locale==='en'?'/en':'/zh'}/m/login`) } }} />
        </div>
      </div>
    </div>
  )
}

function OptionTile({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick?: ()=>void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full px-4 h-[56px] rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 flex items-center justify-between ${danger? 'text-red-600':'text-gray-900'} active:scale-[0.99] transition`}>
      <span className="inline-flex items-center gap-3">
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${danger? 'bg-red-50 text-red-600':'bg-[#e6fffa] text-[#00b899]'} shadow-sm`}>{icon}</span>
        <span className="text-[14px] font-medium">{label}</span>
      </span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  )
}
