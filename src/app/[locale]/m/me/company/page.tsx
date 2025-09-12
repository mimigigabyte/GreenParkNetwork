"use client"

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getUserCompanyInfo, submitCompanyProfile, type CompanyProfileData, getCountries, getProvinces, getEconomicZones } from '@/api/company'

type Option = { value: string; label: string; logo_url?: string }

export default function MobileCompanyInfoPage() {
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [countries, setCountries] = useState<Option[]>([])
  const [provinces, setProvinces] = useState<Option[]>([])
  const [zones, setZones] = useState<Option[]>([])

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
        const [cRes, info] = await Promise.all([getCountries(), getUserCompanyInfo()])
        if (!mounted) return
        if (cRes.success && Array.isArray(cRes.data)) {
          setCountries(cRes.data.map((c: any)=>({ value: c.code, label: locale==='en'?(c.name_en||c.name_zh):c.name_zh, logo_url: c.logo_url })))
        }
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
          // preload province/zone options when possible
          if (d.country?.code) {
            const pRes = await getProvinces(d.country.code)
            if (pRes.success) setProvinces(pRes.data.map((p:any)=>({ value:p.code, label: locale==='en'?(p.name_en||p.name_zh):p.name_zh })))
          }
          if (d.province?.code) {
            const zRes = await getEconomicZones(d.province.code)
            if (zRes.success) setZones(zRes.data.map((z:any)=>({ value:z.code, label: locale==='en'?(z.name_en||z.name_zh):z.name_zh })))
          }
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
    setProvinces([]); setZones([])
    if (code) {
      const res = await getProvinces(code)
      if (res.success) setProvinces(res.data.map((p:any)=>({ value:p.code, label: locale==='en'?(p.name_en||p.name_zh):p.name_zh })))
    }
  }

  const onProvinceChange = async (code: string) => {
    onChange('province', code)
    onChange('economicZone','')
    setZones([])
    if (code) {
      const res = await getEconomicZones(code)
      if (res.success) setZones(res.data.map((z:any)=>({ value:z.code, label: locale==='en'?(z.name_en||z.name_zh):z.name_zh })))
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName.trim()) { alert(locale==='en'?'Please enter company name':'请输入企业名称'); return }
    setSaving(true)
    try {
      const res = await submitCompanyProfile(form)
      if (res.success) alert(locale==='en'?'Saved successfully':'保存成功')
      else alert(res.error || (locale==='en'?'Save failed':'保存失败'))
    } finally { setSaving(false) }
  }

  return (
    <div className="px-3 py-3 pb-24" style={{ backgroundColor: '#edeef7' }}>
      <div className="rounded-2xl bg-white p-3 border border-gray-100">
        <h1 className="text-[16px] font-semibold text-gray-900 mb-3">{locale==='en'?'Company Information':'企业信息'}</h1>
        {loading ? (
          <div className="space-y-2">
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <Field label={locale==='en'?'Company Name':'企业名称'}>
              <input value={form.companyName} onChange={e=>onChange('companyName', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
            </Field>
            <Field label={locale==='en'?'Company Type':'企业类型'}>
              <input value={form.companyType} onChange={e=>onChange('companyType', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" placeholder={locale==='en'?'e.g. Private Enterprise':'例如：民营企业'} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={locale==='en'?'Country/Region':'国家/地区'}>
                <select value={form.country} onChange={e=>onCountryChange(e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px] bg-white">
                  <option value="">{locale==='en'?'Select':'选择'}</option>
                  {countries.map(c=> (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={locale==='en'?'Province/State':'省份'}>
                <select value={form.province} onChange={e=>onProvinceChange(e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px] bg-white" disabled={!form.country}>
                  <option value="">{locale==='en'?'Select':'选择'}</option>
                  {provinces.map(p=> (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={locale==='en'?'National Development Zone':'国家级经开区'}>
              <select value={form.economicZone} onChange={e=>onChange('economicZone', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px] bg-white" disabled={!form.province}>
                <option value="">{locale==='en'?'Select':'选择'}</option>
                {zones.map(z=> (
                  <option key={z.value} value={z.value}>{z.label}</option>
                ))}
              </select>
            </Field>
            <Field label={locale==='en'?'Address':'详细地址'}>
              <input value={form.address} onChange={e=>onChange('address', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={locale==='en'?'Industry Code':'行业代码'}>
                <input value={form.industryCode} onChange={e=>onChange('industryCode', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
              </Field>
              <Field label={locale==='en'?'Annual Output (100M CNY)':'年产值（亿元）'}>
                <input value={form.annualOutput} onChange={e=>onChange('annualOutput', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
            <Field label={locale==='en'?'Unified Social Credit Code':'统一社会信用代码'}>
              <input value={form.creditCode} onChange={e=>onChange('creditCode', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[14px]" />
            </Field>

            <button disabled={saving} className={`w-full h-10 rounded-xl ${saving?'bg-gray-300':'bg-[#00b899] hover:opacity-95'} text-white text-[14px]`}>
              {saving ? (locale==='en'?'Saving...':'保存中...') : (locale==='en'?'Save':'保存')}
            </button>
          </form>
        )}
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

