import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Fallback 筛选选项数据
const fallbackFilterOptions = {
  countries: [
    { value: 'CN', label: '中国', labelEn: 'China' },
    { value: 'US', label: '美国', labelEn: 'United States' },
    { value: 'JP', label: '日本', labelEn: 'Japan' },
    { value: 'DE', label: '德国', labelEn: 'Germany' }
  ],
  provinces: [
    { value: 'BJ', label: '北京', labelEn: 'Beijing', countryId: 1 },
    { value: 'SH', label: '上海', labelEn: 'Shanghai', countryId: 1 },
    { value: 'GD', label: '广东', labelEn: 'Guangdong', countryId: 1 },
    { value: 'JS', label: '江苏', labelEn: 'Jiangsu', countryId: 1 }
  ],
  developmentZones: [
    { value: 'SZ-STZ', label: '深圳经济特区', labelEn: 'Shenzhen SEZ', provinceId: 1 },
    { value: 'SH-PD', label: '上海浦东新区', labelEn: 'Shanghai Pudong', provinceId: 2 }
  ],
  categories: [
    { 
      value: 'energy-saving', 
      label: '节能', 
      labelEn: 'Energy Saving',
      subcategories: [
        { value: 'energy-efficiency', label: '节能技术', labelEn: 'Energy Efficiency' }
      ]
    },
    { 
      value: 'clean-energy', 
      label: '清洁能源', 
      labelEn: 'Clean Energy',
      subcategories: [
        { value: 'solar-power', label: '太阳能', labelEn: 'Solar Power' }
      ]
    }
  ]
};

// GET - 获取筛选选项
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始获取筛选选项...');
    
    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      console.warn('⚠️ supabaseAdmin 不可用，使用fallback数据');
      return NextResponse.json({
        success: true,
        data: fallbackFilterOptions
      });
    }

    try {
      console.log('📊 从数据库获取筛选选项数据...');

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
      
    } catch (dbError) {
      console.error('❌ 数据库查询失败:', dbError);
      console.warn('🔄 使用fallback数据');
      return NextResponse.json({
        success: true,
        data: fallbackFilterOptions
      });
    }

  } catch (error) {
    console.error('❌ 获取筛选选项API错误:', error);
    console.warn('🔄 最终fallback: 返回默认筛选选项数据');
    
    // 最终fallback，确保API始终返回数据
    return NextResponse.json({
      success: true,
      data: fallbackFilterOptions
    });
  }
}