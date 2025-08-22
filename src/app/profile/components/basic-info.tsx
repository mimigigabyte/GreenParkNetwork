'use client'

import { useEffect, useState } from 'react'
import { supabaseAuthApi, User } from '@/api/supabaseAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ImageUpload } from '@/components/admin/forms/image-upload'
import { useAuthContext } from '@/components/auth/auth-provider'

export default function BasicInfo() {
  const { user: authUser, loading: authLoading } = useAuthContext()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false)
  const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)
  const [phoneCountdown, setPhoneCountdown] = useState(0)

  useEffect(() => {
    if (!authLoading) {
      console.log('🔍 个人中心加载用户信息:', authUser)
      
      if (authUser) {
        // 转换AuthContext用户信息为BasicInfo需要的格式
        const basicInfoUser: User = {
          id: authUser.id,
          email: authUser.email || undefined,
          phone: authUser.phone || undefined,
          name: authUser.name || '用户',
          avatar: authUser.avatar_url || undefined,
          role: 'user', // AuthContext没有role信息，默认为user
          createdAt: new Date().toISOString(), // AuthContext没有createdAt，使用当前时间
          emailVerified: !!authUser.email, // 简单判断
          phoneVerified: !!authUser.phone  // 简单判断
        }
        setUser(basicInfoUser)
        console.log('✅ 用户信息已设置:', basicInfoUser)
      } else {
        setUser(null)
        console.log('❌ 未找到用户信息')
      }
      setIsLoading(false)
    }
  }, [authUser, authLoading])

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!newEmail) return
    // TODO: 调用发送邮箱验证码的API
    console.log('发送邮箱验证码到:', newEmail)
    setIsEmailCodeSent(true)
    setEmailCountdown(60)
    
    const timer = setInterval(() => {
      setEmailCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 发送手机验证码
  const handleSendPhoneCode = async () => {
    if (!newPhone) return
    // TODO: 调用发送手机验证码的API
    console.log('发送手机验证码到:', newPhone)
    setIsPhoneCodeSent(true)
    setPhoneCountdown(60)
    
    const timer = setInterval(() => {
      setPhoneCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 确认修改邮箱
  const handleConfirmEmailChange = async () => {
    if (!newEmail || !emailCode) return
    // TODO: 调用修改邮箱的API
    console.log('修改邮箱:', { newEmail, emailCode })
    // 成功后更新用户信息并关闭弹窗
    setUser({ ...user!, email: newEmail })
    setIsEmailDialogOpen(false)
    setNewEmail('')
    setEmailCode('')
    setIsEmailCodeSent(false)
  }

  // 确认修改手机号
  const handleConfirmPhoneChange = async () => {
    if (!newPhone || !phoneCode) return
    // TODO: 调用修改手机号的API
    console.log('修改手机号:', { newPhone, phoneCode })
    // 成功后更新用户信息并关闭弹窗
    setUser({ ...user!, phone: newPhone })
    setIsPhoneDialogOpen(false)
    setNewPhone('')
    setPhoneCode('')
    setIsPhoneCodeSent(false)
  }

  // 更新用户头像
  const handleAvatarChange = async (avatarUrl: string) => {
    try {
      // TODO: 调用更新用户头像的API
      console.log('更新头像:', avatarUrl)
      // 成功后更新用户信息并关闭弹窗
      setUser({ ...user!, avatar: avatarUrl })
      setIsAvatarDialogOpen(false)
    } catch (error) {
      console.error('更新头像失败:', error)
      alert('更新头像失败，请重试')
    }
  }

  if (isLoading) {
    return <BasicInfoSkeleton />
  }

  if (!user) {
    return <div>无法加载用户信息，请尝试重新登录。</div>
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">基本信息</h3>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">更换头像</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>更换头像</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ImageUpload
                  value={user.avatar || ''}
                  onChange={handleAvatarChange}
                  bucket="images"
                  folder="avatars"
                  placeholder="点击上传头像"
                  className="w-full"
                  maxSize={2}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>取消</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input id="username" value={user.name} disabled />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="flex gap-2">
                  <Input id="email" type="email" value={user.email || ''} disabled className="flex-1" />
                  <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">修改</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>修改邮箱</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-email">新邮箱地址</Label>
                          <Input
                            id="new-email"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="请输入新的邮箱地址"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email-code">验证码</Label>
                          <div className="flex gap-2">
                            <Input
                              id="email-code"
                              value={emailCode}
                              onChange={(e) => setEmailCode(e.target.value)}
                              placeholder="请输入验证码"
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={handleSendEmailCode}
                              disabled={!newEmail || emailCountdown > 0}
                            >
                              {emailCountdown > 0 ? `${emailCountdown}s` : '发送验证码'}
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>取消</Button>
                          <Button onClick={handleConfirmEmailChange} disabled={!newEmail || !emailCode}>确认修改</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <div className="flex gap-2">
                  <Input id="phone" value={user.phone || ''} disabled className="flex-1" />
                  <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">修改</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>修改手机号</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-phone">新手机号</Label>
                          <Input
                            id="new-phone"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="请输入新的手机号"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone-code">验证码</Label>
                          <div className="flex gap-2">
                            <Input
                              id="phone-code"
                              value={phoneCode}
                              onChange={(e) => setPhoneCode(e.target.value)}
                              placeholder="请输入验证码"
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={handleSendPhoneCode}
                              disabled={!newPhone || phoneCountdown > 0}
                            >
                              {phoneCountdown > 0 ? `${phoneCountdown}s` : '发送验证码'}
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setIsPhoneDialogOpen(false)}>取消</Button>
                          <Button onClick={handleConfirmPhoneChange} disabled={!newPhone || !phoneCode}>确认修改</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
            </div>
            <div className="space-y-2">
                <Label>注册时间</Label>
                <Input value={new Date(user.createdAt).toLocaleDateString()} disabled />
            </div>
        </div>

      </div>
    </div>
  )
}

function BasicInfoSkeleton() {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4"><Skeleton className="h-6 w-24" /></h3>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div>
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  )
}
