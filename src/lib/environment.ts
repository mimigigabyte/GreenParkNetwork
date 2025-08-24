/**
 * 环境检测工具
 * 用于判断当前运行环境，支持本地开发环境的特殊处理
 */

/**
 * 检测是否为本地开发环境
 * @returns true 如果是本地环境
 */
export function isLocalDevelopment(): boolean {
  // 服务端环境检测
  if (typeof window === 'undefined') {
    // 检查 NODE_ENV
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // 检查是否在 Vercel 环境（线上环境通常会设置这个）
    if (process.env.VERCEL === '1') {
      return false;
    }
    
    // 检查特定的本地环境变量
    if (process.env.SKIP_TURNSTILE_IN_DEV === 'true') {
      return true;
    }
    
    return process.env.NODE_ENV !== 'production';
  }
  
  // 客户端环境检测
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // 检查常见的本地域名
  const localHostnames = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1'
  ];
  
  // 检查是否是本地hostname
  if (localHostnames.includes(hostname)) {
    return true;
  }
  
  // 检查是否是 .local 域名
  if (hostname.endsWith('.local')) {
    return true;
  }
  
  // 检查是否是常见的开发端口
  const devPorts = ['3000', '3001', '8000', '8080', '5173', '5174'];
  if (port && devPorts.includes(port)) {
    return true;
  }
  
  // 检查是否是内网IP
  if (hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') || 
      hostname.startsWith('172.')) {
    return true;
  }
  
  return false;
}

/**
 * 检测当前环境类型
 */
export function getEnvironmentType(): 'development' | 'staging' | 'production' {
  if (isLocalDevelopment()) {
    return 'development';
  }
  
  // 服务端检测
  if (typeof window === 'undefined') {
    if (process.env.VERCEL_ENV === 'preview') {
      return 'staging';
    }
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }
  }
  
  // 客户端检测
  const hostname = window.location.hostname;
  
  // 检查是否是预发布环境（通常有特定的域名模式）
  if (hostname.includes('staging') || hostname.includes('test') || hostname.includes('dev')) {
    return 'staging';
  }
  
  return 'production';
}

/**
 * 判断是否应该跳过 Turnstile 验证
 * @returns true 如果应该跳过验证
 */
export function shouldSkipTurnstile(): boolean {
  // 检查环境变量强制跳过
  if (process.env.SKIP_TURNSTILE_IN_DEV === 'true') {
    return true;
  }
  
  // 本地开发环境跳过
  if (isLocalDevelopment()) {
    return true;
  }
  
  // 如果没有配置 Turnstile keys，也跳过
  if (!process.env.TURNSTILE_SECRET_KEY || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return true;
  }
  
  return false;
}

/**
 * 获取环境信息用于调试
 */
export function getEnvironmentInfo() {
  const isLocal = isLocalDevelopment();
  const envType = getEnvironmentType();
  const skipTurnstile = shouldSkipTurnstile();
  
  return {
    isLocal,
    envType,
    skipTurnstile,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
    hasTurnstileKeys: !!(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  };
}

export default {
  isLocalDevelopment,
  getEnvironmentType, 
  shouldSkipTurnstile,
  getEnvironmentInfo
};