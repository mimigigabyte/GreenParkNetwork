'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getAllContactMessagesDebug } from '@/lib/supabase/contact-messages-debug';

export default function AdminMessagesSimplePage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      console.log('🚀 简化管理员页面 - 开始加载消息');
      
      const result = await getAllContactMessagesDebug(1, 10);
      
      console.log('📊 加载结果:', result);
      
      setMessages(result.data);
      setDebugInfo(result.debug);
      
      toast({
        title: "加载成功",
        description: `成功加载 ${result.count} 条消息`,
      });
    } catch (error) {
      console.error('❌ 加载失败:', error);
      toast({
        title: "加载失败", 
        description: error instanceof Error ? error.message : "加载消息失败",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          简化管理员消息页面（调试版）
        </h1>
        
        <div className="space-y-4">
          <Button 
            onClick={loadMessages}
            disabled={loading}
          >
            {loading ? '加载中...' : '重新加载消息'}
          </Button>

          {/* 调试信息 */}
          {debugInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">调试信息:</h3>
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* 消息列表 */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                联系消息列表 (共 {messages.length} 条)
              </h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>暂无消息</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <div key={message.id} className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {message.technology_name || '通用咨询'}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          message.status === 'pending' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {message.status === 'pending' ? '待处理' : '已处理'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>联系人: {message.contact_name}</div>
                        <div>电话: {message.contact_phone}</div>
                        <div>邮箱: {message.contact_email}</div>
                        <div>公司: {message.company_name || '无'}</div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-700">{message.message}</p>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        提交时间: {new Date(message.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}