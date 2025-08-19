// 企业信息相关API

// 企业信息表单数据类型
export interface CompanyProfileData {
  requirement?: string;
  companyName: string;
  logoUrl?: string;
  logoFile?: File;
  country: string;
  province?: string;
  economicZone?: string;
  companyType: string;
  address: string;
  industryCode: string;
  annualOutput: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  creditCode?: string; // 统一社会信用代码
}

// 提交企业信息（智能创建或更新）
export const submitCompanyProfile = async (data: CompanyProfileData) => {
  try {
    // 先检查是否已有企业信息
    const existingInfo = await getUserCompanyInfo();
    const hasExisting = existingInfo.success && existingInfo.data;

    const requestData = {
      requirement: data.requirement || '',
      companyName: data.companyName,
      country: data.country,
      province: data.province,
      economicZone: data.economicZone,
      logoUrl: data.logoUrl,
      companyType: data.companyType,
      address: data.address,
      industryCode: data.industryCode,
      annualOutput: data.annualOutput,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      creditCode: data.creditCode // 添加统一社会信用代码
    };

    // 先尝试从Supabase获取session
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    let token = null;
    if (session?.access_token) {
      token = session.access_token;
    } else {
      // 回退到localStorage的token
      token = localStorage.getItem('access_token');
    }
    const response = await fetch('/api/company/profile', {
      method: hasExisting ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '提交企业信息失败');
    }

    return await response.json();
  } catch (error) {
    console.error('提交企业信息错误:', error);
    throw error;
  }
};

// 获取用户企业信息
export const getUserCompanyInfo = async () => {
  try {
    // 先尝试从Supabase获取session
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    let token = null;
    if (session?.access_token) {
      token = session.access_token;
    } else {
      // 回退到localStorage的token
      token = localStorage.getItem('access_token');
    }
    
    const response = await fetch('/api/company/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取企业信息失败');
    }

    return await response.json();
  } catch (error) {
    console.error('获取企业信息错误:', error);
    throw error;
  }
};

// 获取国家列表
export const getCountries = async () => {
  try {
    const response = await fetch('/api/company/countries');
    if (!response.ok) {
      throw new Error('获取国家列表失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取国家列表错误:', error);
    throw error;
  }
};

// 获取省份列表
export const getProvinces = async (country: string) => {
  try {
    const response = await fetch(`/api/company/provinces?country=${encodeURIComponent(country)}`);
    if (!response.ok) {
      throw new Error('获取省份列表失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取省份列表错误:', error);
    throw error;
  }
};

// 获取经开区列表
export const getEconomicZones = async (province: string) => {
  try {
    const response = await fetch(`/api/company/economic-zones?province=${encodeURIComponent(province)}`);
    if (!response.ok) {
      throw new Error('获取经开区列表失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取经开区列表错误:', error);
    throw error;
  }
};