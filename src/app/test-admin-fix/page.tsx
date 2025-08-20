'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function TestAdminFixPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAdminAPI = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 开始测试管理员API修复');
      
      // 导入修复后的函数
      const { getAllContactMessages, createContactMessage } = await import('@/lib/supabase/contact-messages');
      
      // 测试获取消息
      console.log('🧪 测试获取联系消息');
      const messages = await getAllContactMessages(1, 5);
      
      console.log('🧪 获取结果:', messages);
      
      setResult({
        success: true,
        data: messages,
        message: `成功获取 ${messages.count} 条消息`
      });
      
      toast({
        title: "测试成功",
        description: `成功获取 ${messages.count} 条消息`,
      });
      
    } catch (error) {
      console.error('🧪 测试失败:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult({
        success: false,
        error: errorMessage,
        message: `测试失败: ${errorMessage}`
      });
      
      toast({
        title: "测试失败",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          管理员API修复测试页面
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">修复内容：</h2>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• 移除严格的 Supabase 认证检查</li>
              <li>• 使用管理员客户端 (supabaseAdmin) 绕过 RLS 限制</li>
              <li>• 改进错误处理和调试日志</li>
              <li>• 支持无认证模式的管理员操作</li>
            </ul>
          </div>

          <Button 
            onClick={testAdminAPI}
            disabled={loading}
            size="lg"
          >
            {loading ? '测试中...' : '🧪 测试管理员API'}
          </Button>

          {result && (
            <div className={`rounded-lg p-4 border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? '✅ 测试成功' : '❌ 测试失败'}
              </h3>
              
              <p className={`mb-3 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
              
              {result.success && result.data && (
                <div className="bg-white rounded p-3 border">
                  <h4 className="font-medium text-gray-900 mb-2">获取的数据：</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">总数量:</span>
                      <span className="font-medium ml-2">{result.data.count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">当前页数据:</span>
                      <span className="font-medium ml-2">{result.data.data.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">总页数:</span>
                      <span className="font-medium ml-2">{Math.ceil((result.data.count || 0) / 10)}</span>
                    </div>
                  </div>
                  
                  {result.data.data.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="font-medium text-gray-900 mb-2">最新消息预览：</h5>
                      <div className="bg-gray-50 rounded p-2 text-xs">
                        <div><strong>联系人:</strong> {result.data.data[0].contact_name}</div>
                        <div><strong>技术:</strong> {result.data.data[0].technology_name}</div>
                        <div><strong>状态:</strong> {result.data.data[0].status}</div>
                        <div><strong>时间:</strong> {new Date(result.data.data[0].created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {result.error && (
                <div className="bg-white rounded p-3 border border-red-300">
                  <h4 className="font-medium text-red-900 mb-2">错误详情：</h4>
                  <code className="text-xs text-red-800 bg-red-100 p-2 rounded block">
                    {result.error}
                  </code>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
            <strong>使用说明：</strong>
            <ol className="mt-2 space-y-1 ml-4">
              <li>1. 点击测试按钮验证修复是否成功</li>
              <li>2. 查看浏览器控制台了解详细执行过程</li>
              <li>3. 如果测试成功，返回正常的管理员页面应该也能正常工作</li>
              <li>4. 测试页面地址: <code>/test-admin-fix</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}