import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥来绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 自动获取国旗图片的函数
async function getCountryFlag(countryName: string, countryCode: string): Promise<string> {
  try {
    // 使用国旗 API 服务
    const flagUrl = `https://flagcdn.com/w320/${countryCode}.png`
    
    // 验证URL是否可访问
    const response = await fetch(flagUrl, { method: 'HEAD' })
    if (response.ok) {
      return flagUrl
    }
    
    // 备选方案：使用其他国旗API
    const restCountriesUrl = `https://restcountries.com/v3.1/alpha/${countryCode}?fields=flags`
    const restResponse = await fetch(restCountriesUrl)
    if (restResponse.ok) {
      const data = await restResponse.json()
      return data.flags?.png || data.flags?.svg || ''
    }
    
    return ''
  } catch (error) {
    console.warn('获取国旗失败:', error)
    return ''
  }
}

// GET - 获取所有国家
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('admin_countries')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('获取国家失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建新国家
export async function POST(request: NextRequest) {
  try {
    const { name_zh, name_en, code, sort_order, is_active } = await request.json()

    // 基本验证
    if (!name_zh || !name_en || !code) {
      return NextResponse.json({ error: '国家名称和代码不能为空' }, { status: 400 })
    }

    // 检查是否为中国
    if (code.toLowerCase() === 'china' || code.toLowerCase() === 'cn') {
      return NextResponse.json({ error: '中国的信息请在"国内省份/经开区管理"中管理' }, { status: 400 })
    }

    // 检查代码是否唯一
    const { data: existingCountry } = await supabase
      .from('admin_countries')
      .select('id')
      .eq('code', code)
      .single()

    if (existingCountry) {
      return NextResponse.json({ error: '国家代码已存在，请使用其他代码' }, { status: 400 })
    }

    // 自动获取国旗图片
    const logo_url = await getCountryFlag(name_en, code)

    // 先不包含 logo_url，等表结构修复后再添加
    const insertData: any = {
      name_zh,
      name_en,
      code: code.toLowerCase(),
      sort_order: sort_order || 0,
      is_active: is_active ?? true
    }

    // 如果数据库支持 logo_url 列，则添加
    if (logo_url) {
      insertData.logo_url = logo_url
    }

    const { data, error } = await supabase
      .from('admin_countries')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('创建国家失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}