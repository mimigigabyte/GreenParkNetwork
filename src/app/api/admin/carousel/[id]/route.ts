import { NextRequest, NextResponse } from 'next/server'
import { 
  getCarouselImageById,
  updateCarouselImage,
  deleteCarouselImage,
  UpdateCarouselImageData
} from '@/lib/supabase/admin-carousel'
import { checkAdminAuth } from '@/lib/admin-auth'

// GET - 获取单个轮播图详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 检查管理员权限
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 })
  }

  try {
    const { id } = params

    console.log('📷 获取轮播图详情:', id)

    const result = await getCarouselImageById(id)

    if (!result) {
      return NextResponse.json({ 
        error: '轮播图不存在' 
      }, { status: 404 })
    }

    console.log('📷 轮播图详情获取成功:', result.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取轮播图详情失败:', error)
    return NextResponse.json({ 
      error: error.message || '获取轮播图详情失败' 
    }, { status: 500 })
  }
}

// PUT - 更新轮播图
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 检查管理员权限
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await request.json()

    console.log('📷 更新轮播图请求:', id, body)

    // 验证必填字段
    if (body.image_url !== undefined && !body.image_url) {
      return NextResponse.json({ 
        error: '图片地址不能为空' 
      }, { status: 400 })
    }

    const updateData: UpdateCarouselImageData = {}
    
    // 只更新提供的字段
    if (body.title_zh !== undefined) updateData.title_zh = body.title_zh || undefined
    if (body.title_en !== undefined) updateData.title_en = body.title_en || undefined
    if (body.description_zh !== undefined) updateData.description_zh = body.description_zh || undefined
    if (body.description_en !== undefined) updateData.description_en = body.description_en || undefined
    if (body.image_url !== undefined) updateData.image_url = body.image_url
    if (body.link_url !== undefined) updateData.link_url = body.link_url || undefined
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    console.log('📷 准备更新轮播图数据:', updateData)

    const result = await updateCarouselImage(id, updateData)

    console.log('📷 轮播图更新成功:', result.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('更新轮播图失败:', error)
    return NextResponse.json({ 
      error: error.message || '更新轮播图失败' 
    }, { status: 500 })
  }
}

// DELETE - 删除轮播图
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 检查管理员权限
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 })
  }

  try {
    const { id } = params

    console.log('📷 删除轮播图:', id)

    await deleteCarouselImage(id)

    console.log('📷 轮播图删除成功:', id)

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除轮播图失败:', error)
    return NextResponse.json({ 
      error: error.message || '删除轮播图失败' 
    }, { status: 500 })
  }
}