'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthContext } from '@/components/auth/auth-provider';
import { Mail, Phone, User, MessageSquare, Send, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createContactMessage } from '@/lib/supabase/contact-messages';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  technologyId?: string;
  technologyName?: string;
  companyName?: string;
}

interface ContactFormData {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  message: string;
}

export function ContactUsModal({ 
  isOpen, 
  onClose, 
  technologyId, 
  technologyName, 
  companyName 
}: ContactUsModalProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    message: ''
  });

  // 当用户信息可用时，自动填充表单
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.name || '',
        contactPhone: user.phone || '',
        contactEmail: user.email || ''
      }));
    }
  }, [user]);

  // 处理表单输入变化
  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.contactName.trim()) {
      toast({
        title: "验证失败",
        description: "请填写联系人姓名",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.contactPhone.trim()) {
      toast({
        title: "验证失败", 
        description: "请填写联系电话",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.contactEmail.trim()) {
      toast({
        title: "验证失败",
        description: "请填写联系邮箱", 
        variant: "destructive"
      });
      return false;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      toast({
        title: "验证失败",
        description: "请填写正确的邮箱格式",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.message.trim()) {
      toast({
        title: "验证失败",
        description: "请填写留言内容",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "提交失败",
        description: "请先登录后再联系我们",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 调用Supabase API创建联系消息
      await createContactMessage({
        technology_id: technologyId,
        technology_name: technologyName,
        company_name: companyName,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        message: formData.message
      });

      toast({
        title: "提交成功",
        description: "您的留言已成功提交，我们会尽快与您联系！",
        variant: "default"
      });

      // 重置表单
      setFormData({
        contactName: user.name || '',
        contactPhone: user.phone || '',
        contactEmail: user.email || '',
        message: ''
      });

      onClose();
    } catch (error) {
      console.error('提交联系消息失败:', error);
      const errorMessage = error instanceof Error ? error.message : '提交失败，请稍后重试';
      toast({
        title: "提交失败",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 取消操作
  const handleCancel = () => {
    // 重置表单
    setFormData({
      contactName: user?.name || '',
      contactPhone: user?.phone || '',
      contactEmail: user?.email || '',
      message: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquare className="w-5 h-5 text-green-600" />
            联系我们
          </DialogTitle>
          {technologyName && (
            <p className="text-sm text-gray-600 mt-2">
              关于技术：<span className="font-medium">{technologyName}</span>
              {companyName && (
                <span className="text-gray-500"> - {companyName}</span>
              )}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 联系人姓名 */}
          <div className="space-y-2">
            <Label htmlFor="contactName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              联系人姓名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactName"
              type="text"
              placeholder="请输入您的姓名"
              value={formData.contactName}
              onChange={(e) => handleInputChange('contactName', e.target.value)}
              required
            />
          </div>

          {/* 联系电话 */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              联系电话 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="请输入您的联系电话"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              required
            />
          </div>

          {/* 联系邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              联系邮箱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="请输入您的邮箱地址"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              required
            />
          </div>

          {/* 留言内容 */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              留言内容 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="请详细描述您的需求或问题..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className="resize-none"
              required
            />
          </div>

          {/* 按钮区域 */}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
              {loading ? '提交中...' : '提交留言'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}