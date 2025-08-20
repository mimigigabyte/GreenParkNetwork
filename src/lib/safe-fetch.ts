/**
 * 安全的 Fetch 包装器 - 自动处理header清理和错误处理
 */

import { createSafeHeaders, createContentTypeHeader, createAuthorizationHeader } from './header-utils';

/**
 * 安全的fetch选项接口
 */
interface SafeFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string | null | undefined>;
  useAuth?: boolean; // 是否自动添加认证token
}

/**
 * 获取认证token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      // 客户端环境
      // 首先尝试从Supabase session获取
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          return session.access_token;
        }
      } catch (error) {
        console.warn('获取Supabase session失败:', error);
      }
      
      // 回退到localStorage
      return localStorage.getItem('access_token');
    }
    return null;
  } catch (error) {
    console.warn('获取认证token失败:', error);
    return null;
  }
}

/**
 * 安全的fetch函数
 * @param url - 请求URL
 * @param options - 请求选项
 * @returns Promise<Response>
 */
export async function safeFetch(url: string, options: SafeFetchOptions = {}): Promise<Response> {
  try {
    const { headers = {}, useAuth = false, ...restOptions } = options;
    
    // 创建基础headers
    const baseHeaders: Record<string, string | null | undefined> = {
      'Content-Type': createContentTypeHeader(),
      ...headers
    };
    
    // 如果需要认证，添加Authorization header
    if (useAuth) {
      const token = await getAuthToken();
      if (token) {
        baseHeaders['Authorization'] = createAuthorizationHeader(token);
      }
    }
    
    // 创建安全的headers
    const safeHeaders = createSafeHeaders(baseHeaders);
    
    console.log('🚀 Safe fetch请求:', {
      url,
      method: restOptions.method || 'GET',
      hasAuth: !!safeHeaders['Authorization'],
      headersCount: Object.keys(safeHeaders).length
    });
    
    const response = await fetch(url, {
      ...restOptions,
      headers: safeHeaders,
    });
    
    console.log(`📡 API响应 ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    return response;
    
  } catch (error) {
    console.error(`❌ Fetch错误 ${url}:`, error);
    throw error;
  }
}

/**
 * 安全的GET请求
 * @param url - 请求URL
 * @param useAuth - 是否使用认证
 * @returns Promise<Response>
 */
export async function safeGet(url: string, useAuth: boolean = false): Promise<Response> {
  return safeFetch(url, { method: 'GET', useAuth });
}

/**
 * 安全的POST请求
 * @param url - 请求URL
 * @param data - 请求数据
 * @param useAuth - 是否使用认证
 * @returns Promise<Response>
 */
export async function safePost(url: string, data?: any, useAuth: boolean = false): Promise<Response> {
  return safeFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    useAuth
  });
}

/**
 * 安全的PUT请求
 * @param url - 请求URL
 * @param data - 请求数据
 * @param useAuth - 是否使用认证
 * @returns Promise<Response>
 */
export async function safePut(url: string, data?: any, useAuth: boolean = false): Promise<Response> {
  return safeFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    useAuth
  });
}

/**
 * 安全的DELETE请求
 * @param url - 请求URL
 * @param useAuth - 是否使用认证
 * @returns Promise<Response>
 */
export async function safeDelete(url: string, useAuth: boolean = false): Promise<Response> {
  return safeFetch(url, { method: 'DELETE', useAuth });
}

/**
 * 处理API响应的通用函数
 * @param response - fetch响应
 * @returns Promise<any>
 */
export async function handleApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (parseError) {
      console.warn('无法解析错误响应:', parseError);
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}