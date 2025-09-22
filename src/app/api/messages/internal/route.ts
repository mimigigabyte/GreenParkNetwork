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

  const { data, error } = await serviceSupabase
    .from('internal_messages')
    .select('*')
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Internal messages fetch failed:', error)
    return NextResponse.json({ success: false, error: '获取消息失败' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}
