// 技术信息数据操作层

import { supabase } from '@/lib/supabase'
import { 
  AdminTechnology,
  CreateTechnologyData,
  UpdateTechnologyData,
  PaginationParams,
  PaginatedResponse
} from '@/lib/types/admin'

/**
 * 获取所有技术（带关联数据）
 */
export async function getTechnologies(): Promise<AdminTechnology[]> {
  const { data, error } = await supabase
    .from('admin_technologies')
    .select(`
      *,
      category:admin_categories(*),
      subcategory:admin_subcategories(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('获取技术列表失败:', error)
    throw new Error(`获取技术列表失败: ${error.message}`)
  }

  return data || []
}

/**
 * 获取分页技术列表
 */
export async function getTechnologiesPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<AdminTechnology>> {
  const { 
    page = 1, 
    pageSize = 10, 
    search = '', 
    sortBy = 'created_at', 
    sortOrder = 'desc' 
  } = params

  let query = supabase
    .from('admin_technologies')
    .select(`
      *,
      category:admin_categories(*),
      subcategory:admin_subcategories(*)
    `, { count: 'exact' })

  // 搜索功能
  if (search) {
    query = query.or(`name_zh.ilike.%${search}%,name_en.ilike.%${search}%,description_zh.ilike.%${search}%,description_en.ilike.%${search}%,brief_zh.ilike.%${search}%,brief_en.ilike.%${search}%`)
  }

  // 排序
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('获取分页技术列表失败:', error)
    throw new Error(`获取分页技术列表失败: ${error.message}`)
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
 * 根据ID获取单个技术
 */
export async function getTechnologyById(id: string): Promise<AdminTechnology | null> {
  const { data, error } = await supabase
    .from('admin_technologies')
    .select(`
      *,
      category:admin_categories(*),
      subcategory:admin_subcategories(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('获取技术详情失败:', error)
    throw new Error(`获取技术详情失败: ${error.message}`)
  }

  return data
}

/**
 * 创建技术
 */
export async function createTechnology(data: CreateTechnologyData): Promise<AdminTechnology> {
  const { data: result, error } = await supabase
    .from('admin_technologies')
    .insert(data)
    .select(`
      *,
      category:admin_categories(*),
      subcategory:admin_subcategories(*)
    `)
    .single()

  if (error) {
    console.error('创建技术失败:', error)
    throw new Error(`创建技术失败: ${error.message}`)
  }

  return result
}

/**
 * 更新技术
 */
export async function updateTechnology(id: string, data: UpdateTechnologyData): Promise<AdminTechnology> {
  const { data: result, error } = await supabase
    .from('admin_technologies')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      category:admin_categories(*),
      subcategory:admin_subcategories(*)
    `)
    .single()

  if (error) {
    console.error('更新技术失败:', error)
    throw new Error(`更新技术失败: ${error.message}`)
  }

  return result
}

/**
 * 删除技术
 */
export async function deleteTechnology(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_technologies')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除技术失败:', error)
    throw new Error(`删除技术失败: ${error.message}`)
  }
}

/**
 * 软删除技术（设置为不活跃）
 */
export async function softDeleteTechnology(id: string): Promise<AdminTechnology> {
  return updateTechnology(id, { is_active: false })
}

/**
 * 按技术来源统计
 */
export async function getTechnologyStatsBySource(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('admin_technologies')
    .select('tech_source')
    .eq('is_active', true)

  if (error) {
    console.error('获取技术来源统计失败:', error)
    return {}
  }

  const stats: Record<string, number> = {}
  data.forEach(tech => {
    const source = tech.tech_source || 'unknown'
    stats[source] = (stats[source] || 0) + 1
  })

  return stats
}

/**
 * 按分类统计技术数量
 */
export async function getTechnologyStatsByCategory(): Promise<Array<{ category: string; count: number }>> {
  const { data, error } = await supabase
    .from('admin_technologies')
    .select(`
      category_id,
      category:admin_categories(name_zh)
    `)
    .eq('is_active', true)
    .not('category_id', 'is', null)

  if (error) {
    console.error('获取技术分类统计失败:', error)
    return []
  }

  const categoryCounts: Record<string, number> = {}
  data.forEach(tech => {
    const category = Array.isArray(tech.category) ? tech.category[0] : tech.category
    const categoryName = category?.name_zh || '未分类'
    categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1
  })

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * 根据分类ID获取技术列表
 */
export async function getTechnologiesByCategory(categoryId: string): Promise<AdminTechnology[]> {
  const { data, error } = await supabase
    .from('admin_technologies')
    .select(`
      *,
      category:admin_categories(*),
      subcategory:admin_subcategories(*)
    `)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('根据分类获取技术列表失败:', error)
    throw new Error(`根据分类获取技术列表失败: ${error.message}`)
  }

  return data || []
}

/**
 * 根据子分类ID获取技术列表
 */
export async function getTechnologiesBySubcategory(subcategoryId: string): Promise<AdminTechnology[]> {
  const { data, error } = await supabase
    .from('admin_technologies')
    .select(`
      *,
      category:admin_categories(*),
      subcategory:admin_subcategories(*)
    `)
    .eq('subcategory_id', subcategoryId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('根据子分类获取技术列表失败:', error)
    throw new Error(`根据子分类获取技术列表失败: ${error.message}`)
  }

  return data || []
}