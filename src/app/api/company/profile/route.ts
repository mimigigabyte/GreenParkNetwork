import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 获取认证token
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 如果有token，使用token验证用户身份
    let user = null;
    if (token) {
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }
    
    // 如果token验证失败，尝试从session获取
    if (!user) {
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      if (!sessionError && sessionUser) {
        user = sessionUser;
      }
    }
    
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

    // 保存企业信息到数据库
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
    // 获取认证token
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 如果有token，使用token验证用户身份
    let user = null;
    if (token) {
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }
    
    // 如果token验证失败，尝试从session获取
    if (!user) {
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      if (!sessionError && sessionUser) {
        user = sessionUser;
      }
    }
    
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
    // 获取认证token
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 如果有token，使用token验证用户身份
    let user = null;
    if (token) {
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }
    
    // 如果token验证失败，尝试从session获取
    if (!user) {
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      if (!sessionError && sessionUser) {
        user = sessionUser;
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      );
    }

    // 获取用户的企业信息
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