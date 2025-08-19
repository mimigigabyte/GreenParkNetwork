// 公共分类API客户端函数（无需管理员权限）

import { AdminCategory, AdminSubcategory } from '@/lib/types/admin'

const API_BASE_URL = '/api/public/categories'
const SUBCATEGORY_API_BASE_URL = '/api/public/subcategories'

/**
 * 获取所有启用的分类（公开接口）
 */
export async function getPublicCategoriesApi(): Promise<AdminCategory[]> {
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
 * 根据分类ID获取启用的子分类（公开接口）
 */
export async function getPublicSubcategoriesApi(categoryId: string): Promise<AdminSubcategory[]> {
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