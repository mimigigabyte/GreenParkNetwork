import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, phone, newPassword } = await request.json();

    if ((!email && !phone) || !newPassword) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数（邮箱或手机号和新密码）' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度至少6位' },
        { status: 400 }
      );
    }

    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase管理员配置缺失' },
        { status: 500 }
      );
    }

    // 首先获取用户列表，查找对应邮箱的用户
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('获取用户列表失败:', listError);
      return NextResponse.json(
        { success: false, error: '重置密码失败' },
        { status: 500 }
      );
    }

    // 查找对应邮箱或手机号的用户
    const user = users?.users?.find(u => 
      (email && u.email === email) || (phone && u.phone === phone)
    );
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 使用用户ID更新密码
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('更新密码失败:', updateError);
      return NextResponse.json(
        { success: false, error: '重置密码失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        message: '密码重置成功'
      }
    });

  } catch (error) {
    console.error('重置密码错误:', error);
    return NextResponse.json(
      { success: false, error: '重置密码失败' },
      { status: 500 }
    );
  }
}