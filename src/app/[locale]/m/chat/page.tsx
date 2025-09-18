"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useAuthContext } from '@/components/auth/auth-provider'
import { useUnreadMessage } from '@/components/message/unread-message-context'
import {
  type InternalMessage,
  getReceivedInternalMessages,
  markInternalMessageAsRead,
  getUnreadInternalMessageCount,
  markInternalMessagesAsRead,
  markAllInternalMessagesAsRead,
  deleteInternalMessages,
} from '@/lib/supabase/contact-messages'

type CategoryKey = 'all' | 'technical' | 'audit' | 'following' | 'security' | 'other'

interface MessageFilters {
  category: CategoryKey
  status: 'all' | 'read' | 'unread'
  searchKeyword: string
}

export default function MobileChatPage() {
  const pathname = usePathname()
  const router = useRouter()
  const locale: 'en' | 'zh' = pathname.startsWith('/en') ? 'en' : 'zh'
  const { user } = useAuthContext()
  const { toast } = useToast()
  const { refreshUnreadCount, decrementUnreadCount, setUnreadCount: setGlobalUnreadCount } = useUnreadMessage()

  const [messages, setMessages] = useState<InternalMessage[]>([])
  const [filtered, setFiltered] = useState<InternalMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [filters, setFilters] = useState<MessageFilters>({ category: 'all', status: 'all', searchKeyword: '' })

  // Category display mapping
  const categoryMap = useMemo(
    () => ({
      technical: locale === 'en' ? 'Technical Connection' : '技术对接',
      audit: locale === 'en' ? 'Publication Review' : '发布审核',
      following: locale === 'en' ? 'My Following' : '我的关注',
      security: locale === 'en' ? 'Security Messages' : '安全消息',
      other: locale === 'en' ? 'Other' : '其他',
    }),
    [locale],
  )

  const loadMessages = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [list, unread] = await Promise.all([
        getReceivedInternalMessages(),
        getUnreadInternalMessageCount(),
      ])
      setMessages(list)
      setUnreadCount(unread)
    } catch (e) {
      console.error('加载消息失败:', e)
      toast({
        title: locale === 'en' ? 'Loading Failed' : '加载失败',
        description: locale === 'en' ? 'Unable to load messages' : '无法加载消息列表',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Apply filters
  useEffect(() => {
    let list = [...messages]
    if (filters.category !== 'all') {
      const target = (categoryMap as any)[filters.category]
      if (target) {
        list = list.filter((m) => {
          if (target === '技术对接' || target === 'Technical Connection') {
            return (
              m.category === target ||
              m.category === '技术对接' ||
              m.category === 'Technical Connection' ||
              !m.category ||
              m.category === (null as any) ||
              m.category === '' ||
              m.category === 'undefined'
            )
          }
          return m.category === target
        })
      }
    }
    if (filters.status === 'read') list = list.filter((m) => m.is_read)
    else if (filters.status === 'unread') list = list.filter((m) => !m.is_read)

    // 移动端不提供搜索框，省略关键词过滤
    setFiltered(list)
    setSelectedIds(new Set())
    setIsAllSelected(false)
  }, [messages, filters, categoryMap])

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map((m) => m.id)))
      setIsAllSelected(true)
    } else {
      setSelectedIds(new Set())
      setIsAllSelected(false)
    }
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
    setIsAllSelected(next.size === filtered.length && filtered.length > 0)
  }

  const markAsReadOne = async (m: InternalMessage) => {
    if (m.is_read) return
    try {
      await markInternalMessageAsRead(m.id)
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
      decrementUnreadCount(1) // 更新全局未读数量
    } catch (e) {
      console.error('标记已读失败', e)
    }
  }

  const batchMarkAsRead = async () => {
    if (selectedIds.size === 0) {
      toast({ title: locale === 'en' ? 'Notice' : '提示', description: locale === 'en' ? 'Select messages first' : '请先选择消息' })
      return
    }
    setBatchLoading(true)
    try {
      const ids = Array.from(selectedIds)
      await markInternalMessagesAsRead(ids)
      setMessages((prev) => prev.map((m) => (selectedIds.has(m.id) ? { ...m, is_read: true, read_at: new Date().toISOString() } : m)))
      const dec = messages.filter((m) => selectedIds.has(m.id) && !m.is_read).length
      setUnreadCount((c) => Math.max(0, c - dec))
      decrementUnreadCount(dec) // 更新全局未读数量
      setSelectedIds(new Set())
      setIsAllSelected(false)
      toast({ title: locale === 'en' ? 'Success' : '操作成功', description: locale === 'en' ? 'Marked as read' : '已标记为已读' })
    } catch (e) {
      console.error('批量标记已读失败', e)
      toast({ title: locale === 'en' ? 'Operation Failed' : '操作失败', description: locale === 'en' ? 'Failed to mark as read' : '标记已读失败', variant: 'destructive' })
    } finally {
      setBatchLoading(false)
    }
  }

  const batchDelete = async () => {
    if (selectedIds.size === 0) {
      toast({ title: locale === 'en' ? 'Notice' : '提示', description: locale === 'en' ? 'Select messages first' : '请先选择消息' })
      return
    }
    setBatchLoading(true)
    try {
      const ids = Array.from(selectedIds)
      await deleteInternalMessages(ids)
      const dec = messages.filter((m) => selectedIds.has(m.id) && !m.is_read).length
      setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)))
      setUnreadCount((c) => Math.max(0, c - dec))
      decrementUnreadCount(dec) // 更新全局未读数量
      setSelectedIds(new Set())
      setIsAllSelected(false)
      toast({ title: locale === 'en' ? 'Success' : '操作成功', description: locale === 'en' ? 'Deleted messages' : '已删除所选消息' })
    } catch (e) {
      console.error('批量删除失败', e)
      toast({ title: locale === 'en' ? 'Operation Failed' : '操作失败', description: locale === 'en' ? 'Failed to delete' : '删除失败', variant: 'destructive' })
    } finally {
      setBatchLoading(false)
    }
  }

  const markAllAsRead = async () => {
    setBatchLoading(true)
    try {
      await markAllInternalMessagesAsRead()
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true, read_at: new Date().toISOString() })))
      setUnreadCount(0)
      setGlobalUnreadCount(0) // 更新全局未读数量为0
      toast({ title: locale === 'en' ? 'Success' : '操作成功', description: locale === 'en' ? 'All read' : '全部已读' })
    } catch (e) {
      console.error('全部已读失败', e)
      toast({ title: locale === 'en' ? 'Operation Failed' : '操作失败', description: locale === 'en' ? 'Failed to mark all' : '全部标记失败', variant: 'destructive' })
    } finally {
      setBatchLoading(false)
    }
  }

  const formatDate = (s: string) => {
    const d = new Date(s)
    // Mobile compact date like 10/15/24 in screenshot
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', { year: '2-digit', month: '2-digit', day: '2-digit' })
  }

  const chips: { key: CategoryKey; label: string; count?: number; color?: string }[] = useMemo(() => {
    const countBy = (test: (m: InternalMessage) => boolean) => messages.filter(test).length
    return [
      { key: 'all', label: locale === 'en' ? 'All' : '全部', count: messages.length },
      {
        key: 'technical',
        label: locale === 'en' ? 'Technical' : '技术对接',
        count: countBy((m) =>
          m.category === '技术对接' ||
          m.category === 'Technical Connection' ||
          !m.category ||
          (m.category as any) === null ||
          m.category === '' ||
          m.category === 'undefined',
        ),
        color: '#2563eb',
      },
      { key: 'audit', label: locale === 'en' ? 'Review' : '发布审核', count: countBy((m) => m.category === '发布审核' || m.category === 'Publication Review'), color: '#ea580c' },
      { key: 'following', label: locale === 'en' ? 'Following' : '我的关注', count: countBy((m) => m.category === '我的关注' || m.category === 'My Following'), color: '#16a34a' },
      { key: 'security', label: locale === 'en' ? 'Security' : '安全消息', count: countBy((m) => m.category === '安全消息' || m.category === 'Security Messages'), color: '#dc2626' },
      { key: 'other', label: locale === 'en' ? 'Other' : '其他', count: countBy((m) => m.category === '其他' || m.category === 'Other'), color: '#6b7280' },
    ]
  }, [messages, locale])

  if (!user) {
    return (
      <section className="min-h-dvh flex items-center justify-center">
        <div className="text-center text-gray-600">
          <Bell className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="mb-4">{locale === 'en' ? 'Please login to view messages' : '请先登录查看消息'}</p>
          <button
            onClick={() => router.push(`/${locale}/m/login`)}
            className="h-11 px-5 rounded-xl bg-[#00b899] text-white"
          >
            {locale === 'en' ? 'Go to Login' : '前往登录'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-dvh" style={{ backgroundColor: '#edeef7' }}>
      {/* Header with title and tabs */}
      <div className="sticky top-0 z-40 px-3 pt-3 pb-2">
        <h1 className="text-[18px] font-bold text-gray-900 mb-2">
          {locale === 'en' ? 'My Messages' : '我的消息'}
        </h1>
        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {chips.map((c) => {
            const active = filters.category === c.key
            return (
              <button
                key={c.key}
                onClick={() => setFilters((p) => ({ ...p, category: c.key }))}
                className={`shrink-0 h-8 px-3 rounded-full border text-[12px] transition-colors ${
                  active ? 'bg-[#00b899] text-white border-[#00b899]' : 'bg-white text-gray-700 border-gray-200'
                }`}
                aria-pressed={active}
              >
                <span>
                  {c.label}
                  {typeof c.count === 'number' ? ` (${c.count})` : ''}
                </span>
              </button>
            )
          })}
        </div>
        {/* Status row (no search) */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-2 text-[12px] text-gray-600">
            <span>
              {locale === 'en' ? 'Selected' : '已选择'}: {selectedIds.size}
            </span>
            <span className="w-px h-3 bg-gray-300" />
            <span>
              {locale === 'en' ? 'Total' : '总条数'}: {filtered.length}
            </span>
            {unreadCount > 0 && (
              <span className="ml-1 text-red-600">
                {locale === 'en' ? 'Unread' : '未读'}: {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Message list */}
      <div className="px-3 pb-28 pt-3 max-w-md mx-auto">
        {loading ? (
          <div className="py-16 text-center text-gray-500">{locale === 'en' ? 'Loading...' : '加载中...'}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            {locale === 'en' ? 'No messages' : '暂无消息'}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((m) => {
              const unread = !m.is_read
              const displayCategory = m.category || (locale === 'en' ? 'Technical Connection' : '技术对接')
              return (
                <li key={m.id}>
                  <div
                    className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`${pathname}/${m.id}`)}
                  >
                    <div className="w-full text-left">
                      {/* Single-row aligned: checkbox, dot, icon, title, status */}
                      <div className="grid grid-cols-[72px_1fr_auto] items-center gap-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300"
                            checked={selectedIds.has(m.id)}
                            onChange={(e) => toggleSelectOne(m.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className={`w-2 h-2 rounded-full ${unread ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#2563eb] to-[#1e40af] flex items-center justify-center shadow-sm ring-1 ring-white/40">
                            <Mail className="w-4 h-4 text-white" strokeWidth={2.2} />
                          </div>
                        </div>
                        <div className={`text-left text-[14px] font-semibold leading-tight truncate ${unread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {m.title}
                        </div>
                        <Badge className="shrink-0 whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-200 text-[10px] font-medium rounded-full px-2 py-0.5">
                          {displayCategory}
                        </Badge>
                      </div>
                      {/* content and date aligned with title (second column start) */}
                      <div className="mt-1.5 pl-[80px] text-[12px] text-gray-500 truncate">{m.content}</div>
                      <div className="mt-1.5 pl-[80px] text-[12px] text-gray-700">{formatDate(m.created_at)}</div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Bottom action bar - sits above tab bar */}
      <div className="fixed left-0 right-0 bottom-14 z-40">
        <div className="mx-auto max-w-md px-3 pb-3">
          <div className="h-12 rounded-2xl bg-white shadow border border-gray-100 flex items-center px-3 gap-2">
            <label className="flex items-center gap-2 text-[13px] text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300"
                checked={isAllSelected}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                disabled={filtered.length === 0}
              />
              <span>{locale === 'en' ? 'Select All' : '全选'}</span>
            </label>
            <span className="h-6 w-px bg-gray-200" />
            <button
              onClick={batchMarkAsRead}
              disabled={selectedIds.size === 0 || batchLoading}
              className={`px-3 h-8 rounded-full text-[12px] ${
                selectedIds.size === 0 || batchLoading
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {batchLoading ? (locale === 'en' ? 'Processing...' : '处理中...') : locale === 'en' ? 'Mark Read' : '标为已读'}
            </button>
            <button
              onClick={batchDelete}
              disabled={selectedIds.size === 0 || batchLoading}
              className={`px-3 h-8 rounded-full text-[12px] ${
                selectedIds.size === 0 || batchLoading
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {locale === 'en' ? 'Delete' : '删除'}
            </button>
            <button
              onClick={markAllAsRead}
              disabled={batchLoading || unreadCount === 0}
              className={`ml-auto px-3 h-8 rounded-full text-[12px] ${
                batchLoading || unreadCount === 0
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {locale === 'en' ? 'All Read' : '全部已读'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
