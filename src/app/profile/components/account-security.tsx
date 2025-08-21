'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { supabaseAuthApi } from '@/api/supabaseAuth'

export default function AccountSecurity() {
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
        title: '错误',
        description: '请输入当前密码',
        variant: 'destructive'
      })
      return
    }

    if (!password.newPassword.trim()) {
      toast({
        title: '错误',
        description: '请输入新密码',
        variant: 'destructive'
      })
      return
    }

    if (password.newPassword !== password.confirmPassword) {
      toast({
        title: '错误',
        description: '新密码和确认密码不匹配',
        variant: 'destructive'
      })
      return
    }

    if (password.newPassword.length < 6) {
      toast({
        title: '错误',
        description: '新密码长度不能少于6位',
        variant: 'destructive'
      })
      return
    }

    if (password.currentPassword === password.newPassword) {
      toast({
        title: '错误',
        description: '新密码不能与当前密码相同',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    
    try {
      const result = await supabaseAuthApi.updatePassword(password.currentPassword, password.newPassword)
      
      if (result.success) {
        toast({
          title: '成功',
          description: result.data?.message || '密码修改成功'
        })
        setPassword({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast({
          title: '密码修改失败',
          description: result.error || '修改密码时发生错误',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('修改密码错误:', error)
      toast({
        title: '密码修改失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">账户安全</h3>
      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="current-password">当前密码</Label>
          <Input 
            id="current-password" 
            type="password" 
            value={password.currentPassword}
            onChange={(e) => setPassword({...password, currentPassword: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">新密码</Label>
          <Input 
            id="new-password" 
            type="password" 
            value={password.newPassword}
            onChange={(e) => setPassword({...password, newPassword: e.target.value})}
            placeholder="请输入新密码（至少6位）"
            minLength={6}
            required
          />
          {password.newPassword && password.newPassword.length < 6 && (
            <p className="text-sm text-red-500">密码长度不能少于6位</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">确认新密码</Label>
          <Input 
            id="confirm-password" 
            type="password" 
            value={password.confirmPassword}
            onChange={(e) => setPassword({...password, confirmPassword: e.target.value})}
            placeholder="请再次输入新密码"
            required
          />
          {password.confirmPassword && password.newPassword !== password.confirmPassword && (
            <p className="text-sm text-red-500">两次输入的密码不一致</p>
          )}
          {password.confirmPassword && password.newPassword === password.confirmPassword && password.confirmPassword.length >= 6 && (
            <p className="text-sm text-green-500">密码确认无误</p>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={
            isLoading || 
            !password.currentPassword.trim() || 
            !password.newPassword.trim() || 
            !password.confirmPassword.trim() ||
            password.newPassword !== password.confirmPassword ||
            password.newPassword.length < 6 ||
            password.currentPassword === password.newPassword
          }
        >
          {isLoading ? '正在修改...' : '修改密码'}
        </Button>
      </form>
    </div>
  )
}
