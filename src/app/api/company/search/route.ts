import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies, formatCompanyInfo } from '@/api/qichacha';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchKey = searchParams.get('q');

    if (!searchKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: '搜索关键字不能为空' 
        },
        { status: 400 }
      );
    }

    if (searchKey.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: '搜索关键字至少需要2个字符' 
        },
        { status: 400 }
      );
    }

    // 调用企查查API搜索企业
    const result = await searchCompanies(searchKey);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || '企业搜索失败' 
        },
        { status: 500 }
      );
    }

    // 格式化返回数据
    const companies = result.data?.map(formatCompanyInfo) || [];

    return NextResponse.json({
      success: true,
      data: companies,
      total: companies.length,
    });

  } catch (error) {
    console.error('企业搜索API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}