import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // 检查是否是管理员相关路由
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    // 检查管理员认证状态
    const adminAuth = request.cookies.get('admin_authenticated')?.value
    const authTime = request.cookies.get('admin_auth_time')?.value

    if (adminAuth !== 'true' || !authTime) {
      return NextResponse.json(
        { error: '未授权访问，需要管理员登录' },
        { status: 401 }
      )
    }

    // 检查会话是否过期（8小时）
    const authTimeMs = parseInt(authTime)
    const now = Date.now()
    const sessionDuration = 8 * 60 * 60 * 1000

    if (now - authTimeMs > sessionDuration) {
      return NextResponse.json(
        { error: '管理员会话已过期，请重新登录' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*']
}