import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

function extractObjectPath(publicUrl: string, bucket: string) {
  try {
    const url = new URL(publicUrl)
    const decodePath = decodeURIComponent(url.pathname)
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = decodePath.indexOf(marker)
    if (index === -1) {
      return null
    }
    return decodePath.substring(index + marker.length)
  } catch (error) {
    console.warn('解析文件URL失败:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, error: '存储服务未配置' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const url = body?.url as string | undefined
  const bucket = (body?.bucket as string | undefined) || 'images'

  if (!url) {
    return NextResponse.json({ success: false, error: '缺少文件URL' }, { status: 400 })
  }

  const objectPath = extractObjectPath(url, bucket)
  if (!objectPath) {
    return NextResponse.json({ success: false, error: '无法解析文件路径' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([objectPath])

  if (error) {
    console.error('删除文件失败:', error)
    return NextResponse.json({ success: false, error: error.message || '删除文件失败' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
