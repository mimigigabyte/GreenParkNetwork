import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/custom-auth';

// 创建带有service role的Supabase客户端用于查询自定义用户
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 通用用户认证函数
async function authenticateUser(request: NextRequest) {
  console.log('🔍 开始用户认证检查...')
  
  const authHeader = request.headers.get('Authorization');
  console.log('🔍 Authorization header:', authHeader ? 'Bearer ***' + authHeader.substring(authHeader.length - 10) : 'null')
  
  let token = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 1. 尝试自定义JWT认证
  if (token) {
    try {
      console.log('🔍 尝试验证自定义JWT token...')
      const decoded = verifyToken(token);
      console.log('🔍 JWT解码结果:', decoded ? { userId: decoded.userId, type: decoded.type } : 'null')
      
      if (decoded && decoded.type === 'custom') {
        // 从自定义用户表获取用户信息（使用service role绕过RLS）
        const { data: customUser, error } = await supabaseAdmin
          .from('custom_users')
          .select('*')
          .eq('id', decoded.userId)
          .eq('is_active', true)
          .single();

        console.log('🔍 自定义用户查询结果:', { found: !!customUser, error })

        if (!error && customUser) {
          console.log('✅ 自定义认证成功:', customUser.id)
          return {
            id: customUser.id,
            email: customUser.email,
            phone: `${customUser.country_code}${customUser.phone}`,
            authType: 'custom'
          };
        }
      }
    } catch (error) {
      console.log('❌ 自定义token验证失败:', error);
    }
  }

  // 2. 尝试Supabase认证
  if (token) {
    console.log('🔍 尝试Supabase token验证...')
    const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
    console.log('🔍 Supabase token验证结果:', { found: !!tokenUser, error: tokenError })
    
    if (!tokenError && tokenUser) {
      console.log('✅ Supabase认证成功:', tokenUser.id)
      return {
        id: tokenUser.id,
        email: tokenUser.email,
        phone: tokenUser.phone,
        authType: 'supabase'
      };
    }
  }
  
  // 3. 尝试从session获取（仅限Supabase）
  console.log('🔍 尝试Supabase session验证...')
  const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
  console.log('🔍 Supabase session验证结果:', { found: !!sessionUser, error: sessionError })
  
  if (!sessionError && sessionUser) {
    console.log('✅ Supabase session认证成功:', sessionUser.id)
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      phone: sessionUser.phone,
      authType: 'supabase'
    };
  }

  console.log('❌ 所有认证方式都失败')
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // 使用通用认证函数
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const requirement = body.requirement as string;
    const companyName = body.companyName as string;
    const country = body.country as string;
    const province = body.province as string;
    const economicZone = body.economicZone as string;
    const logoUrl = body.logoUrl as string;
    const companyType = body.companyType as string;
    const address = body.address as string;
    const industryCode = body.industryCode as string;
    const annualOutput = body.annualOutput as string;
    const contactPerson = body.contactPerson as string;
    const contactPhone = body.contactPhone as string;
    const contactEmail = body.contactEmail as string;
    const creditCode = body.creditCode as string;

    // 基本验证
    if (!companyName || !country || !companyType || !contactPerson || !contactPhone || !contactEmail) {
      return NextResponse.json(
        { error: '请填写必填字段' },
        { status: 400 }
      );
    }

    // Logo URL 已经通过前端上传到 Supabase Storage 获得

    // 查找对应的国家、省份、开发区ID
    let countryId = null;
    let provinceId = null;
    let developmentZoneId = null;

    // 获取国家ID
    if (country) {
      const { data: countryData } = await supabase
        .from('admin_countries')
        .select('id')
        .eq('code', country)
        .single();
      countryId = countryData?.id;
    }

    // 获取省份ID
    if (province) {
      const { data: provinceData } = await supabase
        .from('admin_provinces')
        .select('id')
        .eq('code', province)
        .single();
      provinceId = provinceData?.id;
    }

    // 获取开发区ID
    if (economicZone && economicZone !== 'none') {
      const { data: zoneData } = await supabase
        .from('admin_development_zones')
        .select('id')
        .eq('code', economicZone)
        .single();
      developmentZoneId = zoneData?.id;
    }

    // 保存企业信息到数据库（所有用户都使用admin_companies表）
    const insertData = {
      user_id: user.id,
      name_zh: companyName,
      country_id: countryId,
      province_id: provinceId,
      development_zone_id: developmentZoneId,
      company_type: companyType,
      address: address || null,
      industry_code: industryCode || null,
      annual_output_value: annualOutput ? parseFloat(annualOutput) : null,
      contact_person: contactPerson,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      logo_url: logoUrl,
      credit_code: creditCode || null, // 统一社会信用代码
      is_active: true
    };

    console.log('创建企业，logo URL:', logoUrl);

    const { data: companyData, error: insertError } = await supabase
      .from('admin_companies')
      .insert(insertData)
      .select(`
        *,
        country:admin_countries(*),
        province:admin_provinces(*),
        development_zone:admin_development_zones(*)
      `)
      .single();

    if (insertError) {
      console.error('保存企业信息失败:', insertError);
      return NextResponse.json(
        { error: '保存企业信息失败: ' + insertError.message },
        { status: 500 }
      );
    }

    console.log('企业信息提交成功:', companyData);

    return NextResponse.json({
      success: true,
      message: '企业信息提交成功',
      data: companyData
    });

  } catch (error) {
    console.error('企业信息提交错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 使用通用认证函数
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const companyName = body.companyName as string;
    const country = body.country as string;
    const province = body.province as string;
    const economicZone = body.economicZone as string;
    const logoUrl = body.logoUrl as string;
    const companyType = body.companyType as string;
    const address = body.address as string;
    const industryCode = body.industryCode as string;
    const annualOutput = body.annualOutput as string;
    const contactPerson = body.contactPerson as string;
    const contactPhone = body.contactPhone as string;
    const contactEmail = body.contactEmail as string;
    const creditCode = body.creditCode as string;

    // 基本验证
    if (!companyName || !country || !companyType || !contactPerson || !contactPhone || !contactEmail) {
      return NextResponse.json(
        { error: '请填写必填字段' },
        { status: 400 }
      );
    }

    // 查找对应的国家、省份、开发区ID
    let countryId = null;
    let provinceId = null;
    let developmentZoneId = null;

    // 获取国家ID
    if (country) {
      const { data: countryData } = await supabase
        .from('admin_countries')
        .select('id')
        .eq('code', country)
        .single();
      countryId = countryData?.id;
    }

    // 获取省份ID
    if (province) {
      const { data: provinceData } = await supabase
        .from('admin_provinces')
        .select('id')
        .eq('code', province)
        .single();
      provinceId = provinceData?.id;
    }

    // 获取开发区ID
    if (economicZone && economicZone !== 'none') {
      const { data: zoneData } = await supabase
        .from('admin_development_zones')
        .select('id')
        .eq('code', economicZone)
        .single();
      developmentZoneId = zoneData?.id;
    }

    // 准备更新数据
    const updateData: any = {
      name_zh: companyName,
      country_id: countryId,
      province_id: provinceId,
      development_zone_id: developmentZoneId,
      company_type: companyType,
      address: address || null,
      industry_code: industryCode || null,
      annual_output_value: annualOutput ? parseFloat(annualOutput) : null,
      contact_person: contactPerson,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      credit_code: creditCode || null // 统一社会信用代码
    };

    // 更新 logo URL
    if (logoUrl) {
      updateData.logo_url = logoUrl;
      console.log('保存logo URL到数据库:', logoUrl);
    } else {
      console.log('没有logo URL需要保存');
    }

    // 查找用户的企业信息
    const { data: userCompany } = await supabase
      .from('admin_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!userCompany) {
      return NextResponse.json(
        { error: '未找到可更新的企业信息' },
        { status: 404 }
      );
    }

    const { data: companyData, error: updateError } = await supabase
      .from('admin_companies')
      .update(updateData)
      .eq('id', userCompany.id)
      .select(`
        *,
        country:admin_countries(*),
        province:admin_provinces(*),
        development_zone:admin_development_zones(*)
      `)
      .single();

    if (updateError) {
      console.error('更新企业信息失败:', updateError);
      return NextResponse.json(
        { error: '更新企业信息失败: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('企业信息更新成功:', companyData);

    return NextResponse.json({
      success: true,
      message: '企业信息更新成功',
      data: companyData
    });

  } catch (error) {
    console.error('企业信息更新错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 使用通用认证函数
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }

    // 获取用户的企业信息（所有用户都使用admin_companies表）
    const { data: companyData, error: selectError } = await supabase
      .from('admin_companies')
      .select(`
        *,
        country:admin_countries(*),
        province:admin_provinces(*),
        development_zone:admin_development_zones(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('获取企业信息失败:', selectError);
      return NextResponse.json(
        { error: '获取企业信息失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: companyData || null
    });

  } catch (error) {
    console.error('获取企业信息错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}