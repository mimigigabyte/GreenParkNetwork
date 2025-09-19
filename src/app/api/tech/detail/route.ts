import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || ''
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 500 })
    }

    const { data: tech, error } = await supabaseAdmin
      .from('admin_technologies')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .eq('review_status', 'published')
      .single()

    if (error || !tech) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    // Fetch related lookups in parallel
    const [cat, sub, country, zone, province] = await Promise.all([
      tech.category_id
        ? supabaseAdmin.from('admin_categories').select('id,name_zh,name_en').eq('id', tech.category_id).single()
        : Promise.resolve({ data: null }),
      tech.subcategory_id
        ? supabaseAdmin.from('admin_subcategories').select('id,name_zh,name_en').eq('id', tech.subcategory_id).single()
        : Promise.resolve({ data: null }),
      tech.company_country_id
        ? supabaseAdmin.from('admin_countries').select('id,name_zh,name_en,logo_url,code').eq('id', tech.company_country_id).single()
        : Promise.resolve({ data: null }),
      tech.company_development_zone_id
        ? supabaseAdmin.from('admin_development_zones').select('id,name_zh,name_en,code').eq('id', tech.company_development_zone_id).single()
        : Promise.resolve({ data: null }),
      tech.company_province_id
        ? supabaseAdmin.from('admin_provinces').select('id,name_zh,name_en,code').eq('id', tech.company_province_id).single()
        : Promise.resolve({ data: null })
    ])

    const product = {
      id: tech.id,
      companyName: tech.company_name_zh || '未知企业',
      companyNameEn: tech.company_name_en || tech.company_name_zh || 'Unknown Company',
      companyLogo: tech.company_logo_url || '',
      companyLogoUrl: tech.company_logo_url || '',
      solutionTitle: tech.name_zh || tech.name_en || '未知技术',
      solutionTitleEn: tech.name_en || tech.name_zh || 'Unknown Technology',
      solutionImage: tech.image_url || '',
      solutionThumbnail: tech.image_url || '',
      solutionDescription: tech.description_zh || tech.description_en || '',
      solutionDescriptionEn: tech.description_en || tech.description_zh || '',
      shortDescription: (tech.description_zh || tech.description_en || '').slice(0, 100) + '...',
      shortDescriptionEn: (tech.description_en || tech.description_zh || '').slice(0, 100) + '...',
      fullDescription: tech.description_zh || tech.description_en || '',
      fullDescriptionEn: tech.description_en || tech.description_zh || '',
      attachmentUrls: Array.isArray(tech.attachment_urls) ? tech.attachment_urls : [],
      attachmentNames: Array.isArray(tech.attachments) ? tech.attachments.map((a: any) => a.filename) : [],
      // labels
      categoryName: cat.data?.name_zh || '',
      categoryNameEn: cat.data?.name_en || '',
      subCategoryName: sub.data?.name_zh || '',
      subCategoryNameEn: sub.data?.name_en || '',
      countryName: country.data?.name_zh || '',
      countryNameEn: country.data?.name_en || '',
      countryFlagUrl: country.data?.logo_url || '',
      developmentZoneName: zone.data?.name_zh || '',
      developmentZoneNameEn: zone.data?.name_en || '',
      country: country.data?.code || '',
      province: province.data?.code || '',
      provinceName: province.data?.name_zh || '',
      provinceNameEn: province.data?.name_en || '',
      developmentZone: zone.data?.code || '',
      custom_label: tech.custom_label || '',
      featuredWeight: tech.featured_weight ?? 0,
      updateTime: tech.updated_at || tech.created_at,
      website_url: tech.website_url || ''
    }

    return NextResponse.json({ success: true, data: product })
  } catch (e) {
    console.error('tech detail error', e)
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 })
  }
}
