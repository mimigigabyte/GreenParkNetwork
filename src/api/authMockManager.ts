/**
 * 认证API Mock数据管理器
 * 功能描述：提供认证相关接口的模拟数据和响应
 * 用于开发和测试阶段的接口调试
 */

import { 
  User, 
  AuthResponse, 
  CodeResponse,
  PasswordLoginRequest,
  PhoneCodeLoginRequest,
  EmailRegisterRequest,
  PhoneRegisterRequest,
  SendEmailCodeRequest,
  SendPhoneCodeRequest,
  VerifyCodeRequest,
  ResetPasswordByEmailRequest,
  ResetPasswordByPhoneRequest
} from './auth';

// Mock用户数据
const mockUsers: User[] = [
  {
    id: 'user_001',
    email: 'admin@greentech.com',
    phone: '13800138000',
    name: '系统管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    emailVerified: true,
    phoneVerified: true
  },
  {
    id: 'user_002',
    email: 'user@greentech.com',
    phone: '13900139000',
    name: '测试用户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    role: 'user',
    createdAt: '2024-01-15T10:30:00Z',
    emailVerified: true,
    phoneVerified: false
  },
  {
    id: 'user_003',
    email: 'demo@example.com',
    phone: '18800188000',
    name: '演示账户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    role: 'user',
    createdAt: '2024-01-20T15:45:00Z',
    emailVerified: false,
    phoneVerified: true
  }
];

// Mock验证码存储
const mockVerificationCodes = new Map<string, {
  code: string;
  purpose: string;
  expiresAt: number;
  verified: boolean;
}>();

// 模拟延迟
const mockDelay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// 生成随机验证码
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 生成Mock Token
const generateMockToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    userId, 
    exp: Math.floor(Date.now() / 1000) + 86400, // 24小时后过期
    iat: Math.floor(Date.now() / 1000)
  }));
  const signature = 'mock_signature_' + Math.random().toString(36).substr(2, 9);
  return `${header}.${payload}.${signature}`;
};

// 创建成功响应
const createSuccessResponse = <T>(data: T, message: string = '操作成功') => ({
  success: true,
  data,
  message
});

// 创建错误响应
const createErrorResponse = (error: string) => ({
  success: false,
  error
});

// 查找用户
const findUser = (account: string, type?: 'email' | 'phone'): User | undefined => {
  return mockUsers.find(user => {
    if (type === 'email') return user.email === account;
    if (type === 'phone') return user.phone === account;
    return user.email === account || user.phone === account;
  });
};

// 验证码相关工具函数
const getCodeKey = (phone?: string, email?: string, purpose?: string) => {
  const target = phone || email || '';
  return `${target}_${purpose}`;
};

export class AuthMockManager {
  /**
   * 密码登录Mock
   * 功能描述：模拟用户密码登录
   * 入参：PasswordLoginRequest
   * 返回参数：AuthResponse
   * url地址：/auth/login/password
   * 请求方式：POST
   */
  static async passwordLogin(data: PasswordLoginRequest) {
    await mockDelay();

    const { account, password, type } = data;

    // 检查输入参数
    if (!account || !password) {
      return createErrorResponse('请填写完整的登录信息');
    }

    // 查找用户
    const user = findUser(account, type);
    if (!user) {
      return createErrorResponse('用户不存在');
    }

    // Mock密码验证 (测试密码: 123456)
    if (password !== '123456') {
      return createErrorResponse('密码错误');
    }

    // 生成token
    const token = generateMockToken(user.id);
    const refreshToken = generateMockToken(user.id + '_refresh');

    const authResponse: AuthResponse = {
      user,
      token,
      refreshToken
    };

    return createSuccessResponse(authResponse, '登录成功');
  }

