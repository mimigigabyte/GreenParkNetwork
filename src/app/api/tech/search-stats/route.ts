import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - 获取搜索结果统计信息
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

    console.log('获取统计信息...');

    // 统计所有已发布的技术总数
    const { count: technologyCount } = await supabaseAdmin
      .from('admin_technologies')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('review_status', 'published');

    // 统计所有企业数量
    const { count: companyCount } = await supabaseAdmin
      .from('admin_companies')
      .select('*', { count: 'exact', head: true });

    console.log(`统计结果: 企业 ${companyCount}, 技术 ${technologyCount}`);

    const stats = {
      companyCount: companyCount || 0,
      technologyCount: technologyCount || 0,
      totalResults: technologyCount || 0
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取统计信息API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}