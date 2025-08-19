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
    if (password.newPassword !== password.confirmPassword) {
      toast({
        title: '错误',
        description: '新密码和确认密码不匹配',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    // TODO: 调用 supabase 的修改密码接口
    // const { error } = await supabaseAuthApi.updatePassword(password.currentPassword, password.newPassword)
    setIsLoading(false)

    // if (error) {
    //   toast({
    //     title: '密码修改失败',
    //     description: error.message,
    //     variant: 'destructive'
    //   })
    // } else {
    //   toast({
    //     title: '成功',
    //     description: '密码修改成功'
    //   })
    //   setPassword({
    //     currentPassword: '',
    //     newPassword: '',
    //     confirmPassword: ''
    //   })
    // }
    
    // 模拟成功
    toast({
        title: '成功',
        description: '密码修改成功(模拟)'
    })
    setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
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
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">确认新密码</Label>
          <Input 
            id="confirm-password" 
            type="password" 
            value={password.confirmPassword}
            onChange={(e) => setPassword({...password, confirmPassword: e.target.value})}
            required
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '正在修改...' : '修改密码'}
        </Button>
      </form>
    </div>
  )
}
