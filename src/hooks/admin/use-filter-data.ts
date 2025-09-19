// 筛选数据自定义Hook

import { useState, useEffect } from 'react'
import { getCategories } from '@/lib/supabase/admin-categories'
import { getCountries, getProvincesByCountryId, getDevelopmentZonesByProvinceId } from '@/lib/supabase/admin-locations'
import { AdminCategory, AdminCountry, AdminProvince, AdminDevelopmentZone } from '@/lib/types/admin'

interface FilterData {
  categories: AdminCategory[]
  countries: AdminCountry[]
  provinces: AdminProvince[]
  developmentZones: AdminDevelopmentZone[]
  totalTechnologyCount?: number
}

interface CountedSubcategory {
  id: string
  slug: string
  nameZh: string
  nameEn: string
  count: number
  sortOrder?: number
  isVirtual?: boolean
}

interface CountedCategory {
  id: string
  slug: string
  nameZh: string
  nameEn: string
  count: number
  subcategories: CountedSubcategory[]
}

interface CategoryCountsApiResponse {
  success: boolean
  data?: {
    totalTechnologyCount: number
    categories: CountedCategory[]
  }
  error?: string
}

/**
 * 筛选数据Hook
 */
export function useFilterData() {
  const [data, setData] = useState<FilterData>({
    categories: [],
    countries: [],
    provinces: [],
    developmentZones: [],
    totalTechnologyCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [categoriesData, countriesData, categoryCounts] = await Promise.all([
        getCategories(),
        getCountries(),
        fetch('/api/tech/category-counts')
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch category counts: ${response.status}`)
            }
            return response.json() as Promise<CategoryCountsApiResponse>
          })
          .catch((err) => {
            console.error('获取分类数量失败:', err)
            return null
          })
      ])

      const categoryCountMap = new Map<string, { count: number; category: CountedCategory }>()
      const subcategoryCountMap = new Map<string, { count: number; subcategory: CountedSubcategory }>()
      let totalTechnologyCount = 0

      if (categoryCounts?.success && categoryCounts.data) {
        totalTechnologyCount = categoryCounts.data.totalTechnologyCount || 0
        for (const category of categoryCounts.data.categories) {
          const categoryEntry = { count: category.count, category }
          const categoryKeyId = category.id
          const categoryKeySlug = category.slug
          if (categoryKeyId) {
            categoryCountMap.set(categoryKeyId, categoryEntry)
          }
          if (categoryKeySlug) {
            categoryCountMap.set(categoryKeySlug, categoryEntry)
          }

          for (const sub of category.subcategories || []) {
            const subEntry = { count: sub.count, subcategory: sub }
            const subKeyId = sub.id
            const subKeySlug = sub.slug
            if (subKeyId) {
              subcategoryCountMap.set(subKeyId, subEntry)
            }
            if (subKeySlug) {
              subcategoryCountMap.set(subKeySlug, subEntry)
            }
          }
        }
      }

      const normalizedCategories = (Array.isArray(categoriesData) ? categoriesData : []).map(category => ({
        ...category,
        technology_count: categoryCountMap.get(category.id)?.count ?? categoryCountMap.get(category.slug)?.count ?? 0,
        subcategories: (category.subcategories || []).map(sub => ({
          ...sub,
          technology_count: subcategoryCountMap.get(sub.id)?.count ?? subcategoryCountMap.get(sub.slug)?.count ?? 0
        }))
      }))

      const enrichedCategories = normalizedCategories.map(category => {
        const categoryEntry = categoryCountMap.get(category.id) ?? categoryCountMap.get(category.slug)
        if (!categoryEntry) {
          return category
        }

        const baseSubcategories = Array.isArray(category.subcategories) ? category.subcategories : []
        const countsSubcategories = Array.isArray(categoryEntry.category?.subcategories)
          ? categoryEntry.category.subcategories
          : []

        const existingMatch = (subId?: string | null, subSlug?: string | null) => {
          return baseSubcategories.some(existing => existing.id === subId || existing.slug === subSlug)
        }

        const extraSubcategories = countsSubcategories
          .filter(sub => !existingMatch(sub.id, sub.slug))
          .map(sub => {
            const fallbackId = sub.id || `${category.id}-virtual-${sub.slug || Date.now()}`
            const now = new Date().toISOString()
            return {
              id: fallbackId,
              category_id: category.id,
              name_zh: sub.nameZh,
              name_en: sub.nameEn,
              slug: sub.slug || fallbackId,
              sort_order: sub.sortOrder ?? 9999,
              is_active: true,
              created_at: now,
              updated_at: now,
              technology_count: sub.count,
              __isVirtual: true
            }
          })

        return {
          ...category,
          subcategories: [...baseSubcategories, ...extraSubcategories]
        }
      })

      setData(prev => ({
        ...prev,
        categories: enrichedCategories,
        countries: Array.isArray(countriesData) ? countriesData : [],
        totalTechnologyCount
      }))
      
      console.log('✅ 加载筛选数据成功:', {
        categories: categoriesData?.length || 0,
        countries: countriesData?.length || 0
      })
    } catch (err) {
      console.error('加载筛选数据失败:', err)
      setError('加载筛选数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadProvinces = async (countryId: string) => {
    try {
      const provincesData = await getProvincesByCountryId(countryId)
      const validProvinces = Array.isArray(provincesData) ? provincesData : []
      setData(prev => ({
        ...prev,
        provinces: validProvinces,
        developmentZones: [] // 重置经开区
      }))
      console.log('✅ 加载省份数据成功:', validProvinces.length, '个省份')
      return validProvinces
    } catch (err) {
      console.error('❌ 加载省份数据失败:', err)
      setData(prev => ({
        ...prev,
        provinces: [],
        developmentZones: []
      }))
      return []
    }
  }

  const loadDevelopmentZones = async (provinceId: string) => {
    try {
      const zonesData = await getDevelopmentZonesByProvinceId(provinceId)
      const validZones = Array.isArray(zonesData) ? zonesData : []
      setData(prev => ({
        ...prev,
        developmentZones: validZones
      }))
      console.log('✅ 加载经开区数据成功:', validZones.length, '个经开区')
      return validZones
    } catch (err) {
      console.error('❌ 加载经开区数据失败:', err)
      setData(prev => ({
        ...prev,
        developmentZones: []
      }))
      return []
    }
  }

  return {
    data,
    isLoading,
    error,
    loadProvinces,
    loadDevelopmentZones,
    refetch: loadInitialData
  }
}

/**
 * 简单的中文经开区名称翻译映射
 */
const developmentZoneTranslations: { [key: string]: string } = {
  // 直辖市
  '北京经济技术开发区': 'Beijing Economic and Technological Development Zone',
  '天津经济技术开发区': 'Tianjin Economic and Technological Development Zone',
  '上海漕河泾新兴技术开发区': 'Shanghai Caohejing Hi-Tech Development Zone',
  '重庆经济技术开发区': 'Chongqing Economic and Technological Development Zone',
  
  // 省份经开区示例
  '苏州工业园区': 'Suzhou Industrial Park',
  '昆山经济技术开发区': 'Kunshan Economic and Technological Development Zone',
  '大连经济技术开发区': 'Dalian Economic and Technological Development Zone',
  '青岛经济技术开发区': 'Qingdao Economic and Technological Development Zone',
  '烟台经济技术开发区': 'Yantai Economic and Technological Development Zone',
  '威海经济技术开发区': 'Weihai Economic and Technological Development Zone',
  
  // 可以根据需要继续添加更多翻译
};

/**
 * 中文省份名称到英文的映射（用于补齐缺失的英文名）
 */
const provinceTranslations: { [key: string]: string } = {
  // 直辖市
  '北京': 'Beijing',
  '天津': 'Tianjin',
  '上海': 'Shanghai',
  '重庆': 'Chongqing',
  // 省份
  '河北': 'Hebei',
  '山西': 'Shanxi',
  '辽宁': 'Liaoning',
  '吉林': 'Jilin',
  '黑龙江': 'Heilongjiang',
  '江苏': 'Jiangsu',
  '浙江': 'Zhejiang',
  '安徽': 'Anhui',
  '福建': 'Fujian',
  '江西': 'Jiangxi',
  '山东': 'Shandong',
  '河南': 'Henan',
  '湖北': 'Hubei',
  '湖南': 'Hunan',
  '广东': 'Guangdong',
  '海南': 'Hainan',
  '四川': 'Sichuan',
  '贵州': 'Guizhou',
  '云南': 'Yunnan',
  '陕西': 'Shaanxi',
  '甘肃': 'Gansu',
  '青海': 'Qinghai',
  '台湾': 'Taiwan',
  // 自治区
  '内蒙古': 'Inner Mongolia',
  '广西': 'Guangxi',
  '西藏': 'Tibet',
  '宁夏': 'Ningxia',
  '新疆': 'Xinjiang',
  // 特别行政区
  '香港': 'Hong Kong',
  '澳门': 'Macao'
};

/**
 * 常见国家中文到英文映射（用于补齐缺失的英文名）
 */
const countryTranslations: { [key: string]: string } = {
  '中国': 'China',
  '日本': 'Japan',
  '美国': 'United States',
  '英国': 'United Kingdom',
  '德国': 'Germany',
  '法国': 'France',
  '韩国': 'South Korea',
  '朝鲜': 'North Korea',
  '印度': 'India',
  '加拿大': 'Canada',
  '澳大利亚': 'Australia',
  '意大利': 'Italy',
  '西班牙': 'Spain',
  '荷兰': 'Netherlands',
  '瑞典': 'Sweden',
  '丹麦': 'Denmark',
  '挪威': 'Norway',
  '芬兰': 'Finland',
  '瑞士': 'Switzerland',
  '俄罗斯': 'Russia',
  '新加坡': 'Singapore',
  '马来西亚': 'Malaysia',
  '泰国': 'Thailand',
  '菲律宾': 'Philippines',
  '印度尼西亚': 'Indonesia'
};

// 常见城市/区域翻译（用于经开区前缀翻译）
const cityAreaTranslations: { [key: string]: string } = {
  // 直辖市与常见城市
  '北京': 'Beijing', '天津': 'Tianjin', '上海': 'Shanghai', '重庆': 'Chongqing',
  '广州': 'Guangzhou', '深圳': 'Shenzhen', '杭州': 'Hangzhou', '南京': 'Nanjing', '苏州': 'Suzhou', '无锡': 'Wuxi',
  '宁波': 'Ningbo', '青岛': 'Qingdao', '大连': 'Dalian', '武汉': 'Wuhan', '成都': 'Chengdu', '西安': "Xi'an",
  '沈阳': 'Shenyang', '长春': 'Changchun', '哈尔滨': 'Harbin', '郑州': 'Zhengzhou', '济南': 'Jinan', '合肥': 'Hefei',
  '福州': 'Fuzhou', '厦门': 'Xiamen', '南昌': 'Nanchang', '长沙': 'Changsha', '南宁': 'Nanning', '昆明': 'Kunming',
  '海口': 'Haikou', '兰州': 'Lanzhou', '西宁': 'Xining', '银川': 'Yinchuan', '乌鲁木齐': 'Urumqi', '呼和浩特': 'Hohhot',
  '石家庄': 'Shijiazhuang', '唐山': 'Tangshan', '保定': 'Baoding', '廊坊': 'Langfang', '东营': 'Dongying', '南通': 'Nantong',
  '昆山': 'Kunshan', '江宁': 'Jiangning', '金华': 'Jinhua', '嘉兴': 'Jiaxing', '绍兴': 'Shaoxing', '常州': 'Changzhou',
  '徐州': 'Xuzhou', '泰州': 'Taizhou', '温州': 'Wenzhou', '扬州': 'Yangzhou', '盐城': 'Yancheng', '威海': 'Weihai',
  '烟台': 'Yantai', '潍坊': 'Weifang', '洛阳': 'Luoyang', '太原': 'Taiyuan', '呼伦贝尔': 'Hulunbuir'
};

// 常见区域/园区专有名词
const areaTranslations: { [key: string]: string } = {
  '金桥': 'Jinqiao',
  '张江': 'Zhangjiang',
  '苏州工业园区': 'Suzhou Industrial Park',
  '漕河泾': 'Caohejing'
};

function translateCityAreaPrefix(prefix: string): string {
  // 完全匹配专有名词
  if (areaTranslations[prefix]) return areaTranslations[prefix];

  // 尝试城市+区域拆分（如 上海金桥 => Shanghai Jinqiao）
  for (const cityZh of Object.keys(cityAreaTranslations)) {
    if (prefix.startsWith(cityZh)) {
      const cityEn = cityAreaTranslations[cityZh];
      const rest = prefix.slice(cityZh.length);
      if (!rest) return cityEn;
      const restEn = areaTranslations[rest] || rest; // 若未知区域，原样返回（避免空）
      return `${cityEn} ${restEn}`.trim();
    }
  }
  // 仅城市映射
  if (cityAreaTranslations[prefix]) return cityAreaTranslations[prefix];
  return prefix; // 回退
}

/**
 * 自动翻译经开区名称（如果英文名称为空或包含中文）
 */
function translateDevelopmentZoneName(nameZh: string, nameEn: string): string {
  // 如果英文名称存在且不包含中文字符，直接使用
  if (nameEn && !/[\u4e00-\u9fff]/.test(nameEn)) {
    return nameEn;
  }
  // 查找预定义的翻译
  if (developmentZoneTranslations[nameZh]) {
    return developmentZoneTranslations[nameZh];
  }
  // 结构化匹配：前缀(城市/区域) + 后缀(类型)
  const suffixMap: Array<[RegExp, string]> = [
    [/经济技术开发区$/, 'Economic and Technological Development Zone'],
    [/经济开发区$/, 'Economic Development Zone'],
    [/高新技术开发区$/, 'High-Tech Development Zone'],
    [/工业园区$/, 'Industrial Park'],
    [/科技园$/, 'Science Park'],
    [/新区$/, 'New Area'],
    [/开发区$/, 'Development Zone'],
    [/自贸区$/, 'Free Trade Zone'],
    [/保税区$/, 'Bonded Zone']
  ];
  for (const [re, enSuffix] of suffixMap) {
    const m = nameZh.match(re);
    if (m) {
      const prefix = nameZh.replace(re, '');
      const prefixEn = translateCityAreaPrefix(prefix);
      return `${prefixEn} ${enSuffix}`.trim();
    }
  }
  // 无法匹配后缀时，返回原文（或英文名）
  return nameEn || nameZh;
}

/**
 * 自动翻译省份名称（如果英文为空或仍为中文）
 */
function translateProvinceName(nameZh: string, nameEn: string): string {
  if (nameEn && !/[\u4e00-\u9fff]/.test(nameEn)) {
    return nameEn;
  }
  if (provinceTranslations[nameZh]) {
    return provinceTranslations[nameZh];
  }
  return nameEn || nameZh; // 回退
}

/**
 * 自动翻译国家名称（如果英文为空或仍为中文）
 */
function translateCountryName(nameZh: string, nameEn: string): string {
  if (nameEn && !/[\u4e00-\u9fff]/.test(nameEn)) {
    return nameEn;
  }
  if (countryTranslations[nameZh]) {
    return countryTranslations[nameZh];
  }
  return nameEn || nameZh; // 回退
}

/**
 * 转换为前端组件兼容的格式
 */
export function transformFilterDataForComponents(data: FilterData, locale: string = 'zh') {
  return {
    totalTechnologyCount: data.totalTechnologyCount || 0,
    // 转换产业分类格式
    mainCategories: (data.categories || []).map(category => ({
      id: category.slug,
      name: locale === 'en' ? (category.name_en || category.name_zh) : category.name_zh,
      count: category.technology_count ?? 0,
      subCategories: (category.subcategories || [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(sub => ({
        id: sub.slug,
        name: locale === 'en' ? (sub.name_en || sub.name_zh) : sub.name_zh,
        count: sub.technology_count ?? 0,
        isVirtual: sub.__isVirtual ?? false
      }))
    })),

    // 转换国家格式
    countries: (data.countries || []).map(country => ({
      value: country.code,
      label: locale === 'en' 
        ? translateCountryName(country.name_zh, country.name_en || '')
        : country.name_zh,
      logo_url: country.logo_url
    })),

    // 转换省份格式
    provinces: (data.provinces || []).map(province => ({
      value: province.code,
      label: locale === 'en' 
        ? translateProvinceName(province.name_zh, province.name_en || '')
        : province.name_zh
    })),

    // 转换经开区格式
    developmentZones: (data.developmentZones || []).map(zone => ({
      value: zone.code,
      label: locale === 'en' 
        ? translateDevelopmentZoneName(zone.name_zh, zone.name_en || '') 
        : zone.name_zh
    }))
  }
}
