'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { getTechnologyById } from '@/api/tech'
import { ContactUsModal } from '@/components/contact/contact-us-modal'

export default function MobileTechDetailPage({ params: { id } }: { params: { id: string } }) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await getTechnologyById(id)
      if (!mounted) return
      if (res.success) setData(res.data)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="px-3 py-6">
        <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />
        <div className="mt-3 h-6 w-2/3 bg-gray-100 rounded animate-pulse" />
        <div className="mt-2 h-4 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-3 py-10 text-center text-gray-500">
        {locale==='en' ? 'Technology not found' : '未找到该技术'}
      </div>
    )
  }

  const title = locale==='en' ? (data.solutionTitleEn || data.solutionTitle) : data.solutionTitle
  const desc = locale==='en' ? (data.solutionDescriptionEn || data.fullDescriptionEn || '') : (data.solutionDescription || data.fullDescription || '')

  return (
    <div className="px-3 pb-24">
      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {data.solutionImage ? (
          <Image src={data.solutionImage} alt={title} fill className="object-contain" sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>

      {/* Title + actions */}
      <div className="mt-3 flex items-start justify-between gap-2">
        <h1 className="flex-1 min-w-0 text-[18px] font-semibold text-gray-900 leading-snug">{title}</h1>
        <button
          onClick={()=>setContactOpen(true)}
          className="shrink-0 px-3 h-8 rounded-full bg-[#00b899] text-white text-[12px]"
        >
          {locale==='en'?'Contact':'联系咨询'}
        </button>
      </div>

      {/* Meta tags */}
      <div className="mt-2 flex flex-wrap gap-2">
        {data.categoryName && (
          <span className="px-2.5 h-7 inline-flex items-center rounded-full border text-[11px] text-[#2f6fde] border-[#bfdbfe] bg-white">{locale==='en'?(data.categoryNameEn||data.categoryName):data.categoryName}</span>
        )}
        {data.subCategoryName && (
          <span className="px-2.5 h-7 inline-flex items-center rounded-full border text-[11px] text-[#4b50d4] border-[#c7d2fe] bg-white">{locale==='en'?(data.subCategoryNameEn||data.subCategoryName):data.subCategoryName}</span>
        )}
        {data.custom_label && (
          <span className="px-2.5 h-7 inline-flex items-center rounded-full border text-[11px] text-[#007f66] border-[#a7f3d0] bg-[#ecfdf5]">{data.custom_label}</span>
        )}
      </div>

      {/* Description */}
      {desc && (
        <div className="mt-3">
          <h3 className="text-[13px] text-gray-900 font-medium">{locale==='en'?'Description':'技术简介'}</h3>
          <p className="mt-1 text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{desc}</p>
        </div>
      )}

      {/* Links */}
      {(data.website_url || (data.attachmentUrls && data.attachmentUrls.length>0)) && (
        <div className="mt-3 space-y-2">
          {data.website_url && (
            <a href={data.website_url} target="_blank" rel="noreferrer" className="block w-full h-10 rounded-xl border border-gray-200 bg-white text-[13px] text-[#2563eb] hover:bg-blue-50 flex items-center justify-between px-3">
              <span>{locale==='en'?'Website':'技术网址'}</span>
              <span className="truncate max-w-[60%]">{data.website_url}</span>
            </a>
          )}
          {Array.isArray(data.attachmentUrls) && data.attachmentUrls.length>0 && (
            <div>
              <div className="text-[13px] text-gray-900 font-medium mb-1">{locale==='en'?'Attachments':'技术资料'}</div>
              <div className="space-y-2">
                {data.attachmentUrls.map((u: string, i: number) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="block w-full h-10 rounded-xl border border-gray-200 bg-white text-[13px] text-gray-800 hover:bg-gray-50 flex items-center justify-between px-3">
                    <span className="truncate max-w-[80%]">{data.attachmentNames?.[i] || '技术资料'}</span>
                    <span className="text-[#00b899]">{locale==='en'?'Download':'下载'}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Company */}
      <div className="mt-4 p-3 rounded-2xl bg-white border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded bg-white border border-gray-100 overflow-hidden">
            {data.companyLogoUrl ? (
              <Image src={data.companyLogoUrl} alt={data.companyName} fill className="object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-gray-900 truncate">{locale==='en'?(data.companyNameEn||data.companyName):data.companyName}</div>
            {(data.countryName || data.developmentZoneName) && (
              <div className="text-[12px] text-gray-600 truncate">
                {[data.countryName, data.developmentZoneName].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-3 text-[12px] text-gray-500">
        <span>{locale==='en'?'Updated':'上传时间'}：{new Date(data.updateTime).toLocaleString(locale==='en'?'en-US':'zh-CN')}</span>
      </div>

      {/* Contact modal */}
      <ContactUsModal isOpen={contactOpen} onClose={()=>setContactOpen(false)} technologyId={data.id} technologyName={title} companyName={data.companyName} locale={locale as any} />
    </div>
  )
}

