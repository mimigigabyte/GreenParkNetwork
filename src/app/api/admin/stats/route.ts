import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用service role key创建Supabase客户端
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface AdminStats {
  pendingContacts: number      // 待处理联系消息数
  pendingTechnologies: number  // 待审核技术数
  unreadMessages: number       // 未读管理员消息数
  totalNotifications: number   // 总通知数（用于小铃铛）
}

// GET - 获取管理员控制台统计数据
export async function GET(_: NextRequest) {
  try {
    console.log('📊 开始获取管理员统计数据...')

    // 1. 查询待处理联系消息数
    const { count: pendingContactsCount, error: contactsError } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    console.log('📊 待处理联系消息数:', pendingContactsCount, '错误:', contactsError)

    // 2. 查询待审核技术数
    const { count: pendingTechCount, error: techError } = await supabase
      .from('admin_technologies')
      .select('*', { count: 'exact', head: true })
      .eq('review_status', 'pending_review')

    console.log('📊 待审核技术数:', pendingTechCount, '错误:', techError)

    // 管理员不需要接收站内消息通知，所以未读消息数为0
    const unreadMessages = 0

    const pendingContacts = pendingContactsCount || 0
    const pendingTechnologies = pendingTechCount || 0

    // 计算总通知数（只包含待处理联系消息和待审核技术）
    const totalNotifications = pendingContacts + pendingTechnologies

    const stats: AdminStats = {
      pendingContacts,
      pendingTechnologies,
      unreadMessages,
      totalNotifications
    }

    console.log('📊 最终管理员统计数据:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取管理员统计数据失败:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}