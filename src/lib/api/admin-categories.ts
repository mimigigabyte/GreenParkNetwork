// 产业分类API客户端函数

import { AdminCategory, AdminSubcategory } from '@/lib/types/admin'

const API_BASE_URL = '/api/admin/categories'
const SUBCATEGORY_API_BASE_URL = '/api/admin/subcategories'

// ================== 分类操作 ==================

/**
 * 获取所有分类（包含子分类）
 */
export async function getCategoriesApi(): Promise<AdminCategory[]> {
  const res = await fetch(API_BASE_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to fetch categories')
  }

  return res.json()
}

/**
 * 创建分类
 */
export async function createCategoryApi(data: {
  name_zh: string
  name_en: string
  slug: string
  sort_order?: number
  is_active?: boolean
}): Promise<AdminCategory> {
  const res = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to create category')
  }

  return res.json()
}

/**
 * 更新分类
 */
export async function updateCategoryApi(id: string, data: {
  name_zh: string
  name_en: string
  slug: string
  sort_order?: number
  is_active?: boolean
}): Promise<AdminCategory> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to update category')
  }

  return res.json()
}

/**
 * 删除分类
 */
export async function deleteCategoryApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to delete category')
  }
}

// ================== 子分类操作 ==================

/**
 * 根据分类ID获取子分类
 */
export async function getSubcategoriesApi(categoryId: string): Promise<AdminSubcategory[]> {
  const res = await fetch(`${SUBCATEGORY_API_BASE_URL}?category_id=${categoryId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to fetch subcategories')
  }

  return res.json()
}

/**
 * 创建子分类
 */
export async function createSubcategoryApi(data: {
  name_zh: string
  name_en: string
  slug: string
  sort_order?: number
  is_active?: boolean
  category_id: string
  default_tech_image_url?: string
}): Promise<AdminSubcategory> {
  const res = await fetch(SUBCATEGORY_API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to create subcategory')
  }

  return res.json()
}

/**
 * 更新子分类
 */
export async function updateSubcategoryApi(id: string, data: {
  name_zh: string
  name_en: string
  slug: string
  sort_order?: number
  is_active?: boolean
  category_id: string
  default_tech_image_url?: string
}): Promise<AdminSubcategory> {
  const res = await fetch(`${SUBCATEGORY_API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to update subcategory')
  }

  return res.json()
}

/**
 * 删除子分类
 */
export async function deleteSubcategoryApi(id: string): Promise<void> {
  const res = await fetch(`${SUBCATEGORY_API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to delete subcategory')
  }
}