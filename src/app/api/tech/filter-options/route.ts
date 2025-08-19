import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - 获取筛选选项
export async function GET(request: NextRequest) {
  try {
    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: '服务配置错误' },
        { status: 500 }
      );
    }

    // 获取国家选项
    const { data: countries } = await supabaseAdmin
      .from('admin_countries')
      .select('id, name_zh, name_en, code')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    // 获取省份选项（仅中国的省份）
    const { data: provinces } = await supabaseAdmin
      .from('admin_provinces')
      .select('id, name_zh, name_en, code, country_id')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    // 获取开发区选项
    const { data: developmentZones } = await supabaseAdmin
      .from('admin_development_zones')
      .select('id, name_zh, name_en, code, province_id')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    // 获取分类选项
    const { data: categories } = await supabaseAdmin
      .from('admin_categories')
      .select(`
        id,
        name_zh,
        name_en,
        slug,
        subcategories:admin_subcategories(
          id,
          name_zh,
          name_en,
          slug,
          is_enabled
        )
      `)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    const filterOptions = {
      countries: countries?.map(country => ({
        value: country.code,
        label: country.name_zh,
        labelEn: country.name_en
      })) || [],
      
      provinces: provinces?.map(province => ({
        value: province.code,
        label: province.name_zh,
        labelEn: province.name_en,
        countryId: province.country_id
      })) || [],
      
      developmentZones: developmentZones?.map(zone => ({
        value: zone.code,
        label: zone.name_zh,
        labelEn: zone.name_en,
        provinceId: zone.province_id
      })) || [],
      
      categories: categories?.map(category => ({
        value: category.slug,
        label: category.name_zh,
        labelEn: category.name_en,
        subcategories: category.subcategories?.filter(sub => sub.is_enabled).map(sub => ({
          value: sub.slug,
          label: sub.name_zh,
          labelEn: sub.name_en
        })) || []
      })) || []
    };

    return NextResponse.json({
      success: true,
      data: filterOptions
    });

  } catch (error) {
    console.error('获取筛选选项API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}