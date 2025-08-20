import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    if (!country) {
      return NextResponse.json(
        { error: '缺少国家参数' },
        { status: 400 }
      );
    }

    // 只有中国有省份数据
    if (country === '中国') {
      const provinces = [
        '北京市',
        '天津市',
        '上海市',
        '重庆市',
        '河北省',
        '山西省',
        '辽宁省',
        '吉林省',
        '黑龙江省',
        '江苏省',
        '浙江省',
        '安徽省',
        '福建省',
        '江西省',
        '山东省',
        '河南省',
        '湖北省',
        '湖南省',
        '广东省',
        '海南省',
        '四川省',
        '贵州省',
        '云南省',
        '陕西省',
        '甘肃省',
        '青海省',
        '台湾省',
        '内蒙古自治区',
        '广西壮族自治区',
        '西藏自治区',
        '宁夏回族自治区',
        '新疆维吾尔自治区',
        '香港特别行政区',
        '澳门特别行政区'
      ];

      return NextResponse.json({
        success: true,
        data: provinces
      });
    } else {
      // 其他国家没有省份概念
      return NextResponse.json({
        success: true,
        data: []
      });
    }

  } catch (error) {
    console.error('获取省份列表错误:', error);
    return NextResponse.json(
      { error: '获取省份列表失败' },
      { status: 500 }
    );
  }
}