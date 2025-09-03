export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
  company_name?: string;
  role?: 'admin' | 'user';
  // 可选：登录来源/认证方式（用于调试或状态判断）
  authType?: string;
}
