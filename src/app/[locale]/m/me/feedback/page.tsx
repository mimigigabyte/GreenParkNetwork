"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/auth/auth-provider'
import { createContactMessage } from '@/lib/supabase/contact-messages'
import { ArrowLeft } from 'lucide-react'

export default function MobileFeedbackPage() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'
  const { user } = useAuthContext()

  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)

  const toNullable = (value?: string | null) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert(locale === 'en' ? 'Please login first' : '请先登录')
      return
    }
    if (!form.message.trim()) {
      setMessageError(locale === 'en' ? 'Feedback content is required' : '反馈内容为必填项')
      return
    }
    setMessageError(null)
    setSubmitting(true)
    try {
      const contactName = toNullable(form.name) ?? toNullable(user?.name ?? null)
      const contactPhone = toNullable(form.phone) ?? toNullable(user?.phone ?? null)
      const contactEmail = toNullable(form.email) ?? toNullable(user?.email ?? null)

      await createContactMessage({
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        message: form.message.trim(),
        category: '用户反馈' // 明确标记为用户反馈
      })
      alert(locale==='en'?'Submitted successfully':'提交成功')
      setForm({ name: '', phone: '', email: '', message: '' })
      setMessageError(null)
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
        <div className="mb-2 flex items-center gap-2">
          <button onClick={()=>router.back()} aria-label={locale==='en'?'Back':'返回'} className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 inline-flex items-center justify-center active:scale-95">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[16px] font-semibold text-gray-900">{locale==='en'?'Feedback':'问题反馈'}</h2>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label={locale==='en'?'Name (optional)':'姓名（可选）'}>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={locale==='en'?'Phone (optional)':'电话（可选）'}>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
            </Field>
            <Field label={locale==='en'?'Email (optional)':'邮箱（可选）'}>
              <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
            </Field>
          </div>
          <Field
            label={locale==='en'?'Feedback Content':'反馈内容'}
            required
            requiredLabel={locale==='en'?'(required)':'（必填）'}
            error={messageError}
          >
            <textarea
              value={form.message}
              onChange={e=>{
                const nextValue = e.target.value
                setForm(f=>({...f,message:nextValue}))
                if (messageError && nextValue.trim()) {
                  setMessageError(null)
                }
              }}
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[14px]"
            />
          </Field>
          <button disabled={submitting} className={`w-full h-10 rounded-xl ${submitting?'bg-gray-300':'bg-[#00b899] hover:opacity-95'} text-white text-[14px]`}>
            {submitting ? (locale==='en'?'Submitting...':'提交中...') : (locale==='en'?'Submit':'提交')}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children, required, requiredLabel, error }: { label: string; children: React.ReactNode; required?: boolean; requiredLabel?: string; error?: string | null }) {
  const labelColor = required ? 'text-red-500' : 'text-gray-600'
  return (
    <label className="block">
      <div className={`mb-1 text-[12px] ${labelColor}`}>
        {label}
        {required && <span className="ml-1 text-red-500">{requiredLabel || '(required)'}</span>}
      </div>
      {children}
      {error && <div className="mt-1 text-[12px] text-red-500">{error}</div>}
    </label>
  )
}
