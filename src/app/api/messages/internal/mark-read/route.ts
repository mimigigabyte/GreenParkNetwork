import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequestUser, serviceSupabase } from '@/app/api/_utils/auth'

export async function POST(request: NextRequest) {
  const user = await authenticateRequestUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
  }

  if (!serviceSupabase) {
    return NextResponse.json({ success: false, error: '服务不可用' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && id) : []

  if (ids.length === 0) {
    return NextResponse.json({ success: false, error: '缺少消息ID' }, { status: 400 })
  }

  const timestamp = new Date().toISOString()
  const { data, error } = await serviceSupabase
    .from('internal_messages')
    .update({
      is_read: true,
      read_at: timestamp,
      updated_at: timestamp,
    })
    .in('id', ids)
    .eq('to_user_id', user.id)
    .select('*')

  if (error) {
    console.error('Mark messages read failed:', error)
    return NextResponse.json({ success: false, error: '标记已读失败' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}
