import { NextRequest, NextResponse } from 'next/server'
import { updateCarouselImagesOrder } from '@/lib/supabase/admin-carousel'
import { checkAdminAuth } from '@/lib/admin-auth'

// PUT - 批量更新轮播图排序
export async function PUT(request: NextRequest) {
  // 检查管理员权限
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    console.log('📷 批量更新轮播图排序请求:', body)

    // 验证请求数据
    if (!Array.isArray(body.updates)) {
      return NextResponse.json({ 
        error: '请求数据格式错误' 
      }, { status: 400 })
    }

    // 验证每个更新项
    for (const update of body.updates) {
      if (!update.id || typeof update.sort_order !== 'number') {
        return NextResponse.json({ 
          error: '更新数据格式错误：需要 id 和 sort_order' 
        }, { status: 400 })
      }
    }

    console.log('📷 准备更新排序:', body.updates)

    await updateCarouselImagesOrder(body.updates)

    console.log('📷 轮播图排序更新成功')

    return NextResponse.json({ message: '排序更新成功' })
  } catch (error) {
    console.error('批量更新轮播图排序失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '排序更新失败' 
    }, { status: 500 })
  }
}