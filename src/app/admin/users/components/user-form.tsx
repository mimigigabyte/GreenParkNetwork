'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AdminUser, AdminCompany } from '@/lib/types/admin'
import { createUserApi, updateUserApi, getCompaniesForSelectApi } from '@/api/admin-users'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email({ message: '请输入有效的邮箱地址' }).optional().or(z.literal('')),
  phone_number: z.string().optional().or(z.literal('')),
  password: z.string().min(6, { message: '密码至少需要6位' }).optional().or(z.literal('')),
  company_id: z.string({ message: '请选择一个企业' }),
}).refine(data => data.email || data.phone_number, {
  message: '邮箱和手机号至少需要填写一个',
  path: ['email'],
});

type UserFormValues = z.infer<typeof formSchema>

interface UserFormProps {
  user: AdminUser | null
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const isEditMode = !!user

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      password: '',
      company_id: user?.company_id || '',
    },
  })

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companyList = await getCompaniesForSelectApi()
        setCompanies(companyList)
      } catch (error) {
        console.error('获取企业列表失败:', error)
        alert('获取企业列表失败')
      }
    }
    fetchCompanies()
  }, [])

  const onSubmit = async (values: UserFormValues) => {
    setIsLoading(true)
    try {
      const submissionData: Partial<AdminUser> & { password?: string } = {
        email: values.email,
        phone_number: values.phone_number,
        company_id: values.company_id,
      }
      if (values.password) {
        // 在真实应用中，密码应该在发送到服务器前进行哈希处理
        // 或者最好由后端来处理密码的哈希和存储
        submissionData.password = values.password
      }

      if (isEditMode) {
        await updateUserApi(user.id, submissionData)
        alert('用户更新成功')
      } else {
        await createUserApi(submissionData)
        alert('用户创建成功')
      }
      onSuccess()
    } catch (error) {
      console.error('操作失败:', error)
      alert(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑用户' : '新增用户'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input placeholder="13800138000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditMode ? '新密码 (可选)' : '密码'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所属企业</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择一个企业" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name_zh}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
