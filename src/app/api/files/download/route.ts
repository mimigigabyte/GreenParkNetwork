import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename');

    if (!fileUrl) {
      return NextResponse.json(
        { error: '缺少文件URL参数' },
        { status: 400 }
      );
    }

    // 从URL中提取文件路径
    const urlParts = fileUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: '无效的文件URL格式' },
        { status: 400 }
      );
    }

    const [bucketName, ...fileParts] = urlParts[1].split('/');
    const filePath = fileParts.join('/');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    // 从Supabase Storage获取文件
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('下载文件失败:', error);
      return NextResponse.json(
        { error: '文件下载失败: ' + error.message },
        { status: 404 }
      );
    }

    // 获取文件类型
    const contentType = getContentType(filename || filePath);

    // 获取要下载的文件名
    const downloadFilename = filename || getFilenameFromPath(filePath);
    
    // 正确编码文件名以支持中文
    const encodedFilename = encodeURIComponent(downloadFilename);
    
    // 创建安全的ASCII文件名作为fallback
    const safeFilename = downloadFilename.replace(/[^\x00-\x7F]/g, '_');
    
    // 设置响应头
    const response = new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'private, max-age=0',
      },
    });

    return response;

  } catch (error) {
    console.error('文件下载API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

function getFilenameFromPath(filePath: string): string {
  return filePath.split('/').pop() || 'download';
}