import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST - 用户上传文件到 Supabase Storage
export async function POST(request: NextRequest) {
  // 检查用户认证状态
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '需要用户认证' }, { status: 401 })
  }

  // 创建 Supabase 客户端（使用 service role key 用于上传）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase configuration not found' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'images'
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json({ error: '没有提供文件' }, { status: 400 })
    }

    console.log('📤 用户文件上传:', {
      name: file.name,
      size: file.size,
      type: file.type,
      bucket,
      folder
    })

    // 验证文件类型（统一支持图片与常见文档）
    const allowedTypes = new Set([
      // images
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      // pdf
      'application/pdf',
      // office docs
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // text
      'text/plain'
    ])
    if (file.type && (file.type.startsWith('image/') || allowedTypes.has(file.type))) {
      // ok
    } else {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 })
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    console.log('📤 生成的文件名:', fileName)

    // 上传文件到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Supabase Storage 上传错误:', error)
      
      if (error.message.includes('Bucket not found')) {
        return NextResponse.json({ 
          error: `存储桶 '${bucket}' 不存在` 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: `上传失败: ${error.message}` 
      }, { status: 500 })
    }

    console.log('✅ 文件上传成功:', data.path)

    // 获取公共URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    if (!publicData || !publicData.publicUrl) {
      return NextResponse.json({ 
        error: '无法生成文件访问URL' 
      }, { status: 500 })
    }

    console.log('✅ 公共URL生成成功:', publicData.publicUrl)

    return NextResponse.json({
      url: publicData.publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      path: data.path
    })

  } catch (error) {
    console.error('💥 文件上传过程中出现异常:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '上传失败，请重试' 
    }, { status: 500 })
  }
}
