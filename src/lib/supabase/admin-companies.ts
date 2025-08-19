// 企业信息数据操作层

import { supabase } from '@/lib/supabase'
import { 
  AdminCompany,
  CreateCompanyData,
  UpdateCompanyData,
  PaginationParams,
  PaginatedResponse
} from '@/lib/types/admin'

/**
 * 获取所有企业（带关联数据）
 */
export async function getCompanies(): Promise<AdminCompany[]> {
  const { data, error } = await supabase
    .from('admin_companies')
    .select(`
      *,
      country:admin_countries(*),
      province:admin_provinces(*),
      development_zone:admin_development_zones(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('获取企业列表失败:', error)
    throw new Error(`获取企业列表失败: ${error.message}`)
  }

  return data || []
}

/**
 * 获取分页企业列表
 */
export async function getCompaniesPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<AdminCompany>> {
  const { 
    page = 1, 
    pageSize = 10, 
    search = '', 
    sortBy = 'created_at', 
    sortOrder = 'desc' 
  } = params

  let query = supabase
    .from('admin_companies')
    .select(`
      *,
      country:admin_countries(*),
      province:admin_provinces(*),
      development_zone:admin_development_zones(*)
    `, { count: 'exact' })

  // 搜索功能
  if (search) {
    query = query.or(`name_zh.ilike.%${search}%,name_en.ilike.%${search}%,contact_person.ilike.%${search}%,industry_code.ilike.%${search}%`)
  }

  // 排序
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('获取分页企业列表失败:', error)
    throw new Error(`获取分页企业列表失败: ${error.message}`)
  }

  return {
    data: data || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }
}

/**
 * 根据ID获取单个企业
 */
export async function getCompanyById(id: string): Promise<AdminCompany | null> {
  const { data, error } = await supabase
    .from('admin_companies')
    .select(`
      *,
      country:admin_countries(*),
      province:admin_provinces(*),
      development_zone:admin_development_zones(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('获取企业详情失败:', error)
    throw new Error(`获取企业详情失败: ${error.message}`)
  }

  return data
}

/**
 * 创建企业
 */
export async function createCompany(data: CreateCompanyData): Promise<AdminCompany> {
  const { data: result, error } = await supabase
    .from('admin_companies')
    .insert(data)
    .select(`
      *,
      country:admin_countries(*),
      province:admin_provinces(*),
      development_zone:admin_development_zones(*)
    `)
    .single()

  if (error) {
    console.error('创建企业失败:', error)
    throw new Error(`创建企业失败: ${error.message}`)
  }

  return result
}

/**
 * 更新企业
 */
export async function updateCompany(id: string, data: UpdateCompanyData): Promise<AdminCompany> {
  const { data: result, error } = await supabase
    .from('admin_companies')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      country:admin_countries(*),
      province:admin_provinces(*),
      development_zone:admin_development_zones(*)
    `)
    .single()

  if (error) {
    console.error('更新企业失败:', error)
    throw new Error(`更新企业失败: ${error.message}`)
  }

  return result
}

/**
 * 删除企业
 */
export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_companies')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除企业失败:', error)
    throw new Error(`删除企业失败: ${error.message}`)
  }
}

/**
 * 软删除企业（设置为不活跃）
 */
export async function softDeleteCompany(id: string): Promise<AdminCompany> {
  return updateCompany(id, { is_active: false })
}

/**
 * 按企业类型统计
 */
export async function getCompanyStatsByType(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('admin_companies')
    .select('company_type')
    .eq('is_active', true)

  if (error) {
    console.error('获取企业类型统计失败:', error)
    return {}
  }

  const stats: Record<string, number> = {}
  data.forEach(company => {
    const type = company.company_type || 'unknown'
    stats[type] = (stats[type] || 0) + 1
  })

  return stats
}

/**
 * 按地区统计企业数量
 */
export async function getCompanyStatsByRegion(): Promise<Array<{ region: string; count: number }>> {
  const { data, error } = await supabase
    .from('admin_companies')
    .select(`
      province_id,
      province:admin_provinces(name_zh)
    `)
    .eq('is_active', true)
    .not('province_id', 'is', null)

  if (error) {
    console.error('获取企业地区统计失败:', error)
    return []
  }

  const regionCounts: Record<string, number> = {}
  data.forEach(company => {
    const regionName = company.province?.name_zh || '未知地区'
    regionCounts[regionName] = (regionCounts[regionName] || 0) + 1
  })

  return Object.entries(regionCounts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * 按年产值范围统计
 */
export async function getCompanyStatsByOutputValue(): Promise<Array<{ range: string; count: number }>> {
  const { data, error } = await supabase
    .from('admin_companies')
    .select('annual_output_value')
    .eq('is_active', true)
    .not('annual_output_value', 'is', null)

  if (error) {
    console.error('获取企业产值统计失败:', error)
    return []
  }

  const ranges = [
    { min: 0, max: 1, label: '1亿以下' },
    { min: 1, max: 10, label: '1-10亿' },
    { min: 10, max: 50, label: '10-50亿' },
    { min: 50, max: 100, label: '50-100亿' },
    { min: 100, max: Infinity, label: '100亿以上' }
  ]

  const rangeCounts = ranges.map(range => ({
    range: range.label,
    count: data.filter(company => {
      const value = company.annual_output_value
      return value >= range.min && value < range.max
    }).length
  }))

  return rangeCounts
}