import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用service role key创建Supabase客户端
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - 审核技术（通过或退回）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, reason } = await request.json()
    const technologyId = params.id

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: '无效的审核操作' }, { status: 400 })
    }

    if (action === 'reject' && !reason?.trim()) {
      return NextResponse.json({ error: '退回时必须提供原因' }, { status: 400 })
    }

    // 准备更新数据
    const updateData: any = {
      reviewed_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.review_status = 'published'
      updateData.reject_reason = null
    } else if (action === 'reject') {
      updateData.review_status = 'rejected'
      updateData.reject_reason = reason.trim()
    }

    // 更新技术审核状态
    const { data, error } = await supabase
      .from('admin_technologies')
      .update(updateData)
      .eq('id', technologyId)
      .select()
      .single()

    if (error) {
      console.error('更新技术审核状态失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '技术不存在' }, { status: 404 })
    }

    // TODO: 这里可以添加消息通知逻辑
    // 发送消息给技术创建者，告知审核结果
    if (data.created_by) {
      try {
        await sendReviewNotification(data.created_by, data, action, reason)
      } catch (notificationError) {
        console.error('发送审核通知失败:', notificationError)
        // 不影响主要流程，只记录错误
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 发送审核通知的辅助函数
async function sendReviewNotification(
  userId: string, 
  technology: any, 
  action: string, 
  reason?: string
) {
  console.log('🔔 开始发送审核通知:', { userId, action, technologyName: technology.name_zh })
  
  const messageContent = action === 'approve' 
    ? `您提交的技术"${technology.name_zh}"已通过审核，现已发布到平台上。`
    : `您提交的技术"${technology.name_zh}"未通过审核。\n\n退回原因：${reason}`

  const messageData = {
    from_user_id: null, // 系统消息，没有发送者
    to_user_id: userId,
    title: action === 'approve' ? '技术审核通过' : '技术审核退回',
    content: messageContent,
    category: '发布审核', // 设置为发布审核分类
    is_read: false,
    created_at: new Date().toISOString()
  }
  
  console.log('🔔 准备插入的消息数据:', messageData)

  // 插入消息到站内消息表
  const { data, error } = await supabase
    .from('internal_messages')
    .insert(messageData)
    .select()

  console.log('🔔 消息插入结果:', { data, error })

  if (error) {
    console.error('🔔 消息插入失败:', error)
    throw error
  }
  
  console.log('🔔 审核通知发送成功')
}