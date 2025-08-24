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
    // 优先检查是否强制启用跳过（仅用于特殊调试）
    if (process.env.SKIP_TURNSTILE_IN_DEV === 'true') {
      return true;
    }
    
    // 检查是否明确为开发环境
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // 所有其他情况都视为生产环境，不跳过验证
    return false;
  }
  
  // 客户端环境检测
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // 明确的生产环境域名，绝对不能跳过验证
  const productionDomains = [
    'gtech.greendev.org.cn',
    'greendev.org.cn'
  ];
  
  // 如果是生产域名，强制返回false
  if (productionDomains.some(domain => hostname.includes(domain))) {
    return false;
  }
  
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
  
  // 检查是否是常见的开发端口（但排除生产域名）
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
  // 额外安全检查：如果是明确的生产环境，绝不跳过
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const productionDomains = [
      'gtech.greendev.org.cn',
      'greendev.org.cn'
    ];
    
    if (productionDomains.some(domain => hostname.includes(domain))) {
      console.log('🔒 生产环境检测到，强制启用Turnstile验证');
      return false;
    }
  }
  
  // 检查环境变量强制跳过（仅限开发环境）
  if (process.env.SKIP_TURNSTILE_IN_DEV === 'true') {
    if (isLocalDevelopment()) {
      return true;
    }
    console.warn('⚠️ SKIP_TURNSTILE_IN_DEV 只在本地开发环境生效');
  }
  
  // 本地开发环境跳过
  if (isLocalDevelopment()) {
    return true;
  }
  
  // 生产环境必须有Turnstile配置，没有配置不跳过（显示错误）
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