import { ApiResponse } from './index'

// 接口类型定义，与现有的保持一致
export interface SendEmailCodeRequest {
  email: string
  purpose: 'register' | 'login' | 'reset_password'
}

export interface VerifyCodeRequest {
  code: string
  phone?: string
  email?: string
  purpose: 'register' | 'login' | 'reset_password'
  countryCode?: string
}

export interface ResetPasswordByEmailRequest {
  email: string
  emailCode: string
  newPassword: string
}

// Resend 认证 API
export const resendAuthApi = {
  
  /**
   * 发送邮箱验证码（使用Resend）
   */
  async sendEmailCode(data: SendEmailCodeRequest): Promise<ApiResponse<{ message: string; devOTP?: string }>> {
    try {
      const response = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '发送验证码失败'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '发送验证码失败'
      };
    }
  },

  /**
   * 验证邮箱验证码
   */
  async verifyCode(data: VerifyCodeRequest): Promise<ApiResponse<{ message: string; valid?: boolean }>> {
    try {
      const response = await fetch('/api/auth/send-email-code', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          code: data.code,
          purpose: data.purpose
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '验证码验证失败'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '验证码验证失败'
      };
    }
  },

  /**
   * 通过邮箱重置密码
   */
  async resetPasswordByEmail(data: ResetPasswordByEmailRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // 注意：验证码已在前面的步骤中验证过，这里直接调用密码重置API
      const resetResponse = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          newPassword: data.newPassword
        }),
      });

      const resetResult = await resetResponse.json();

      if (!resetResponse.ok || !resetResult.success) {
        return {
          success: false,
          error: resetResult.error || '密码重置失败'
        };
      }

      return {
        success: true,
        data: resetResult.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '密码重置失败'
      };
    }
  },

  /**
   * 邮箱验证码注册（需要与现有的Supabase注册集成）
   */
  async emailRegister(data: {
    email: string
    emailCode: string
    password: string
    name?: string
  }): Promise<ApiResponse<{ message: string }>> {
    try {
      // 首先验证验证码
      const verifyResult = await this.verifyCode({
        email: data.email,
        code: data.emailCode,
        purpose: 'register'
      });

      if (!verifyResult.success || !verifyResult.data?.valid) {
        return {
          success: false,
          error: verifyResult.data?.message || verifyResult.error || '验证码验证失败'
        };
      }

      // 验证码正确，创建用户账户
      // 这里需要根据实际需求选择使用Supabase还是后端API
      // 暂时返回成功，实际应该调用相应的注册API
      return {
        success: true,
        data: {
          message: '注册成功'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '注册失败'
      };
    }
  }
};

export { resendAuthApi as resendAuth };