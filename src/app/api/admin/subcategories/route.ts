import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥来绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  throw new Error('缺少必要的Supabase环境变量')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - 根据分类ID获取子分类
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    if (!categoryId) {
      return NextResponse.json({ error: '分类ID不能为空' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin_subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('获取子分类失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建新子分类
export async function POST(request: NextRequest) {
  try {
    const { name_zh, name_en, slug, sort_order, is_active, category_id } = await request.json()

    // 基本验证
    if (!name_zh || !name_en || !slug || !category_id) {
      return NextResponse.json({ error: '子分类名称、标识符和所属分类不能为空' }, { status: 400 })
    }

    // 检查分类是否存在
    const { data: category } = await supabase
      .from('admin_categories')
      .select('id')
      .eq('id', category_id)
      .single()

    if (!category) {
      return NextResponse.json({ error: '所属分类不存在' }, { status: 400 })
    }

    // 检查同一分类下的slug是否唯一
    const { data: existingSubcategory } = await supabase
      .from('admin_subcategories')
      .select('id')
      .eq('category_id', category_id)
      .eq('slug', slug)
      .single()

    if (existingSubcategory) {
      return NextResponse.json({ error: '该分类下已存在相同标识符的子分类' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin_subcategories')
      .insert({
        name_zh,
        name_en,
        slug,
        sort_order: sort_order || 0,
        is_active: is_active ?? true,
        category_id
      })
      .select()
      .single()

    if (error) {
      console.error('创建子分类失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}