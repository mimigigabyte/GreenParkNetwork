import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const countries = [
      '中国',
      '美国',
      '日本',
      '德国',
      '英国',
      '法国',
      '韩国',
      '新加坡',
      '澳大利亚',
      '加拿大',
      '意大利',
      '西班牙',
      '荷兰',
      '瑞士',
      '瑞典',
      '挪威',
      '丹麦',
      '芬兰',
      '俄罗斯',
      '印度',
      '巴西',
      '墨西哥',
      '阿根廷',
      '南非'
    ];

    return NextResponse.json({
      success: true,
      data: countries
    });

  } catch (error) {
    console.error('获取国家列表错误:', error);
    return NextResponse.json(
      { error: '获取国家列表失败' },
      { status: 500 }
    );
  }
}