// 地理位置数据操作层

import { supabase } from '@/lib/supabase'
import { 
  AdminCountry,
  AdminProvince,
  AdminDevelopmentZone,
  CreateCountryData,
  UpdateCountryData,
  CreateProvinceData,
  UpdateProvinceData,
  CreateDevelopmentZoneData,
  UpdateDevelopmentZoneData
} from '@/lib/types/admin'

// ==================== 国别操作 ====================

/**
 * 获取所有国别
 */
export async function getCountries(): Promise<AdminCountry[]> {
  const { data, error } = await supabase
    .from('admin_countries')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取国别失败:', error)
    throw new Error(`获取国别失败: ${error.message}`)
  }

  return data || []
}

/**
 * 创建国别
 */
export async function createCountry(data: CreateCountryData): Promise<AdminCountry> {
  const { data: result, error } = await supabase
    .from('admin_countries')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('创建国别失败:', error)
    throw new Error(`创建国别失败: ${error.message}`)
  }

  return result
}

// ==================== 省份操作 ====================

/**
 * 获取所有省份
 */
export async function getProvinces(): Promise<AdminProvince[]> {
  const { data, error } = await supabase
    .from('admin_provinces')
    .select(`
      *,
      country:admin_countries(*)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取省份失败:', error)
    throw new Error(`获取省份失败: ${error.message}`)
  }

  return data || []
}

/**
 * 根据国别ID获取省份
 */
export async function getProvincesByCountryId(countryId: string): Promise<AdminProvince[]> {
  const { data, error } = await supabase
    .from('admin_provinces')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取省份失败:', error)
    throw new Error(`获取省份失败: ${error.message}`)
  }

  return data || []
}

// ==================== 经开区操作 ====================

/**
 * 获取所有经开区
 */
export async function getDevelopmentZones(): Promise<AdminDevelopmentZone[]> {
  const { data, error } = await supabase
    .from('admin_development_zones')
    .select(`
      *,
      province:admin_provinces(*)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取经开区失败:', error)
    throw new Error(`获取经开区失败: ${error.message}`)
  }

  return data || []
}

/**
 * 根据省份ID获取经开区
 */
export async function getDevelopmentZonesByProvinceId(provinceId: string): Promise<AdminDevelopmentZone[]> {
  const { data, error } = await supabase
    .from('admin_development_zones')
    .select('*')
    .eq('province_id', provinceId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取经开区失败:', error)
    throw new Error(`获取经开区失败: ${error.message}`)
  }

  return data || []
}

/**
 * 创建经开区
 */
export async function createDevelopmentZone(data: CreateDevelopmentZoneData): Promise<AdminDevelopmentZone> {
  const { data: result, error } = await supabase
    .from('admin_development_zones')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('创建经开区失败:', error)
    throw new Error(`创建经开区失败: ${error.message}`)
  }

  return result
}

/**
 * 更新经开区
 */
export async function updateDevelopmentZone(id: string, data: UpdateDevelopmentZoneData): Promise<AdminDevelopmentZone> {
  const { data: result, error } = await supabase
    .from('admin_development_zones')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新经开区失败:', error)
    throw new Error(`更新经开区失败: ${error.message}`)
  }

  return result
}

/**
 * 删除经开区
 */
export async function deleteDevelopmentZone(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_development_zones')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除经开区失败:', error)
    throw new Error(`删除经开区失败: ${error.message}`)
  }
}

/**
 * 创建省份
 */
export async function createProvince(data: CreateProvinceData): Promise<AdminProvince> {
  const { data: result, error } = await supabase
    .from('admin_provinces')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('创建省份失败:', error)
    throw new Error(`创建省份失败: ${error.message}`)
  }

  return result
}

/**
 * 更新省份
 */
export async function updateProvince(id: string, data: UpdateProvinceData): Promise<AdminProvince> {
  const { data: result, error } = await supabase
    .from('admin_provinces')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新省份失败:', error)
    throw new Error(`更新省份失败: ${error.message}`)
  }

  return result
}

/**
 * 删除省份
 */
export async function deleteProvince(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_provinces')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除省份失败:', error)
    throw new Error(`删除省份失败: ${error.message}`)
  }
}