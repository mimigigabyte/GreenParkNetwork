import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 强制动态渲染，禁用所有缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - 搜索技术产品
export async function GET(request: NextRequest) {
  try {
    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      console.error('supabaseAdmin is not available');
      return NextResponse.json(
        { error: '服务配置错误' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';
    const category = searchParams.get('category') || '';
    const subCategory = searchParams.get('subCategory') || '';
    const country = searchParams.get('country') || '';
    const province = searchParams.get('province') || '';
    const developmentZone = searchParams.get('developmentZone') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortBy = searchParams.get('sortBy') || 'updateTime';

    console.log('🔍 技术搜索API调用时间:', new Date().toISOString());
    console.log('搜索参数:', { keyword, category, subCategory, country, province, developmentZone, page, pageSize, sortBy });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 先恢复基本查询，避免关联查询错误
    let query = supabaseAdmin
      .from('admin_technologies')
      .select('*', { count: 'exact' })
      .eq('is_active', true) // 只显示启用的技术
      .eq('review_status', 'published'); // 只显示已发布的技术

    // 关键词搜索
    if (keyword) {
      query = query.or(`name_zh.ilike.%${keyword}%,name_en.ilike.%${keyword}%,description_zh.ilike.%${keyword}%`);
    }

    // 分类筛选
    if (category) {
      // 先查找分类ID
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from('admin_categories')
        .select('id')
        .eq('slug', category)
        .single();
      
      if (categoryError) {
        console.log('分类查找错误:', categoryError);
      } else if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }

    // 子分类筛选
    if (subCategory) {
      const { data: subCategoryData, error: subCategoryError } = await supabaseAdmin
        .from('admin_subcategories')
        .select('id')
        .eq('slug', subCategory)
        .single();
      
      if (subCategoryError) {
        console.log('子分类查找错误:', subCategoryError);
      } else if (subCategoryData) {
        query = query.eq('subcategory_id', subCategoryData.id);
      }
    }

    // 国别筛选
    if (country) {
      const { data: countryData, error: countryError } = await supabaseAdmin
        .from('admin_countries')
        .select('id')
        .eq('code', country)
        .single();
      
      if (countryError) {
        console.log('国别查找错误:', countryError);
      } else if (countryData) {
        query = query.eq('company_country_id', countryData.id);
      }
    }

    // 省份筛选
    if (province) {
      const { data: provinceData, error: provinceError } = await supabaseAdmin
        .from('admin_provinces')
        .select('id')
        .eq('code', province)
        .single();
      
      if (provinceError) {
        console.log('省份查找错误:', provinceError);
      } else if (provinceData) {
        query = query.eq('company_province_id', provinceData.id);
      }
    }

    // 经开区筛选
    if (developmentZone) {
      const { data: zoneData, error: zoneError } = await supabaseAdmin
        .from('admin_development_zones')
        .select('id')
        .eq('code', developmentZone)
        .single();
      
      if (zoneError) {
        console.log('经开区查找错误:', zoneError);
      } else if (zoneData) {
        query = query.eq('company_development_zone_id', zoneData.id);
      }
    }

    // 排序
    let orderField = 'updated_at';
    let orderAscending = false;

    switch (sortBy) {
      case 'updateTime':
        orderField = 'updated_at';
        orderAscending = false;
        break;
      case 'nameAsc':
        orderField = 'name_zh';
        orderAscending = true;
        break;
      case 'nameDesc':
        orderField = 'name_zh';
        orderAscending = false;
        break;
    }

    const { data: technologies, error, count } = await query
      .order(orderField, { ascending: orderAscending })
      .range(from, to);

    if (error) {
      console.error('搜索技术失败:', error);
      return NextResponse.json(
        { error: '搜索失败: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`找到 ${count} 个技术，返回 ${technologies?.length} 个`);
    
    // 详细日志：显示前几个技术的关键信息
    if (technologies && technologies.length > 0) {
      console.log('🔍 返回的技术列表（前3个）:');
      technologies.slice(0, 3).forEach((tech, index) => {
        console.log(`  ${index + 1}. ${tech.name_zh} (ID: ${tech.id}, 状态: ${tech.review_status}, 更新时间: ${tech.updated_at})`);
      });
    }

    // 获取所有需要的关联数据ID
    const categoryIds = [...new Set(technologies?.map(tech => tech.category_id).filter(Boolean))];
    const subcategoryIds = [...new Set(technologies?.map(tech => tech.subcategory_id).filter(Boolean))];
    const countryIds = [...new Set(technologies?.map(tech => tech.company_country_id).filter(Boolean))];
    const developmentZoneIds = [...new Set(technologies?.map(tech => tech.company_development_zone_id).filter(Boolean))];

    // 并行查询所有关联数据
    const [categoriesData, subcategoriesData, countriesData, developmentZonesData] = await Promise.all([
      categoryIds.length > 0 ? supabaseAdmin.from('admin_categories').select('id, name_zh, name_en').in('id', categoryIds) : { data: [] },
      subcategoryIds.length > 0 ? supabaseAdmin.from('admin_subcategories').select('id, name_zh, name_en').in('id', subcategoryIds) : { data: [] },
      countryIds.length > 0 ? supabaseAdmin.from('admin_countries').select('id, name_zh, name_en, logo_url').in('id', countryIds) : { data: [] },
      developmentZoneIds.length > 0 ? supabaseAdmin.from('admin_development_zones').select('id, name_zh, name_en').in('id', developmentZoneIds) : { data: [] }
    ]);

    // 创建查找映射
    const categoriesMap = new Map((categoriesData.data || []).map(item => [item.id, item]));
    const subcategoriesMap = new Map((subcategoriesData.data || []).map(item => [item.id, item]));
    const countriesMap = new Map((countriesData.data || []).map(item => [item.id, item]));
    const developmentZonesMap = new Map((developmentZonesData.data || []).map(item => [item.id, item]));

    // 数据转换，使用数据库中的企业信息
    const products = technologies?.map(tech => {
      // 处理附件信息，支持新旧格式
      let attachmentUrls: string[] = [];
      let attachmentNames: string[] = [];

      if (tech.attachments && Array.isArray(tech.attachments)) {
        // 新格式：attachments 数组包含 { url, filename, size, type } 对象
        attachmentUrls = tech.attachments.map((att: any) => att.url);
        attachmentNames = tech.attachments.map((att: any) => att.filename);
      } else if (tech.attachment_urls && Array.isArray(tech.attachment_urls)) {
        // 旧格式：attachment_urls 字符串数组
        attachmentUrls = tech.attachment_urls;
        attachmentNames = tech.attachment_urls.map((url: string) => {
          // 从URL中提取或生成友好的文件名
          const urlPath = url.split('/').pop() || '';
          const parts = urlPath.split('.');
          if (parts.length > 1) {
            const ext = parts.pop();
            return `技术资料.${ext}`;
          }
          return '技术资料';
        });
      } else {
        // 兼容性：检查是否在attachment_urls字段中保存了完整附件信息
        attachmentUrls = [];
        attachmentNames = [];
      }

      return {
        id: tech.id,
        companyName: tech.company_name_zh || '未知企业',
        companyNameEn: tech.company_name_en || 'Unknown Company',
        companyLogo: tech.company_logo_url || '',
        companyLogoUrl: tech.company_logo_url || '',
        solutionTitle: tech.name_zh || tech.name_en || '未知技术',
        solutionImage: tech.image_url || '',
        solutionThumbnail: tech.image_url || '',
        solutionDescription: tech.description_zh || tech.description_en || '',
        shortDescription: (tech.description_zh || tech.description_en || '').slice(0, 100) + '...',
        fullDescription: tech.description_zh || tech.description_en || '',
        attachmentUrls, // 附件URL数组
        attachmentNames, // 附件原始文件名数组
        // 新增标签字段 - 从映射中获取
        categoryName: categoriesMap.get(tech.category_id)?.name_zh || '',
        subCategoryName: subcategoriesMap.get(tech.subcategory_id)?.name_zh || '',
        countryName: countriesMap.get(tech.company_country_id)?.name_zh || '',
        countryFlagUrl: countriesMap.get(tech.company_country_id)?.logo_url || '',
        developmentZoneName: developmentZonesMap.get(tech.company_development_zone_id)?.name_zh || '',
        // 原有字段保持兼容性
        category: category || '',
        subCategory: '',
        country: tech.company_country_id || '',
        province: tech.company_province_id || '',
        developmentZone: tech.company_development_zone_id || '',
        hasContact: true,
        updateTime: tech.updated_at || tech.created_at
      };
    }) || [];

    const result = {
      products,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      categories: [],
      stats: {
        companyCount: 0,
        technologyCount: count || 0,
        totalResults: count || 0
      }
    };

    const response = NextResponse.json({
      success: true,
      data: result
    });
    
    // 添加强制禁用缓存的头部
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;

  } catch (error) {
    console.error('技术搜索API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}