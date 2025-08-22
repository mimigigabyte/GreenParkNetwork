'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 检查管理员认证状态
  useEffect(() => {
    const checkAuth = () => {
      try {
        const adminAuth = localStorage.getItem('admin_authenticated');
        const authTime = localStorage.getItem('admin_auth_time');
        
        if (adminAuth === 'true' && authTime) {
          const authTimeMs = parseInt(authTime);
          const now = Date.now();
          // 管理员会话有效期8小时
          const sessionDuration = 8 * 60 * 60 * 1000;
          
          if (now - authTimeMs < sessionDuration) {
            setIsAuthenticated(true);
          } else {
            // 会话过期，清除认证信息
            localStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_auth_time');
            setShowLoginForm(true);
          }
        } else {
          setShowLoginForm(true);
        }
      } catch (error) {
        console.error('检查管理员认证状态失败:', error);
        setShowLoginForm(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 处理管理员登录
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      // 验证管理员账号密码
      if (loginData.username === 'admin' && loginData.password === 'Ecocenter2025') {
        const currentTime = Date.now().toString();
        
        // 保存认证状态到localStorage
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_auth_time', currentTime);
        
        // 设置cookie用于API请求验证
        const isSecure = window.location.protocol === 'https:';
        const cookieOptions = `path=/; max-age=${8 * 60 * 60}; SameSite=strict${isSecure ? '; Secure' : ''}`;
        document.cookie = `admin_authenticated=true; ${cookieOptions}`;
        document.cookie = `admin_auth_time=${currentTime}; ${cookieOptions}`;
        
        setIsAuthenticated(true);
        setShowLoginForm(false);
      } else {
        setLoginError('用户名或密码错误');
      }
    } catch (error) {
      console.error('管理员登录错误:', error);
      setLoginError('登录失败，请稍后重试');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_auth_time');
    
    // 清除cookie
    const isSecure = window.location.protocol === 'https:';
    const clearCookieOptions = `path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=strict${isSecure ? '; Secure' : ''}`;
    document.cookie = `admin_authenticated=; ${clearCookieOptions}`;
    document.cookie = `admin_auth_time=; ${clearCookieOptions}`;
    
    router.push('/');
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">验证管理员权限...</p>
        </div>
      </div>
    );
  }

  // 显示登录表单
  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">管理员登录</h1>
            <p className="text-gray-600">请输入管理员账号密码访问控制台</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            {/* 用户名输入 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入管理员用户名"
                required
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入管理员密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
            </div>

            {/* 错误信息 */}
            {loginError && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {loginError}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={!loginData.username || !loginData.password || isLoggingIn}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                loginData.username && loginData.password && !isLoggingIn
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoggingIn ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 返回首页 */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 已认证，显示子组件
  return (
    <>
      {children}
      {/* 可以在这里添加管理员退出登录的快捷按钮 */}
    </>
  );
}