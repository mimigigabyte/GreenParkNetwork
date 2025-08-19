import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// 更新用户 (PUT /api/admin/users/[id])
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: '管理员权限配置错误' },
        { status: 500 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { email, phone_number, company_id } = body;

    // 基本验证
    if (!email && !phone_number) {
      return NextResponse.json(
        { error: '邮箱或手机号必须至少提供一个' },
        { status: 400 }
      );
    }

    // 更新用户基本信息
    const updateData: any = {};
    if (email) updateData.email = email;
    if (phone_number) updateData.phone = phone_number;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

      if (updateError) {
        console.error('更新用户信息失败:', updateError);
        return NextResponse.json(
          { error: '更新用户失败: ' + updateError.message },
          { status: 400 }
        );
      }
    }

    // 更新企业关联
    if (company_id !== undefined) {
      // 先清除当前用户的企业关联
      await supabaseAdmin
        .from('admin_companies')
        .update({ user_id: null })
        .eq('user_id', userId);

      // 如果指定了新企业，建立关联
      if (company_id) {
        const { error: companyError } = await supabaseAdmin
          .from('admin_companies')
          .update({ user_id: userId })
          .eq('id', company_id);

        if (companyError) {
          console.error('关联企业失败:', companyError);
          return NextResponse.json(
            { error: '关联企业失败: ' + companyError.message },
            { status: 500 }
          );
        }
      }
    }

    // 获取更新后的用户信息
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('获取更新后用户信息失败:', userError);
      return NextResponse.json(
        { error: '获取用户信息失败' },
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
      message: '用户信息更新成功',
      data: formattedUser
    });

  } catch (error) {
    console.error('更新用户错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 删除用户 (DELETE /api/admin/users/[id])
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: '管理员权限配置错误' },
        { status: 500 }
      );
    }

    const userId = params.id;

    // 先清除企业关联
    await supabaseAdmin
      .from('admin_companies')
      .update({ user_id: null })
      .eq('user_id', userId);

    // 删除用户账户
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('删除用户失败:', deleteError);
      return NextResponse.json(
        { error: '删除用户失败: ' + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}