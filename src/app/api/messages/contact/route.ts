import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequestUser, serviceSupabase } from '@/app/api/_utils/auth'

const db = serviceSupabase ?? (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null)

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: false, error: '服务未配置' }, { status: 500 })
  }

  const user = await authenticateRequestUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
  }

  const { data, error } = await db
    .from('contact_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('获取联系消息失败:', error)
    return NextResponse.json({ success: false, error: '获取联系消息失败' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: false, error: '服务未配置' }, { status: 500 })
  }

  const user = await authenticateRequestUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ success: false, error: '请求体无效' }, { status: 400 })
  }

  const contactName = (body.contact_name || body.contactName || '').trim()
  const contactPhone = (body.contact_phone || body.contactPhone || '').trim()
  const contactEmail = (body.contact_email || body.contactEmail || '').trim()
  const message = (body.message || '').trim()
  const category = (body.category || body.type || '').trim() || '技术对接'
  const technologyId = body.technology_id || body.technologyId || null
  const technologyName = body.technology_name || body.technologyName || ''
  const companyName = body.company_name || body.companyName || ''

  if (!contactName || !contactPhone || !contactEmail || !message) {
    return NextResponse.json({ success: false, error: '请填写完整的联系信息' }, { status: 400 })
  }

  const isCustom = user.authType === 'custom'
  const insertData: any = {
    technology_id: technologyId,
    technology_name: technologyName,
    company_name: companyName,
    contact_name: contactName,
    contact_phone: contactPhone,
    contact_email: contactEmail,
    message,
    category,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (isCustom) {
    insertData.custom_user_id = user.id
  } else {
    insertData.user_id = user.id
  }

  const { data, error } = await db
    .from('contact_messages')
    .insert(insertData)
    .select()
    .single()

  if (error || !data) {
    console.error('创建联系消息失败:', error)
    return NextResponse.json({ success: false, error: '创建联系消息失败' }, { status: 500 })
  }

  try {
    await notifyAdmins(db, data)
  } catch (notifyError) {
    console.error('通知管理员失败（已忽略）:', notifyError)
  }

  return NextResponse.json({ success: true, data })
}

async function notifyAdmins(client: any, contactMessage: any) {
  const { data: admins, error } = await client
    .from('users')
    .select('id')
    .eq('role', 'admin')

  if (error) {
    console.warn('查询管理员失败:', error)
    return
  }

  if (!admins || admins.length === 0) return

  const isFeedback = contactMessage.category === '用户反馈'
  const titlePrefix = isFeedback ? '新的用户反馈' : '新的联系咨询'
  const titleSuffix = isFeedback ? '问题反馈' : (contactMessage.technology_name || '技术咨询')
  const category = isFeedback ? '用户反馈' : '技术对接'
  const now = new Date().toISOString()

  const notifications = admins.map((admin: any) => ({
    from_user_id: contactMessage.user_id,
    to_user_id: admin.id,
    contact_message_id: contactMessage.id,
    title: `${titlePrefix}：${titleSuffix}`,
    content: `您收到了一条新的${isFeedback ? '用户反馈' : '联系消息'}：\n\n联系人：${contactMessage.contact_name}\n联系电话：${contactMessage.contact_phone}\n联系邮箱：${contactMessage.contact_email}\n${isFeedback ? '' : `咨询技术：${contactMessage.technology_name || '无'}\n所属公司：${contactMessage.company_name || '无'}`}\n\n${isFeedback ? '反馈' : '留言'}内容：\n${contactMessage.message}\n\n请前往管理后台查看并处理此消息。`,
    category,
    is_read: false,
    created_at: now,
    updated_at: now,
  }))

  const { error: notifyError } = await client
    .from('internal_messages')
    .insert(notifications)

  if (notifyError) {
    throw notifyError
  }
}
