'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { supabaseAuthApi } from '@/api/supabaseAuth'
import { safeFetch, handleApiResponse } from '@/lib/safe-fetch'

interface AccountSecurityProps {
  locale: string
}

export default function AccountSecurity({ locale }: AccountSecurityProps) {
  const { toast } = useToast()
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // 将后端中文错误提示映射为英文，便于双语展示
  const translateMessage = (msg: string, locale: string) => {
    if (!msg) return locale === 'en' ? 'Operation failed' : '操作失败'
    if (locale !== 'en') return msg
    const map: Record<string, string> = {
      '当前密码不正确': 'Current password is incorrect',
      '当前密码验证失败': 'Current password verification failed, please check your password',
      '请检查密码是否正确': 'Please check if the current password is correct',
      '新密码不能与当前密码相同': 'New password cannot be the same as current password',
      '新密码长度不能少于6位': 'New password must be at least 6 characters',
      '密码长度至少为6位': 'Password must be at least 6 characters long',
      '用户未登录或会话已过期': 'Not logged in or session expired',
      '未授权访问': 'Unauthorized access',
      '用户不存在或已被禁用': 'User does not exist or has been disabled',
      '密码更新失败': 'Failed to update password',
      '密码修改失败': 'Failed to change password',
      '服务器错误': 'Server error'
    }
    // 匹配包含关系，返回首个命中的翻译
    for (const key of Object.keys(map)) {
      if (msg.includes(key)) return map[key]
    }
    return msg
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 基本验证
    if (!password.currentPassword.trim()) {
      toast({
        title: locale === 'en' ? 'Error' : '错误',
        description: locale === 'en' ? 'Please enter current password' : '请输入当前密码',
        variant: 'destructive'
      })
      return
    }

    if (!password.newPassword.trim()) {
      toast({
        title: locale === 'en' ? 'Error' : '错误',
        description: locale === 'en' ? 'Please enter new password' : '请输入新密码',
        variant: 'destructive'
      })
      return
    }

    // 新旧密码相同校验
    if (password.newPassword === password.currentPassword) {
      toast({
        title: locale === 'en' ? 'Error' : '错误',
        description: locale === 'en' 
          ? 'New password cannot be the same as current password' 
          : '新密码不能与当前密码相同',
        variant: 'destructive'
      })
      return
    }

    if (password.newPassword !== password.confirmPassword) {
      toast({
        title: locale === 'en' ? 'Error' : '错误',
        description: locale === 'en' ? 'New password and confirm password do not match' : '新密码和确认密码不匹配',
        variant: 'destructive'
      })
      return
    }

    if (password.newPassword.length < 6) {
      toast({
        title: locale === 'en' ? 'Error' : '错误',
        description: locale === 'en' ? 'Password must be at least 6 characters long' : '密码长度至少为6位',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      // 判断认证方式：有自定义token则走自定义修改密码API，否则走Supabase修改密码
      const hasCustomToken = typeof window !== 'undefined' && !!localStorage.getItem('custom_auth_token')

      if (hasCustomToken) {
        const resp = await safeFetch('/api/auth/custom-change-password', {
          method: 'POST',
          useAuth: true,
          body: JSON.stringify({
            currentPassword: password.currentPassword,
            newPassword: password.newPassword
          })
        })
        const result = await handleApiResponse(resp)
        if (!result.success) {
          throw new Error(result.error || (locale === 'en' ? 'Failed to change password' : '修改密码失败'))
        }
      } else {
        const result = await supabaseAuthApi.updatePassword(password.currentPassword, password.newPassword)
        if (!result.success) {
          throw new Error(result.error || (locale === 'en' ? 'Failed to change password' : '修改密码失败'))
        }
      }

      toast({
        title: locale === 'en' ? 'Success' : '成功',
        description: locale === 'en' ? 'Password changed successfully' : '密码修改成功'
      })

      // 重置表单
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('密码修改失败:', error)
      const rawMessage = error instanceof Error ? (error.message || '') : ''
      const desc = translateMessage(rawMessage, locale) || (locale === 'en' ? 'Failed to change password, please try again' : '密码修改失败，请重试')
      toast({
        title: locale === 'en' ? 'Error' : '错误',
        description: desc,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6">
        {locale === 'en' ? 'Account Security' : '账户安全'}
      </h3>
      
      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="current-password">
            {locale === 'en' ? 'Current Password' : '当前密码'}
          </Label>
          <Input
            id="current-password"
            type="password"
            value={password.currentPassword}
            onChange={(e) => setPassword(prev => ({ ...prev, currentPassword: e.target.value }))}
            placeholder={locale === 'en' ? 'Enter current password' : '请输入当前密码'}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="new-password">
            {locale === 'en' ? 'New Password' : '新密码'}
          </Label>
          <Input
            id="new-password"
            type="password"
            value={password.newPassword}
            onChange={(e) => setPassword(prev => ({ ...prev, newPassword: e.target.value }))}
            placeholder={locale === 'en' ? 'Enter new password (at least 6 characters)' : '请输入新密码（至少6位）'}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">
            {locale === 'en' ? 'Confirm New Password' : '确认新密码'}
          </Label>
          <Input
            id="confirm-password"
            type="password"
            value={password.confirmPassword}
            onChange={(e) => setPassword(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder={locale === 'en' ? 'Enter new password again' : '请再次输入新密码'}
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || !password.currentPassword || !password.newPassword || !password.confirmPassword}
          className="w-full bg-[#00b899] hover:bg-[#009a7a] text-white"
        >
          {isLoading 
            ? (locale === 'en' ? 'Changing...' : '修改中...')
            : (locale === 'en' ? 'Change Password' : '修改密码')
          }
        </Button>
      </form>
    </div>
  )
}
