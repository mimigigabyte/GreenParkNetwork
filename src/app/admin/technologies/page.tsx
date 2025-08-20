'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Lightbulb, Tag, FileText, Image as ImageIcon, Download, Check, X, MessageSquare, Eye } from 'lucide-react'
import { AdminTechnology, PaginationParams, TECH_SOURCE_OPTIONS, TECH_REVIEW_STATUS_OPTIONS, TechReviewStatus } from '@/lib/types/admin'
import { DataTable } from '@/components/admin/data-table/data-table'
import { TechnologyForm } from './components/technology-form'
import { getTechnologiesApi, deleteTechnologyApi, reviewTechnologyApi } from '@/lib/api/admin-technologies'

export default function TechnologiesPage() {
  const [technologies, setTechnologies] = useState<AdminTechnology[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTechnology, setEditingTechnology] = useState<AdminTechnology | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [reviewStatusFilter, setReviewStatusFilter] = useState<TechReviewStatus>('published')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingTechnology, setRejectingTechnology] = useState<AdminTechnology | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [viewingTechnology, setViewingTechnology] = useState<AdminTechnology | null>(null)
  const [stats, setStats] = useState({
    totalTechCount: 0,
    uniqueSupplierCount: 0,
    uniqueCountryCount: 0,
    uniqueDevZoneCount: 0
  })
  const [reviewStatusCounts, setReviewStatusCounts] = useState({
    published: 0,
    pending_review: 0,
    rejected: 0
  })

  useEffect(() => {
    loadTechnologies()
    loadStats()
    loadReviewStatusCounts()
  }, [pagination.current, pagination.pageSize, reviewStatusFilter])

  const loadStats = async () => {
    try {
      // 获取所有已发布的技术数据来计算统计信息
      const response = await fetch('/api/admin/technologies?reviewStatus=published&pageSize=1000') // 只获取已发布的技术
      const techData = await response.json()
      
      if (techData && techData.data) {
        const technologies = techData.data
        
        // 计算已发布技术总数
        const totalTechCount = techData.pagination?.total || technologies.length
        
        // 计算唯一技术供应商数量（基于已发布技术的企业ID去重）
        const uniqueSuppliers = new Set()
        technologies.forEach((tech: AdminTechnology) => {
          // 根据企业ID或企业名称去重，优先使用company_id
          if (tech.company_id) {
            uniqueSuppliers.add(tech.company_id)
          } else if (tech.company_name_zh || tech.company_name_en) {
            // 如果没有company_id，使用企业名称作为标识
            const companyKey = tech.company_name_zh || tech.company_name_en
            uniqueSuppliers.add(companyKey)
          }
        })
        
        // 计算唯一国别数量（基于已发布技术的企业国别）
        const uniqueCountries = new Set()
        technologies.forEach((tech: AdminTechnology) => {
          if (tech.company_country_id) {
            uniqueCountries.add(tech.company_country_id)
          }
        })
        
        // 计算唯一经开区数量（基于已发布技术的企业经开区）
        const uniqueDevZones = new Set()
        technologies.forEach((tech: AdminTechnology) => {
          if (tech.company_development_zone_id) {
            uniqueDevZones.add(tech.company_development_zone_id)
          }
        })
        
        setStats({
          totalTechCount: totalTechCount,
          uniqueSupplierCount: uniqueSuppliers.size,
          uniqueCountryCount: uniqueCountries.size,
          uniqueDevZoneCount: uniqueDevZones.size
        })
        
        console.log('技术统计数据:', {
          totalTechCount,
          uniqueSupplierCount: uniqueSuppliers.size,
          uniqueCountryCount: uniqueCountries.size,
          uniqueDevZoneCount: uniqueDevZones.size,
          uniqueSuppliers: Array.from(uniqueSuppliers),
          uniqueCountries: Array.from(uniqueCountries),
          uniqueDevZones: Array.from(uniqueDevZones)
        })
      } else {
        setStats({
          totalTechCount: 0,
          uniqueSupplierCount: 0,
          uniqueCountryCount: 0,
          uniqueDevZoneCount: 0
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 如果统计数据加载失败，设置为0
      setStats({
        totalTechCount: 0,
        uniqueSupplierCount: 0,
        uniqueCountryCount: 0,
        uniqueDevZoneCount: 0
      })
    }
  }

  const loadReviewStatusCounts = async () => {
    try {
      // 并行获取各个审核状态的技术数量
      const [publishedRes, pendingRes, rejectedRes] = await Promise.all([
        fetch('/api/admin/technologies?reviewStatus=published&pageSize=1'),
        fetch('/api/admin/technologies?reviewStatus=pending_review&pageSize=1'),
        fetch('/api/admin/technologies?reviewStatus=rejected&pageSize=1')
      ])

      const [publishedData, pendingData, rejectedData] = await Promise.all([
        publishedRes.json(),
        pendingRes.json(),
        rejectedRes.json()
      ])

      setReviewStatusCounts({
        published: publishedData.pagination?.total || 0,
        pending_review: pendingData.pagination?.total || 0,
        rejected: rejectedData.pagination?.total || 0
      })
    } catch (error) {
      console.error('加载审核状态统计失败:', error)
      setReviewStatusCounts({
        published: 0,
        pending_review: 0,
        rejected: 0
      })
    }
  }

  const loadTechnologies = async (params?: Partial<PaginationParams>) => {
    try {
      setIsLoading(true)
      
      const result = await getTechnologiesApi({
        page: pagination.current,
        pageSize: pagination.pageSize,
        reviewStatus: reviewStatusFilter,
        ...params
      })
      
      setTechnologies(result.data)
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total
      }))
    } catch (error) {
      console.error('加载技术列表失败:', error)
      alert('加载技术列表失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (search: string) => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadTechnologies({ search })
  }


  const handleSort = (field: string, order: 'asc' | 'desc') => {
    loadTechnologies({ sortBy: field, sortOrder: order })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }))
  }

  const handleAdd = () => {
    setEditingTechnology(null)
    setShowForm(true)
  }

  const handleEdit = (technology: AdminTechnology) => {
    setEditingTechnology(technology)
    setShowForm(true)
  }

  const handleView = (technology: AdminTechnology) => {
    setViewingTechnology(technology)
    setShowDetailModal(true)
  }

  const handleDelete = async (technology: AdminTechnology) => {
    if (!confirm(`确定要删除技术"${technology.name_zh}"吗？`)) {
      return
    }

    try {
      await deleteTechnologyApi(technology.id)
      alert('技术删除成功')
      await loadTechnologies()
      await loadReviewStatusCounts() // 重新加载统计数据
    } catch (error) {
      console.error('删除技术失败:', error)
      alert(`删除技术失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingTechnology(null)
    loadTechnologies()
    loadReviewStatusCounts() // 重新加载统计数据
  }

  const handleApprove = async (technology: AdminTechnology) => {
    if (!confirm(`确定要通过技术"${technology.name_zh}"吗？`)) {
      return
    }

    try {
      await reviewTechnologyApi(technology.id, 'approve')
      alert('技术审核通过成功')
      await loadTechnologies()
      await loadReviewStatusCounts() // 重新加载统计数据
    } catch (error) {
      console.error('审核操作失败:', error)
      alert(`审核操作失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleReject = (technology: AdminTechnology) => {
    setRejectingTechnology(technology)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!rejectingTechnology || !rejectReason.trim()) {
      alert('请填写退回原因')
      return
    }

    try {
      await reviewTechnologyApi(rejectingTechnology.id, 'reject', rejectReason.trim())
      alert('技术退回成功')
      setShowRejectModal(false)
      setRejectingTechnology(null)
      setRejectReason('')
      await loadTechnologies()
      await loadReviewStatusCounts() // 重新加载统计数据
    } catch (error) {
      console.error('退回操作失败:', error)
      alert(`退回操作失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const getReviewStatusLabel = (status?: TechReviewStatus) => {
    const option = TECH_REVIEW_STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.label_zh || '未知'
  }

  const getReviewStatusBadge = (status?: TechReviewStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTechSourceLabel = (source?: string) => {
    const option = TECH_SOURCE_OPTIONS.find(opt => opt.value === source)
    return option?.label_zh || '未知'
  }

  const handlePreviewImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank')
  }

  // 从URL中提取或获取原始文件名
  const getDisplayFilename = (url: string, originalFilename?: string) => {
    // 优先使用原始文件名
    if (originalFilename) {
      return originalFilename;
    }
    
    const urlPath = url.split('/').pop() || '';
    const parts = urlPath.split('.');
    
    if (parts.length > 1) {
      const ext = parts.pop(); // 获取文件扩展名
      // 如果文件名看起来像是时间戳+随机字符，则生成更友好的名称
      return `技术资料.${ext}`;
    }
    
    return '技术资料';
  };

  const handleDownloadAttachment = async (attachmentUrl: string, originalFilename?: string) => {
    try {
      // 获取有意义的文件名
      const filename = getDisplayFilename(attachmentUrl, originalFilename);
      
      // 使用API接口进行下载
      const downloadUrl = `/api/files/download?url=${encodeURIComponent(attachmentUrl)}&filename=${encodeURIComponent(filename)}`
      
      // 创建隐藏的下载链接
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('下载附件失败:', error)
      alert('下载附件失败，请重试')
    }
  }

  const columns = [
    {
      key: 'image_url',
      title: '图片',
      width: '100px',
      render: (image_url: string, record: AdminTechnology) => (
        <div className="flex items-center space-x-2">
          {image_url ? (
            <div className="relative">
              <img 
                src={image_url} 
                alt={record.name_zh}
                className="w-16 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80"
                onClick={() => handlePreviewImage(image_url)}
              />
            </div>
          ) : (
            <div className="w-16 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'name_zh',
      title: '技术名称',
      sortable: true,
      render: (name_zh: string, record: AdminTechnology) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">{name_zh}</div>
          {record.name_en && (
            <div className="text-sm text-gray-500 truncate">{record.name_en}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      title: '分类',
      render: (_: unknown, record: AdminTechnology) => (
        <div className="text-sm">
          {record.category && (
            <div className="flex items-center text-blue-600 mb-1">
              <Tag className="w-3 h-3 mr-1" />
              {record.category.name_zh}
            </div>
          )}
          {record.subcategory && (
            <div className="text-gray-500 ml-4 text-xs">
              {record.subcategory.name_zh}
            </div>
          )}
          {!record.category && !record.subcategory && (
            <span className="text-gray-400">未分类</span>
          )}
        </div>
      )
    },
    {
      key: 'country_info',
      title: '国别',
      width: '120px',
      render: (_: unknown, record: AdminTechnology) => {
        if (!record.company_country) {
          return <span className="text-gray-400 text-sm">-</span>
        }
        return (
          <div className="flex items-center space-x-2">
            {record.company_country.logo_url && (
              <img 
                src={record.company_country.logo_url}
                alt={record.company_country.name_zh}
                className="w-4 h-3 object-cover"
              />
            )}
            <span className="text-sm text-gray-900">
              {record.company_country.name_zh}
            </span>
          </div>
        )
      }
    },
    {
      key: 'company_info',
      title: '所属企业',
      width: '200px',
      render: (_: unknown, record: AdminTechnology) => (
        <div className="flex items-center space-x-3">
          {record.company_logo_url ? (
            <img 
              src={record.company_logo_url}
              alt={record.company_name_zh || '企业logo'}
              className="w-8 h-8 object-cover rounded border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {record.company_name_zh ? (
              <div>
                <div className="font-medium text-gray-900 truncate text-sm">
                  {record.company_name_zh}
                </div>
                {record.company_name_en && (
                  <div className="text-xs text-gray-500 truncate">
                    {record.company_name_en}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">未关联企业</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'location_info',
      title: '省份和经开区',
      width: '180px',
      render: (_: unknown, record: AdminTechnology) => {
        // 只显示省份和国家级经开区
        if (!record.company_province && !record.company_development_zone) {
          return <span className="text-gray-400 text-sm">-</span>
        }

        return (
          <div className="text-sm text-gray-600">
            {record.company_province && (
              <div className="font-medium text-gray-900 truncate">{record.company_province.name_zh}</div>
            )}
            {record.company_development_zone && (
              <div className="text-xs text-gray-500 truncate">{record.company_development_zone.name_zh}</div>
            )}
          </div>
        )
      }
    },
    {
      key: 'attachments',
      title: '附件',
      width: '160px',
      render: (_: unknown, record: AdminTechnology) => {
        // 优先使用新的attachments字段，fallback到attachment_urls
        let attachments: Array<{url: string, filename?: string}> = [];
        
        if (record.attachments && Array.isArray(record.attachments)) {
          // 新格式：包含完整附件信息
          attachments = record.attachments;
        } else if (record.attachment_urls && Array.isArray(record.attachment_urls)) {
          // 旧格式：只有URL
          attachments = record.attachment_urls.map(url => ({ url }));
        }
        
        return (
          <div className="flex items-center">
            {attachments && attachments.length > 0 ? (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center text-green-600">
                  <FileText className="w-4 h-4 mr-1" />
                  <span className="text-sm">{attachments.length}个文件</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {attachments.map((attachment, index) => {
                    const filename = getDisplayFilename(attachment.url, attachment.filename);
                    const shortName = filename.length > 12 ? filename.substring(0, 12) + '...' : filename;
                    return (
                      <button
                        key={index}
                        onClick={() => handleDownloadAttachment(attachment.url, attachment.filename)}
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-1 py-0.5 rounded border border-blue-200 transition-colors"
                        title={`下载: ${filename}`}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-20">{shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <span className="text-gray-400 text-sm">无</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'review_status',
      title: '审核状态',
      width: '100px',
      render: (_: unknown, record: AdminTechnology) => {
        const status = record.review_status || 'published'
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            getReviewStatusBadge(status)
          }`}>
            {getReviewStatusLabel(status)}
          </span>
        )
      }
    },
    {
      key: 'is_active',
      title: '启用状态',
      width: '80px',
      render: (is_active: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {is_active ? '启用' : '禁用'}
        </span>
      )
    },
    {
      key: 'created_at',
      title: '创建时间',
      sortable: true,
      render: (created_at: string) => (
        <span className="text-sm text-gray-500">
          {new Date(created_at).toLocaleDateString('zh-CN')}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: '200px',
      render: (_: unknown, record: AdminTechnology) => {
        const status = record.review_status || 'published'
        return (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleView(record)}
              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
              title="浏览详情"
            >
              <Eye className="w-4 h-4" />
            </button>
            {status === 'pending_review' && (
              <>
                <button
                  onClick={() => handleApprove(record)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="通过"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReject(record)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="退回"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
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
    }
  ]

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">技术管理</h1>
          <p className="text-gray-600 mt-1">管理绿色低碳技术信息，包括技术描述、分类、来源等</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增技术
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Lightbulb className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">技术总数</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold">供</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">技术供应商数量</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueSupplierCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center mr-3">
              <span className="text-purple-600 font-bold">国</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">涉及国别数量</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueCountryCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center mr-3">
              <span className="text-orange-600 font-bold">区</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">涉及经开区数量</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueDevZoneCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 技术展示列表 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* 分类和搜索栏 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* 左侧分类选项 */}
            <div className="flex items-center space-x-1">
              {TECH_REVIEW_STATUS_OPTIONS.map((option) => {
                const count = reviewStatusCounts[option.value as keyof typeof reviewStatusCounts] || 0
                return (
                  <button
                    key={option.value}
                    onClick={() => setReviewStatusFilter(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      reviewStatusFilter === option.value
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {option.label_zh}
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      reviewStatusFilter === option.value
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
            
            {/* 右侧搜索框 */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索技术名称、描述或简介..."
                  className="w-80 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      handleSearch('')
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch((e.target as HTMLInputElement).value)
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 数据表格 */}
        <DataTable
          columns={columns}
          data={technologies}
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handlePaginationChange
          }}
          onSort={handleSort}
          hideSearch={true}
          className="border-0 shadow-none"
        />
      </div>

      {/* 技术表单弹窗 */}
      {showForm && (
        <TechnologyForm
          technology={editingTechnology}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
      
      {/* 退回原因填写弹窗 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">退回技术</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                技术名称：<span className="font-medium">{rejectingTechnology?.name_zh}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                退回原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请详细说明退回原因..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={4}
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingTechnology(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 技术详情查看弹窗 */}
      {showDetailModal && viewingTechnology && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">技术详情</h2>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setViewingTechnology(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-6 space-y-8">
                
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">基本信息</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">技术名称（中文）</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {viewingTechnology.name_zh || '-'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">技术名称（英文）</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {viewingTechnology.name_en || '-'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">技术来源</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {getTechSourceLabel(viewingTechnology.tech_source)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">技术分类</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                          {viewingTechnology.category?.name_zh || '-'}
                          {viewingTechnology.subcategory && (
                            <span className="text-gray-500"> / {viewingTechnology.subcategory.name_zh}</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">审核状态</label>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getReviewStatusBadge(viewingTechnology.review_status)
                          }`}>
                            {getReviewStatusLabel(viewingTechnology.review_status)}
                          </span>
                          {viewingTechnology.review_status === 'rejected' && viewingTechnology.reject_reason && (
                            <span className="text-xs text-red-600">
                              原因：{viewingTechnology.reject_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">技术图片</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {viewingTechnology.image_url ? (
                          <img 
                            src={viewingTechnology.image_url}
                            alt={viewingTechnology.name_zh}
                            className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80"
                            onClick={() => window.open(viewingTechnology.image_url, '_blank')}
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 技术描述 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">技术描述</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">中文描述</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                        {viewingTechnology.description_zh || '-'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">英文描述</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                        {viewingTechnology.description_en || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 企业信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">企业信息</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">企业名称</label>
                      <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                        {viewingTechnology.company_logo_url && (
                          <img 
                            src={viewingTechnology.company_logo_url}
                            alt="企业logo"
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm text-gray-900">
                            {viewingTechnology.company_name_zh || '-'}
                          </p>
                          {viewingTechnology.company_name_en && (
                            <p className="text-xs text-gray-500">
                              {viewingTechnology.company_name_en}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">所属国别</label>
                      <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                        {viewingTechnology.company_country?.logo_url && (
                          <img 
                            src={viewingTechnology.company_country.logo_url}
                            alt="国旗"
                            className="w-4 h-3 object-cover"
                          />
                        )}
                        <span className="text-sm text-gray-900">
                          {viewingTechnology.company_country?.name_zh || '-'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">省份/经开区</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {viewingTechnology.company_province?.name_zh && (
                          <div className="font-medium">{viewingTechnology.company_province.name_zh}</div>
                        )}
                        {viewingTechnology.company_development_zone?.name_zh && (
                          <div className="text-xs text-gray-500 mt-1">
                            {viewingTechnology.company_development_zone.name_zh}
                          </div>
                        )}
                        {!viewingTechnology.company_province?.name_zh && !viewingTechnology.company_development_zone?.name_zh && '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 技术附件 */}
                {((viewingTechnology.attachments && viewingTechnology.attachments.length > 0) || 
                  (viewingTechnology.attachment_urls && viewingTechnology.attachment_urls.length > 0)) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">技术资料</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(() => {
                          let attachments: Array<{url: string, filename?: string}> = [];
                          
                          if (viewingTechnology.attachments && Array.isArray(viewingTechnology.attachments)) {
                            attachments = viewingTechnology.attachments;
                          } else if (viewingTechnology.attachment_urls && Array.isArray(viewingTechnology.attachment_urls)) {
                            attachments = viewingTechnology.attachment_urls.map(url => ({ url }));
                          }
                          
                          return attachments.map((attachment, index) => {
                            const filename = attachment.filename || getDisplayFilename(attachment.url);
                            return (
                              <button
                                key={index}
                                onClick={() => handleDownloadAttachment(attachment.url, attachment.filename)}
                                className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                              >
                                <FileText className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {filename}
                                  </div>
                                  <div className="text-xs text-gray-500">点击下载</div>
                                </div>
                                <Download className="w-4 h-4 text-gray-400 ml-2" />
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* 其他信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">其他信息</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">启用状态</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        viewingTechnology.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingTechnology.is_active ? '启用' : '禁用'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">创建时间</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {new Date(viewingTechnology.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">最后更新</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {new Date(viewingTechnology.updated_at || viewingTechnology.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setViewingTechnology(null)
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setViewingTechnology(null)
                  handleEdit(viewingTechnology)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                编辑技术
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}