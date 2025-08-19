'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { AdminSetup } from '@/lib/admin-setup';
import { Shield, User, Check, AlertCircle } from 'lucide-react';

export default function AdminSetupPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminStatus, setAdminStatus] = useState({ hasAdmin: false, adminCount: 0 });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: 'admin@example.com',
    password: 'admin123456',
    name: '系统管理员'
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // 检查管理员状态
  const checkAdminStatus = async () => {
    setCheckingAdmin(true);
    try {
      const status = await AdminSetup.checkAdminExists();
      setAdminStatus(status);
      
      const user = await AdminSetup.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('检查状态失败:', error);
    } finally {
      setCheckingAdmin(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  // 创建管理员用户
  const handleCreateAdmin = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        title: "验证失败",
        description: "请填写完整的管理员信息",
        variant: "destructive"
      });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "验证失败",
        description: "请输入有效的邮箱地址",
        variant: "destructive"
      });
      return;
    }

    // 验证密码长度
    if (formData.password.length < 6) {
      toast({
        title: "验证失败",
        description: "密码长度至少为6位",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await AdminSetup.createAdminUser(formData);
      
      if (result.success) {
        toast({
          title: "创建成功",
          description: result.message,
        });
        
        await checkAdminStatus(); // 刷新状态
      } else {
        toast({
          title: "创建失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "创建异常",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 管理员登录
  const handleAdminLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast({
        title: "验证失败",
        description: "请填写邮箱和密码",
        variant: "destructive"
      });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      toast({
        title: "验证失败",
        description: "请输入有效的邮箱地址",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await AdminSetup.loginAdmin(loginData.email, loginData.password);
      
      if (result.success) {
        toast({
          title: "登录成功",
          description: "欢迎回来，管理员！",
        });
        
        await checkAdminStatus(); // 刷新状态
        
        // 登录成功后跳转到管理员页面
        setTimeout(() => {
          window.location.href = '/admin/messages';
        }, 1000);
      } else {
        toast({
          title: "登录失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "登录异常",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">检查管理员状态中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* 页面标题 */}
      <div className="text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员设置</h1>
        <p className="text-gray-600">创建和管理系统管理员账户</p>
      </div>

      {/* 当前状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            系统状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{adminStatus.adminCount}</div>
              <div className="text-sm text-blue-800">管理员用户数</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {adminStatus.hasAdmin ? '✅' : '❌'}
              </div>
              <div className="text-sm text-green-800">
                {adminStatus.hasAdmin ? '有管理员' : '无管理员'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {currentUser ? '✅' : '❌'}
              </div>
              <div className="text-sm text-purple-800">
                {currentUser ? '已登录' : '未登录'}
              </div>
            </div>
          </div>

          {currentUser && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">当前登录用户：</h4>
              <div className="text-sm space-y-1">
                <div><strong>姓名:</strong> {currentUser.name}</div>
                <div><strong>邮箱:</strong> {currentUser.email}</div>
                <div><strong>角色:</strong> <span className="font-medium">{currentUser.role}</span></div>
                <div><strong>用户ID:</strong> {currentUser.id}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 创建管理员 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              创建管理员用户
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-email">邮箱地址</Label>
              <Input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value.trim() }))}
                placeholder="admin@example.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="admin-password">密码</Label>
              <Input
                id="admin-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="至少6位字符"
              />
            </div>
            
            <div>
              <Label htmlFor="admin-name">姓名</Label>
              <Input
                id="admin-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="系统管理员"
              />
            </div>
            
            <Button 
              onClick={handleCreateAdmin}
              disabled={loading}
              className="w-full"
            >
              {loading ? '创建中...' : '创建管理员用户'}
            </Button>
          </CardContent>
        </Card>

        {/* 管理员登录 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              管理员登录
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="login-email">邮箱地址</Label>
              <Input
                id="login-email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value.trim() }))}
                placeholder="管理员邮箱"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="login-password">密码</Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="管理员密码"
              />
            </div>
            
            <Button 
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? '登录中...' : '管理员登录'}
            </Button>

            {adminStatus.hasAdmin && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/admin/messages'}
                  className="text-sm"
                >
                  直接前往管理后台 →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>1. 首次使用:</strong> 需要先创建一个管理员用户账户</p>
            <p><strong>2. 创建后:</strong> 使用创建的邮箱和密码进行登录</p>
            <p><strong>3. 登录成功:</strong> 会自动跳转到管理员控制台</p>
            <p><strong>4. 注意事项:</strong> 管理员账户将在 Supabase 中创建对应的认证记录</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}