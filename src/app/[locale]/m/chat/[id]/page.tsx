"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, CheckCircle, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useAuthContext } from '@/components/auth/auth-provider'
import { useUnreadMessage } from '@/components/message/unread-message-context'
import {
  type InternalMessage,
  getInternalMessageById,
  markInternalMessageAsRead,
  deleteInternalMessages,
} from '@/lib/supabase/contact-messages'

export default function MobileMessageDetailPage({ params: { id } }: { params: { id: string } }) {
  const pathname = usePathname()
  const router = useRouter()
  const locale: 'en' | 'zh' = pathname.startsWith('/en') ? 'en' : 'zh'
  const { user } = useAuthContext()
  const { toast } = useToast()
  const { decrementUnreadCount } = useUnreadMessage()

  const [message, setMessage] = useState<InternalMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)

  useEffect(() => {
    const loadMessage = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const messageData = await getInternalMessageById(id)
        setMessage(messageData)

        // 自动标记为已读（如果未读）
        if (!messageData.is_read) {
          try {
            await markInternalMessageAsRead(messageData.id)
            setMessage(prev => prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : null)
            decrementUnreadCount(1) // 更新全局未读数量
          } catch (readError) {
            console.error('Auto mark as read failed:', readError)
            // 不影响页面显示，只是标记失败
          }
        }
      } catch (error) {
        console.error('Load message failed:', error)
        toast({
          title: locale === 'en' ? 'Loading Failed' : '加载失败',
          description: locale === 'en' ? 'Unable to load message' : '无法加载消息',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadMessage()
  }, [id, user, locale, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleMarkAsRead = async () => {
    if (!message || message.is_read || markingRead) return

    setMarkingRead(true)
    try {
      await markInternalMessageAsRead(message.id)
      setMessage(prev => prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : null)
      decrementUnreadCount(1) // 更新全局未读数量
      toast({
        title: locale === 'en' ? 'Success' : '操作成功',
        description: locale === 'en' ? 'Message marked as read' : '消息已标记为已读'
      })
    } catch (error) {
      console.error('Mark as read failed:', error)
      toast({
        title: locale === 'en' ? 'Operation Failed' : '操作失败',
        description: locale === 'en' ? 'Failed to mark as read' : '标记已读失败',
        variant: 'destructive'
      })
    } finally {
      setMarkingRead(false)
    }
  }

  const handleDelete = async () => {
    if (!message || deleting) return

    const confirmed = confirm(locale === 'en' ? 'Are you sure you want to delete this message?' : '确定要删除这条消息吗？')
    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteInternalMessages([message.id])
      // 如果删除的是未读消息，更新全局未读数量
      if (!message.is_read) {
        decrementUnreadCount(1)
      }
      toast({
        title: locale === 'en' ? 'Success' : '操作成功',
        description: locale === 'en' ? 'Message deleted' : '消息已删除'
      })
      router.back()
    } catch (error) {
      console.error('Delete failed:', error)
      toast({
        title: locale === 'en' ? 'Operation Failed' : '操作失败',
        description: locale === 'en' ? 'Failed to delete message' : '删除消息失败',
        variant: 'destructive'
      })
      setDeleting(false)
    }
  }

  if (!user) {
    return (
      <section className="min-h-dvh flex items-center justify-center">
        <div className="text-center text-gray-600">
          <Mail className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p>{locale === 'en' ? 'Please login to view messages' : '请先登录查看消息'}</p>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="min-h-dvh flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="animate-spin w-6 h-6 border-2 border-[#00b899] border-t-transparent rounded-full mx-auto mb-3"></div>
          <p>{locale === 'en' ? 'Loading...' : '加载中...'}</p>
        </div>
      </section>
    )
  }

  if (!message) {
    return (
      <section className="min-h-dvh flex items-center justify-center">
        <div className="text-center text-gray-600">
          <Mail className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p>{locale === 'en' ? 'Message not found' : '消息不存在'}</p>
        </div>
      </section>
    )
  }

  const displayCategory = message.category || (locale === 'en' ? 'Technical Connection' : '技术对接')

  return (
    <div className="pb-20" style={{ backgroundColor: '#edeef7' }}>
      <div className="px-3 pt-4">
        {/* Message Header Card */}
        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          {/* Title and Category */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="flex-1 text-[18px] font-semibold text-gray-900 leading-tight">
              {message.title}
            </h1>
            <Badge className="shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-200 text-[11px] font-medium rounded-full px-2 py-1">
              {displayCategory}
            </Badge>
          </div>

          {/* Date */}
          <div className="text-[12px] text-gray-500">
            <span>{formatDate(message.created_at)}</span>
          </div>
        </div>

        {/* Message Content Card */}
        <div className="mt-3 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <h2 className="text-[14px] font-semibold text-gray-900 mb-3">
            {locale === 'en' ? 'Message Content' : '消息内容'}
          </h2>
          <div className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-white border-t">
        <div className="mx-auto max-w-md px-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', paddingTop: 8 }}>
          <div className="flex items-center gap-2">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              aria-label={locale === 'en' ? 'Back' : '返回'}
              className="h-10 w-10 rounded-full bg-white border border-gray-200 text-gray-800 inline-flex items-center justify-center transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              {/* Delete Button */}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 rounded-xl bg-white border border-gray-200 text-gray-800 text-[13px] inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? (locale === 'en' ? 'Deleting...' : '删除中...') : (locale === 'en' ? 'Delete' : '删除')}</span>
              </button>

              {/* Mark as Read Button */}
              <button
                onClick={handleMarkAsRead}
                disabled={message.is_read || markingRead}
                className="h-10 rounded-xl bg-[#00b899] hover:bg-[#009a7a] active:bg-[#008a74] text-white text-[13px] inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {markingRead
                    ? (locale === 'en' ? 'Marking...' : '标记中...')
                    : message.is_read
                    ? (locale === 'en' ? 'Read' : '已读')
                    : (locale === 'en' ? 'Mark Read' : '标为已读')
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}