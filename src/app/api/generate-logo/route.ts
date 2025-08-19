import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服务角色密钥
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 生成企业Logo的服务端实现
function generateLogoServer(companyName: string, size: number = 256): Buffer {
  // 由于服务端没有Canvas API，我们需要使用node-canvas或其他方案
  // 这里先返回一个简单的SVG实现
  
  // 获取企业名称的前四个字符
  const firstFourChars = getFirstFourChars(companyName);
  
  // 计算字符位置 - 严格按照eo.jpg的布局
  const centerX = size / 2;
  const centerY = size / 2;
  const fontSize = Math.floor(size / 3.5); // 更大的字体，参考图片中文字占比很大
  const spacing = fontSize * 1.3; // 适中的间距，给文字留出呼吸空间
  
  // 创建SVG - 严格参考eo.jpg的亮绿色背景和布局
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#84c7a3" rx="8" ry="8"/>
      <text x="${centerX - spacing/2}" y="${centerY - spacing/2}" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${firstFourChars[0] || ''}</text>
      <text x="${centerX + spacing/2}" y="${centerY - spacing/2}" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${firstFourChars[1] || ''}</text>
      <text x="${centerX - spacing/2}" y="${centerY + spacing/2}" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${firstFourChars[2] || ''}</text>
      <text x="${centerX + spacing/2}" y="${centerY + spacing/2}" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${firstFourChars[3] || ''}</text>
    </svg>
  `;
  
  return Buffer.from(svg);
}

function getFirstFourChars(companyName: string): string[] {
  // 移除常见的企业后缀
  const cleanName = companyName
    .replace(/(有限公司|股份有限公司|有限责任公司|集团|公司|科技|技术)$/g, '')
    .replace(/\s+/g, ''); // 移除空格

  // 如果清理后的名称长度>=4，取前4个字符
  if (cleanName.length >= 4) {
    return cleanName.slice(0, 4).split('');
  }
  
  // 如果清理后的名称不足4个字符，补充原名称的字符
  const remainingChars = companyName.replace(/\s+/g, '').slice(cleanName.length);
  const result = cleanName.split('');
  
  for (let i = 0; i < remainingChars.length && result.length < 4; i++) {
    const char = remainingChars[i];
    // 避免重复添加已有的字符
    if (!result.includes(char)) {
      result.push(char);
    }
  }
  
  // 如果仍然不足4个字符，用第一个字符填充
  while (result.length < 4 && result.length > 0) {
    result.push(result[0]);
  }
  
  return result.slice(0, 4);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, size = 256 } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: '企业名称不能为空' },
        { status: 400 }
      );
    }

    // 生成logo
    const logoBuffer = generateLogoServer(companyName, size);
    
    // 生成文件名
    const timestamp = Date.now();
    const fileName = `company-logos/generated-${timestamp}.svg`;

    // 上传到Supabase Storage - 使用正确的bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, logoBuffer, {
        contentType: 'image/svg+xml',
        upsert: false
      });

    if (uploadError) {
      console.error('上传logo失败:', uploadError);
      console.error('上传详情:', { fileName, contentType: 'image/svg+xml' });
      return NextResponse.json(
        { error: '上传logo失败: ' + uploadError.message },
        { status: 500 }
      );
    }

    console.log('logo上传成功:', uploadData);

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log('生成的logo URL:', urlData.publicUrl);

    return NextResponse.json({
      success: true,
      logoUrl: urlData.publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('生成logo错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}