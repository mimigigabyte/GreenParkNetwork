'use client'

import { useRouter } from 'next/navigation'

export default function MobileLoginPage() {
  const router = useRouter()
  return (
    <section className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-3">移动端 · 登录</h1>
      <p className="text-gray-600 text-sm mb-4">这里接入现有登录接口与校验逻辑（短信/邮箱）。</p>
      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={() => router.push('/')}
      >
        返回首页
      </button>
    </section>
  )
}

