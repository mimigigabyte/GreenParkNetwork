import { executeWithoutProxy } from './proxy-bypass'

// 使用动态导入避免CommonJS/ESM冲突
let SmsClient: any = null

async function initSmsClient() {
  if (!SmsClient) {
    const tencentcloud = require('tencentcloud-sdk-nodejs-sms')
    SmsClient = tencentcloud.sms.v20210111.Client
  }
  return SmsClient
}

/**
 * 腾讯云短信服务配置
 */
interface TencentSMSConfig {
  secretId: string
  secretKey: string
  region: string
  smsSdkAppId: string
  signName: string
  templateId: string
}

/**
 * 验证码发送结果
 */
interface SMSResult {
  success: boolean
  message: string
  requestId?: string
}

/**
 * 腾讯云短信服务类
 */
export class TencentSMSService {
  private client: any = null
  private config: TencentSMSConfig
  private initialized: boolean = false

  constructor(config: TencentSMSConfig) {
    this.config = config
  }

  private async ensureInitialized() {
    if (this.initialized) return

    // 清除代理环境变量，确保直连腾讯云API
    delete process.env.HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.http_proxy
    delete process.env.https_proxy

    // 获取SMS客户端类
    const ClientClass = await initSmsClient()

    // 实例化一个认证对象，入参需要传入腾讯云账户secretId，secretKey
    // 本示例采用的是从环境变量读取的方式，需要在环境中先设置这两个值
    const clientConfig = {
      credential: {
        secretId: this.config.secretId,
        secretKey: this.config.secretKey,
      },
      region: this.config.region,
      profile: {
        httpProfile: {
          endpoint: 'sms.tencentcloudapi.com',
          timeout: 60,
        },
        signatureMethod: 'TC3-HMAC-SHA256',
      },
    }

    // 实例化要请求产品的client对象,clientProfile是可选的
    this.client = new ClientClass(clientConfig)
    this.initialized = true
  }

  /**
   * 发送验证码短信
   */
  async sendVerificationCode(
    phoneNumber: string,
    verificationCode: string,
    countryCode: string = '+86'
  ): Promise<SMSResult> {
    return executeWithoutProxy(async () => {
      try {
        // 确保客户端已初始化
        await this.ensureInitialized()
        console.log('🔍 开始发送短信 - 原始参数:', {
          phoneNumber,
          verificationCode,
          countryCode,
          config: {
            smsSdkAppId: this.config.smsSdkAppId,
            signName: this.config.signName,
            templateId: this.config.templateId
          }
        })
        
        // 格式化手机号
        const formattedPhone = this.formatPhoneNumber(phoneNumber, countryCode)
        console.log('📱 手机号格式化结果:', `${phoneNumber} -> ${formattedPhone}`)
        
        // 确保所有参数都是字符串类型
        // 尝试不同的模板参数格式，某些模板可能只需要验证码参数
        const params = {
          PhoneNumberSet: [formattedPhone],
          SmsSdkAppId: this.config.smsSdkAppId,
          SignName: this.config.signName,
          TemplateId: this.config.templateId,
          TemplateParamSet: [verificationCode], // 先尝试只传验证码
        }

        console.log('📱 腾讯云短信发送参数:', {
          ...params,
          debug: {
            originalPhone: phoneNumber,
            formattedPhone: formattedPhone,
            countryCode: countryCode
          }
        })

        const data = await this.client.SendSms(params)
        
        console.log('📱 腾讯云短信发送响应:', JSON.stringify(data, null, 2))

        if (data.SendStatusSet && data.SendStatusSet.length > 0) {
          const status = data.SendStatusSet[0]
          
          if (status.Code === 'Ok') {
            return {
              success: true,
              message: `验证码已发送到 ${phoneNumber}，请注意查收`,
              requestId: data.RequestId,
            }
          } else {
            console.error('❌ 腾讯云短信发送失败:', status.Code, status.Message)
            return {
              success: false,
              message: `发送失败: ${status.Message || '未知错误'}`,
              requestId: data.RequestId,
            }
          }
        } else {
          console.error('❌ 腾讯云短信响应格式异常:', data)
          return {
            success: false,
            message: '发送失败，响应格式异常',
            requestId: data.RequestId,
          }
        }
      } catch (error) {
        console.error('❌ 腾讯云短信发送异常:', error)
        
        // 更详细的错误处理
        let errorMessage = '发送失败，请稍后重试'
        
        if (error instanceof Error) {
          console.error('❌ 错误详情:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          })
          
          // 针对特定错误提供更明确的提示
          if (error.message.includes('Invalid URL')) {
            errorMessage = '请求URL格式错误，请检查配置参数'
          } else if (error.message.includes('Unsupported phone provider')) {
            errorMessage = '不支持的手机号提供商，请检查手机号格式是否正确'
          } else if (error.message.includes('ECONNREFUSED')) {
            errorMessage = '网络连接被拒绝，请检查网络设置'
          } else {
            errorMessage = error.message
          }
        }
        
        return {
          success: false,
          message: errorMessage,
        }
      }
    })
  }

  /**
   * 格式化手机号码
   * 腾讯云短信API要求国际格式，如：+8613800000000
   */
  private formatPhoneNumber(phoneNumber: string, countryCode: string): string {
    console.log('🔍 格式化手机号 - 输入:', { phoneNumber, countryCode })
    
    // 移除所有非数字字符
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    console.log('🔍 清理后的手机号:', cleanPhone)
    
    if (!cleanPhone) {
      throw new Error('手机号码不能为空')
    }
    
    if (countryCode === '+86') {
      // 中国大陆手机号
      if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
        const result = `+86${cleanPhone}`
        console.log('🔍 11位手机号格式化结果:', result)
        return result
      } else if (cleanPhone.length === 13 && cleanPhone.startsWith('86')) {
        const result = `+${cleanPhone}`
        console.log('🔍 13位手机号格式化结果:', result)
        return result
      } else {
        console.error('❌ 无效的中国大陆手机号码:', { cleanPhone, length: cleanPhone.length, startsWith1: cleanPhone.startsWith('1') })
        throw new Error(`无效的中国大陆手机号码格式，输入: ${phoneNumber}, 清理后: ${cleanPhone}`)
      }
    } else {
      // 其他国家/地区，假设用户输入的是正确格式
      const code = countryCode.replace('+', '')
      if (cleanPhone.startsWith(code)) {
        const result = `+${cleanPhone}`
        console.log('🔍 其他国家手机号格式化结果 (已包含国家码):', result)
        return result
      } else {
        const result = `${countryCode}${cleanPhone}`
        console.log('🔍 其他国家手机号格式化结果 (添加国家码):', result)
        return result
      }
    }
  }

