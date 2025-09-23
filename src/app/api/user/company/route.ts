import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequestUser, serviceSupabase } from '@/app/api/_utils/auth'

export const dynamic = 'force-dynamic'

const db = serviceSupabase ?? (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null)

export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: '服务未配置' }, { status: 500 })
  }

  const user = await authenticateRequestUser(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const queryUserId = searchParams.get('userId')
  if (queryUserId && queryUserId !== user.id) {
    return NextResponse.json({ error: '无权限访问其他用户的企业信息' }, { status: 403 })
  }

  const filterColumn = user.authType === 'custom' ? 'custom_user_id' : 'user_id'

  const { data: company, error } = await db
    .from('admin_companies')
    .select('id, name_zh, name_en, logo_url, country_id, province_id, development_zone_id, user_id, custom_user_id')
    .eq(filterColumn, user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('获取用户企业信息失败:', error)
    return NextResponse.json({ error: '获取用户企业信息失败' }, { status: 500 })
  }

  if (!company) {
    return NextResponse.json({
      id: null,
      name_zh: null,
      name_en: null,
      logo_url: null,
      country_id: null,
      province_id: null,
      development_zone_id: null,
    })
  }

  return NextResponse.json(company)
}
