"use client"

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthContext } from '@/components/auth/auth-provider'
import { createContactMessage } from '@/lib/supabase/contact-messages'

export default function MobileFeedbackPage() {
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'
  const { user } = useAuthContext()

  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { alert(locale==='en'?'Please login first':'请先登录'); return }
    if (!form.message.trim()) { alert(locale==='en'?'Please enter message':'请输入反馈内容'); return }
    setSubmitting(true)
    try {
      await createContactMessage({
        contact_name: form.name || (user.name || 'User'),
        contact_phone: form.phone || (user.phone || ''),
        contact_email: form.email || (user.email || ''),
        message: form.message
      })
      alert(locale==='en'?'Submitted successfully':'提交成功')
      setForm({ name: '', phone: '', email: '', message: '' })
    } catch (err) {
      console.error(err)
      alert(locale==='en'?'Submit failed':'提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-3 py-3 pb-20" style={{ backgroundColor: '#edeef7' }}>
      <div className="rounded-2xl bg-white p-3 border border-gray-100">
        <h1 className="text-[16px] font-semibold text-gray-900 mb-2">{locale==='en'?'Feedback':'问题反馈'}</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label={locale==='en'?'Name(optional)':'姓名（可选）'}>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={locale==='en'?'Phone(optional)':'电话（可选）'}>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
            </Field>
            <Field label={locale==='en'?'Email(optional)':'邮箱（可选）'}>
              <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
            </Field>
          </div>
          <Field label={locale==='en'?'Message':'反馈内容'}>
            <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={6} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[14px]" />
          </Field>
          <button disabled={submitting} className={`w-full h-10 rounded-xl ${submitting?'bg-gray-300':'bg-[#00b899] hover:opacity-95'} text-white text-[14px]`}>
            {submitting ? (locale==='en'?'Submitting...':'提交中...') : (locale==='en'?'Submit':'提交')}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[12px] text-gray-600">{label}</div>
      {children}
    </label>
  )
}

