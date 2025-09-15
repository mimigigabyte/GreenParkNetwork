import { AdminTechnology, PaginationParams, PaginatedResponse } from '@/lib/types/admin'

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

  const response = await fetch(`/api/user/technologies?${searchParams}`)
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '获取用户技术列表失败')
  }

  const result = await response.json()
  return {
    data: result.data || [],
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
  const response = await fetch('/api/user/technologies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(technologyData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '创建技术失败')
  }

  return await response.json()
}

// 用户更新技术
export async function updateUserTechnologyApi(id: string, technologyData: Partial<AdminTechnology>): Promise<AdminTechnology> {
  const response = await fetch(`/api/user/technologies/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(technologyData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '更新技术失败')
  }

  return await response.json()
}

// 用户删除技术
export async function deleteUserTechnologyApi(id: string, userId: string): Promise<void> {
  const response = await fetch(`/api/user/technologies/${id}?userId=${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '删除技术失败')
  }
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
