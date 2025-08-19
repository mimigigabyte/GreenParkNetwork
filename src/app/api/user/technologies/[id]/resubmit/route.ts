import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用service role key创建Supabase客户端
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - 重新提交技术审核
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const technologyId = params.id

    // 更新技术状态为待审核，清除退回原因
    const { data, error } = await supabase
      .from('admin_technologies')
      .update({
        review_status: 'pending_review',
        reject_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', technologyId)
      .select()
      .single()

    if (error) {
      console.error('重新提交技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '技术不存在' }, { status: 404 })
    }

    // 通知管理员有技术重新提交审核
    try {
      await notifyAdminTechnologyResubmit(data)
    } catch (notificationError) {
      console.error('发送管理员通知失败:', notificationError)
      // 不影响主要流程，只记录错误
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 通知管理员技术重新提交的辅助函数
async function notifyAdminTechnologyResubmit(technology: any) {
  // 查找所有管理员（这里可以根据需要调整管理员查找逻辑）
  const { data: admins, error: adminError } = await supabase
    .from('auth.users')
    .select('id')
    .limit(10) // 暂时获取前10个用户作为管理员

  if (adminError || !admins || admins.length === 0) {
    console.warn('没有找到管理员用户')
    return
  }

  // 为每个管理员创建通知消息
  const notifications = admins.map(admin => ({
    from_user_id: technology.created_by,
    to_user_id: admin.id,
    title: '技术重新提交审核',
    content: `用户重新提交了技术"${technology.name_zh}"，请及时审核。`,
    category: '发布审核',
    is_read: false,
    created_at: new Date().toISOString()
  }))

  // 批量插入通知消息
  const { error } = await supabase
    .from('internal_messages')
    .insert(notifications)

  if (error) {
    throw error
  }
}