'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { getTechnologyById } from '@/api/tech'
import { Share2, Heart, Phone } from 'lucide-react'
import { ContactUsModal } from '@/components/contact/contact-us-modal'

export default function MobileTechDetailPage({ params: { id } }: { params: { id: string } }) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [fav, setFav] = useState(false)

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
    <div className="pb-[120px]" style={{ backgroundColor: '#edeef7' }}>
      <div className="px-3">
      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {data.solutionImage ? (
          <Image src={data.solutionImage} alt={title} fill className="object-contain" sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>

      {/* Title + tags card */}
      <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="flex-1 min-w-0 text-[20px] font-semibold text-gray-900 leading-snug">
            {title}
          </h1>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.categoryName && (
            <span className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">{locale==='en'?(data.categoryNameEn||data.categoryName):data.categoryName}</span>
          )}
          {data.subCategoryName && (
            <span className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">{locale==='en'?(data.subCategoryNameEn||data.subCategoryName):data.subCategoryName}</span>
          )}
          {data.custom_label && (
            <span className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">{data.custom_label}</span>
          )}
          {data.countryName && (
            <span className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">
              {data.countryFlagUrl && <img src={data.countryFlagUrl} className="w-3.5 h-3.5 rounded-sm" alt="flag" />}
              <span>{locale==='en'?(data.countryNameEn||data.countryName):data.countryName}</span>
            </span>
          )}
          {data.provinceName && (
            <span className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">{locale==='en'?(data.provinceNameEn||data.provinceName):data.provinceName}</span>
          )}
          {data.developmentZoneName && (
            <span className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">{locale==='en'?(data.developmentZoneNameEn||data.developmentZoneName):data.developmentZoneName}</span>
          )}
        </div>
      </div>

      {/* Description card */}
      {desc && (
        <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-3">
          <h3 className="text-[14px] text-gray-900 font-semibold">{locale==='en'?'Description':'技术简介'}</h3>
          {(() => {
            const text = String(desc || '')
            const lines = text.split(/\r?\n/)
            const labelRe = /^(\s*(?:Description|Benefit\s+Types|Benefit\s+Details|Deployed\s+In|Technology\s+Readiness\s+Level|ID)\s*:|(?:技术描述|收益类型|收益描述|应用地区和国家|技术成熟度|ID)\s*：)/
            const frags: (string | JSX.Element)[] = []
            lines.forEach((line, idx) => {
              const m = line.match(labelRe)
              if (m) {
                const label = m[1]
                const rest = line.slice(label.length)
                frags.push(<strong key={`l-${idx}`}>{label.trim()}</strong>)
                frags.push(rest)
              } else {
                frags.push(line)
              }
              if (idx !== lines.length - 1) frags.push('\n')
            })
            return (
              <p className="mt-1 text-[13px] text-gray-700 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                {frags}
              </p>
            )
          })()}
        </div>
      )}

      {/* Attachments card */}
      {Array.isArray(data.attachmentUrls) && data.attachmentUrls.length>0 && (
        <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-3">
          <h3 className="text-[14px] text-gray-900 font-semibold mb-1">{locale==='en'?'Attachments':'技术资料'}</h3>
          <div className="space-y-2">
            {data.attachmentUrls.map((u: string, i: number) => (
              <div key={i} className="w-full rounded-xl border border-gray-200 bg-white text-[13px] text-gray-800 flex items-center justify-between px-3 h-11">
                <span className="truncate max-w-[60%]">{data.attachmentNames?.[i] || '技术资料'}</span>
                <div className="shrink-0 inline-flex items-center gap-3">
                  <a href={u} target="_blank" rel="noreferrer" className="text-[#2563eb] hover:underline">{locale==='en'?'Preview':'预览'}</a>
                  <a href={u} download className="text-[#00b899] hover:underline">{locale==='en'?'Download':'下载'}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company card */}
      <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-3">
        <h3 className="text-[14px] text-gray-900 font-semibold mb-2">{locale==='en'?'Company':'企业信息'}</h3>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded bg-white border border-gray-100 overflow-hidden">
            {data.companyLogoUrl ? (
              <Image src={data.companyLogoUrl} alt={data.companyName} fill className="object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-gray-900 truncate">{locale==='en'?(data.companyNameEn||data.companyName):data.companyName}</div>
            <div className="text-[12px] text-gray-600 truncate inline-flex items-center gap-1">
              {data.countryFlagUrl && <img src={data.countryFlagUrl} className="w-3.5 h-3.5 rounded-sm" alt="flag" />}
              <span className="truncate">{[data.countryName, data.provinceName, data.developmentZoneName].filter(Boolean).join(' · ')}</span>
            </div>
          </div>
        </div>
        {data.website_url && (
          <a href={data.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-[13px] text-[#2563eb] hover:underline break-all">
            {data.website_url}
          </a>
        )}
        <div className="mt-2 text-[12px] text-gray-500">
          <span>{locale==='en'?'Updated':'上传时间'}：{new Date(data.updateTime).toLocaleString(locale==='en'?'en-US':'zh-CN')}</span>
        </div>
      </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-t">
        <div className="mx-auto max-w-md px-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', paddingTop: 8 }}>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={()=>setFav(v=>!v)} className="h-10 rounded-xl bg-white border border-gray-200 text-gray-800 text-[13px] inline-flex items-center justify-center gap-1.5">
              <Heart className={`w-4 h-4 ${fav? 'fill-[#ef4444] stroke-[#ef4444]':'stroke-current'}`} />
              <span>{locale==='en'?'Favorite':'收藏'}</span>
            </button>
            <button onClick={async()=>{ if (navigator.share) { try { await navigator.share({ title, text: title, url: typeof window!=='undefined'?window.location.href:'' }) } catch {} } }} className="h-10 rounded-xl bg-white border border-gray-200 text-gray-800 text-[13px] inline-flex items-center justify-center gap-1.5">
              <Share2 className="w-4 h-4" />
              <span>{locale==='en'?'Share':'分享'}</span>
            </button>
            <button onClick={()=>setContactOpen(true)} className="h-10 rounded-xl bg-[#00b899] text-white text-[13px] inline-flex items-center justify-center gap-1.5">
              <Phone className="w-4 h-4" />
              <span>{locale==='en'?'Contact':'联系咨询'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contact modal */}
      <ContactUsModal isOpen={contactOpen} onClose={()=>setContactOpen(false)} technologyId={data.id} technologyName={title} companyName={data.companyName} locale={locale as any} />
    </div>
  )
}
