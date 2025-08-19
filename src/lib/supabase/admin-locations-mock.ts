// 地理位置模拟数据

import { AdminCountry, AdminProvince, AdminDevelopmentZone } from '@/lib/types/admin'

// 模拟国家数据
const mockCountries: AdminCountry[] = [
  {
    id: 'china',
    name_zh: '中国',
    name_en: 'China',
    code: 'china',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provinces: []
  },
  {
    id: 'usa',
    name_zh: '美国',
    name_en: 'United States',
    code: 'usa',
    logo_url: 'https://flagcdn.com/w160/us.png',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provinces: []
  },
  {
    id: 'japan',
    name_zh: '日本',
    name_en: 'Japan',
    code: 'japan',
    logo_url: 'https://flagcdn.com/w160/jp.png',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provinces: []
  },
  {
    id: 'germany',
    name_zh: '德国',
    name_en: 'Germany',
    code: 'germany',
    logo_url: 'https://flagcdn.com/w160/de.png',
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provinces: []
  }
]

// 模拟省份数据（中国）
const mockChinaProvinces: AdminProvince[] = [
  {
    id: 'beijing',
    country_id: 'china',
    name_zh: '北京市',
    name_en: 'Beijing',
    code: 'beijing',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'shanghai',
    country_id: 'china',
    name_zh: '上海市',
    name_en: 'Shanghai',
    code: 'shanghai',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'guangdong',
    country_id: 'china',
    name_zh: '广东省',
    name_en: 'Guangdong Province',
    code: 'guangdong',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'jiangsu',
    country_id: 'china',
    name_zh: '江苏省',
    name_en: 'Jiangsu Province',
    code: 'jiangsu',
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'zhejiang',
    country_id: 'china',
    name_zh: '浙江省',
    name_en: 'Zhejiang Province',
    code: 'zhejiang',
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// 模拟经开区数据
const mockDevelopmentZones: { [provinceId: string]: AdminDevelopmentZone[] } = {
  beijing: [
    {
      id: 'beijing-etz',
      province_id: 'beijing',
      name_zh: '北京经济技术开发区',
      name_en: 'Beijing Economic and Technological Development Zone',
      code: 'beijing-etz',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  shanghai: [
    {
      id: 'shanghai-pudong',
      province_id: 'shanghai',
      name_zh: '上海浦东新区',
      name_en: 'Shanghai Pudong New Area',
      code: 'shanghai-pudong',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'shanghai-jinqiao',
      province_id: 'shanghai',
      name_zh: '上海金桥经济技术开发区',
      name_en: 'Shanghai Jinqiao Economic and Technological Development Zone',
      code: 'shanghai-jinqiao',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  guangdong: [
    {
      id: 'guangzhou-etz',
      province_id: 'guangdong',
      name_zh: '广州经济技术开发区',
      name_en: 'Guangzhou Economic and Technological Development Zone',
      code: 'guangzhou-etz',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'shenzhen-etz',
      province_id: 'guangdong',
      name_zh: '深圳经济特区',
      name_en: 'Shenzhen Special Economic Zone',
      code: 'shenzhen-etz',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  jiangsu: [
    {
      id: 'nanjing-etz',
      province_id: 'jiangsu',
      name_zh: '南京经济技术开发区',
      name_en: 'Nanjing Economic and Technological Development Zone',
      code: 'nanjing-etz',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'suzhou-etz',
      province_id: 'jiangsu',
      name_zh: '苏州工业园区',
      name_en: 'Suzhou Industrial Park',
      code: 'suzhou-etz',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  zhejiang: [
    {
      id: 'hangzhou-etz',
      province_id: 'zhejiang',
      name_zh: '杭州经济技术开发区',
      name_en: 'Hangzhou Economic and Technological Development Zone',
      code: 'hangzhou-etz',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
}

/**
 * 模拟获取所有国家
 */
export async function getMockCountries(): Promise<AdminCountry[]> {
  await new Promise(resolve => setTimeout(resolve, 500))
  return mockCountries
}

/**
 * 模拟根据国家ID获取省份
 */
export async function getMockProvincesByCountryId(countryId: string): Promise<AdminProvince[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  if (countryId === 'china') {
    return mockChinaProvinces
  }
  
  // 其他国家暂时返回空数组
  return []
}

/**
 * 模拟根据省份ID获取经开区
 */
export async function getMockDevelopmentZonesByProvinceId(provinceId: string): Promise<AdminDevelopmentZone[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  return mockDevelopmentZones[provinceId] || []
}

/**
 * 模拟创建国家
 */
export async function createMockCountry(data: any): Promise<AdminCountry> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const newCountry: AdminCountry = {
    id: Date.now().toString(),
    name_zh: data.name_zh,
    name_en: data.name_en,
    code: data.code,
    sort_order: data.sort_order || 0,
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    provinces: []
  }
  
  mockCountries.push(newCountry)
  return newCountry
}

/**
 * 模拟创建省份
 */
export async function createMockProvince(data: any): Promise<AdminProvince> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const newProvince: AdminProvince = {
    id: Date.now().toString(),
    country_id: data.country_id,
    name_zh: data.name_zh,
    name_en: data.name_en,
    code: data.code,
    sort_order: data.sort_order || 0,
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  if (data.country_id === 'china') {
    mockChinaProvinces.push(newProvince)
  }
  
  return newProvince
}

/**
 * 模拟创建经开区
 */
export async function createMockDevelopmentZone(data: any): Promise<AdminDevelopmentZone> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const newZone: AdminDevelopmentZone = {
    id: Date.now().toString(),
    province_id: data.province_id,
    name_zh: data.name_zh,
    name_en: data.name_en,
    code: data.code,
    sort_order: data.sort_order || 0,
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  if (!mockDevelopmentZones[data.province_id]) {
    mockDevelopmentZones[data.province_id] = []
  }
  mockDevelopmentZones[data.province_id].push(newZone)
  
  return newZone
}

/**
 * 模拟更新国家
 */
export async function updateMockCountry(id: string, data: any): Promise<AdminCountry> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const countryIndex = mockCountries.findIndex(country => country.id === id)
  if (countryIndex === -1) {
    throw new Error('国家不存在')
  }
  
  mockCountries[countryIndex] = {
    ...mockCountries[countryIndex],
    ...data,
    updated_at: new Date().toISOString()
  }
  
  return mockCountries[countryIndex]
}

/**
 * 模拟删除国家
 */
export async function deleteMockCountry(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const countryIndex = mockCountries.findIndex(country => country.id === id)
  if (countryIndex === -1) {
    throw new Error('国家不存在')
  }
  
  mockCountries.splice(countryIndex, 1)
}

/**
 * 模拟更新省份
 */
export async function updateMockProvince(id: string, data: any): Promise<AdminProvince> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const provinceIndex = mockChinaProvinces.findIndex(province => province.id === id)
  if (provinceIndex === -1) {
    throw new Error('省份不存在')
  }
  
  mockChinaProvinces[provinceIndex] = {
    ...mockChinaProvinces[provinceIndex],
    ...data,
    updated_at: new Date().toISOString()
  }
  
  return mockChinaProvinces[provinceIndex]
}

/**
 * 模拟删除省份
 */
export async function deleteMockProvince(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const provinceIndex = mockChinaProvinces.findIndex(province => province.id === id)
  if (provinceIndex === -1) {
    throw new Error('省份不存在')
  }
  
  // 同时删除该省份下的所有经开区
  delete mockDevelopmentZones[id]
  
  mockChinaProvinces.splice(provinceIndex, 1)
}

/**
 * 模拟更新经开区
 */
export async function updateMockDevelopmentZone(id: string, data: any): Promise<AdminDevelopmentZone> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  for (const provinceId in mockDevelopmentZones) {
    const zones = mockDevelopmentZones[provinceId]
    const zoneIndex = zones.findIndex(zone => zone.id === id)
    if (zoneIndex !== -1) {
      zones[zoneIndex] = {
        ...zones[zoneIndex],
        ...data,
        updated_at: new Date().toISOString()
      }
      return zones[zoneIndex]
    }
  }
  
  throw new Error('经开区不存在')
}

/**
 * 模拟删除经开区
 */
export async function deleteMockDevelopmentZone(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  for (const provinceId in mockDevelopmentZones) {
    const zones = mockDevelopmentZones[provinceId]
    const zoneIndex = zones.findIndex(zone => zone.id === id)
    if (zoneIndex !== -1) {
      zones.splice(zoneIndex, 1)
      return
    }
  }
  
  throw new Error('经开区不存在')
}