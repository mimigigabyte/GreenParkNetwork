// 产业分类数据操作层

import { supabase } from '@/lib/supabase'
import { 
  AdminCategory, 
  AdminSubcategory,
  CreateCategoryData,
  UpdateCategoryData,
  CreateSubcategoryData,
  UpdateSubcategoryData,
  PaginationParams,
  PaginatedResponse
} from '@/lib/types/admin'

/**
 * 获取所有产业分类（包含子分类）
 */
export async function getCategories(): Promise<AdminCategory[]> {
  const { data, error } = await supabase
    .from('admin_categories')
    .select(`
      *,
      subcategories:admin_subcategories(*)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取产业分类失败:', error)
    throw new Error(`获取产业分类失败: ${error.message}`)
  }

  return data || []
}

/**
 * 获取分页产业分类列表
 */
export async function getCategoriesPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<AdminCategory>> {
  const { 
    page = 1, 
    pageSize = 10, 
    search = '', 
    sortBy = 'sort_order', 
    sortOrder = 'asc' 
  } = params

  let query = supabase
    .from('admin_categories')
    .select(`
      *,
      subcategories:admin_subcategories(*)
    `, { count: 'exact' })

  // 搜索功能
  if (search) {
    query = query.or(`name_zh.ilike.%${search}%,name_en.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  // 排序
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('获取分页产业分类失败:', error)
    throw new Error(`获取分页产业分类失败: ${error.message}`)
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
 * 根据ID获取单个产业分类
 */
export async function getCategoryById(id: string): Promise<AdminCategory | null> {
  const { data, error } = await supabase
    .from('admin_categories')
    .select(`
      *,
      subcategories:admin_subcategories(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('获取产业分类详情失败:', error)
    throw new Error(`获取产业分类详情失败: ${error.message}`)
  }

  return data
}

/**
 * 创建产业分类
 */
export async function createCategory(data: CreateCategoryData): Promise<AdminCategory> {
  const { data: result, error } = await supabase
    .from('admin_categories')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('创建产业分类失败:', error)
    throw new Error(`创建产业分类失败: ${error.message}`)
  }

  return result
}

/**
 * 更新产业分类
 */
export async function updateCategory(id: string, data: UpdateCategoryData): Promise<AdminCategory> {
  const { data: result, error } = await supabase
    .from('admin_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新产业分类失败:', error)
    throw new Error(`更新产业分类失败: ${error.message}`)
  }

  return result
}

/**
 * 删除产业分类
 */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除产业分类失败:', error)
    throw new Error(`删除产业分类失败: ${error.message}`)
  }
}

/**
 * 软删除产业分类（设置为不活跃）
 */
export async function softDeleteCategory(id: string): Promise<AdminCategory> {
  return updateCategory(id, { is_active: false })
}

/**
 * 批量更新产业分类排序
 */
export async function updateCategoriesOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
  const { error } = await supabase.rpc('update_categories_order', {
    updates: updates
  })

  if (error) {
    console.error('批量更新产业分类排序失败:', error)
    throw new Error(`批量更新产业分类排序失败: ${error.message}`)
  }
}

// ==================== 子分类操作 ====================

/**
 * 获取指定产业分类的所有子分类
 */
export async function getSubcategoriesByCategoryId(categoryId: string): Promise<AdminSubcategory[]> {
  const { data, error } = await supabase
    .from('admin_subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取子分类失败:', error)
    throw new Error(`获取子分类失败: ${error.message}`)
  }

  return data || []
}

/**
 * 创建子分类
 */
export async function createSubcategory(data: CreateSubcategoryData): Promise<AdminSubcategory> {
  const { data: result, error } = await supabase
    .from('admin_subcategories')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('创建子分类失败:', error)
    throw new Error(`创建子分类失败: ${error.message}`)
  }

  return result
}

/**
 * 更新子分类
 */
export async function updateSubcategory(id: string, data: UpdateSubcategoryData): Promise<AdminSubcategory> {
  const { data: result, error } = await supabase
    .from('admin_subcategories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新子分类失败:', error)
    throw new Error(`更新子分类失败: ${error.message}`)
  }

  return result
}

/**
 * 删除子分类
 */
export async function deleteSubcategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_subcategories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除子分类失败:', error)
    throw new Error(`删除子分类失败: ${error.message}`)
  }
}

/**
 * 软删除子分类
 */
export async function softDeleteSubcategory(id: string): Promise<AdminSubcategory> {
  return updateSubcategory(id, { is_active: false })
}

/**
 * 检查分类slug是否唯一
 */
export async function checkCategorySlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  let query = supabase
    .from('admin_categories')
    .select('id')
    .eq('slug', slug)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('检查分类slug唯一性失败:', error)
    return false
  }

  return (data?.length || 0) === 0
}

/**
 * 检查子分类slug在同一分类下是否唯一
 */
export async function checkSubcategorySlugUnique(
  categoryId: string, 
  slug: string, 
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('admin_subcategories')
    .select('id')
    .eq('category_id', categoryId)
    .eq('slug', slug)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('检查子分类slug唯一性失败:', error)
    return false
  }

  return (data?.length || 0) === 0
}