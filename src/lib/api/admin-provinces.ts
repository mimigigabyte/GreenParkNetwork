// 省份管理API客户端

import { AdminProvince, CreateProvinceData, UpdateProvinceData } from '@/lib/types/admin'

/**
 * 获取省份列表
 */
export async function getProvincesApi(countryId?: string): Promise<AdminProvince[]> {
  const url = countryId 
    ? `/api/admin/provinces?countryId=${countryId}`
    : '/api/admin/provinces'
    
  const response = await fetch(url)
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '获取省份失败')
  }
  
  return result.data
}

/**
 * 创建省份
 */
export async function createProvinceApi(data: CreateProvinceData): Promise<AdminProvince> {
  const response = await fetch('/api/admin/provinces', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '创建省份失败')
  }
  
  return result.data
}

/**
 * 更新省份
 */
export async function updateProvinceApi(id: string, data: UpdateProvinceData): Promise<AdminProvince> {
  const response = await fetch(`/api/admin/provinces/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '更新省份失败')
  }
  
  return result.data
}

/**
 * 删除省份
 */
export async function deleteProvinceApi(id: string): Promise<void> {
  const response = await fetch(`/api/admin/provinces/${id}`, {
    method: 'DELETE',
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '删除省份失败')
  }
}