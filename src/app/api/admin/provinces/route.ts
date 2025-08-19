import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用service role key创建Supabase客户端
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - 获取所有省份或按国家筛选
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId')

    let query = supabase
      .from('admin_provinces')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (countryId) {
      query = query.eq('country_id', countryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取省份失败:', error)
      return NextResponse.json(
        { success: false, error: `获取省份失败: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// POST - 创建新省份
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('admin_provinces')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('创建省份失败:', error)
      return NextResponse.json(
        { success: false, error: `创建省份失败: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}