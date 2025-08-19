import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用service role key创建Supabase客户端
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface DashboardStats {
  totalTechnologies: number        // 技术总数
  totalCompanies: number          // 注册企业总数
  pendingContacts: number         // 待处理联系消息
  pendingTechReviews: number      // 待处理技术发布审核
  monthlyNewTechnologies: number  // 本月新增技术数
  monthlyNewCompanies: number     // 本月新增企业数
}

// GET - 获取管理员控制台首页统计数据
export async function GET(request: NextRequest) {
  try {
    console.log('📊 开始获取控制台统计数据...')

    // 计算本月的开始时间
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // 并行查询各种统计数据
    const [
      totalTechResult,
      totalCompaniesResult,
      pendingContactsResult,
      pendingTechReviewsResult,
      monthlyTechResult,
      monthlyCompaniesResult
    ] = await Promise.all([
      // 1. 技术总数（所有技术）
      supabase
        .from('admin_technologies')
        .select('*', { count: 'exact', head: true }),
      
      // 2. 注册企业总数
      supabase
        .from('admin_companies')
        .select('*', { count: 'exact', head: true }),
      
      // 3. 待处理联系消息数（status = 'pending'）
      supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // 4. 待处理技术发布审核数（review_status = 'pending_review'）
      supabase
        .from('admin_technologies')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'pending_review'),

      // 5. 本月新增技术数
      supabase
        .from('admin_technologies')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth),

      // 6. 本月新增企业数
      supabase
        .from('admin_companies')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth)
    ])

    const totalTechnologies = totalTechResult.count || 0
    const totalCompanies = totalCompaniesResult.count || 0
    const pendingContacts = pendingContactsResult.count || 0
    const pendingTechReviews = pendingTechReviewsResult.count || 0
    const monthlyNewTechnologies = monthlyTechResult.count || 0
    const monthlyNewCompanies = monthlyCompaniesResult.count || 0

    const stats: DashboardStats = {
      totalTechnologies,
      totalCompanies,
      pendingContacts,
      pendingTechReviews,
      monthlyNewTechnologies,
      monthlyNewCompanies
    }

    console.log('📊 控制台统计数据:', stats)

    // 检查是否有错误
    if (totalTechResult.error) {
      console.error('获取技术总数失败:', totalTechResult.error)
    }
    if (totalCompaniesResult.error) {
      console.error('获取企业总数失败:', totalCompaniesResult.error)
    }
    if (pendingContactsResult.error) {
      console.error('获取联系消息统计失败:', pendingContactsResult.error)
    }
    if (pendingTechReviewsResult.error) {
      console.error('获取技术审核统计失败:', pendingTechReviewsResult.error)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取控制台统计数据失败:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}