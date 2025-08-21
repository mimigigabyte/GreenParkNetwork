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
 * 转换为前端组件兼容的格式
 */
export function transformFilterDataForComponents(data: FilterData) {
  return {
    // 转换产业分类格式
    mainCategories: (data.categories || []).map(category => ({
      id: category.slug,
      name: category.name_zh,
      subCategories: (category.subcategories || []).map(sub => ({
        id: sub.slug,
        name: sub.name_zh,
        count: 0 // TODO: 从技术表中统计实际数量
      }))
    })),

    // 转换国家格式
    countries: (data.countries || []).map(country => ({
      value: country.code,
      label: country.name_zh,
      logo_url: country.logo_url
    })),

    // 转换省份格式
    provinces: (data.provinces || []).map(province => ({
      value: province.code,
      label: province.name_zh
    })),

    // 转换经开区格式
    developmentZones: (data.developmentZones || []).map(zone => ({
      value: zone.code,
      label: zone.name_zh
    }))
  }
}