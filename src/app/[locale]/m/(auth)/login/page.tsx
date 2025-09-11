'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { isValidEmail, isValidPhone, emailError, phoneError } from '@/lib/validators'
import { authApi } from '@/api/auth'
import { customAuthApi } from '@/api/customAuth'
import { tencentSmsAuthApi } from '@/api/tencentSmsAuth'
import { useAuthContext } from '@/components/auth/auth-provider'

export default function MobileLoginPage() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('auth')
  const { checkUser } = useAuthContext()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  // 0 = 验证码登录，1 = 密码登录
  const [tab, setTab] = useState<0 | 1>(0)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const goAfterLogin = () => router.replace(`/${locale}/m/console`)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!account || !password) {
      alert(locale === 'en' ? 'Please fill account and password' : '请填写账号和密码')
      return
    }
    const type = isValidEmail(account) ? 'email' : 'phone'
    if (type === 'email') {
      if (!isValidEmail(account)) { alert(emailError(locale as any)); return }
    } else {
      if (!isValidPhone(account, '+86')) { alert(phoneError(locale as any)); return }
    }
    setLoading(true)
    try {
      let ok = false
      if (type === 'phone') {
        try {
          const r = await customAuthApi.phoneLogin({ phone: account, password, countryCode: '+86' })
          if (r.success && r.data) ok = true
        } catch {}
      }
      if (!ok) {
        const r = await authApi.passwordLogin({ account, password, type })
        if (r.success && 'data' in r && r.data) {
          localStorage.setItem('access_token', r.data.token)
          if (r.data.refreshToken) localStorage.setItem('refresh_token', r.data.refreshToken)
          ok = true
        } else if ('error' in r) {
          alert(r.error)
        }
      }
      if (ok) { await checkUser(); alert(locale==='en'?'Login successful':'登录成功'); goAfterLogin() }
      else { alert(locale==='en'?'Login failed, please check your account and password':'登录失败，请检查账号与密码') }
    } finally { setLoading(false) }
  }

  async function handleSendCode() {
    if (!isValidPhone(phone, '+86')) { alert(phoneError(locale as any)); return }
    setSending(true)
    try {
      const r = await tencentSmsAuthApi.sendPhoneCode({ phone, purpose: 'login', countryCode: '+86' })
      if (r.success) {
        setCountdown(60)
        const timer = setInterval(() => setCountdown(p => { if (p <= 1) { clearInterval(timer); return 0 } return p - 1 }), 1000)
      } else { alert(r.error || (locale==='en'?'Failed to send code':'发送验证码失败')) }
    } finally { setSending(false) }
  }

  async function handleSmsLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(phone, '+86')) { alert(phoneError(locale as any)); return }
    if (!code) { alert(locale==='en'?'Please enter verification code':'请输入验证码'); return }
    setLoading(true)
    try {
      const r = await tencentSmsAuthApi.phoneCodeLogin({ phone, code, countryCode: '+86' })
      if (r.success && r.data) {
        localStorage.setItem('access_token', r.data.token)
        if (r.data.refreshToken) localStorage.setItem('refresh_token', r.data.refreshToken)
        await checkUser(); alert(locale==='en'?'Login successful':'登录成功'); goAfterLogin()
      } else { alert(r.error || (locale==='en'?'Login failed':'登录失败')) }
    } finally { setLoading(false) }
  }

  return (
    <section className="min-h-dvh flex flex-col bg-[radial-gradient(120%_60%_at_50%_-10%,#e9e7ff_0%,#ffffff_60%)]">
      {/* 顶部 Logo 与标题（更紧凑） */}
      <div className="px-4 pt-6 pb-4 text-center">
        <div className="mx-auto w-12 h-12 relative rounded-md overflow-hidden shadow-sm">
          <Image src="/images/logo/绿盟logo.png" alt="logo" fill className="object-contain" />
        </div>
        <h1 className="mt-2 text-[13px] font-medium text-gray-900">国家级经开区绿色技术产品推广平台</h1>
      </div>

      {/* 卡片容器（375 视觉基线，紧凑尺寸） */}
      <div className="px-3">
        <div className="mx-auto w-full max-w-[360px] rounded-[18px] bg-white p-4 shadow-sm border">
          {/* Tabs：左 验证码登录 右 密码登录 */}
          <div className="mb-3 grid grid-cols-2 bg-[#f5f6ff] rounded-full p-0.5">
            <button onClick={() => setTab(0)} className={`h-9 rounded-full text-[13px] font-medium ${tab===0?'bg-white text-gray-900 shadow':'text-gray-500'}`}>验证码登录</button>
            <button onClick={() => setTab(1)} className={`h-9 rounded-full text-[13px] font-medium ${tab===1?'bg-white text-gray-900 shadow':'text-gray-500'}`}>密码登录</button>
          </div>

          {tab === 1 ? (
            <form className="space-y-3" onSubmit={handlePasswordLogin}>
              <input type="text" value={account} onChange={(e)=>setAccount(e.target.value)} placeholder={locale==='en'?'Phone / Email':'手机号 / 邮箱'} className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#00b899] outline-none text-[14px]" />
              <div className="relative">
                <input type={showPassword?'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder={locale==='en'?'Password':'密码'} className="w-full h-11 px-3 pr-9 rounded-xl bg-gray-50 border border-transparent focus:border-[#00b899] outline-none text-[14px]" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" onClick={()=>setShowPassword(v=>!v)} aria-label="toggle password">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
              </div>
              <button type="submit" disabled={loading} className={`w-full h-11 rounded-xl text-white font-medium text-[14px] ${loading?'bg-gray-400':'bg-[#00b899] hover:bg-[#009a7a] active:opacity-90'}`}>登录</button>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={handleSmsLogin}>
              <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder={locale==='en'?'Phone number':'输入手机号'} className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#00b899] outline-none text-[14px]" />
              <div className="flex items-center gap-2">
                <input type="text" value={code} onChange={(e)=>setCode(e.target.value)} placeholder={locale==='en'?'6-digit code':'6位短信验证码'} className="flex-1 h-11 px-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#00b899] outline-none text-[14px]" />
                <button type="button" onClick={handleSendCode} disabled={sending||countdown>0||!isValidPhone(phone,'+86')} className={`h-11 px-3 rounded-xl border text-[13px] ${sending||countdown>0?'text-gray-400 border-gray-200 bg-gray-100':'text-[#6b6ee2] border-[#d7d8fb] bg-[#eef0ff]'}`}>{countdown>0?`${countdown}s`:'发送验证码'}</button>
              </div>
              <button type="submit" disabled={loading} className={`w-full h-11 rounded-xl text-white font-medium text-[14px] ${loading?'bg-gray-400':'bg-[#00b899] hover:bg-[#009a7a] active:opacity-90'}`}>登录</button>
            </form>
          )}

          {/* 微信登录 */}
          <div className="mt-5 text-center">
            <button type="button" className="inline-flex items-center gap-2 text-gray-700 text-[14px]">
              <img src="/images/icons/wechat-icon.png" alt="wechat" className="w-4 h-4"/>
              <span>微信登录</span>
            </button>
          </div>

          {/* 协议 */}
          <div className="mt-4 text-[12px] text-gray-500 text-center pb-[env(safe-area-inset-bottom)]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#6b6ee2] w-3.5 h-3.5 rounded"/>
              <span>
                我已阅读并同意
                <a href="/terms-of-service" target="_blank" className="mx-1 text-[#6b6ee2] underline">《用户协议》</a>
                <a href="/privacy-policy" target="_blank" className="text-[#6b6ee2] underline">《隐私政策》</a>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-auto py-4 text-center text-[11px] text-gray-400">© {new Date().getFullYear()} — Green Tech Platform</div>
    </section>
  )
}
