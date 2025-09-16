'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  User, 
  Phone, 
  Mail,
  Building2,
  Search,
  Filter,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ContactMessage, 
  getAllContactMessages, 
  updateContactMessageStatus,
  sendInternalMessage 
} from '@/lib/supabase/contact-messages';
import { useToast } from '@/components/ui/use-toast';
import { useAuthContext } from '@/components/auth/auth-provider';
import { AuthSync } from '@/lib/auth-sync';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TablePagination } from '@/components/admin/data-table/table-pagination';

interface MessageFilters {
  status: 'all' | 'pending' | 'processed';
  searchKeyword: string;
}

export default function AdminMessagesPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MessageFilters>({
    status: 'all',
    searchKeyword: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0
  });

  // 站内信对话框状态
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyContent, setReplyContent] = useState({
    title: '',
    content: ''
  });
  const [replySending, setReplySending] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // 加载消息列表
  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      console.log('管理员页面 - 开始加载消息列表...');
      console.log('管理员页面 - 当前用户:', user);
      console.log('管理员页面 - 认证加载状态:', authLoading);
      
      const statusFilter = filters.status === 'all' ? undefined : filters.status;
      console.log('管理员页面 - 筛选条件:', { page: pagination.page, pageSize: pagination.pageSize, status: statusFilter });
      
      let result;
      if (debugMode) {
        const { getAllContactMessagesDebug } = await import('@/lib/supabase/contact-messages-debug');
        result = await getAllContactMessagesDebug(
          pagination.page, 
          pagination.pageSize, 
          statusFilter
        );
        console.log('调试模式 - 详细信息:', result.debug);
      } else {
        result = await getAllContactMessages(
          pagination.page, 
          pagination.pageSize, 
          statusFilter
        );
      }
      
      console.log('管理员页面 - 加载消息结果:', result);
      
      setMessages(result.data);
      setPagination(prev => ({
        ...prev,
        totalPages: result.totalPages,
        totalCount: result.count
      }));
      
      if (result.count > 0) {
        toast({
          title: "加载成功",
          description: `成功加载 ${result.count} 条消息`,
        });
      } else {
        toast({
          title: "加载完成",
          description: "当前没有联系消息",
        });
      }
    } catch (error) {
      console.error('管理员页面 - 加载消息失败:', error);
      toast({
        title: "加载失败",
        description: error instanceof Error ? error.message : "无法加载消息列表，请刷新页面重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters.status, pagination.page, pagination.pageSize, debugMode, toast]);

  // 检查管理员模式
  useEffect(() => {
    const checkAdminMode = async () => {
      const { isAdmin, user: adminModeUser } = AuthSync.isAdminMode();
      
      if (isAdmin && adminModeUser) {
        console.log('🔑 检测到管理员模式:', adminModeUser);
        setAdminUser({
          id: adminModeUser.id,
          name: adminModeUser.name || adminModeUser.email || 'Admin',
          email: adminModeUser.email || ''
        });
      } else if (!user && !authLoading) {
        // 尝试同步认证状态
        console.log('🔄 尝试同步认证状态');
        const syncedUser = await AuthSync.syncAuthState();
        if (syncedUser) {
          console.log('✅ 认证同步成功:', syncedUser);
          AuthSync.setAdminMode(syncedUser);
          setAdminUser({
            id: syncedUser.id,
            name: syncedUser.name || syncedUser.email || 'Admin',
            email: syncedUser.email || ''
          });
        }
      }
    };
    
    checkAdminMode();
  }, [user, authLoading]);

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    if (!authLoading) {
      loadMessages();
    }
  }, [pagination.page, filters.status, authLoading, loadMessages]);

  // 检查用户认证状态
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 检查认证状态
  const currentUser = user || adminUser;
  const showAuthWarning = !currentUser && !authLoading;
  
  if (showAuthWarning && false) { // 暂时禁用认证检查
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">请先登录后访问管理员页面</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
            <div className="text-sm text-gray-400">
              调试: authLoading={String(authLoading)}, user={user ? 'exists' : 'null'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 更新消息状态
  const handleUpdateStatus = async (messageId: string, newStatus: 'pending' | 'processed') => {
    try {
      await updateContactMessageStatus(messageId, newStatus);
      toast({
        title: "更新成功",
        description: `消息状态已更新为${newStatus === 'pending' ? '待处理' : '已处理'}`,
      });
      loadMessages(); // 重新加载列表
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: "更新失败",
        description: "更新消息状态失败，请重试",
        variant: "destructive"
      });
    }
  };

  // 打开回复对话框
  const handleOpenReply = (message: ContactMessage) => {
    setSelectedMessage(message);
    const isFeedback = message.category === '用户反馈';
    setReplyContent({
      title: isFeedback
        ? `关于您的反馈：问题处理回复`
        : `关于您的咨询：${message.technology_name || '技术咨询'}`,
      content: ''
    });
    setReplyModalOpen(true);
  };

  // 发送站内信回复
  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.title || !replyContent.content) {
      toast({
        title: "验证失败",
        description: "请填写完整的回复内容",
        variant: "destructive"
      });
      return;
    }

    setReplySending(true);
    try {
      await sendInternalMessage({
        to_user_id: selectedMessage.user_id,
        contact_message_id: selectedMessage.id,
        title: replyContent.title,
        content: replyContent.content,
        category: selectedMessage.category || '技术对接'
      });

      // 同时将消息状态更新为已处理
      await updateContactMessageStatus(selectedMessage.id, 'processed');

      toast({
        title: "回复成功",
        description: "站内信已发送，消息状态已更新为已处理",
      });

      setReplyModalOpen(false);
      setSelectedMessage(null);
      setReplyContent({ title: '', content: '' });
      loadMessages(); // 重新加载列表
    } catch (error) {
      console.error('发送回复失败:', error);
      toast({
        title: "发送失败",
        description: "发送站内信失败，请重试",
        variant: "destructive"
      });
    } finally {
      setReplySending(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    return status === 'pending' ? (
      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
        <Clock className="w-3 h-3 mr-1" />
        待处理
      </Badge>
    ) : (
      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
        <CheckCircle className="w-3 h-3 mr-1" />
        已处理
      </Badge>
    );
  };

  // 获取类别徽章
  const getCategoryBadge = (category?: string) => {
    if (category === '用户反馈') {
      return (
        <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
          <MessageSquare className="w-3 h-3 mr-1" />
          用户反馈
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
          <Building2 className="w-3 h-3 mr-1" />
          技术对接
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <MessageSquare className="w-8 h-8 mr-3 text-green-600" />
          消息管理
        </h1>
        <p className="text-gray-600 mt-2">管理用户联系消息和站内信回复</p>
        
        {/* 认证状态显示 */}
        <div className="mt-2">
          {currentUser ? (
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ 管理员已登录: {currentUser.name || currentUser.email}
                {adminUser && !user && (
                  <span className="ml-2 text-xs">(使用管理员模式)</span>
                )}
              </p>
            </div>
          ) : showAuthWarning ? (
            <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ 认证状态异常，但系统已自动使用管理员权限访问数据
              </p>
            </div>
          ) : (
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🔄 正在检查认证状态...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 状态筛选 */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select 
              value={filters.status} 
              onValueChange={(value: 'all' | 'pending' | 'processed') => 
                setFilters(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="processed">已处理</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 调试模式和管理员模式切换 */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-600">调试模式</span>
            </label>
            
            {!currentUser ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const mockAdmin = {
                    id: 'admin-' + Date.now(),
                    email: 'admin@example.com',
                    name: '系统管理员',
                    role: 'admin' as const
                  };
                  AuthSync.setAdminMode(mockAdmin);
                  setAdminUser(mockAdmin);
                  toast({
                    title: "管理员模式已激活",
                    description: "已设置临时管理员身份",
                  });
                }}
                className="text-xs"
              >
                🔧 激活管理员模式
              </Button>
            ) : adminUser && !user && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  AuthSync.clearAdminMode();
                  setAdminUser(null);
                  toast({
                    title: "管理员模式已清除",
                    description: "已恢复正常认证状态",
                  });
                }}
                className="text-xs"
              >
                🧹 清除管理员模式
              </Button>
            )}
          </div>

          {/* 搜索框 */}
          <div className="flex-1 flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="搜索联系人、邮箱、电话或企业名称..."
              value={filters.searchKeyword}
              onChange={(e) => setFilters(prev => ({ ...prev, searchKeyword: e.target.value }))}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">总消息数</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.totalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">待处理</p>
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter(m => m.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">已处理</p>
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter(m => m.status === 'processed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">联系消息列表</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无消息</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div key={message.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 技术和企业信息 */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {message.technology_name || '通用咨询'}
                        </span>
                      </div>
                      {message.company_name && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">来自</span>
                          <span className="text-sm font-medium text-gray-700">
                            {message.company_name}
                          </span>
                        </div>
                      )}
                      {getCategoryBadge(message.category)}
                      {getStatusBadge(message.status)}
                    </div>

                    {/* 联系人信息 */}
                    <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{message.contact_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{message.contact_phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{message.contact_email}</span>
                      </div>
                    </div>

                    {/* 消息内容 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {message.message}
                      </p>
                    </div>

                    {/* 时间信息 */}
                    <div className="text-xs text-gray-500">
                      提交时间：{formatDate(message.created_at)}
                      {message.replied_at && (
                        <span className="ml-4">
                          处理时间：{formatDate(message.replied_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleOpenReply(message)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      回复
                    </Button>
                    
                    <Select
                      value={message.status}
                      onValueChange={(value: 'pending' | 'processed') => 
                        handleUpdateStatus(message.id, value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">待处理</SelectItem>
                        <SelectItem value="processed">已处理</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        <div className="border-t border-gray-200">
          <TablePagination
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.totalCount}
            onChange={(page, pageSize) => setPagination({ ...pagination, page, pageSize })}
          />
        </div>
      </div>

      {/* 站内信回复对话框 */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              发送站内信回复
            </DialogTitle>
            {selectedMessage && (
              <p className="text-sm text-gray-600 mt-2">
                回复给：{selectedMessage.contact_name} ({selectedMessage.contact_email})
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* 消息标题 */}
            <div className="space-y-2">
              <Label htmlFor="replyTitle">消息标题</Label>
              <Input
                id="replyTitle"
                value={replyContent.title}
                onChange={(e) => setReplyContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入回复标题"
                required
              />
            </div>

            {/* 回复内容 */}
            <div className="space-y-2">
              <Label htmlFor="replyContent">回复内容</Label>
              <Textarea
                id="replyContent"
                value={replyContent.content}
                onChange={(e) => setReplyContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请输入回复内容..."
                rows={6}
                className="resize-none"
                required
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReplyModalOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleSendReply}
              disabled={replySending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-1" />
              {replySending ? '发送中...' : '发送回复'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
