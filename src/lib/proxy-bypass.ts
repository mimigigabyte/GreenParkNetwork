/**
 * 代理绕过工具
 * 用于确保腾讯云API调用不受本地代理影响
 */

/**
 * 临时禁用代理环境变量
 */
export function disableProxyForTencentCloud() {
  // 保存原始代理设置
  const originalProxy = {
    HTTP_PROXY: process.env.HTTP_PROXY,
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    http_proxy: process.env.http_proxy,
    https_proxy: process.env.https_proxy,
    NO_PROXY: process.env.NO_PROXY,
    no_proxy: process.env.no_proxy,
  }

  // 临时清除所有代理环境变量
  delete process.env.HTTP_PROXY
  delete process.env.HTTPS_PROXY
  delete process.env.http_proxy
  delete process.env.https_proxy

  // 设置不使用代理的域名
  process.env.NO_PROXY = 'sms.tencentcloudapi.com,*.tencentcloudapi.com,localhost,127.0.0.1'
  process.env.no_proxy = 'sms.tencentcloudapi.com,*.tencentcloudapi.com,localhost,127.0.0.1'

  console.log('🚫 已临时禁用代理，直连腾讯云API')

  return originalProxy
}

/**
 * 恢复原始代理设置
 */
export function restoreProxySettings(originalProxy: Record<string, string | undefined>) {
  Object.keys(originalProxy).forEach(key => {
    if (originalProxy[key]) {
      process.env[key] = originalProxy[key]
    } else {
      delete process.env[key]
    }
  })

  console.log('🔄 已恢复原始代理设置')
}

/**
 * 执行函数并临时禁用代理
 */
export async function executeWithoutProxy<T>(fn: () => Promise<T>): Promise<T> {
  const originalProxy = disableProxyForTencentCloud()
  
  try {
    const result = await fn()
    return result
  } finally {
    restoreProxySettings(originalProxy)
  }
}