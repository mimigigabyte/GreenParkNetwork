import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequestUser, serviceSupabase } from '@/app/api/_utils/auth'

export async function GET(request: NextRequest) {
  const user = await authenticateRequestUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
  }

  if (!serviceSupabase) {
    return NextResponse.json({ success: false, error: '服务不可用' }, { status: 500 })
  }

  const { count, error } = await serviceSupabase
    .from('internal_messages')
    .select('id', { count: 'exact', head: true })
    .eq('to_user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Fetch unread count failed:', error)
    return NextResponse.json({ success: false, error: '获取未读数量失败' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: count ?? 0 })
}
