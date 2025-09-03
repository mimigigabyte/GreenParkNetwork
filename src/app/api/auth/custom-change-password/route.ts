import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken, verifyPassword, hashPassword } from '@/lib/custom-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 })
    }

    // 验证自定义JWT
    let payload: any
    try {
      payload = verifyToken(token)
    } catch (e) {
      return NextResponse.json({ success: false, error: '无效的认证信息' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: '当前密码和新密码不能为空' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: '新密码长度不能少于6位' }, { status: 400 })
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ success: false, error: '新密码不能与当前密码相同' }, { status: 400 })
    }

    const userId = payload.userId

    // 获取自定义用户记录
    const { data: user, error } = await supabaseAdmin
      .from('custom_users')
      .select('id, password_hash')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ success: false, error: '用户不存在或已被禁用' }, { status: 404 })
    }

    // 校验当前密码
    const ok = await verifyPassword(currentPassword, user.password_hash)
    if (!ok) {
      return NextResponse.json({ success: false, error: '当前密码不正确' }, { status: 400 })
    }

    // 更新新密码
    const newHash = await hashPassword(newPassword)
    const { error: upErr } = await supabaseAdmin
      .from('custom_users')
      .update({ password_hash: newHash })
      .eq('id', userId)

    if (upErr) {
      return NextResponse.json({ success: false, error: '密码更新失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { message: '密码修改成功' } })
  } catch (e) {
    console.error('custom-change-password error:', e)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}

