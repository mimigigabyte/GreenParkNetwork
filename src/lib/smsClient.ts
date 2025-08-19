import crypto from 'crypto'

// 融信云短信配置
interface SmsConfig {
  appId: string
  password: string
  baseUrl: string
}

// 短信发送请求参数
interface SendSmsRequest {
  appId: string
  password: string
  content: string
  mobile: string[]
}

// 短信发送响应
interface SendSmsResponse {
  code: string
  msg: string
  data: Array<{
    mobile: string
    msgId: string
  }>
}

// 验证码模板
export const SMS_TEMPLATES = {
  REGISTER: '您的注册验证码是：{code}，5分钟内有效。如非本人操作，请忽略此短信。',
  LOGIN: '您的登录验证码是：{code}，5分钟内有效。如非本人操作，请忽略此短信。',
  RESET_PASSWORD: '您的密码重置验证码是：{code}，5分钟内有效。如非本人操作，请忽略此短信。'
}

/**
 * 融信云短信客户端
 */
export class SmsClient {
  private config: SmsConfig

  constructor(config: SmsConfig) {
    this.config = config
  }

  /**
   * MD5加密密码
   */
  private hashPassword(password: string): string {
    return crypto.createHash('md5').update(password).digest('hex').toLowerCase()
  }

  /**
   * 发送短信
   */
  async sendSms(mobile: string, content: string): Promise<SendSmsResponse> {
    const requestData: SendSmsRequest = {
      appId: this.config.appId,
      password: this.hashPassword(this.config.password),
      content: content,
      mobile: [mobile]
    }

    console.log('📱 发送短信请求:', {
      appId: requestData.appId,
      mobile: requestData.mobile,
      content: requestData.content,
      passwordHash: requestData.password.substring(0, 8) + '...'
    })

    try {
      const response = await fetch(`${this.config.baseUrl}/api/smsSend/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: SendSmsResponse = await response.json()
      
      console.log('📱 短信发送响应:', result)
      
      return result
    } catch (error) {
      console.error('❌ 短信发送失败:', error)
      throw new Error(`短信发送失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 发送验证码短信
   */
  async sendVerificationCode(mobile: string, code: string, purpose: 'register' | 'login' | 'reset_password'): Promise<boolean> {
    let template: string
    
    switch (purpose) {
      case 'register':
        template = SMS_TEMPLATES.REGISTER
        break
      case 'login':
        template = SMS_TEMPLATES.LOGIN
        break
      case 'reset_password':
        template = SMS_TEMPLATES.RESET_PASSWORD
        break
      default:
        throw new Error('不支持的验证码用途')
    }

    const content = template.replace('{code}', code)
    
    try {
      const result = await this.sendSms(mobile, content)
      
      // 检查发送状态
      if (result.code === '0' || result.code === 'success') {
        console.log('✅ 验证码发送成功:', {
          mobile,
          purpose,
          msgId: result.data?.[0]?.msgId
        })
        return true
      } else {
        console.error('❌ 验证码发送失败:', result.msg)
        return false
      }
    } catch (error) {
      console.error('❌ 验证码发送异常:', error)
      return false
    }
  }
}

/**
 * 创建短信客户端实例
 */
export function createSmsClient(): SmsClient | null {
  const config: SmsConfig = {
    appId: process.env.SMS_APP_ID || '',
    password: process.env.SMS_PASSWORD || '',
    baseUrl: process.env.SMS_BASE_URL || 'https://sms.bjxunyin.net'
  }

  if (!config.appId || !config.password) {
    console.warn('⚠️ 短信服务配置不完整，短信功能已禁用。请配置环境变量 SMS_APP_ID 和 SMS_PASSWORD 来启用短信服务。')
    return null
  }

  return new SmsClient(config)
}

// 默认短信客户端实例（可能为null如果配置不完整）
export const smsClient = createSmsClient()

/**
 * 检查短信服务是否可用
 */
export function isSmsServiceAvailable(): boolean {
  return smsClient !== null
}