/**
 * Cloudflare Turnstile 验证工具类
 * 用于后端验证Turnstile token的有效性
 */

export interface TurnstileVerifyRequest {
  secret: string;
  response: string;
  remoteip?: string;
  idempotency_key?: string;
}

export interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
  challengeTimestamp?: string;
  hostname?: string;
}

/**
 * Turnstile错误码对应的中文说明
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  'missing-input-secret': '缺少密钥参数',
  'invalid-input-secret': '密钥参数无效或不正确',
  'missing-input-response': '缺少响应token参数',
  'invalid-input-response': '响应token参数无效或已过期',
  'bad-request': '请求格式错误',
  'timeout-or-duplicate': 'token已超时或已被使用过',
  'internal-error': 'Turnstile内部错误，请重试',
};

/**
 * 验证Turnstile token
 * @param token 前端传来的Turnstile响应token
 * @param remoteIp 可选：用户IP地址，用于额外验证
 * @returns 验证结果
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  try {
    // 检查必需的环境变量
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.error('TURNSTILE_SECRET_KEY 环境变量未设置');
      return {
        success: false,
        error: '服务器配置错误，请联系管理员'
      };
    }

    // 检查token参数
    if (!token || token.trim() === '') {
      return {
        success: false,
        error: '人机验证token不能为空'
      };
    }

    // 构建验证请求
    const requestBody: TurnstileVerifyRequest = {
      secret,
      response: token
    };

    // 如果提供了IP地址，添加到请求中
    if (remoteIp) {
      requestBody.remoteip = remoteIp;
    }

    // 调用Cloudflare Siteverify API
    console.log('正在验证Turnstile token...');
    
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      // 设置超时时间
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    if (!response.ok) {
      console.error(`Turnstile API响应错误: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: `验证服务响应错误: ${response.status}`
      };
    }

    const result: TurnstileVerifyResponse = await response.json();
    
    console.log('Turnstile验证结果:', {
      success: result.success,
      errorCodes: result['error-codes'],
      hostname: result.hostname
    });

    if (result.success) {
      return {
        success: true,
        challengeTimestamp: result.challenge_ts,
        hostname: result.hostname
      };
    } else {
      // 处理验证失败的情况
      const errorCodes = result['error-codes'] || [];
      const errorMessages = errorCodes.map(code => 
        ERROR_CODE_MESSAGES[code] || `未知错误: ${code}`
      );

      return {
        success: false,
        error: errorMessages.length > 0 ? errorMessages.join(', ') : '人机验证失败',
        errorCodes
      };
    }

  } catch (error) {
    console.error('Turnstile验证异常:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: '验证服务请求超时，请重试'
        };
      } else {
        return {
          success: false,
          error: `验证过程出错: ${error.message}`
        };
      }
    }
    
    return {
      success: false,
      error: '人机验证服务暂时不可用，请稍后重试'
    };
  }
}

/**
 * 从请求中提取IP地址
 * 支持代理和负载均衡器的情况
 */
export function extractIpAddress(request: Request): string | undefined {
  // 尝试从各种headers中获取真实IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for 可能包含多个IP，取第一个
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // 如果没有找到，返回undefined
  return undefined;
}

/**
 * 中间件：验证请求中的Turnstile token
 * 用于API路由中快速验证token
 */
export async function validateTurnstileMiddleware(
  request: Request,
  tokenFieldName: string = 'turnstileToken'
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = await request.json();
    const token = body[tokenFieldName];
    
    if (!token) {
      return {
        success: false,
        error: '缺少人机验证token'
      };
    }

    const remoteIp = extractIpAddress(request);
    const result = await verifyTurnstileToken(token, remoteIp);
    
    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || '人机验证失败'
      };
    }
    
  } catch (error) {
    console.error('Turnstile中间件验证错误:', error);
    return {
      success: false,
      error: '验证请求格式错误'
    };
  }
}

export default {
  verifyTurnstileToken,
  extractIpAddress,
  validateTurnstileMiddleware
};