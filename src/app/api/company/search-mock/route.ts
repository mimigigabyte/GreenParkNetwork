import { NextRequest, NextResponse } from 'next/server';

// 模拟企业数据
const mockCompanies = [
  {
    id: "mock-001",
    name: "深圳市腾讯计算机系统有限公司",
    creditCode: "914403001998072041",
    legalRepresentative: "马化腾",
    registeredDate: "1998-11-11",
    status: "存续",
    registrationNumber: "440301103212233",
    address: "深圳市南山区粤海街道麻雀岭工业区M-1栋、M-2栋、M-5栋201-203室"
  },
  {
    id: "mock-002", 
    name: "北京百度网讯科技有限公司",
    creditCode: "91110000802100433B",
    legalRepresentative: "梁志祥",
    registeredDate: "2001-06-05",
    status: "存续",
    registrationNumber: "110000008021004",
    address: "北京市海淀区上地十街10号百度大厦"
  },
  {
    id: "mock-003",
    name: "阿里巴巴(中国)有限公司", 
    creditCode: "913301087254808020",
    legalRepresentative: "张勇",
    registeredDate: "1999-09-09",
    status: "存续",
    registrationNumber: "330108000014576",
    address: "杭州市余杭区文一西路969号"
  },
  {
    id: "mock-004",
    name: "华为技术有限公司",
    creditCode: "914403001922038216", 
    legalRepresentative: "徐文伟",
    registeredDate: "1987-09-15",
    status: "存续",
    registrationNumber: "440301104001819",
    address: "深圳市龙岗区坂田华为总部办公楼"
  },
  {
    id: "mock-005",
    name: "小米科技有限责任公司",
    creditCode: "91110108555165137Q",
    legalRepresentative: "雷军", 
    registeredDate: "2010-03-03",
    status: "存续",
    registrationNumber: "110108012108067",
    address: "北京市海淀区清河中街68号华润五彩城"
  }
];

/**
 * 模拟企查查企业搜索API
 * 当真实API不可用时使用此接口进行功能演示
 */
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

    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 根据搜索关键字过滤企业数据
    const filteredCompanies = mockCompanies.filter(company => 
      company.name.includes(searchKey) ||
      company.legalRepresentative.includes(searchKey) ||
      company.address.includes(searchKey)
    );

    // 如果没有精确匹配，返回所有数据作为示例
    const results = filteredCompanies.length > 0 ? filteredCompanies : mockCompanies.slice(0, 3);

    console.log(`模拟企查查API: 搜索"${searchKey}", 返回${results.length}条结果`);

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      mock: true, // 标识这是模拟数据
      message: '当前使用模拟数据，实际部署时请配置有效的企查查API密钥'
    });

  } catch (error) {
    console.error('模拟企业搜索API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '搜索服务暂时不可用' 
      },
      { status: 500 }
    );
  }
}