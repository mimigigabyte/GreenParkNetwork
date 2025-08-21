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
    
    // 如果不是管理员页面，需要添加用户认证token
    if (!isAdminPage) {
      // 从 Supabase 获取当前用户的访问token
      const token = await supabase.auth.getSession().then(({ data: { session } }) => 
        session?.access_token
      );
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

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
  console.log(`开始上传文件到存储桶 '${bucket}', 文件夹 '${folder}'`);
  console.log(`文件信息: ${file.name}, 大小: ${file.size}字节, 类型: ${file.type}`);

  // 使用管理员客户端避免RLS权限问题
  const client = supabaseAdmin || supabase;
  if (!client) {
    throw new Error('Supabase 客户端未初始化');
  }

  // 生成唯一文件名
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  console.log(`生成的文件名: ${fileName}`);

  try {
    // 添加上传超时控制
    const uploadPromise = client.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('上传超时，请检查网络连接或文件大小')), 30000)
    );

    const result = await Promise.race([uploadPromise, timeoutPromise]);
    const { data, error } = result as { data: any; error: any };

    if (error) {
      console.error('Supabase上传错误:', error);
      
      // 提供更友好的错误信息
      if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
        throw new Error(`存储桶 '${bucket}' 不存在。请检查存储配置。`);
      }
      if (error.message.includes('The resource already exists')) {
        throw new Error(`文件已存在，请重试或重命名文件。`);
      }
      if (error.message.includes('413') || error.message.includes('too large')) {
        throw new Error(`文件太大，请选择小于10MB的文件。`);
      }
      
      throw new Error(`上传失败: ${error.message}`);
    }

    if (!data || !data.path) {
      throw new Error('上传成功但未返回文件路径');
    }

    console.log('文件上传成功到Supabase:', data);

    // 获取公共URL
    const { data: publicData } = client.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!publicData || !publicData.publicUrl) {
      throw new Error('无法生成文件访问URL');
    }

    console.log('生成的公共URL:', publicData.publicUrl);
    
    // 返回完整的附件信息
    return {
      url: publicData.publicUrl,
      filename: file.name, // 保存原始文件名
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('上传过程中发生错误:', error);
    
    // 重新抛出更友好的错误信息
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('上传失败，请重试');
    }
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