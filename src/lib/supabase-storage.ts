import { supabase, supabaseAdmin } from '@/lib/supabase';

/**
 * 附件信息接口
 */
export interface FileAttachment {
  url: string
  filename: string
  size: number
  type: string
}

/**
 * 上传文件到 Supabase Storage
 * @param file 要上传的文件
 * @param bucket 存储桶名称
 * @param folder 文件夹路径
 * @returns 上传成功后的公共URL
 */
export async function uploadFileToSupabase(
  file: File,
  bucket: string = 'images',
  folder: string = 'uploads'
): Promise<string> {
  console.log(`开始上传文件到存储桶 '${bucket}', 文件夹 '${folder}'`);
  console.log(`文件信息: ${file.name}, 大小: ${file.size}字节, 类型: ${file.type}`);

  try {
    // 使用服务端API上传，避免前端RLS权限问题
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('folder', folder);

    // 检查当前是否在管理员页面
    const isAdminPage = window.location.pathname.startsWith('/admin');
    const uploadUrl = isAdminPage ? '/api/admin/upload' : '/api/upload';
    
    // 准备请求头
    const headers: Record<string, string> = {};
    
    // 如果不是管理员页面，需要添加用户认证token（为 getSession 增加超时，并回退到本地token）
    if (!isAdminPage) {
      let token: string | null = null
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('getSession timeout')), 3000))
        ]) as { data: { session?: any } }
        token = sessionResult?.data?.session?.access_token || null
      } catch {}
      if (!token) {
        try { token = localStorage.getItem('custom_auth_token') } catch {}
      }
      if (!token) {
        try { token = localStorage.getItem('access_token') } catch {}
      }
      if (token) headers['Authorization'] = `Bearer ${token}`
    }

    // 增加请求超时，避免前端长时间等待
    const controller = new AbortController()
    const pending = fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    })
    const timeout = setTimeout(() => controller.abort('timeout'), 30000)
    let response: Response
    try {
      response = await pending
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      let errorMessage = `上传失败: HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        // 如果响应不是JSON格式，使用响应文本
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ 文件上传成功:', result.url);

    return result.url;
  } catch (error) {
    console.error('❌ 上传过程中发生错误:', error);
    throw error;
  }
}

/**
 * 删除文件从 Supabase Storage
 * @param url 文件的公共URL
 * @param bucket 存储桶名称
 */
export async function deleteFileFromSupabase(
  url: string,
  bucket: string = 'images'
): Promise<void> {
  try {
    // 使用管理员客户端避免RLS权限问题
    const client = supabaseAdmin || supabase;
    
    // 从URL中提取文件路径
    const urlParts = url.split('/');
    const fileName = urlParts.slice(-2).join('/'); // folder/filename.ext

    const { error } = await client.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`删除失败: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}

/**
 * 上传用户头像
 */
export async function uploadUserAvatar(file: File): Promise<string> {
  return uploadFileToSupabase(file, 'images', 'avatars');
}

/**
 * 上传企业Logo
 */
export async function uploadCompanyLogo(file: File): Promise<string> {
  return uploadFileToSupabase(file, 'images', 'company-logos');
}

/**
 * 上传轮播图
 */
export async function uploadCarouselImage(file: File): Promise<string> {
  return uploadFileToSupabase(file, 'images', 'carousel');
}

/**
 * 上传技术图片
 */
export async function uploadTechnologyImage(file: File): Promise<string> {
  return uploadFileToSupabase(file, 'images', 'technologies');
}

/**
 * 上传附件并返回完整附件信息
 * @param file 要上传的文件
 * @param bucket 存储桶名称
 * @param folder 文件夹路径
 * @returns 包含原始文件名的附件信息
 */
export async function uploadFileWithInfo(
  file: File,
  bucket: string = 'images',
  folder: string = 'uploads'
): Promise<FileAttachment> {
  console.log(`开始上传文件到存储桶 '${bucket}', 文件夹 '${folder}'`)
  console.log(`文件信息: ${file.name}, 大小: ${file.size}字节, 类型: ${file.type}`)

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)
    formData.append('folder', folder)

    // 非管理员统一走 /api/upload，带认证；为 getSession 加超时并回退本地 token
    const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    const uploadUrl = isAdminPage ? '/api/admin/upload' : '/api/upload'
    const headers: Record<string, string> = {}

    if (!isAdminPage) {
      let token: string | null = null
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('getSession timeout')), 3000))
        ]) as { data: { session?: any } }
        token = sessionResult?.data?.session?.access_token || null
      } catch {}
      if (!token) { try { token = localStorage.getItem('custom_auth_token') || null } catch {} }
      if (!token) { try { token = localStorage.getItem('access_token') || null } catch {} }
      if (token) headers['Authorization'] = `Bearer ${token}`
    }

    const controller = new AbortController()
    const pending = fetch(uploadUrl, { method: 'POST', headers, body: formData, signal: controller.signal })
    const timeout = setTimeout(() => controller.abort('timeout'), 30000)
    let resp: Response
    try {
      resp = await pending
    } finally {
      clearTimeout(timeout)
    }

    if (!resp.ok) {
      let errorMessage = `上传失败: HTTP ${resp.status}`
      try { const e = await resp.json(); errorMessage = e.error || errorMessage } catch { /* ignore */ }
      throw new Error(errorMessage)
    }

    const result = await resp.json()
    return {
      url: result.url as string,
      filename: result.filename || file.name,
      size: result.size || file.size,
      type: result.type || file.type
    }
  } catch (error) {
    console.error('上传过程中发生错误:', error)
    if (error instanceof Error) throw error
    throw new Error('上传失败，请重试')
  }
}

/**
 * 批量上传附件
 * @param files 要上传的文件数组
 * @param bucket 存储桶名称
 * @param folder 文件夹路径
 * @returns 附件信息数组
 */
export async function uploadMultipleFilesWithInfo(
  files: File[],
  bucket: string = 'images',
  folder: string = 'uploads'
): Promise<FileAttachment[]> {
  const uploadPromises = files.map(file => uploadFileWithInfo(file, bucket, folder));
  return Promise.all(uploadPromises);
}
