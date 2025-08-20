/**
 * Header 工具函数 - 清理和验证HTTP头部值
 */

/**
 * 清理header值，移除无效字符
 * @param value - 原始header值
 * @returns 清理后的header值
 */
export function sanitizeHeaderValue(value: string | null | undefined): string {
  if (!value) return '';
  
  // 转换为字符串并移除换行符、回车符和其他控制字符
  return String(value)
    .replace(/[\r\n\t]/g, '') // 移除换行符、回车符、制表符
    .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
    .trim(); // 移除首尾空格
}

/**
 * 验证header值是否有效
 * @param value - header值
 * @returns 是否有效
 */
export function isValidHeaderValue(value: string): boolean {
  // 检查是否包含无效字符
  return !/[\r\n\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value);
}

/**
 * 安全地创建Authorization header
 * @param token - 认证token
 * @returns 清理后的Authorization header值
 */
export function createAuthorizationHeader(token: string | null | undefined): string {
  if (!token) return '';
  
  const cleanToken = sanitizeHeaderValue(token);
  
  // 验证token格式
  if (!cleanToken || cleanToken.length < 10) {
    console.warn('⚠️ Token格式无效或过短');
    return '';
  }
  
  return `Bearer ${cleanToken}`;
}

/**
 * 安全地创建Content-Type header
 * @param contentType - 内容类型
 * @returns 清理后的Content-Type header值
 */
export function createContentTypeHeader(contentType: string = 'application/json'): string {
  return sanitizeHeaderValue(contentType) || 'application/json';
}

/**
 * 创建安全的headers对象
 * @param headers - 原始headers对象
 * @returns 清理后的headers对象
 */
export function createSafeHeaders(headers: Record<string, string | null | undefined> = {}): Record<string, string> {
  const safeHeaders: Record<string, string> = {};
  
  Object.entries(headers).forEach(([key, value]) => {
    const cleanValue = sanitizeHeaderValue(value);
    if (cleanValue && isValidHeaderValue(cleanValue)) {
      safeHeaders[key] = cleanValue;
    } else if (cleanValue) {
      console.warn(`⚠️ Header "${key}" 包含无效字符，已跳过`);
    }
  });
  
  return safeHeaders;
}

/**
 * 安全的fetch包装器
 * @param url - 请求URL
 * @param options - fetch选项
 * @returns fetch Promise
 */
export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const safeOptions = { ...options };
  
  // 清理headers
  if (options.headers) {
    const headersRecord: Record<string, string | null | undefined> = {};
    
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
    
    safeOptions.headers = createSafeHeaders(headersRecord);
  }
  
  return fetch(url, safeOptions);
}