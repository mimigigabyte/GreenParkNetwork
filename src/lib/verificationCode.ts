/**
 * 验证码管理服务
 */

// 验证码存储接口
interface VerificationCodeData {
  code: string
  mobile: string
  purpose: 'register' | 'login' | 'reset_password'
  expiresAt: number
  attempts: number
  maxAttempts: number
}

// 内存存储（生产环境建议使用 Redis）
const codeStorage = new Map<string, VerificationCodeData>()

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 获取验证码存储键
 */
function getStorageKey(mobile: string, purpose: string): string {
  return `${mobile}:${purpose}`
}

/**
 * 存储验证码
 */
export function storeVerificationCode(
  mobile: string, 
  code: string, 
  purpose: 'register' | 'login' | 'reset_password',
  expiresInMinutes: number = 5
): void {
  const key = getStorageKey(mobile, purpose)
  const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000)
  
  const codeData: VerificationCodeData = {
    code,
    mobile,
    purpose,
    expiresAt,
    attempts: 0,
    maxAttempts: 3
  }
  
  codeStorage.set(key, codeData)
  
  console.log('💾 验证码已存储:', {
    mobile,
    purpose,
    code: code.substring(0, 2) + '****',
    expiresAt: new Date(expiresAt).toLocaleString()
  })
}

/**
 * 验证验证码
 */
export interface VerificationResult {
  success: boolean
  message: string
  attemptsLeft?: number
}

export function verifyCode(
  mobile: string,
  inputCode: string,
  purpose: 'register' | 'login' | 'reset_password'
): VerificationResult {
  const key = getStorageKey(mobile, purpose)
  const codeData = codeStorage.get(key)
  
  // 检查验证码是否存在
  if (!codeData) {
    return {
      success: false,
      message: '验证码不存在或已过期，请重新获取'
    }
  }
  
  // 检查是否过期
  if (Date.now() > codeData.expiresAt) {
    codeStorage.delete(key)
    return {
      success: false,
      message: '验证码已过期，请重新获取'
    }
  }
  
  // 检查尝试次数
  if (codeData.attempts >= codeData.maxAttempts) {
    codeStorage.delete(key)
    return {
      success: false,
      message: '验证码错误次数过多，请重新获取'
    }
  }
  
  // 验证码错误
  if (codeData.code !== inputCode) {
    codeData.attempts++
    const attemptsLeft = codeData.maxAttempts - codeData.attempts
    
    if (attemptsLeft <= 0) {
      codeStorage.delete(key)
      return {
        success: false,
        message: '验证码错误次数过多，请重新获取'
      }
    }
    
    return {
      success: false,
      message: '验证码错误',
      attemptsLeft
    }
  }
  
  // 验证成功，删除验证码
  codeStorage.delete(key)
  
  console.log('✅ 验证码验证成功:', {
    mobile,
    purpose
  })
  
  return {
    success: true,
    message: '验证码验证成功'
  }
}

/**
 * 检查是否可以发送验证码（防止频繁发送）
 */
export function canSendCode(
  mobile: string,
  purpose: 'register' | 'login' | 'reset_password'
): { canSend: boolean; waitTime?: number } {
  const key = getStorageKey(mobile, purpose)
  const codeData = codeStorage.get(key)
  
  if (!codeData) {
    return { canSend: true }
  }
  
  // 如果验证码已过期，可以发送新的
  if (Date.now() > codeData.expiresAt) {
    return { canSend: true }
  }
  
  // 计算剩余等待时间（60秒内不能重复发送）
  const lastSentTime = codeData.expiresAt - (5 * 60 * 1000) // 假设验证码有效期5分钟
  const waitUntil = lastSentTime + (60 * 1000) // 60秒后可以重新发送
  const waitTime = Math.max(0, waitUntil - Date.now())
  
  if (waitTime > 0) {
    return {
      canSend: false,
      waitTime: Math.ceil(waitTime / 1000) // 返回秒数
    }
  }
  
  return { canSend: true }
}

/**
 * 清理过期的验证码（定期清理）
 */
export function cleanupExpiredCodes(): void {
  const now = Date.now()
  const expiredKeys: string[] = []
  
  codeStorage.forEach((codeData, key) => {
    if (now > codeData.expiresAt) {
      expiredKeys.push(key)
    }
  })
  
  for (const key of expiredKeys) {
    codeStorage.delete(key)
  }
  
  if (expiredKeys.length > 0) {
    console.log('🧹 清理过期验证码:', expiredKeys.length)
  }
}

// 每分钟清理一次过期验证码
setInterval(cleanupExpiredCodes, 60 * 1000)