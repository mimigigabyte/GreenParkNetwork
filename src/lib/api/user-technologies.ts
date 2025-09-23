import { AdminTechnology, PaginationParams, PaginatedResponse } from '@/lib/types/admin'
import { safeFetch, handleApiResponse } from '@/lib/safe-fetch'

// 获取用户技术列表
export async function getUserTechnologiesApi(params: Partial<PaginationParams & { userId: string }>): Promise<PaginatedResponse<AdminTechnology>> {
  if (!params.userId) {
    throw new Error('用户ID不能为空')
  }

  const searchParams = new URLSearchParams()
  
  if (params.page) searchParams.append('page', String(params.page))
  if (params.pageSize) searchParams.append('pageSize', String(params.pageSize))
  if (params.search) searchParams.append('search', params.search)
  if (params.sortBy) searchParams.append('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)
  if (params.userId) searchParams.append('userId', params.userId)

  const response = await safeFetch(`/api/user/technologies?${searchParams}`, { useAuth: true })
  const result = await handleApiResponse(response)
  return {
    data: result?.data || [],
    pagination: result.pagination || {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    }
  }
}

// 用户创建技术
export async function createUserTechnologyApi(technologyData: Partial<AdminTechnology>): Promise<AdminTechnology> {
  const response = await safeFetch('/api/user/technologies', {
    method: 'POST',
    useAuth: true,
    body: JSON.stringify(technologyData),
  })

  const result = await handleApiResponse(response)
  return result?.data ?? result
}

// 用户更新技术
export async function updateUserTechnologyApi(id: string, technologyData: Partial<AdminTechnology>): Promise<AdminTechnology> {
  const response = await safeFetch(`/api/user/technologies/${id}`, {
    method: 'PUT',
    useAuth: true,
    body: JSON.stringify(technologyData),
  })

  const result = await handleApiResponse(response)
  return result?.data ?? result
}

// 用户删除技术
export async function deleteUserTechnologyApi(id: string, userId: string): Promise<void> {
  const response = await safeFetch(`/api/user/technologies/${id}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    useAuth: true,
  })

  await handleApiResponse(response)
}

// 获取单个用户技术详情
export async function getUserTechnologyByIdApi(id: string): Promise<AdminTechnology> {
  const response = await fetch(`/api/user/technologies/${id}`)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || '获取技术详情失败')
  }
  const result = await response.json()
  return result.data as AdminTechnology
}
