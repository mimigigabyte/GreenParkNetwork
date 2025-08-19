// 经开区管理API客户端

import { AdminDevelopmentZone, CreateDevelopmentZoneData, UpdateDevelopmentZoneData } from '@/lib/types/admin'

/**
 * 获取经开区列表
 */
export async function getDevelopmentZonesApi(provinceId?: string): Promise<AdminDevelopmentZone[]> {
  const url = provinceId 
    ? `/api/admin/development-zones?provinceId=${provinceId}`
    : '/api/admin/development-zones'
    
  const response = await fetch(url)
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '获取经开区失败')
  }
  
  return result.data
}

/**
 * 创建经开区
 */
export async function createDevelopmentZoneApi(data: CreateDevelopmentZoneData): Promise<AdminDevelopmentZone> {
  const response = await fetch('/api/admin/development-zones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '创建经开区失败')
  }
  
  return result.data
}

/**
 * 更新经开区
 */
export async function updateDevelopmentZoneApi(id: string, data: UpdateDevelopmentZoneData): Promise<AdminDevelopmentZone> {
  const response = await fetch(`/api/admin/development-zones/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '更新经开区失败')
  }
  
  return result.data
}

/**
 * 删除经开区
 */
export async function deleteDevelopmentZoneApi(id: string): Promise<void> {
  const response = await fetch(`/api/admin/development-zones/${id}`, {
    method: 'DELETE',
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || '删除经开区失败')
  }
}