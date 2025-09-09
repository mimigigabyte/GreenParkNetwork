import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('admin_technologies')
      .select('id, name_en, name_zh, description_en, description_zh, image_url, website_url, company_name_en, company_name_zh, company_country_id, category_id, subcategory_id, review_status, created_at, updated_at')
      .ilike('description_en', `%ID: ${id}%`)
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) return NextResponse.json({ exists: false })

    const record = data[0]
    // Fetch category/subcategory names for better UI display
    let category_name_zh: string | null = null
    let subcategory_name_zh: string | null = null
    if (record.category_id) {
      const { data: cat } = await supabase.from('admin_categories').select('name_zh').eq('id', record.category_id).single()
      category_name_zh = cat?.name_zh || null
    }
    if (record.subcategory_id) {
      const { data: sub } = await supabase.from('admin_subcategories').select('name_zh').eq('id', record.subcategory_id).single()
      subcategory_name_zh = sub?.name_zh || null
    }
    return NextResponse.json({ exists: true, record: { ...record, category_name_zh, subcategory_name_zh } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}
