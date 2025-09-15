"use client"

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getUserCompanyInfo, submitCompanyProfile, type CompanyProfileData } from '@/api/company'
import { isValidEmail, isValidPhone, emailError, phoneError } from '@/lib/validators'
import { I18nCompactImageUpload } from '@/components/ui/i18n-compact-image-upload'
import { ArrowLeft } from 'lucide-react'
import { useFilterData, transformFilterDataForComponents } from '@/hooks/admin/use-filter-data'
import { COMPANY_TYPE_OPTIONS } from '@/lib/types/admin'

type Option = { value: string; label: string; logo_url?: string }

export default function MobileCompanyInfoPage() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { data: fd, isLoading: fdLoading, loadProvinces, loadDevelopmentZones, refetch } = useFilterData()
  const transformed = useMemo(() => transformFilterDataForComponents(fd, locale), [fd, locale])

  const [form, setForm] = useState<CompanyProfileData>({
    companyName: '',
    logoUrl: '',
    country: '',
    province: '',
    economicZone: '',
    companyType: '',
    address: '',
    industryCode: '',
    annualOutput: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    creditCode: ''
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const info = await getUserCompanyInfo()
        if (!mounted) return
        if (info.success && info.data) {
          const d = info.data
          setForm(prev => ({
            ...prev,
            companyName: d.name_zh || '',
            logoUrl: d.logo_url || '',
            country: d.country?.code || '',
            province: d.province?.code || '',
            economicZone: d.development_zone?.code || '',
            companyType: d.company_type || '',
            address: d.address || '',
            industryCode: d.industry_code || '',
            annualOutput: d.annual_output_value ? String(d.annual_output_value) : '',
            contactPerson: d.contact_person || '',
            contactPhone: d.contact_phone || '',
            contactEmail: d.contact_email || '',
            creditCode: d.credit_code || ''
          }))
          // provinces/zones will be preloaded in next effect when fd is ready
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [locale])

  const onChange = (k: keyof CompanyProfileData, v: string) => setForm(f => ({ ...f, [k]: v }))

  const onCountryChange = async (code: string) => {
    onChange('country', code)
    onChange('province','')
    onChange('economicZone','')
    if (code) {
      const countryId = (fd.countries || []).find(c=>c.code===code)?.id
      if (countryId) await loadProvinces(countryId)
    }
  }

  const onProvinceChange = async (code: string) => {
    onChange('province', code)
    onChange('economicZone','')
    if (code) {
      const provinceId = (fd.provinces || []).find(p=>p.code===code)?.id
      if (provinceId) await loadDevelopmentZones(provinceId)
    }
  }

  // Preload provinces/zones with IDs once fd is ready and form has codes
  useEffect(() => {
    (async () => {
      if (fdLoading) return
      if (form.country) {
        const countryId = (fd.countries || []).find(c=>c.code===form.country)?.id
        if (countryId) await loadProvinces(countryId)
      }
      if (form.province) {
        const provinceId = (fd.provinces || []).find(p=>p.code===form.province)?.id
        if (provinceId) await loadDevelopmentZones(provinceId)
      }
    })()
  }, [fdLoading])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName.trim()) { alert(locale==='en'?'Please enter company name':'请输入企业名称'); return }
    // 校验：国家为中国时必须选择省份
    if (form.country === 'china' && !form.province) { alert(locale==='en'?'Please select a province':'请选择省份'); return }
    // 校验：邮箱/电话格式
    if (form.contactEmail && !isValidEmail(form.contactEmail)) { alert(emailError(locale as any)); return }
    if (form.contactPhone && !isValidPhone(form.contactPhone, '+86')) { alert(phoneError(locale as any)); return }
    setSaving(true)
    try {
      const res = await submitCompanyProfile(form)
      if (res.success) alert(locale==='en'?'Saved successfully':'保存成功')
      else alert(res.error || (locale==='en'?'Save failed':'保存失败'))
    } finally { setSaving(false) }
  }

  return (
    <div className="px-3 py-3 pb-24" style={{ backgroundColor: '#edeef7' }}>
      <h1 className="sr-only">{locale==='en'?'Company Information':'企业信息'}</h1>
      <form onSubmit={onSubmit} className="space-y-3">
      {/* 企业基本信息 */}
      <div className="rounded-2xl bg-white p-3 border border-gray-100">
        <div className="mb-2 flex items-center gap-2">
          <button onClick={()=>router.back()} aria-label={locale==='en'?'Back':'返回'} className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 inline-flex items-center justify-center active:scale-95">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[16px] font-semibold text-gray-900">{locale==='en'?'Basic Info':'企业基本信息'}</h2>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        ) : (
          <>
            <Field label={locale==='en'?'Company Name':'企业名称'}>
              <input value={form.companyName} onChange={e=>onChange('companyName', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
            </Field>
            <Field label={locale==='en'?'Company Logo':'企业Logo'}>
              <I18nCompactImageUpload value={form.logoUrl} onChange={(url)=>onChange('logoUrl', url)} locale={locale as any} bucket="images" folder="company-logos" />
            </Field>
          </>
        )}
      </div>

      {/* 地址信息 */}
      <div className="mt-3 rounded-2xl bg-white p-3 border border-gray-100">
        <h2 className="text-[16px] font-semibold text-gray-900 mb-2">{locale==='en'?'Address':'地址信息'}</h2>
            <div className="grid grid-cols-2 gap-x-2 gap-y-4">
          <Field label={locale==='en'?'Country/Region':'国家/地区'}>
            <select value={form.country} onChange={e=>onCountryChange(e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px] bg-white">
              <option value="">{locale==='en'?'Select':'选择'}</option>
              {(transformed.countries||[]).map(c=> (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label={locale==='en'?'Province/State':'省份'}>
            <select value={form.province} onChange={e=>onProvinceChange(e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px] bg-white" disabled={!form.country}>
              <option value="">{locale==='en'?'Select':'选择'}</option>
              {(transformed.provinces||[]).map(p=> (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={locale==='en'?'National Development Zone':'国家级经开区'}>
          <select value={form.economicZone} onChange={e=>onChange('economicZone', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px] bg-white" disabled={!form.province}>
            <option value="">{locale==='en'?'Select':'选择'}</option>
            {(transformed.developmentZones||[]).map(z=> (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>
        </Field>
        <Field label={locale==='en'?'Address':'详细地址'}>
          <input value={form.address} onChange={e=>onChange('address', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
        </Field>
      </div>

      {/* 企业详情 */}
      <div className="mt-3 rounded-2xl bg-white p-3 border border-gray-100">
        <h2 className="text-[16px] font-semibold text-gray-900 mb-2">{locale==='en'?'Company Details':'企业详情'}</h2>
        <Field label={locale==='en'?'Company Nature':'企业性质'}>
          <select value={form.companyType} onChange={e=>onChange('companyType', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px] bg-white">
            <option value="">{locale==='en'?'Select':'选择'}</option>
            {COMPANY_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{locale==='en'? opt.label_en : opt.label_zh}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-x-2 gap-y-4">
          <Field label={locale==='en'?'Industry Code':'行业代码'}>
            <input value={form.industryCode} onChange={e=>onChange('industryCode', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
          </Field>
          <Field label={locale==='en'?'Annual Output (100M CNY)':'工业总产值（亿元）'}>
            <input value={form.annualOutput} onChange={e=>onChange('annualOutput', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
          </Field>
        </div>
      </div>

      {/* 联系人信息 */}
      <div className="mt-3 rounded-2xl bg-white p-3 border border-gray-100">
        <h2 className="text-[16px] font-semibold text-gray-900 mb-2">{locale==='en'?'Contact':'联系人信息'}</h2>
        <div className="grid grid-cols-2 gap-x-2 gap-y-4">
          <Field label={locale==='en'?'Contact Person':'联系人'}>
            <input value={form.contactPerson} onChange={e=>onChange('contactPerson', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
          </Field>
          <Field label={locale==='en'?'Phone':'联系电话'}>
            <input value={form.contactPhone} onChange={e=>onChange('contactPhone', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
          </Field>
        </div>
        <Field label={locale==='en'?'Email':'联系邮箱'}>
          <input value={form.contactEmail} onChange={e=>onChange('contactEmail', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
        </Field>
      </div>

      {/* 提交按钮 */}
      <div className="mt-3">
        <button type="submit" disabled={saving} className={`w-full h-10 rounded-xl ${saving?'bg-gray-300':'bg-[#00b899] hover:opacity-95'} text-white text-[14px]`}>
          {saving ? (locale==='en'?'Saving...':'保存中...') : (locale==='en'?'Save':'保存')}
        </button>
      </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <div className="mb-1.5 text-[12px] text-gray-600">{label}</div>
      {children}
    </label>
  )
}
