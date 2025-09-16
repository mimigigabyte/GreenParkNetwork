"use client"

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getUserTechnologyByIdApi, deleteUserTechnologyApi } from '@/lib/api/user-technologies'
import type { AdminTechnology, TechReviewStatus } from '@/lib/types/admin'
import { TECH_REVIEW_STATUS_OPTIONS, TECH_SOURCE_OPTIONS } from '@/lib/types/admin'
import { ArrowLeft, Image as ImageIcon, Tag, Link as LinkIcon, FileText, Trash2, Edit as EditIcon } from 'lucide-react'
import { useAuthContext } from '@/components/auth/auth-provider'
import { UserTechnologyForm } from '@/app/[locale]/user/technologies/components/user-technology-form'

export default function MobileMyTechDetailPage({ params: { id } }: { params: { id: string } }) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'
  const { user } = useAuthContext()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AdminTechnology | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await getUserTechnologyByIdApi(id)
        if (!mounted) return
        setData(res)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const getStatusLabel = (status?: TechReviewStatus) => {
    const option = TECH_REVIEW_STATUS_OPTIONS.find(o=>o.value===status)
    return locale==='en' ? (option?.label_en || 'Unknown') : (option?.label_zh || '未知')
  }
  const getStatusClass = (status?: TechReviewStatus) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'pending_review': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const getSourceLabel = (src?: string) => {
    const option = TECH_SOURCE_OPTIONS.find(o=>o.value===src)
    return locale==='en' ? (option?.label_en || 'Unknown') : (option?.label_zh || '未知')
  }

  // Always compute attachments hook to keep hooks order stable across renders
  const attachments: Array<{ url: string; filename?: string }> = useMemo(() => {
    const d: any = data
    if (d?.attachments && Array.isArray(d.attachments) && d.attachments.length) return d.attachments as any
    if (d?.attachment_urls && Array.isArray(d.attachment_urls) && d.attachment_urls.length) return d.attachment_urls.map((u: string)=>({ url: u }))
    return []
  }, [data])

  if (loading) {
    return (
      <div className="px-3 py-6">
        <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="mt-3 h-6 w-2/3 bg-gray-100 rounded animate-pulse" />
        <div className="mt-2 h-4 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-3 py-10 text-center text-gray-500">
        {locale==='en'?'Technology not found':'未找到该技术'}
      </div>
    )
  }

  const name = locale==='en' ? (data.name_en || data.name_zh) : data.name_zh
  const nameEn = data.name_en || ''
  const descZh = data.description_zh || ''
  const descEn = data.description_en || ''
  const website = data.website_url || ''
  const createdAt = data.created_at ? new Date(data.created_at).toLocaleString(locale==='en'?'en-US':'zh-CN') : ''

  const catName = locale==='en' ? (data.category?.name_en || data.category?.name_zh || '') : (data.category?.name_zh || '')
  const subName = locale==='en' ? (data.subcategory?.name_en || data.subcategory?.name_zh || '') : (data.subcategory?.name_zh || '')

  // attachments is computed above to ensure consistent hooks order

  const baseLocale = locale === 'en' ? '/en' : '/zh'

  const handleDelete = async () => {
    if (!user?.id || !data?.id || deleting) return
    const ok = confirm(locale==='en' ? 'Are you sure to delete this technology?' : '确定要删除该技术吗？')
    if (!ok) return
    setDeleting(true)
    try {
      await deleteUserTechnologyApi(data.id, user.id)
      alert(locale==='en' ? 'Deleted successfully' : '删除成功')
      router.replace(`${baseLocale}/m/me/technologies`)
    } catch (e:any) {
      alert((locale==='en' ? 'Delete failed: ' : '删除失败：') + (e?.message || ''))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="pb-20" style={{ backgroundColor: '#edeef7' }}>
      <div className="px-3 mt-3">
        {/* Card 1: Image */}
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
          {data.image_url ? (
            <div className="w-full aspect-[16/9] bg-cover bg-center" style={{ backgroundImage: `url(${data.image_url})` }} />
          ) : (
            <div className="w-full aspect-[16/9] bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-gray-400" />
            </div>
          )}
        </div>

        {/* Card 2: Meta */}
        <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-gray-900 leading-snug">{name}</div>
              {nameEn && nameEn !== name && (
                <div className="text-[12px] text-gray-500 mt-0.5 break-all">{nameEn}</div>
              )}
            </div>
            <span className={`shrink-0 inline-flex px-2 py-1 text-[11px] font-semibold rounded-full ${getStatusClass(data.review_status)}`}>
              {getStatusLabel(data.review_status)}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{locale==='en'?'Source':'技术来源'}：</span>
              <span>{getSourceLabel(data.tech_source)}</span>
            </div>
            {website && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#2563eb]" />
                <a href={website} target="_blank" rel="noreferrer" className="text-[#2563eb] break-all underline-offset-2 hover:underline">{website}</a>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {catName && (
                <span className="inline-flex items-center px-2 py-1 text-[11px] rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white"><Tag className="w-3 h-3 mr-1" />{catName}</span>
              )}
              {subName && (
                <span className="inline-flex items-center px-2 py-1 text-[11px] rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white">{subName}</span>
              )}
              {data.custom_label && (
                <span className="inline-flex items-center px-2 py-1 text-[11px] rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white">{data.custom_label}</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Descriptions */}
        <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-3">
          <h3 className="text-[14px] font-semibold text-gray-900">{locale==='en'?'Technology Description':'技术简介'}</h3>
          {!!descZh && <p className="mt-2 text-[13px] text-gray-800 whitespace-pre-line leading-relaxed">{descZh}</p>}
          {!!descEn && (
            <>
              <div className="mt-3 h-px bg-gray-100" />
              <h4 className="mt-3 text-[13px] font-medium text-gray-900">{locale==='en'?'English Description':'技术简介（英文）'}</h4>
              <p className="mt-1 text-[13px] text-gray-800 whitespace-pre-line leading-relaxed">{descEn}</p>
            </>
          )}
        </div>

        {/* Card 4: Attachments */}
        {attachments.length>0 && (
          <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-3">
            <h3 className="text-[14px] font-semibold text-gray-900">{locale==='en'?'Technology Documents':'技术资料'}</h3>
            <div className="mt-2 space-y-2">
              {attachments.map((att, i) => {
                const filename = att.filename || (locale==='en'?'Tech-Material':'技术资料')
                const downloadUrl = `/api/files/download?url=${encodeURIComponent(att.url)}&filename=${encodeURIComponent(filename)}`
                return (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 h-12 border border-gray-100">
                    <div className="flex items-center min-w-0 gap-2">
                      <FileText className="w-5 h-5 text-[#2563eb]" />
                      <div className="text-[13px] text-gray-900 truncate">{filename}</div>
                    </div>
                    <a
                      href={downloadUrl}
                      className="shrink-0 inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#00b899] text-white text-[12px] hover:opacity-95"
                    >
                      {locale==='en'?'Download':'下载'}
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Upload time */}
        {createdAt && (
          <div className="mt-3 text-[12px] text-gray-500">{locale==='en'?'Uploaded at':'上传时间'}：{createdAt}</div>
        )}
      </div>

      {/* Bottom action bar: back / delete / edit */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-t">
        <div className="mx-auto max-w-md px-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', paddingTop: 8 }}>
          <div className="flex items-center gap-2">
            <button onClick={()=>router.back()} aria-label={locale==='en'?'Back':'返回'} className="h-10 w-10 rounded-full bg-white border border-gray-200 text-gray-800 inline-flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <button onClick={handleDelete} disabled={deleting} className="h-10 rounded-xl bg-white border border-gray-200 text-gray-800 text-[13px] inline-flex items-center justify-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                <span>{locale==='en'?'Delete':'删除'}</span>
              </button>
              <button onClick={()=>setShowEdit(true)} className="h-10 rounded-xl bg-[#00b899] text-white text-[13px] inline-flex items-center justify-center gap-1.5">
                <EditIcon className="w-4 h-4" />
                <span>{locale==='en'?'Edit':'编辑'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit overlay reuse Web form */}
      {showEdit && data && (
        <UserTechnologyForm
          technology={data}
          onSuccess={async()=>{ setShowEdit(false); try { const res = await getUserTechnologyByIdApi(data.id!); setData(res) } catch {} }}
          onCancel={()=>setShowEdit(false)}
        />
      )}
    </div>
  )
}