  /**
   * 手机验证码登录Mock
   * 功能描述：模拟手机验证码登录
   * 入参：PhoneCodeLoginRequest
   * 返回参数：AuthResponse
   * url地址：/auth/login/phone-code
   * 请求方式：POST
   */
  static async phoneCodeLogin(data: PhoneCodeLoginRequest) {
    await mockDelay();

    const { phone, code } = data;

    if (!phone || !code) {
      return createErrorResponse('请填写完整的登录信息');
    }

    // 验证验证码
    const codeKey = getCodeKey(phone, undefined, 'login');
    const storedCode = mockVerificationCodes.get(codeKey);

    if (!storedCode) {
      return createErrorResponse('请先获取验证码');
    }

    if (storedCode.code !== code) {
      return createErrorResponse('验证码错误');
    }

    if (Date.now() > storedCode.expiresAt) {
      return createErrorResponse('验证码已过期');
    }

    // 查找或创建用户
    let user = findUser(phone, 'phone');
    if (!user) {
      // 创建新用户
      user = {
        id: 'user_' + Date.now(),
        phone,
        name: `用户${phone.slice(-4)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
        role: 'user',
        createdAt: new Date().toISOString(),
        emailVerified: false,
        phoneVerified: true
      };
      mockUsers.push(user);
    }

    // 标记验证码为已使用
    storedCode.verified = true;

    const token = generateMockToken(user.id);
    const refreshToken = generateMockToken(user.id + '_refresh');

    const authResponse: AuthResponse = {
      user,
      token,
      refreshToken
    };

    return createSuccessResponse(authResponse, '登录成功');
  }

  /**
   * 邮箱注册Mock
   * 功能描述：模拟邮箱验证码注册
   * 入参：EmailRegisterRequest
   * 返回参数：AuthResponse
   * url地址：/auth/register/email
   * 请求方式：POST
   */
  static async emailRegister(data: EmailRegisterRequest) {
    await mockDelay();

    const { email, emailCode, password, name } = data;

    if (!email || !emailCode || !password) {
      return createErrorResponse('请填写完整的注册信息');
    }

    // 检查用户是否已存在
    if (findUser(email, 'email')) {
      return createErrorResponse('该邮箱已被注册');
    }

    // 验证验证码
    const codeKey = getCodeKey(undefined, email, 'register');
    const storedCode = mockVerificationCodes.get(codeKey);

    if (!storedCode || storedCode.code !== emailCode) {
      return createErrorResponse('验证码错误');
    }

    if (Date.now() > storedCode.expiresAt) {
      return createErrorResponse('验证码已过期');
    }

    // 创建新用户
    const user: User = {
      id: 'user_' + Date.now(),
      email,
      name: name || `用户${email.split('@')[0]}`, // 如果没有提供用户名，使用邮箱前缀
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      emailVerified: true,
      phoneVerified: false
    };

    mockUsers.push(user);
    storedCode.verified = true;

    const token = generateMockToken(user.id);
    const refreshToken = generateMockToken(user.id + '_refresh');

    const authResponse: AuthResponse = {
      user,
      token,
      refreshToken
    };

    return createSuccessResponse(authResponse, '注册成功');
  }

  /**
   * 手机注册Mock
   * 功能描述：模拟手机验证码注册
   * 入参：PhoneRegisterRequest
   * 返回参数：AuthResponse
   * url地址：/auth/register/phone
   * 请求方式：POST
   */
  static async phoneRegister(data: PhoneRegisterRequest) {
    await mockDelay();

    const { phone, phoneCode, password, name } = data;

    if (!phone || !phoneCode || !password) {
      return createErrorResponse('请填写完整的注册信息');
    }

    // 检查用户是否已存在
    if (findUser(phone, 'phone')) {
      return createErrorResponse('该手机号已被注册');
    }

    // 验证验证码
    const codeKey = getCodeKey(phone, undefined, 'register');
    const storedCode = mockVerificationCodes.get(codeKey);

    if (!storedCode || storedCode.code !== phoneCode) {
      return createErrorResponse('验证码错误');
    }

    if (Date.now() > storedCode.expiresAt) {
      return createErrorResponse('验证码已过期');
    }

    // 创建新用户
    const user: User = {
      id: 'user_' + Date.now(),
      phone,
      name: name || `用户${phone.slice(-4)}`, // 如果没有提供用户名，使用手机号后4位
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      emailVerified: false,
      phoneVerified: true
    };

    mockUsers.push(user);
    storedCode.verified = true;

    const token = generateMockToken(user.id);
    const refreshToken = generateMockToken(user.id + '_refresh');

    const authResponse: AuthResponse = {
      user,
      token,
      refreshToken
    };

    return createSuccessResponse(authResponse, '注册成功');
  }

  /**
   * 发送邮箱验证码Mock
   * 功能描述：模拟发送邮箱验证码
   * 入参：SendEmailCodeRequest
   * 返回参数：CodeResponse
   * url地址：/auth/code/email
   * 请求方式：POST
   */
  static async sendEmailCode(data: SendEmailCodeRequest) {
    await mockDelay(500);

    const { email, purpose } = data;

    if (!email) {
      return createErrorResponse('请输入邮箱地址');
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('邮箱格式不正确');
    }

    // 检查注册场景下邮箱是否已存在
    if (purpose === 'register' && findUser(email, 'email')) {
      return createErrorResponse('该邮箱已被注册');
    }

    // 检查密码重置场景下邮箱是否存在
    if (purpose === 'reset_password' && !findUser(email, 'email')) {
      return createErrorResponse('该邮箱尚未注册');
    }

    // 生成并存储验证码
    const code = generateVerificationCode();
    const codeKey = getCodeKey(undefined, email, purpose);
    
    mockVerificationCodes.set(codeKey, {
      code,
      purpose,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟后过期
      verified: false
    });

    console.log(`📧 邮箱验证码已发送到 ${email}，验证码：${code} (测试模式)`);

    const codeResponse: CodeResponse = {
      success: true,
      message: `验证码已发送至邮箱 ${email}`,
      expiresIn: 300
    };

    return createSuccessResponse(codeResponse);
  }

  /**
   * 发送手机验证码Mock
   * 功能描述：模拟发送手机验证码
   * 入参：SendPhoneCodeRequest
   * 返回参数：CodeResponse
   * url地址：/auth/code/phone
   * 请求方式：POST
   */
  static async sendPhoneCode(data: SendPhoneCodeRequest) {
    await mockDelay(500);

    const { phone, purpose, countryCode = '+86' } = data;

    if (!phone) {
      return createErrorResponse('请输入手机号');
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return createErrorResponse('手机号格式不正确');
    }

    // 检查注册场景下手机号是否已存在
    if (purpose === 'register' && findUser(phone, 'phone')) {
      return createErrorResponse('该手机号已被注册');
    }

    // 检查密码重置场景下手机号是否存在
    if (purpose === 'reset_password' && !findUser(phone, 'phone')) {
      return createErrorResponse('该手机号尚未注册');
    }

    // 生成并存储验证码
    const code = generateVerificationCode();
    const codeKey = getCodeKey(phone, undefined, purpose);
    
    mockVerificationCodes.set(codeKey, {
      code,
      purpose,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟后过期
      verified: false
    });

    console.log(`📱 手机验证码已发送到 ${countryCode} ${phone}，验证码：${code} (测试模式)`);

    const codeResponse: CodeResponse = {
      success: true,
      message: `验证码已发送至手机 ${countryCode} ${phone}`,
      expiresIn: 300
    };

    return createSuccessResponse(codeResponse);
  }

  /**
   * 验证验证码Mock
   * 功能描述：模拟验证验证码
   * 入参：VerifyCodeRequest
   * 返回参数：验证结果
   * url地址：/auth/code/verify
   * 请求方式：POST
   */
  static async verifyCode(data: VerifyCodeRequest) {
    await mockDelay(300);

    const { code, phone, email, purpose } = data;

    if (!code) {
      return createErrorResponse('请输入验证码');
    }

    const codeKey = getCodeKey(phone, email, purpose);
    const storedCode = mockVerificationCodes.get(codeKey);

    if (!storedCode) {
      return createSuccessResponse({ 
        valid: false, 
        message: '请先获取验证码' 
      });
    }

    if (storedCode.code !== code) {
      return createSuccessResponse({ 
        valid: false, 
        message: '验证码错误' 
      });
    }

    if (Date.now() > storedCode.expiresAt) {
      return createSuccessResponse({ 
        valid: false, 
        message: '验证码已过期' 
      });
    }

    return createSuccessResponse({ 
      valid: true, 
      message: '验证码验证成功' 
    });
  }

  /**
   * 通过邮箱重置密码Mock
   * 功能描述：模拟通过邮箱重置密码
   * 入参：ResetPasswordByEmailRequest
   * 返回参数：重置结果
   * url地址：/auth/password/reset/email
   * 请求方式：POST
   */
  static async resetPasswordByEmail(data: ResetPasswordByEmailRequest) {
    await mockDelay();

    const { email, emailCode, newPassword } = data;

    if (!email || !emailCode || !newPassword) {
      return createErrorResponse('请填写完整信息');
    }

    const user = findUser(email, 'email');
    if (!user) {
      return createErrorResponse('用户不存在');
    }

    // 验证验证码
    const codeKey = getCodeKey(undefined, email, 'reset_password');
    const storedCode = mockVerificationCodes.get(codeKey);

    if (!storedCode || storedCode.code !== emailCode) {
      return createErrorResponse('验证码错误');
    }

    if (Date.now() > storedCode.expiresAt) {
      return createErrorResponse('验证码已过期');
    }

    // 标记验证码为已使用
    storedCode.verified = true;

    console.log(`🔐 用户 ${email} 密码重置成功 (测试模式)`);

    return createSuccessResponse({ 
      success: true, 
      message: '密码重置成功' 
    });
  }

  /**
   * 通过手机重置密码Mock
   * 功能描述：模拟通过手机重置密码
   * 入参：ResetPasswordByPhoneRequest
   * 返回参数：重置结果
   * url地址：/auth/password/reset/phone
   * 请求方式：POST
   */
  static async resetPasswordByPhone(data: ResetPasswordByPhoneRequest) {
    await mockDelay();

    const { phone, phoneCode, newPassword } = data;

    if (!phone || !phoneCode || !newPassword) {
      return createErrorResponse('请填写完整信息');
    }

    const user = findUser(phone, 'phone');
    if (!user) {
      return createErrorResponse('用户不存在');
    }

    // 验证验证码
    const codeKey = getCodeKey(phone, undefined, 'reset_password');
    const storedCode = mockVerificationCodes.get(codeKey);

    if (!storedCode || storedCode.code !== phoneCode) {
      return createErrorResponse('验证码错误');
    }

    if (Date.now() > storedCode.expiresAt) {
      return createErrorResponse('验证码已过期');
    }

    // 标记验证码为已使用
    storedCode.verified = true;

    console.log(`🔐 用户 ${phone} 密码重置成功 (测试模式)`);

    return createSuccessResponse({ 
      success: true, 
      message: '密码重置成功' 
    });
  }

  /**
   * 获取当前用户信息Mock
   * 功能描述：模拟获取当前用户信息
   * 入参：无
   * 返回参数：User
   * url地址：/auth/me
   * 请求方式：GET
   */
  static async getCurrentUser() {
    await mockDelay(300);

    // 模拟从token中获取用户信息
    const token = localStorage.getItem('access_token');
    if (!token) {
      return createErrorResponse('未登录');
    }

    // 返回默认用户信息（实际应该从token解析）
    const user = mockUsers[1]; // 返回测试用户
    const companyName = localStorage.getItem('company_name');
    if (companyName) {
      user.name = companyName;
    }
    return createSuccessResponse(user);
  }

  /**
   * 用户登出Mock
   * 功能描述：模拟用户登出
   * 入参：无
   * 返回参数：操作结果
   * url地址：/auth/logout
   * 请求方式：POST
   */
  static async logout() {
    await mockDelay(300);

    // 清除本地存储的token
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    return createSuccessResponse(null, '登出成功');
  }

  /**
   * 刷新Token Mock
   * 功能描述：模拟刷新访问令牌
   * 入参：refresh token
   * 返回参数：新的token
   * url地址：/auth/refresh
   * 请求方式：POST
   */
  static async refreshToken(refreshToken: string) {
    await mockDelay(300);

    if (!refreshToken) {
      return createErrorResponse('Refresh token is required');
    }

    // 生成新的token
    const newToken = generateMockToken('current_user');
    const newRefreshToken = generateMockToken('current_user_refresh');

    return createSuccessResponse({
      token: newToken,
      refreshToken: newRefreshToken
    });
  }

  /**
   * 检查账号是否存在Mock
   * 功能描述：模拟检查账号是否存在
   * 入参：账号和类型
   * 返回参数：存在状态
   * url地址：/auth/check-account
   * 请求方式：POST
   */
  static async checkAccountExists(account: string, type: 'email' | 'phone') {
    await mockDelay(300);

    const user = findUser(account, type);
    
    return createSuccessResponse({
      exists: !!user,
      verified: user ? (type === 'email' ? user.emailVerified : user.phoneVerified) : false
    });
  }

  /**
   * 获取Mock验证码 (仅用于测试)
   * 功能描述：获取已生成的验证码用于测试
   * 入参：手机号或邮箱和用途
   * 返回参数：验证码
   */
  static getMockCode(phone?: string, email?: string, purpose?: string): string | null {
    const codeKey = getCodeKey(phone, email, purpose);
    const storedCode = mockVerificationCodes.get(codeKey);
    return storedCode?.code || null;
  }

  /**
   * 清除所有Mock数据 (仅用于测试)
   * 功能描述：清除所有mock数据，重置状态
   */
  static clearMockData() {
    mockVerificationCodes.clear();
    // 重置用户列表到初始状态
    mockUsers.splice(3); // 保留前3个默认用户
  }
}