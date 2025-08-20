'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Building2, Mail, Phone } from 'lucide-react'
import { AdminUser, AdminCompany, PaginationParams } from '@/lib/types/admin'
import { DataTable } from '@/components/admin/data-table/data-table'
import { UserForm } from './components/user-form'
import { getUsersApi, deleteUserApi } from '@/api/admin-users'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  useEffect(() => {
    loadUsers()
  }, [pagination.current, pagination.pageSize])

  const loadUsers = async (params?: Partial<PaginationParams>) => {
    try {
      setIsLoading(true)
      const result = await getUsersApi({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...params,
      })
      setUsers(result.data)
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
      }))
    } catch (error) {
      console.error('加载用户列表失败:', error)
      alert('加载用户列表失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (search: string) => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers({ search })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }))
  }

  const handleAdd = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`确定要删除用户 "${user.email || user.phone_number}" 吗？`)) {
      return
    }

    try {
      await deleteUserApi(user.id)
      alert('用户删除成功')
      await loadUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
      alert(`删除用户失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingUser(null)
    loadUsers()
  }

  const columns = [
    {
      key: 'identifier',
      title: '用户标识',
      render: (value: string | AdminCompany | undefined, record: AdminUser, index: number) => (
        <div>
          {record.email && <div className="flex items-center"><Mail className="w-4 h-4 mr-2 text-gray-400" />{record.email}</div>}
          {record.phone_number && <div className="flex items-center"><Phone className="w-4 h-4 mr-2 text-gray-400" />{record.phone_number}</div>}
        </div>
      ),
    },
    {
      key: 'company',
      title: '所属企业',
      render: (value: string | AdminCompany | undefined, record: AdminUser, index: number) => (
        <div className="flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
          {record.company?.name_zh || '未关联'}
        </div>
      ),
    },
    {
      key: 'created_at',
      title: '注册时间',
      render: (value: string | AdminCompany | undefined, record: AdminUser, index: number) => new Date(value as string).toLocaleString('zh-CN'),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (value: string | AdminCompany | undefined, record: AdminUser, index: number) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(record)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(record)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center"><Users className="w-6 h-6 mr-2" />用户管理</h1>
          <p className="text-gray-600 mt-1">管理平台的所有注册用户及其所属企业</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增用户
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: handlePaginationChange,
        }}
        onSearch={handleSearch}
        searchPlaceholder="搜索邮箱、手机号或企业名称..."
        className="shadow-sm"
      />

      {showForm && (
        <UserForm
          user={editingUser}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
