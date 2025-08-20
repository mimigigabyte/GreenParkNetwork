'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/components/auth/auth-provider';

export default function DebugContactMessagesPage() {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing database connection...');
      
      // 测试联系消息表
      const { data: contactData, error: contactError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (contactError) {
        console.error('Contact messages error:', contactError);
        setError(`Contact messages error: ${contactError.message}`);
        return;
      }
      
      console.log('Contact messages:', contactData);
      setMessages(contactData || []);
      
      // 测试站内信表
      const { data: internalData, error: internalError } = await supabase
        .from('internal_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (internalError) {
        console.error('Internal messages error:', internalError);
        setError(`Internal messages error: ${internalError.message}`);
        return;
      }
      
      console.log('Internal messages:', internalData);
      setInternalMessages(internalData || []);
      
    } catch (err) {
      console.error('Database test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testAdminAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing admin API...');
      
      const { getAllContactMessagesDebug } = await import('@/lib/supabase/contact-messages-debug');
      const result = await getAllContactMessagesDebug(1, 10);
      
      console.log('Admin API result:', result);
      console.log('Debug info:', result.debug);
      setAdminMessages(result.data);
      
    } catch (err) {
      console.error('Admin API test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTestMessage = async () => {
    if (!user) {
      setError('用户未登录');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 使用联系我们API创建消息（这将触发自动通知）
      const { createContactMessage } = await import('@/lib/supabase/contact-messages');
      
      const testData = {
        technology_id: 'test-tech-id',
        technology_name: '测试技术名称',
        company_name: '测试公司',
        contact_name: '测试联系人',
        contact_phone: '13800138000',
        contact_email: 'test@example.com',
        message: '这是一条测试消息，用于调试联系我们功能。'
      };

      console.log('Creating test message with API:', testData);

      const result = await createContactMessage(testData);
      console.log('Test message created via API:', result);
      
      // 重新获取数据
      testDatabaseConnection();
      
    } catch (err) {
      console.error('Create test message error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          联系消息调试页面
        </h1>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={testDatabaseConnection}
              disabled={loading}
            >
              {loading ? '测试中...' : '测试数据库连接'}
            </Button>
            
            <Button 
              onClick={createTestMessage}
              disabled={loading || !user}
              variant="outline"
            >
              创建测试消息
            </Button>
            
            <Button 
              onClick={testAdminAPI}
              disabled={loading}
              variant="secondary"
            >
              测试管理员API
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">错误：{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 联系消息 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                联系消息表 (contact_messages)
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                共 {messages.length} 条记录
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {messages.map((msg, index) => (
                  <div key={msg.id || index} className="bg-gray-50 rounded p-3 text-xs">
                    <div className="font-medium">ID: {msg.id}</div>
                    <div>用户ID: {msg.user_id}</div>
                    <div>技术: {msg.technology_name}</div>
                    <div>联系人: {msg.contact_name}</div>
                    <div>邮箱: {msg.contact_email}</div>
                    <div>状态: {msg.status}</div>
                    <div>创建时间: {new Date(msg.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 站内信 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                站内信表 (internal_messages)
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                共 {internalMessages.length} 条记录
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {internalMessages.map((msg, index) => (
                  <div key={msg.id || index} className="bg-gray-50 rounded p-3 text-xs">
                    <div className="font-medium">ID: {msg.id}</div>
                    <div>发送者: {msg.from_user_id}</div>
                    <div>接收者: {msg.to_user_id}</div>
                    <div>标题: {msg.title}</div>
                    <div>已读: {msg.is_read ? '是' : '否'}</div>
                    <div>创建时间: {new Date(msg.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 管理员API结果 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                管理员API结果
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                共 {adminMessages.length} 条记录
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {adminMessages.map((msg, index) => (
                  <div key={msg.id || index} className="bg-gray-50 rounded p-3 text-xs">
                    <div className="font-medium">ID: {msg.id}</div>
                    <div>用户ID: {msg.user_id}</div>
                    <div>技术: {msg.technology_name}</div>
                    <div>联系人: {msg.contact_name}</div>
                    <div>状态: {msg.status}</div>
                    <div>创建时间: {new Date(msg.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 用户信息 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              当前用户信息
            </h2>
            {user ? (
              <div className="bg-gray-50 rounded p-3 text-sm">
                <div>用户ID: {user.id}</div>
                <div>邮箱: {user.email}</div>
                <div>姓名: {user.name}</div>
                <div>角色: {(user as any).role || '未设置'}</div>
              </div>
            ) : (
              <p className="text-gray-600">用户未登录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}