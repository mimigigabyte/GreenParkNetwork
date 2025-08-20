import { NextRequest } from 'next/server'

/**
 * 检查管理员认证状态
 */
export function checkAdminAuth(request: NextRequest): boolean {
  try {
    const adminAuth = request.cookies.get('admin_authenticated')?.value
    const authTime = request.cookies.get('admin_auth_time')?.value
    
    if (adminAuth !== 'true' || !authTime) {
      return false
    }
    
    const authTimeMs = parseInt(authTime)
    const now = Date.now()
    // 管理员会话有效期8小时
    const sessionDuration = 8 * 60 * 60 * 1000
    
    if (now - authTimeMs >= sessionDuration) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('检查管理员认证失败:', error)
    return false
  }
}

/**
 * 管理员认证中间件
 */
export function withAdminAuth(handler: (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<Response>) {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    if (!checkAdminAuth(request)) {
      return new Response(JSON.stringify({ error: '需要管理员权限' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return handler(request, context)
  }
}