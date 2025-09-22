"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { wechatAuthApi } from '@/api/wechat'
import { useAuthContext } from '@/components/auth/auth-provider'

export default function WechatCallbackPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { checkUser } = useAuthContext()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  const [message, setMessage] = useState(locale === 'en' ? 'Signing in with WeChat...' : '正在通过微信登录...')

  useEffect(() => {
    const code = searchParams?.get('code') || ''
    const state = searchParams?.get('state') || ''
    if (!code) {
      setMessage(locale === 'en' ? 'Missing code parameter' : '缺少code参数')
      return
    }

    (async () => {
      try {
        const res = await wechatAuthApi.loginByCode({ code, state })
        if (res.success && res.data) {
          await checkUser()
          if (res.data.isNewUser) {
            router.replace(`/${locale}/m/company-profile`)
          } else {
            router.replace(`/${locale}/m/home`)
          }
        } else {
          setMessage(res.error || (locale === 'en' ? 'WeChat login failed' : '微信登录失败'))
        }
      } catch (e) {
        setMessage(locale === 'en' ? 'WeChat login failed' : '微信登录失败')
      }
    })()
  }, [searchParams, router, checkUser, locale])

  return (
    <section className="min-h-dvh flex items-center justify-center">
      <div className="text-sm text-gray-600">{message}</div>
    </section>
  )
}

