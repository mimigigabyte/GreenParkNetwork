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
}

/**
 * 筛选数据Hook
 */
export function useFilterData() {
  const [data, setData] = useState<FilterData>({
    categories: [],
    countries: [],
    provinces: [],
    developmentZones: []
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

      const [categoriesData, countriesData] = await Promise.all([
        getCategories(),
        getCountries()
      ])

      setData(prev => ({
        ...prev,
        categories: Array.isArray(categoriesData) ? categoriesData : [],
        countries: Array.isArray(countriesData) ? countriesData : []
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
  
  // 简单的自动翻译规则
  return nameZh
    .replace(/经济技术开发区/g, 'Economic and Technological Development Zone')
    .replace(/经济开发区/g, 'Economic Development Zone')
    .replace(/高新技术开发区/g, 'High-Tech Development Zone')
    .replace(/工业园区/g, 'Industrial Park')
    .replace(/科技园/g, 'Science Park')
    .replace(/新区/g, 'New Area')
    .replace(/开发区/g, 'Development Zone')
    .replace(/自贸区/g, 'Free Trade Zone')
    .replace(/保税区/g, 'Bonded Zone');
}

/**
 * 转换为前端组件兼容的格式
 */
export function transformFilterDataForComponents(data: FilterData, locale: string = 'zh') {
  return {
    // 转换产业分类格式
    mainCategories: (data.categories || []).map(category => ({
      id: category.slug,
      name: locale === 'en' ? (category.name_en || category.name_zh) : category.name_zh,
      subCategories: (category.subcategories || []).map(sub => ({
        id: sub.slug,
        name: locale === 'en' ? (sub.name_en || sub.name_zh) : sub.name_zh,
        count: 0 // TODO: 从技术表中统计实际数量
      }))
    })),

    // 转换国家格式
    countries: (data.countries || []).map(country => ({
      value: country.code,
      label: locale === 'en' ? (country.name_en || country.name_zh) : country.name_zh,
      logo_url: country.logo_url
    })),

    // 转换省份格式
    provinces: (data.provinces || []).map(province => ({
      value: province.code,
      label: locale === 'en' ? (province.name_en || province.name_zh) : province.name_zh
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