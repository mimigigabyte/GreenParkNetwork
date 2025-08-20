// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || false
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' || true // 默认使用 Supabase
const USE_SMS_SERVICE = process.env.NEXT_PUBLIC_USE_SMS_SERVICE === 'true' || false // 使用短信服务

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  attemptsLeft?: number
}

import { createSafeHeaders, createContentTypeHeader } from '@/lib/header-utils'

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      
      // 创建安全的headers
      const baseHeaders = {
        'Content-Type': createContentTypeHeader(),
      }
      
      const headersRecord: Record<string, string | null | undefined> = { ...baseHeaders }
      
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((value, key) => {
            headersRecord[key] = value;
          });
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach(([key, value]) => {
            headersRecord[key] = value;
          });
        } else {
          Object.assign(headersRecord, options.headers);
        }
      }
      
      const safeHeaders = createSafeHeaders(headersRecord)
      
      const response = await fetch(url, {
        ...options,
        headers: safeHeaders,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || '请求失败',
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('API请求错误:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()

// Mock模式标识
export { USE_MOCK, USE_SUPABASE, USE_SMS_SERVICE } 