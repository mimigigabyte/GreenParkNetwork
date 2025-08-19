import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥来绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

// 调试信息
console.log('🔧 API路由环境变量检查:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已设置' : '未设置')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  throw new Error('缺少必要的Supabase环境变量')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - 获取所有分类
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('admin_categories')
      .select(`
        *,
        subcategories:admin_subcategories(*)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('获取分类失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const { name_zh, name_en, slug, sort_order, is_active } = await request.json()

    // 基本验证
    if (!name_zh || !name_en || !slug) {
      return NextResponse.json({ error: '分类名称和标识符不能为空' }, { status: 400 })
    }

    // 检查slug是否唯一
    const { data: existingCategory } = await supabase
      .from('admin_categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCategory) {
      return NextResponse.json({ error: '标识符已存在，请使用其他标识符' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin_categories')
      .insert({
        name_zh,
        name_en,
        slug,
        sort_order: sort_order || 0,
        is_active: is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('创建分类失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}