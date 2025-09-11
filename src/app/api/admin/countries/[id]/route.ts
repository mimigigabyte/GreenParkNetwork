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

function clip(v: any, max: number): string | null {
  if (v == null) return null
  const s = String(v)
  return s.length <= max ? s : s.slice(0, max)
}

async function uploadDataUrlToStorage(dataUrl: string, code: string): Promise<string | null> {
  try {
    const m = dataUrl.match(/^data:(.+?);base64,(.*)$/)
    if (!m) return null
    const mime = m[1]
    const b64 = m[2]
    const buffer = Buffer.from(b64, 'base64')
    const ext = mime.includes('png') ? 'png' : mime.includes('svg') ? 'svg' : mime.includes('webp') ? 'webp' : 'jpg'
    const objectPath = `country-flags/${code.toLowerCase()}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('images')
      .upload(objectPath, buffer, { contentType: mime, upsert: true })
    if (upErr) {
      console.warn('上传国别图片到存储失败:', upErr.message)
      return null
    }
    const { data } = supabase.storage.from('images').getPublicUrl(objectPath)
    return data.publicUrl || null
  } catch (e: any) {
    console.warn('解析/上传 data URL 失败:', e?.message || e)
    return null
  }
}

// PUT - 更新国家
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name_zh, name_en, code, logo_url, sort_order, is_active } = await request.json()

    // 基本验证
    if (!name_zh || !name_en || !code) {
      return NextResponse.json({ error: '国家名称和代码不能为空' }, { status: 400 })
    }

    // 检查是否为中国
    if (code.toLowerCase() === 'china' || code.toLowerCase() === 'cn') {
      return NextResponse.json({ error: '中国的信息请在"国内省份/经开区管理"中管理' }, { status: 400 })
    }

    // 检查代码是否与其他国家冲突
    const { data: existingCountry } = await supabase
      .from('admin_countries')
      .select('id')
      .eq('code', code)
      .neq('id', params.id)
      .single()

    if (existingCountry) {
      return NextResponse.json({ error: '国家代码已存在，请使用其他代码' }, { status: 400 })
    }

    // 如果没有提供logo_url，自动获取国旗；若提供的是 data: URL，上传到存储后改为可公开访问的 https 链接
    let finalLogoUrl = logo_url
    if (finalLogoUrl && typeof finalLogoUrl === 'string' && finalLogoUrl.startsWith('data:')) {
      const uploaded = await uploadDataUrlToStorage(finalLogoUrl, code)
      if (uploaded) {
        finalLogoUrl = uploaded
      } else {
        // 上传失败则清空，避免存入超长/无效 data URL
        finalLogoUrl = ''
      }
    }
    if (!finalLogoUrl) {
      finalLogoUrl = await getCountryFlag(name_en, code)
    }

    // 先不包含 logo_url，等表结构修复后再添加
    const updateData: any = {
      name_zh: clip(name_zh, 100) || '',
      name_en: clip(name_en, 100) || '',
      code: clip(code.toLowerCase(), 10) || '',
      sort_order: sort_order || 0,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString()
    }

    // 如果数据库支持 logo_url 列，则添加
    if (finalLogoUrl) {
      // 最终只存 http(s) 链接，避免过长的 data: URL 触发数据库长度限制
      updateData.logo_url = clip(finalLogoUrl, 500)
    }

    const { data, error } = await supabase
      .from('admin_countries')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('更新国家失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '国家不存在' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除国家
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 先检查国家是否存在
    const { data: country, error: fetchError } = await supabase
      .from('admin_countries')
      .select('code, name_zh')
      .eq('id', params.id)
      .single()

    if (fetchError || !country) {
      return NextResponse.json({ error: '国家不存在' }, { status: 404 })
    }

    // 不允许删除中国
    if (country.code === 'china') {
      return NextResponse.json({ error: '不能删除中国' }, { status: 400 })
    }

    // 检查是否有关联的公司或其他数据
    // TODO: 根据实际业务需求添加关联检查

    const { error } = await supabase
      .from('admin_countries')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('删除国家失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: '国家删除成功' })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
