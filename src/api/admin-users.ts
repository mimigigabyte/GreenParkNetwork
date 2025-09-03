import { AdminUser, PaginationParams, PaginatedResponse, AdminCompany } from '@/lib/types/admin'

/**
 * 获取用户列表
 * @param params - 分页和过滤参数
 * @returns 用户列表
 */
export const getUsersApi = async (params: PaginationParams): Promise<PaginatedResponse<AdminUser>> => {
  try {
    console.log('Fetching users with params:', params)
    
    const searchParams = new URLSearchParams();
    searchParams.append('page', params.page?.toString() || '1');
    searchParams.append('pageSize', params.pageSize?.toString() || '10');
    
    if (params.search) {
      searchParams.append('search', params.search);
    }

    const response = await fetch(`/api/admin/users?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch users');
    }

    return {
      data: result.data,
      pagination: result.pagination,
    };

  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * 创建用户
 * @param userData - 用户数据
 * @returns 新创建的用户
 */
export const createUserApi = async (userData: Partial<AdminUser>): Promise<AdminUser> => {
  try {
    console.log('Creating user with data:', userData)

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create user');
    }

    return result.data;

  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * 更新用户
 * @param userId - 用户ID
 * @param userData - 要更新的用户数据
 * @returns 更新后的用户
 */
export const updateUserApi = async (userId: string, userData: Partial<AdminUser>): Promise<AdminUser> => {
  try {
    console.log(`Updating user ${userId} with data:`, userData)

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update user');
    }

    return result.data;

  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * 删除用户
 * @param userId - 用户ID
 */
export const deleteUserApi = async (userId: string): Promise<void> => {
  try {
    console.log(`Deleting user ${userId}`)

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete user');
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * 获取企业列表 (用于表单选择)
 * @returns 企业列表
 */
export const getCompaniesForSelectApi = async (): Promise<AdminCompany[]> => {
  try {
    // 拉取较大的页尺寸，避免分页遗漏
    const params = new URLSearchParams({ page: '1', pageSize: '1000', sortBy: 'name_zh', sortOrder: 'asc' })
    const response = await fetch(`/api/admin/companies?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    // 兼容两种响应格式：
    // 1) { data: [...], pagination: {...} }
    // 2) { success: true, data: [...] }
    const list: AdminCompany[] = Array.isArray(result)
      ? (result as AdminCompany[])
      : (Array.isArray(result.data) ? result.data : [])

    if (!list || !Array.isArray(list)) {
      throw new Error(result.error || 'Failed to fetch companies')
    }

    return list.map((company: AdminCompany) => ({
      id: company.id,
      name_zh: company.name_zh,
      name_en: (company as any).name_en,
    }))
  } catch (error) {
    console.error('Error fetching companies for select:', error)
    throw error
  }
}
