import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 强制动态渲染，避免缓存
export const dynamic = 'force-dynamic';

// 获取用户列表 (GET /api/admin/users)
export async function GET(request: NextRequest) {
  try {
    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: '管理员权限配置错误' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    // 1. 获取 Supabase Auth 用户列表（为确保前端分页正常，这里拉取足够大的页容量并在服务端统一分页）
    // 注意：如果用户量增长很大，可改为循环分页累积或改造为后端合并分页查询
    const perPageForFetch = 1000; // 单次拉取上限，当前规模足够
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: perPageForFetch,
    });

    if (authError) {
      console.error('获取auth用户列表失败:', authError);
      return NextResponse.json(
        { error: '获取用户列表失败: ' + authError.message },
        { status: 500 }
      );
    }

    let supabaseUsers = authUsers.users || [];

    // 2. 获取自定义认证用户列表
    const { data: customUsers, error: customError } = await supabaseAdmin
      .from('custom_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (customError) {
      console.error('获取自定义用户列表失败:', customError);
    }

    const customUsersList = customUsers || [];

    const customUserIds = customUsersList.map((user) => user.id);
    let customUserCompanies: Record<string, { id: string; name_zh: string | null; name_en: string | null }> = {};

    if (customUserIds.length > 0) {
      const { data: customCompanies, error: customCompanyError } = await supabaseAdmin
        .from('admin_companies')
        .select('id, name_zh, name_en, custom_user_id')
        .in('custom_user_id', customUserIds)
        .eq('is_active', true);

      if (customCompanyError) {
        console.error('获取自定义用户企业失败:', customCompanyError);
      } else if (customCompanies) {
        customUserCompanies = customCompanies.reduce((acc, company) => {
          if (company.custom_user_id) {
            acc[company.custom_user_id] = {
              id: company.id,
              name_zh: company.name_zh,
              name_en: company.name_en,
            };
          }
          return acc;
        }, {} as typeof customUserCompanies);
      }
    }

    // 如果有搜索条件，过滤 Supabase 用户
    if (search) {
      supabaseUsers = supabaseUsers.filter(user => 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.includes(search)
      );
    }

    // 处理 Supabase 用户，获取关联的企业信息
    const supabaseUsersWithCompany = await Promise.all(
      supabaseUsers.map(async (user) => {
        // 查询用户关联的企业
        const { data: company } = await supabaseAdmin!
          .from('admin_companies')
          .select('id, name_zh, name_en')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        return {
          id: user.id,
          email: user.email,
          phone_number: user.phone,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
          auth_type: 'supabase',
          company_id: company?.id || null,
          company: company ? {
            id: company.id,
            name_zh: company.name_zh,
            name_en: company.name_en
          } : null,
          created_at: user.created_at,
          last_login_at: user.last_sign_in_at,
          email_confirmed: !!user.email_confirmed_at,
          phone_confirmed: !!user.phone_confirmed_at,
          is_active: true,
          user_metadata: user.user_metadata
        };
      })
    );

    // 处理自定义用户
    let processedCustomUsers = customUsersList.map(user => {
      const company = customUserCompanies[user.id] || null;
      const wechatOpenId = user.wechat_openid || user.user_metadata?.wechat_openid || '';
      const phoneNumber = user.phone ? `${user.country_code || ''}${user.phone}` : '';

      return {
        id: user.id,
        email: user.email,
        phone_number: wechatOpenId || phoneNumber || '--',
        name: user.name || wechatOpenId || (phoneNumber ? `用户${phoneNumber.slice(-4)}` : '微信用户'),
        auth_type: 'custom',
        company_id: company?.id || null,
        company,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        email_confirmed: !!user.email,
        phone_confirmed: !!phoneNumber,
        is_active: user.is_active,
        user_metadata: user.user_metadata || {}
      };
    });

    // 如果有搜索条件，过滤自定义用户
    if (search) {
      processedCustomUsers = processedCustomUsers.filter(user => 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone_number?.includes(search) ||
        user.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 合并两种用户类型
    const allUsers = [...supabaseUsersWithCompany, ...processedCustomUsers];

    // 按创建时间排序（最新的在前）
    allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 应用分页（基于合并后的完整列表）
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedUsers = allUsers.slice(from, to);

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        current: page,
        pageSize: pageSize,
        total: allUsers.length,
        totalPages: Math.ceil(allUsers.length / pageSize),
        supabaseCount: supabaseUsersWithCompany.length,
        customCount: processedCustomUsers.length
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 创建用户 (POST /api/admin/users)
export async function POST(request: NextRequest) {
  try {
    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: '管理员权限配置错误' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, phone_number, password, company_id } = body;

    // 基本验证
    if (!email && !phone_number) {
      return NextResponse.json(
        { error: '邮箱或手机号必须至少提供一个' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: '密码是必填项' },
        { status: 400 }
      );
    }

    // 创建用户账户
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      phone: phone_number,
      password: password,
      email_confirm: true // 管理员创建的用户自动确认邮箱
    });

    if (authError) {
      console.error('创建用户账户失败:', authError);
      return NextResponse.json(
        { error: '创建用户失败: ' + authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: '创建用户失败：无法获取用户ID' },
        { status: 500 }
      );
    }

    // 如果指定了公司，创建关联关系
    if (company_id) {
      const { error: companyError } = await supabaseAdmin
        .from('admin_companies')
        .update({ user_id: userId })
        .eq('id', company_id);

      if (companyError) {
        console.error('关联企业失败:', companyError);
        // 不阻止用户创建，只记录错误
      }
    }

    // 获取完整的用户信息（包括关联的企业）
    const { data: userData, error: userFetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userFetchError) {
      console.error('获取创建的用户信息失败:', userFetchError);
      return NextResponse.json(
        { error: '创建用户成功但无法获取用户信息' },
        { status: 500 }
      );
    }

    // 获取关联的企业信息
    const { data: company } = await supabaseAdmin
      .from('admin_companies')
      .select('id, name_zh, name_en')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    const formattedUser = {
      id: userData.user.id,
      email: userData.user.email,
      phone_number: userData.user.phone,
      company_id: company?.id || null,
      company: company ? {
        id: company.id,
        name_zh: company.name_zh,
        name_en: company.name_en
      } : null,
      created_at: userData.user.created_at,
      email_confirmed: !!userData.user.email_confirmed_at,
    };

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
      data: formattedUser
    });

  } catch (error) {
    console.error('创建用户错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
