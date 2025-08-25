'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { supabaseAuthApi } from '@/api/supabaseAuth'

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
      // TODO: 调用修改密码的API
      console.log('修改密码请求:', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword
      })

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

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
      toast({
        title: locale === 'en' ? 'Error' : '错误',
        description: locale === 'en' ? 'Failed to change password, please try again' : '密码修改失败，请重试',
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
          className="w-full"
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