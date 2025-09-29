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
    const category = searchParams.get('category') || null;
    const subCategory = searchParams.get('subCategory') || null;
    const country = searchParams.get('country') || null;
    const province = searchParams.get('province') || null;
    const developmentZone = searchParams.get('developmentZone') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortBy = searchParams.get('sortBy') || 'updateTime';

    console.log('🔍 技术搜索API调用时间:', new Date().toISOString());
    console.log('📥 接收到的原始参数:', { keyword, category, subCategory, country, province, developmentZone, page, pageSize, sortBy });
    console.log('📊 联合筛选条件检查：', {
      hasKeyword: !!keyword,
      hasCategory: !!category,
      hasSubCategory: !!subCategory,
      hasCountry: !!country,
      hasProvince: !!province,
      hasDevelopmentZone: !!developmentZone
    });
    
    // 验证筛选条件的完整性
    if (province && !country) {
      console.warn('⚠️ 检测到省份筛选但没有国家筛选，这可能导致结果不准确');
    }
    if (developmentZone && !province) {
      console.warn('⚠️ 检测到经开区筛选但没有省份筛选，这可能导致结果不准确');
    }

    const filterConditions = {
      keyword: !!keyword,
      category: !!category,
      subCategory: !!subCategory,
      country: !!country,
      province: !!province,
      developmentZone: !!developmentZone
    };

    console.log('🎯 开始应用联合筛选条件:', filterConditions);

    // 解析筛选条件所需的ID
    let categoryId: string | null = null;
    if (category) {
      console.log('🔍 开始查找分类:', category);
      if (category.includes('-') && category.length > 30) {
        categoryId = category;
        console.log('✅ 使用UUID作为分类ID:', categoryId);
      } else {
        const { data: slugData, error: slugError } = await supabaseAdmin
          .from('admin_categories')
          .select('id')
          .eq('slug', category)
          .single();

        if (!slugError && slugData) {
          categoryId = slugData.id;
          console.log('✅ 通过slug找到分类ID:', category, '->', categoryId);
        } else {
          console.log('❌ 未找到分类:', category);
        }
      }
    }

    let subCategoryId: string | null = null;
    if (subCategory) {
      console.log('🔍 开始查找子分类:', subCategory);
      if (subCategory.includes('-') && subCategory.length > 30) {
        subCategoryId = subCategory;
        console.log('✅ 使用UUID作为子分类ID:', subCategoryId);
      } else {
        const { data, error } = await supabaseAdmin
          .from('admin_subcategories')
          .select('id')
          .eq('slug', subCategory)
          .single();

        if (!error && data) {
          subCategoryId = data.id;
          console.log('✅ 通过slug找到子分类ID:', subCategory, '->', subCategoryId);
        } else {
          console.log('❌ 未找到子分类:', subCategory);
        }
      }
    }

    let countryId: string | null = null;
    if (country) {
      console.log('🔍 开始查找国家:', country);
      if (country.includes('-') && country.length > 30) {
        countryId = country;
        console.log('✅ 使用UUID作为国家ID:', countryId);
      } else {
        const { data, error } = await supabaseAdmin
          .from('admin_countries')
          .select('id')
          .eq('code', country)
          .single();

        if (!error && data) {
          countryId = data.id;
          console.log('✅ 通过code找到国家ID:', country, '->', countryId);
        } else {
          console.log('❌ 未找到国家:', country);
        }
      }
    }

    let provinceId: string | null = null;
    if (province) {
      console.log('🔍 开始查找省份:', province);
      if (province.includes('-') && province.length > 30) {
        provinceId = province;
        console.log('✅ 使用UUID作为省份ID:', provinceId);
      } else {
        const { data, error } = await supabaseAdmin
          .from('admin_provinces')
          .select('id')
          .eq('code', province)
          .single();

        if (!error && data) {
          provinceId = data.id;
          console.log('✅ 通过code找到省份ID:', province, '->', provinceId);
        } else {
          console.log('❌ 未找到省份:', province);
        }
      }
    }

    let developmentZoneId: string | null = null;
    if (developmentZone) {
      console.log('🔍 开始查找经开区:', developmentZone);
      if (developmentZone.includes('-') && developmentZone.length > 30) {
        developmentZoneId = developmentZone;
        console.log('✅ 使用UUID作为经开区ID:', developmentZoneId);
      } else {
        const { data, error } = await supabaseAdmin
          .from('admin_development_zones')
          .select('id')
          .eq('code', developmentZone)
          .single();

        if (!error && data) {
          developmentZoneId = data.id;
          console.log('✅ 通过code找到经开区ID:', developmentZone, '->', developmentZoneId);
        } else {
          console.log('❌ 未找到经开区:', developmentZone);
        }
      }
    }

    if (keyword) {
      console.log('✅ 已应用关键词筛选:', keyword);
    }
    if (categoryId) {
      console.log('✅ 已应用分类筛选条件');
    }
    if (subCategoryId) {
      console.log('✅ 已应用子分类筛选条件');
    }
    if (countryId) {
      console.log('✅ 已应用国家筛选条件');
    }
    if (provinceId) {
      console.log('✅ 已应用省份筛选条件');
    }
    if (developmentZoneId) {
      console.log('✅ 已应用经开区筛选条件');
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

    const applyCommonFilters = (builder: any) => {
      let q = builder
        .eq('is_active', true)
        .eq('review_status', 'published');

      if (keyword) {
        q = q.or(`name_zh.ilike.%${keyword}%,name_en.ilike.%${keyword}%,description_zh.ilike.%${keyword}%`);
      }

      if (categoryId) {
        q = q.eq('category_id', categoryId);
      }

      if (subCategoryId) {
        q = q.eq('subcategory_id', subCategoryId);
      }

      if (countryId) {
        q = q.eq('company_country_id', countryId);
      }

      if (provinceId) {
        q = q.eq('company_province_id', provinceId);
      }

      if (developmentZoneId) {
        q = q.eq('company_development_zone_id', developmentZoneId);
      }

      return q;
    };

    const hasDescriptionConditions = [
      'and(description_zh.not.is.null,description_zh.not.eq.)',
      'and(description_en.not.is.null,description_en.not.eq.)'
    ].join(',');

    const noDescriptionConditions = [
      'and(description_zh.is.null,description_en.is.null)',
      'and(description_zh.is.null,description_en.eq.)',
      'and(description_zh.eq.,description_en.is.null)',
      'and(description_zh.eq.,description_en.eq.)'
    ].join(',');

    const applyDescriptionPreference = (builder: any, mode: 'with' | 'without' | 'all') => {
      if (mode === 'with') {
        return builder.or(hasDescriptionConditions);
      }
      if (mode === 'without') {
        return builder.or(noDescriptionConditions);
      }
      return builder;
    };

    const buildQuery = (columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
      const selectOptions: Record<string, any> = {};
      if (options?.count) {
        selectOptions.count = options.count;
      }
      if (options?.head) {
        selectOptions.head = options.head;
      }

      const selectArgs = Object.keys(selectOptions).length > 0 ? selectOptions : undefined;

      const builder = supabaseAdmin
        .from('admin_technologies')
        .select(columns, selectArgs);

      return applyCommonFilters(builder);
    };

    const applyOrdering = (builder: any) => builder
      .order('featured_weight', { ascending: false })
      .order(orderField, { ascending: orderAscending })
      .order('id', { ascending: true });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      count: withDescriptionCount,
      error: withDescriptionError
    } = await applyDescriptionPreference(buildQuery('id', { count: 'exact', head: true }), 'with');

    if (withDescriptionError) {
      console.error('统计有描述的技术数量失败:', withDescriptionError);
      return NextResponse.json(
        { error: '搜索失败: ' + withDescriptionError.message },
        { status: 500 }
      );
    }

    const {
      count: withoutDescriptionCount,
      error: withoutDescriptionError
    } = await applyDescriptionPreference(buildQuery('id', { count: 'exact', head: true }), 'without');

    if (withoutDescriptionError) {
      console.error('统计无描述的技术数量失败:', withoutDescriptionError);
      return NextResponse.json(
        { error: '搜索失败: ' + withoutDescriptionError.message },
        { status: 500 }
      );
    }

    const withCount = withDescriptionCount || 0;
    const withoutCount = withoutDescriptionCount || 0;
    const totalCount = withCount + withoutCount;

    console.log('📊 技术描述分布统计:', {
      withDescription: withCount,
      withoutDescription: withoutCount,
      total: totalCount
    });

    let describedTechnologies: any[] = [];
    if (withCount > 0 && from < withCount) {
      const describedFrom = from;
      const describedTo = Math.min(to, withCount - 1);

      const { data, error } = await applyDescriptionPreference(
        applyOrdering(buildQuery('*')),
        'with'
      ).range(describedFrom, describedTo);

      if (error) {
        console.error('查询有描述的技术失败:', error);
        return NextResponse.json(
          { error: '搜索失败: ' + error.message },
          { status: 500 }
        );
      }

      describedTechnologies = data || [];
    }

    let undescribedTechnologies: any[] = [];
    if (withoutCount > 0 && to >= withCount) {
      const undescribedFrom = Math.max(0, from - withCount);
      const undescribedTo = Math.min(to - withCount, withoutCount - 1);

      if (undescribedFrom <= undescribedTo) {
        const { data, error } = await applyDescriptionPreference(
          applyOrdering(buildQuery('*')),
          'without'
        ).range(undescribedFrom, undescribedTo);

        if (error) {
          console.error('查询无描述的技术失败:', error);
          return NextResponse.json(
            { error: '搜索失败: ' + error.message },
            { status: 500 }
          );
        }

        undescribedTechnologies = data || [];
      }
    }

    const technologies = [...describedTechnologies, ...undescribedTechnologies];

    console.log(`🎯 联合查询完成: 找到 ${totalCount} 个技术，返回 ${technologies.length} 个`);
    console.log('📊 筛选效果:', {
      appliedFilters: Object.values(filterConditions).filter(Boolean).length,
      totalResults: totalCount,
      returnedResults: technologies.length
    });

    if (technologies.length > 0) {
      console.log('🔍 返回的技术列表（前3个）:');
      technologies.slice(0, 3).forEach((tech, index) => {
        console.log(`  ${index + 1}. ${tech.name_zh} (ID: ${tech.id}, 状态: ${tech.review_status}, 更新时间: ${tech.updated_at})`);
      });
    }

    // 性能优化：批量获取关联数据
    const categoryIds = Array.from(new Set(technologies?.map(tech => tech.category_id).filter(Boolean)));
    const subcategoryIds = Array.from(new Set(technologies?.map(tech => tech.subcategory_id).filter(Boolean)));
    const countryIds = Array.from(new Set(technologies?.map(tech => tech.company_country_id).filter(Boolean)));
    const developmentZoneIds = Array.from(new Set(technologies?.map(tech => tech.company_development_zone_id).filter(Boolean)));

    console.log('🔄 批量查询关联数据:', {
      categories: categoryIds.length,
      subcategories: subcategoryIds.length,
      countries: countryIds.length,
      developmentZones: developmentZoneIds.length
    });

    // 并行查询所有关联数据，优化查询性能
    const [categoriesData, subcategoriesData, countriesData, developmentZonesData] = await Promise.all([
      categoryIds.length > 0 ? supabaseAdmin.from('admin_categories').select('id, name_zh, name_en').in('id', categoryIds) : { data: [] },
      subcategoryIds.length > 0 ? supabaseAdmin.from('admin_subcategories').select('id, name_zh, name_en').in('id', subcategoryIds) : { data: [] },
      countryIds.length > 0 ? supabaseAdmin.from('admin_countries').select('id, name_zh, name_en, logo_url').in('id', countryIds) : { data: [] },
      developmentZoneIds.length > 0 ? supabaseAdmin.from('admin_development_zones').select('id, name_zh, name_en').in('id', developmentZoneIds) : { data: [] }
    ]);
    
    console.log('✅ 关联数据查询完成');

    // 创建查找映射
    const categoriesMap = new Map((categoriesData.data || []).map((item: any) => [item.id, item]));
    const subcategoriesMap = new Map((subcategoriesData.data || []).map((item: any) => [item.id, item]));
    const countriesMap = new Map((countriesData.data || []).map((item: any) => [item.id, item]));
    const developmentZonesMap = new Map((developmentZonesData.data || []).map((item: any) => [item.id, item]));

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
        attachmentUrls, // 附件URL数组
        attachmentNames, // 附件原始文件名数组
        // 新增标签字段 - 从映射中获取
        categoryName: categoriesMap.get(tech.category_id)?.name_zh || '',
        categoryNameEn: categoriesMap.get(tech.category_id)?.name_en || '',
        subCategoryName: subcategoriesMap.get(tech.subcategory_id)?.name_zh || '',
        subCategoryNameEn: subcategoriesMap.get(tech.subcategory_id)?.name_en || '',
        countryName: countriesMap.get(tech.company_country_id)?.name_zh || '',
        countryNameEn: countriesMap.get(tech.company_country_id)?.name_en || '',
        countryFlagUrl: countriesMap.get(tech.company_country_id)?.logo_url || '',
        developmentZoneName: developmentZonesMap.get(tech.company_development_zone_id)?.name_zh || '',
        developmentZoneNameEn: developmentZonesMap.get(tech.company_development_zone_id)?.name_en || '',
        custom_label: tech.custom_label || '', // 自定义标签
        featuredWeight: tech.featured_weight ?? 0,
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
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      categories: [],
      stats: {
        companyCount: 0,
        technologyCount: totalCount,
        totalResults: totalCount
      }
    };

    const response = NextResponse.json({
      success: true,
      data: result
    });
    
    // 性能优化：如果没有筛选条件，允许短期缓存
    const hasFilters = Object.values(filterConditions).some(Boolean);
    if (hasFilters || keyword) {
      // 有筛选条件时，禁用缓存确保数据实时性
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    } else {
      // 无筛选条件时，允许短期缓存提高性能
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    }
    
    return response;

  } catch (error) {
    console.error('技术搜索API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
