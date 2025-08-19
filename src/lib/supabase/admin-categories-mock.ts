// 临时的模拟数据，直到数据库表创建完成

import { AdminCategory, AdminSubcategory } from '@/lib/types/admin'

// 模拟产业分类数据
const mockCategories: AdminCategory[] = [
  {
    id: '1',
    name_zh: '节能技术',
    name_en: 'Energy Saving Technology',
    slug: 'energy-saving',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subcategories: [
      {
        id: '1-1',
        category_id: '1',
        name_zh: '工业节能',
        name_en: 'Industrial Energy Saving',
        slug: 'industrial-energy-saving',
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '1-2',
        category_id: '1',
        name_zh: '建筑节能',
        name_en: 'Building Energy Saving',
        slug: 'building-energy-saving',
        sort_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  },
  {
    id: '2',
    name_zh: '环保技术',
    name_en: 'Environmental Protection Technology',
    slug: 'environmental-protection',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subcategories: [
      {
        id: '2-1',
        category_id: '2',
        name_zh: '水污染治理',
        name_en: 'Water Pollution Control',
        slug: 'water-pollution-control',
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2-2',
        category_id: '2',
        name_zh: '大气污染治理',
        name_en: 'Air Pollution Control',
        slug: 'air-pollution-control',
        sort_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  },
  {
    id: '3',
    name_zh: '新能源技术',
    name_en: 'New Energy Technology',
    slug: 'new-energy',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subcategories: [
      {
        id: '3-1',
        category_id: '3',
        name_zh: '太阳能技术',
        name_en: 'Solar Technology',
        slug: 'solar-technology',
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3-2',
        category_id: '3',
        name_zh: '风能技术',
        name_en: 'Wind Energy Technology',
        slug: 'wind-energy',
        sort_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }
]

/**
 * 模拟获取所有产业分类（包含子分类）
 */
export async function getMockCategories(): Promise<AdminCategory[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  return mockCategories
}

/**
 * 模拟创建产业分类
 */
export async function createMockCategory(data: any): Promise<AdminCategory> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const newCategory: AdminCategory = {
    id: Date.now().toString(),
    name_zh: data.name_zh,
    name_en: data.name_en,
    slug: data.slug,
    sort_order: data.sort_order || 0,
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subcategories: []
  }
  
  mockCategories.push(newCategory)
  return newCategory
}

/**
 * 模拟更新产业分类
 */
export async function updateMockCategory(id: string, data: any): Promise<AdminCategory> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const categoryIndex = mockCategories.findIndex(cat => cat.id === id)
  if (categoryIndex === -1) {
    throw new Error('分类不存在')
  }
  
  mockCategories[categoryIndex] = {
    ...mockCategories[categoryIndex],
    ...data,
    updated_at: new Date().toISOString()
  }
  
  return mockCategories[categoryIndex]
}

/**
 * 模拟删除产业分类
 */
export async function deleteMockCategory(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const categoryIndex = mockCategories.findIndex(cat => cat.id === id)
  if (categoryIndex === -1) {
    throw new Error('分类不存在')
  }
  
  mockCategories.splice(categoryIndex, 1)
}

/**
 * 模拟创建子分类
 */
export async function createMockSubcategory(data: any): Promise<AdminSubcategory> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const category = mockCategories.find(cat => cat.id === data.category_id)
  if (!category) {
    throw new Error('父分类不存在')
  }
  
  const newSubcategory: AdminSubcategory = {
    id: Date.now().toString(),
    category_id: data.category_id,
    name_zh: data.name_zh,
    name_en: data.name_en,
    slug: data.slug,
    sort_order: data.sort_order || 0,
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  if (!category.subcategories) {
    category.subcategories = []
  }
  category.subcategories.push(newSubcategory)
  
  return newSubcategory
}

/**
 * 模拟更新子分类
 */
export async function updateMockSubcategory(id: string, data: any): Promise<AdminSubcategory> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  for (const category of mockCategories) {
    if (category.subcategories) {
      const subIndex = category.subcategories.findIndex(sub => sub.id === id)
      if (subIndex !== -1) {
        category.subcategories[subIndex] = {
          ...category.subcategories[subIndex],
          ...data,
          updated_at: new Date().toISOString()
        }
        return category.subcategories[subIndex]
      }
    }
  }
  
  throw new Error('子分类不存在')
}

/**
 * 模拟删除子分类
 */
export async function deleteMockSubcategory(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  for (const category of mockCategories) {
    if (category.subcategories) {
      const subIndex = category.subcategories.findIndex(sub => sub.id === id)
      if (subIndex !== -1) {
        category.subcategories.splice(subIndex, 1)
        return
      }
    }
  }
  
  throw new Error('子分类不存在')
}