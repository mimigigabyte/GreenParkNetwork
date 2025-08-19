import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - 获取产品分类
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

    console.log('开始获取分类数据...');

    // 获取所有分类（先不筛选启用状态）
    const { data: categories, error } = await supabaseAdmin
      .from('admin_categories')
      .select('id, name_zh, name_en, slug, sort_order')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('获取分类失败:', error);
      return NextResponse.json(
        { error: '获取分类失败: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`找到 ${categories?.length} 个分类`);

    // 英文名称映射表
    const englishNameMap: { [key: string]: string } = {
      'energy-saving': 'ENERGY SAVING',
      'clean-energy': 'CLEAN ENERGY', 
      'clean-production': 'CLEAN PRODUCTION',
      'new-energy-vehicle': 'NEW ENERGY VEHICLE'
    };

    // 简化处理，暂时不统计技术数量
    const categoriesWithCount = categories?.map(category => {
      const categoryId = category.slug || category.id.toString();
      return {
        id: categoryId,
        name: category.name_zh || category.name_en || '未命名分类',
        nameEn: englishNameMap[categoryId] || 'UNNAMED CATEGORY',
        icon: 'default', // 暂时固定图标
        count: 10, // 暂时固定数量，后续优化
        color: '#3B82F6' // 默认颜色，因为color字段不存在
      };
    }) || [];

    console.log('返回分类数据:', categoriesWithCount);

    return NextResponse.json({
      success: true,
      data: categoriesWithCount
    });

  } catch (error) {
    console.error('获取分类API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}