  /**
   * 验证手机号码格式
   */
  static validatePhoneNumber(phoneNumber: string, countryCode: string = '+86'): boolean {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    if (countryCode === '+86') {
      // 中国大陆手机号验证
      return /^1[3-9]\d{9}$/.test(cleanPhone)
    } else {
      // 其他国家/地区的简单验证（至少6位数字）
      return cleanPhone.length >= 6 && cleanPhone.length <= 15
    }
  }
}

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 获取腾讯云短信服务实例
 */
export function createTencentSMSService(): TencentSMSService | null {
  const config = {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
    region: process.env.TENCENT_SMS_REGION || 'ap-beijing',
    smsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID,
    signName: process.env.TENCENT_SMS_SIGN_NAME,
    templateId: process.env.TENCENT_SMS_TEMPLATE_ID,
  }

  console.log('🔍 腾讯云短信配置检查:', {
    secretId: config.secretId ? `${config.secretId.substr(0, 8)}***` : 'undefined',
    secretKey: config.secretKey ? `${config.secretKey.substr(0, 8)}***` : 'undefined',
    region: config.region,
    smsSdkAppId: config.smsSdkAppId,
    signName: config.signName,
    templateId: config.templateId,
    nodeEnv: process.env.NODE_ENV,
    proxyVars: {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      NO_PROXY: process.env.NO_PROXY
    }
  })

  // 检查必需的环境变量
  const requiredFields = ['secretId', 'secretKey', 'smsSdkAppId', 'signName', 'templateId']
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config])

  if (missingFields.length > 0) {
    console.warn('⚠️ 腾讯云短信配置不完整，缺少以下环境变量:', missingFields.map(f => `TENCENT_${f.toUpperCase().replace(/([A-Z])/g, '_$1')}`))
    return null
  }

  try {
    return new TencentSMSService(config as TencentSMSConfig)
  } catch (error) {
    console.error('❌ 创建腾讯云短信服务失败:', error)
    return null
  }
}