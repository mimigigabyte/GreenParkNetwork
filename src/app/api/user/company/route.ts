import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase管理员客户端未配置' },
        { status: 500 }
      )
    }

    // 查询用户关联的企业信息
    const { data: company, error } = await supabaseAdmin
      .from('admin_companies')
      .select(`
        id,
        name_zh,
        name_en,
        logo_url,
        country_id,
        province_id,
        development_zone_id,
        user_id
      `)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 用户没有关联企业
        return NextResponse.json({
          id: null,
          name_zh: null,
          name_en: null,
          logo_url: null,
          country_id: null,
          province_id: null,
          development_zone_id: null
        })
      }
      
      console.error('获取用户企业信息失败:', error)
      return NextResponse.json(
        { error: '获取用户企业信息失败' },
        { status: 500 }
      )
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('获取用户企业信息失败:', error)
    return NextResponse.json(
      { error: '获取用户企业信息失败' },
      { status: 500 }
    )
  }
}