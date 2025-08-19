import crypto from 'crypto';

// 企查查API响应接口
export interface QichachaCompanyInfo {
  KeyNo: string;
  Name: string;
  CreditCode: string;
  StartDate: string;
  OperName: string;
  Status: string;
  No: string;
  Address: string;
}

export interface QichachaApiResponse {
  Paging: {
    PageSize: number;
    PageIndex: number;
    TotalRecords: number;
  };
  Result: QichachaCompanyInfo[];
  Status: string;
  Message: string;
  OrderNumber: string;
}

/**
 * 生成企查查API认证Token
 * Token = MD5(key + Timespan + SecretKey)
 */
function generateQichachaToken(key: string, timespan: string, secretKey: string): string {
  const input = key + timespan + secretKey;
  return crypto.createHash('md5').update(input).digest('hex').toUpperCase();
}

/**
 * 调用企查查企业模糊搜索API
 */
export async function searchCompanies(searchKey: string): Promise<{
  success: boolean;
  data?: QichachaCompanyInfo[];
  error?: string;
}> {
  try {
    const apiKey = process.env.QICHACHA_API_KEY;
    const secretKey = process.env.QICHACHA_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      throw new Error('企查查API密钥或SecretKey未配置');
    }

    console.log('企查查API调用开始:', { 
      searchKey, 
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      secretKeyPrefix: secretKey.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    });

    // 生成时间戳
    const timespan = Math.floor(Date.now() / 1000).toString();
    
    // Token = MD5(key + Timespan + SecretKey)
    const token = generateQichachaToken(apiKey, timespan, secretKey);

    console.log('认证信息:', {
      timespan,
      tokenPrefix: token.substring(0, 8) + '...'
    });

    // 构建请求URL
    const url = new URL('https://api.qichacha.com/FuzzySearch/GetList');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('searchKey', searchKey);

    console.log('请求URL:', url.toString().replace(apiKey, apiKey.substring(0, 8) + '...'));

    // 发送请求
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Token': token,
        'Timespan': timespan,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; GreenTechPlatform/1.0)',
      },
    });

    console.log('API响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '无法获取错误详情');
      console.error('HTTP错误响应:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const data: QichachaApiResponse = await response.json();
    
    console.log('API响应数据:', {
      status: data.Status,
      message: data.Message,
      resultCount: data.Result?.length || 0
    });

    // 检查API响应状态
    if (data.Status !== '200') {
      // 根据状态码提供更友好的错误信息
      const errorMessages: Record<string, string> = {
        '101': 'API密钥无效或未生效，请检查配置',
        '102': 'API账户已欠费',
        '103': 'API密钥被暂停使用',
        '107': '签名错误或IP被禁止',
        '201': '未找到匹配的企业信息',
        '202': '查询参数错误，请检查搜索关键词',
      };
      
      const friendlyMessage = errorMessages[data.Status] || data.Message;
      console.error('企查查API业务错误:', {
        status: data.Status,
        message: data.Message,
        friendlyMessage
      });
      
      throw new Error(`${friendlyMessage} (状态码: ${data.Status})`);
    }

    console.log('企查查API调用成功，返回企业数量:', data.Result?.length || 0);

    return {
      success: true,
      data: data.Result || [],
    };
  } catch (error) {
    console.error('企查查API调用失败:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '企业搜索失败，请稍后重试',
    };
  }
}

/**
 * 格式化企业信息用于前端显示
 */
export function formatCompanyInfo(company: QichachaCompanyInfo) {
  return {
    id: company.KeyNo,
    name: company.Name,
    creditCode: company.CreditCode,
    legalRepresentative: company.OperName,
    registeredDate: company.StartDate,
    status: company.Status,
    registrationNumber: company.No,
    address: company.Address,
  };
}