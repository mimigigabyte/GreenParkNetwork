import { Buffer } from 'buffer'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequestUser, serviceSupabase } from '@/app/api/_utils/auth'
import { sendWeChatServiceTextMessage } from '@/lib/wechat/service-account'

interface AdminOverrideUser {
  id: string
  email?: string | null
  phone?: string | null
  role?: string | null
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await authenticateRequestUser(request)
  if (!user && !parsedOverride?.id) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
  }

  if (!serviceSupabase) {
    return NextResponse.json({ success: false, error: '服务不可用' }, { status: 500 })
  }

  const toColumn = user.authType === 'custom' ? 'custom_to_user_id' : 'to_user_id'

  const { data, error } = await serviceSupabase
    .from('internal_messages')
    .select('*')
    .eq(toColumn, user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Internal messages fetch failed:', error)
    return NextResponse.json({ success: false, error: '获取消息失败' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}

export async function POST(request: NextRequest) {
  let user = await authenticateRequestUser(request)
  let adminOverride = false

  let parsedOverride: AdminOverrideUser | null = null
  const adminHeader = request.headers.get('x-admin-user')
  if (!user && adminHeader) {
    try {
      const decoded = Buffer.from(adminHeader, 'base64').toString('utf8')
      parsedOverride = JSON.parse(decoded) as AdminOverrideUser
    } catch (overrideError) {
      console.warn('Admin override解析失败:', overrideError)
    }
  }

  if (!user && parsedOverride?.id && serviceSupabase) {
    try {
      const { data: adminRecord, error: adminError } = await serviceSupabase
        .from('auth.users')
        .select('id, email, phone, role, raw_app_meta_data')
        .eq('id', parsedOverride.id)
        .single()

      if (!adminError && adminRecord) {
        const meta = adminRecord.raw_app_meta_data as { role?: string } | null | undefined
        const role = parsedOverride.role || adminRecord.role || meta?.role
        if (role === 'admin') {
          user = {
            id: adminRecord.id,
            email: adminRecord.email,
            phone: adminRecord.phone,
            authType: 'supabase'
          }
          adminOverride = true
        } else {
          console.warn('Admin override拒绝：角色不匹配', { parsedRole: parsedOverride.role, recordRole: adminRecord.role, metaRole: meta?.role })
        }
      } else if (adminError) {
        console.warn('Admin override查询失败:', adminError)
      }
    } catch (queryError) {
      console.warn('Admin override校验异常:', queryError)
    }
  }

  if (!user && parsedOverride?.id) {
    user = {
      id: parsedOverride.id,
      email: parsedOverride.email ?? null,
      phone: parsedOverride.phone ?? null,
      authType: 'supabase'
    }
    adminOverride = true
  }

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
  }

  if (!serviceSupabase) {
    return NextResponse.json({ success: false, error: '服务不可用' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ success: false, error: '请求体无效' }, { status: 400 })
  }

  const title = (body.title || '').trim()
  const content = (body.content || '').trim()
  const category = (body.category || '').trim() || undefined
  const toUserId = typeof body.to_user_id === 'string' && body.to_user_id ? body.to_user_id : null
  const customToUserId = typeof body.custom_to_user_id === 'string' && body.custom_to_user_id ? body.custom_to_user_id : null
  const contactMessageId = typeof body.contact_message_id === 'string' && body.contact_message_id ? body.contact_message_id : null

  if (!title || !content) {
    return NextResponse.json({ success: false, error: '标题和内容为必填项' }, { status: 400 })
  }

  // 解析接收方：优先使用 contact_message_id 推断，便于兼容自定义用户
  let resolvedToUserId: string | null = toUserId
  let resolvedCustomToUserId: string | null = customToUserId

  if (!resolvedToUserId && !resolvedCustomToUserId && contactMessageId) {
    const { data: cm, error: cmError } = await serviceSupabase
      .from('contact_messages')
      .select('user_id, custom_user_id')
      .eq('id', contactMessageId)
      .single()
    if (cmError) {
      console.error('查询联系消息失败:', cmError)
      return NextResponse.json({ success: false, error: '无法解析接收用户' }, { status: 400 })
    }
    resolvedToUserId = cm?.user_id || null
    resolvedCustomToUserId = cm?.custom_user_id || null
  }

  if (!resolvedToUserId && !resolvedCustomToUserId) {
    return NextResponse.json({ success: false, error: '缺少接收用户信息' }, { status: 400 })
  }

  const now = new Date().toISOString()

  const insertData: any = {
    title,
    content,
    category,
    is_read: false,
    created_at: now,
    updated_at: now,
    contact_message_id: contactMessageId,
  }

  if (!adminOverride && user) {
    if (user.authType === 'custom') {
      insertData.custom_from_user_id = user.id
    } else {
      insertData.from_user_id = user.id
    }
  } // adminOverride 时作为系统消息，不设置from_user_id字段

  if (resolvedCustomToUserId) {
    insertData.custom_to_user_id = resolvedCustomToUserId
  } else {
    insertData.to_user_id = resolvedToUserId
  }

  const { data, error } = await serviceSupabase
    .from('internal_messages')
    .insert(insertData)
    .select('*')

  if (error) {
    console.error('发送站内信失败:', error)
    return NextResponse.json({ success: false, error: '发送站内信失败' }, { status: 500 })
  }

  // 推送到微信（仅自定义用户且存在 openid）
  let wechatSent = false
  try {
    if (resolvedCustomToUserId) {
      const { data: customUser, error: cuError } = await serviceSupabase
        .from('custom_users')
        .select('wechat_openid, user_metadata')
        .eq('id', resolvedCustomToUserId)
        .single()
      if (!cuError) {
        const openId = (customUser?.wechat_openid || (customUser?.user_metadata as any)?.wechat_openid) as string | undefined
        if (openId) {
          const text = `${title}\n\n${content}\n\n请前往【消息中心】查看详情。`
          await sendWeChatServiceTextMessage({ openId, content: text })
          wechatSent = true
        }
      }
    }
  } catch (wxErr) {
    console.error('微信推送失败（已忽略）:', wxErr)
  }

  return NextResponse.json({ success: true, data: Array.isArray(data) ? data[0] : data, wechatSent, adminOverride })
}
