import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

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

    // 使用 Supabase Auth Admin API 获取用户列表
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: page,
      perPage: pageSize,
    });

    if (authError) {
      console.error('获取auth用户列表失败:', authError);
      return NextResponse.json(
        { error: '获取用户列表失败: ' + authError.message },
        { status: 500 }
      );
    }

    let users = authUsers.users || [];

    // 如果有搜索条件，过滤用户
    if (search) {
      users = users.filter(user => 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.includes(search)
      );
    }

    // 获取每个用户关联的企业信息
    const usersWithCompany = await Promise.all(
      users.map(async (user) => {
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
          company_id: company?.id || null,
          company: company ? {
            id: company.id,
            name_zh: company.name_zh,
            name_en: company.name_en
          } : null,
          created_at: user.created_at,
          email_confirmed: !!user.email_confirmed_at,
          user_metadata: user.user_metadata
        };
      })
    );

    // 如果有搜索条件，还要考虑企业名称搜索
    const filteredUsers = search ? 
      usersWithCompany.filter(user => 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone_number?.includes(search) ||
        user.company?.name_zh?.includes(search)
      ) : usersWithCompany;

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      pagination: {
        current: page,
        pageSize: pageSize,
        total: filteredUsers.length // 注意：这里只是当前页面的总数，实际应该从 auth API 获取总数
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