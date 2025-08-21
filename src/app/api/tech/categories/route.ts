import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Fallback 分类数据
const fallbackCategories = [
  {
    id: 'energy-saving',
    name: '节能',
    nameEn: 'ENERGY SAVING',
    icon: 'default',
    count: 10,
    color: '#3B82F6'
  },
  {
    id: 'clean-energy',
    name: '清洁能源',
    nameEn: 'CLEAN ENERGY',
    icon: 'default',
    count: 8,
    color: '#10B981'
  },
  {
    id: 'clean-production',
    name: '清洁生产',
    nameEn: 'CLEAN PRODUCTION',
    icon: 'default',
    count: 12,
    color: '#F59E0B'
  },
  {
    id: 'new-energy-vehicle',
    name: '新能源汽车',
    nameEn: 'NEW ENERGY VEHICLE',
    icon: 'default',
    count: 15,
    color: '#EF4444'
  }
];

// GET - 获取产品分类
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始获取产品分类...');
    
    // 检查管理员客户端是否可用
    if (!supabaseAdmin) {
      console.warn('⚠️ supabaseAdmin 不可用，使用fallback数据');
      return NextResponse.json({
        success: true,
        data: fallbackCategories
      });
    }

    try {
      console.log('📊 从数据库获取分类数据...');

      // 获取所有分类（先不筛选启用状态）
      const { data: categories, error } = await supabaseAdmin
        .from('admin_categories')
        .select('id, name_zh, name_en, slug, sort_order')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ 获取分类失败:', error);
        console.warn('🔄 使用fallback数据');
        return NextResponse.json({
          success: true,
          data: fallbackCategories
        });
      }

      console.log(`✅ 找到 ${categories?.length} 个分类`);

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

      console.log('✅ 返回分类数据:', categoriesWithCount);

      return NextResponse.json({
        success: true,
        data: categoriesWithCount
      });
      
    } catch (dbError) {
      console.error('❌ 数据库查询失败:', dbError);
      console.warn('🔄 使用fallback数据');
      return NextResponse.json({
        success: true,
        data: fallbackCategories
      });
    }

  } catch (error) {
    console.error('❌ 获取分类API错误:', error);
    console.warn('🔄 最终fallback: 返回默认分类数据');
    
    // 最终fallback，确保API始终返回数据
    return NextResponse.json({
      success: true,
      data: fallbackCategories
    });
  }
}