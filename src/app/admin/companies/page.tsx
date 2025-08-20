'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Building, Phone, Mail } from 'lucide-react'
import { AdminCompany, AdminCountry, AdminProvince, AdminDevelopmentZone, PaginationParams, COMPANY_TYPE_OPTIONS } from '@/lib/types/admin'
// 移除旧的导入，改用API调用
import { DataTable } from '@/components/admin/data-table/data-table'
import { CompanyForm } from './components/company-form'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [stats, setStats] = useState({
    totalCompanies: 0,
    stateOwned: 0,
    privateEnterprise: 0,
    foreign: 0
  })

  const loadStats = useCallback(async () => {
    try {
      // 加载总统计数据
      const dashboardResponse = await fetch('/api/admin/dashboard-stats')
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        
        // 加载所有企业数据来计算按类型分类的统计
        const allCompaniesResponse = await fetch('/api/admin/companies?pageSize=1000')
        if (allCompaniesResponse.ok) {
          const allCompaniesData = await allCompaniesResponse.json()
          const allCompanies = allCompaniesData.data || []
          
          // 计算按企业类型分类的数量
          const stateOwned = allCompanies.filter((company: AdminCompany) => 
            company.company_type === 'state_owned_enterprise'
          ).length
          
          const privateEnterprise = allCompanies.filter((company: AdminCompany) => 
            company.company_type === 'private_enterprise'
          ).length
          
          const foreign = allCompanies.filter((company: AdminCompany) => 
            company.company_type === 'foreign_enterprise'
          ).length
          
          setStats({
            totalCompanies: dashboardData.totalCompanies || 0,
            stateOwned,
            privateEnterprise,
            foreign
          })
        }
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }, [])

  const loadCompanies = useCallback(async (params?: Partial<PaginationParams>) => {
    try {
      setIsLoading(true)
      
      const searchParams = new URLSearchParams({
        page: String(pagination.current),
        pageSize: String(pagination.pageSize),
        ...(params?.search && { search: params.search }),
        ...(params?.sortBy && { sortBy: params.sortBy }),
        ...(params?.sortOrder && { sortOrder: params.sortOrder })
      })

      const response = await fetch(`/api/admin/companies?${searchParams}`)
      if (!response.ok) {
        throw new Error('获取企业列表失败')
      }
      
      const result = await response.json()
      setCompanies(result.data)
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total
      }))
    } catch (error) {
      console.error('加载企业列表失败:', error)
      alert('加载企业列表失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompanies()
    loadStats()
  }, [loadCompanies, loadStats, pagination.current, pagination.pageSize])

  const handleSearch = (search: string) => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadCompanies({ search })
  }

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    loadCompanies({ sortBy: field, sortOrder: order })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }))
  }

  const handleAdd = () => {
    setEditingCompany(null)
    setShowForm(true)
  }

  const handleEdit = (company: AdminCompany) => {
    setEditingCompany(company)
    setShowForm(true)
  }

  const handleDelete = async (company: AdminCompany) => {
    if (!confirm(`确定要删除企业"${company.name_zh}"吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除失败')
      }

      alert('企业删除成功')
      await loadCompanies()
      await loadStats()
    } catch (error) {
      console.error('删除企业失败:', error)
      alert(`删除企业失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingCompany(null)
    loadCompanies()
    loadStats()
  }

  const getCompanyTypeLabel = (type?: string) => {
    const option = COMPANY_TYPE_OPTIONS.find(opt => opt.value === type)
    return option?.label_zh || '未知'
  }

  const formatOutputValue = (value?: number) => {
    if (!value) return '-'
    return `${value.toFixed(1)}亿元`
  }

  const columns = [
    {
      key: 'logo_url',
      title: 'Logo',
      width: '80px',
      render: (value: string | number | boolean | AdminCountry | AdminProvince | AdminDevelopmentZone | undefined, record: AdminCompany, index: number) => (
        value ? (
          <img 
            src={value as string} 
            alt={record.name_zh}
            className="w-12 h-12 object-cover rounded border border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
            <Building className="w-6 h-6 text-gray-400" />
          </div>
        )
      )
    },
    {
      key: 'name_zh',
      title: '企业名称',
      sortable: true,
      render: (value: string | number | boolean | AdminCountry | AdminProvince | AdminDevelopmentZone | undefined, record: AdminCompany, index: number) => (
        <div>
          <div className="font-medium text-gray-900">{value as string}</div>
          {record.name_en && (
            <div className="text-sm text-gray-500">{record.name_en}</div>
          )}
        </div>
      )
    },
    {
      key: 'company_type',
      title: '企业性质',
      render: (value: string | number | boolean | AdminCountry | AdminProvince | AdminDevelopmentZone | undefined, record: AdminCompany, index: number) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {getCompanyTypeLabel(value as string)}
        </span>
      )
    },
    {
      key: 'country',
      title: '国别',
      render: (_: unknown, record: AdminCompany) => (
        <span className="text-sm text-gray-900">
          {record.country?.name_zh || '-'}
        </span>
      )
    },
    {
      key: 'province',
      title: '省份',
      render: (_: unknown, record: AdminCompany) => (
        <span className="text-sm text-gray-700">
          {record.province?.name_zh || '-'}
        </span>
      )
    },
    {
      key: 'development_zone',
      title: '经开区',
      render: (_: unknown, record: AdminCompany) => (
        <span className="text-sm text-gray-600">
          {record.development_zone?.name_zh || (record.country?.code === 'china' && record.province ? '不在经开区内' : '-')}
        </span>
      )
    },
    {
      key: 'address',
      title: '地址',
      render: (_: unknown, record: AdminCompany) => (
        <div className="text-sm">
          <div className="text-gray-900">{record.address_zh || record.address_en || '-'}</div>
        </div>
      )
    },
    {
      key: 'industry_code',
      title: '行业代码',
      render: (value: string | number | boolean | AdminCountry | AdminProvince | AdminDevelopmentZone | undefined, record: AdminCompany, index: number) => (
        value ? (
          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
            {value as string}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      key: 'annual_output_value',
      title: '年产值',
      sortable: true,
      render: (value: string | number | boolean | AdminCountry | AdminProvince | AdminDevelopmentZone | undefined, record: AdminCompany, index: number) => (
        <span className="text-sm font-medium text-green-600">
          {formatOutputValue(value as number)}
        </span>
      )
    },
    {
      key: 'contact_info',
      title: '联系信息',
      render: (_: unknown, record: AdminCompany) => (
        <div className="text-xs space-y-1">
          {record.contact_person && (
            <div className="text-gray-900">{record.contact_person}</div>
          )}
          {record.contact_phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="w-3 h-3 mr-1" />
              {record.contact_phone}
            </div>
          )}
          {record.contact_email && (
            <div className="flex items-center text-gray-600">
              <Mail className="w-3 h-3 mr-1" />
              {record.contact_email}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      title: '状态',
      width: '80px',
      render: (value: string | number | boolean | AdminCountry | AdminProvince | AdminDevelopmentZone | undefined, record: AdminCompany, index: number) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value as boolean 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value as boolean ? '启用' : '禁用'}
        </span>
      )
    },
    {
      key: 'created_at',
      title: '创建时间',
      sortable: true,
      render: (value: string | number | boolean | AdminCountry | AdminProvince | AdminDevelopmentZone | undefined, record: AdminCompany, index: number) => (
        <span className="text-sm text-gray-500">
          {new Date(value as string).toLocaleDateString('zh-CN')}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (_: unknown, record: AdminCompany) => (
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
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企业管理</h1>
          <p className="text-gray-600 mt-1">管理平台企业信息，包括基本信息、联系方式等</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增企业
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">企业总数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center mr-3">
              <span className="text-green-600 font-bold">国</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">国有企业</p>
              <p className="text-2xl font-bold text-gray-900">{stats.stateOwned}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center mr-3">
              <span className="text-purple-600 font-bold">民</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">民营企业</p>
              <p className="text-2xl font-bold text-gray-900">{stats.privateEnterprise}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center mr-3">
              <span className="text-orange-600 font-bold">外</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">外贸企业</p>
              <p className="text-2xl font-bold text-gray-900">{stats.foreign}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <DataTable
        columns={columns}
        data={companies}
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: handlePaginationChange
        }}
        onSearch={handleSearch}
        onSort={handleSort}
        searchPlaceholder="搜索企业名称、联系人或行业代码..."
        className="shadow-sm"
      />

      {/* 企业表单弹窗 */}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}