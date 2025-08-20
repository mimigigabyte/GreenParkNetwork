'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Lightbulb, Tag, FileText, Image as ImageIcon, RefreshCw, MessageSquare, Eye, Download, X } from 'lucide-react'
import { AdminTechnology, AdminCategory, AdminSubcategory, AdminCountry, AdminProvince, AdminDevelopmentZone, AdminCompany, TechnologyAttachment, PaginationParams, TECH_SOURCE_OPTIONS, TECH_REVIEW_STATUS_OPTIONS, TechReviewStatus } from '@/lib/types/admin'
import { DataTable } from '@/components/admin/data-table/data-table'
import { UserTechnologyForm } from './components/user-technology-form'
import { getUserTechnologiesApi, deleteUserTechnologyApi } from '@/lib/api/user-technologies'
import { useAuthContext } from '@/components/auth/auth-provider'

export default function UserTechnologiesPage() {
  const { user } = useAuthContext()
  const [technologies, setTechnologies] = useState<AdminTechnology[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTechnology, setEditingTechnology] = useState<AdminTechnology | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [viewingTechnology, setViewingTechnology] = useState<AdminTechnology | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 获取用户名（邮箱或手机号）
  const getUserName = () => {
    return user?.email || user?.phone || user?.name || 'User'
  }

  useEffect(() => {
    if (user?.id) {
      loadTechnologies()
    }
  }, [pagination.current, pagination.pageSize, user?.id])

  const loadTechnologies = async (params?: Partial<PaginationParams>) => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      
      // 只加载当前用户创建的技术
      const result = await getUserTechnologiesApi({
        page: pagination.current,
        pageSize: pagination.pageSize,
        userId: user.id, // 必须的用户ID
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

  const handleView = (technology: AdminTechnology) => {
    setViewingTechnology(technology)
    setShowDetailModal(true)
  }

  const handleEdit = (technology: AdminTechnology) => {
    setEditingTechnology(technology)
    setShowForm(true)
  }

  const handleDelete = async (technology: AdminTechnology) => {
    if (!confirm(`确定要删除技术"${technology.name_zh}"吗？`)) {
      return
    }

    if (!user?.id) {
      alert('用户信息不完整，无法删除')
      return
    }

    try {
      await deleteUserTechnologyApi(technology.id, user.id)
      alert('技术删除成功')
      await loadTechnologies()
    } catch (error) {
      console.error('删除技术失败:', error)
      alert(`删除技术失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingTechnology(null)
    loadTechnologies()
  }

  const handleResubmit = async (technology: AdminTechnology) => {
    if (!confirm(`确定要重新提交技术"${technology.name_zh}"进行审核吗？`)) {
      return
    }

    try {
      // 将技术状态设置为待审核
      const response = await fetch(`/api/user/technologies/${technology.id}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('重新提交失败')
      }

      alert('您的技术发布申请已重新提交，我们正在对其进行审核，结果将在3-5个工作日内通过站内信、短信、邮件的形式通知您')
      await loadTechnologies()
    } catch (error) {
      console.error('重新提交失败:', error)
      alert(`重新提交失败: ${error instanceof Error ? error.message : '未知错误'}`)
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

  // 从URL中提取或生成有意义的文件名
  const getDisplayFilename = (url: string) => {
    const urlPath = url.split('/').pop() || '';
    const parts = urlPath.split('.');
    
    if (parts.length > 1) {
      const ext = parts.pop(); // 获取文件扩展名
      return `技术资料.${ext}`;
    }
    
    return '技术资料';
  };

  const handlePreviewImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank')
  }

  const handleDownloadAttachment = async (attachmentUrl: string, originalFilename?: string) => {
    try {
      // 获取有意义的文件名
      const filename = originalFilename || getDisplayFilename(attachmentUrl);
      
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
      render: (value: string | boolean | string[] | AdminCategory | AdminSubcategory | AdminCountry | AdminProvince | AdminDevelopmentZone | AdminCompany | TechnologyAttachment[] | undefined, record: AdminTechnology, index: number) => (
        <div className="flex items-center space-x-2">
          {value ? (
            <div className="relative">
              <img 
                src={value as string} 
                alt={record.name_zh}
                className="w-16 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80"
                onClick={() => handlePreviewImage(value as string)}
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
      render: (value: string | boolean | string[] | AdminCategory | AdminSubcategory | AdminCountry | AdminProvince | AdminDevelopmentZone | AdminCompany | TechnologyAttachment[] | undefined, record: AdminTechnology, index: number) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">{value as string}</div>
          {record.name_en && (
            <div className="text-sm text-gray-500 truncate">{record.name_en}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      title: '分类',
      render: (value: string | boolean | string[] | AdminCategory | AdminSubcategory | AdminCountry | AdminProvince | AdminDevelopmentZone | AdminCompany | TechnologyAttachment[] | undefined, record: AdminTechnology, index: number) => (
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
      key: 'tech_source',
      title: '技术来源',
      render: (value: string | boolean | string[] | AdminCategory | AdminSubcategory | AdminCountry | AdminProvince | AdminDevelopmentZone | AdminCompany | TechnologyAttachment[] | undefined, record: AdminTechnology, index: number) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          {getTechSourceLabel(value as string)}
        </span>
      )
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
                    const filename = attachment.filename || getDisplayFilename(attachment.url);
                    const shortName = filename.length > 15 ? filename.substring(0, 15) + '...' : filename;
                    return (
                      <button
                        key={index}
                        onClick={() => handleDownloadAttachment(attachment.url, attachment.filename)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline truncate max-w-24"
                        title={filename}
                      >
                        {shortName}
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
          <div className="space-y-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              getReviewStatusBadge(status)
            }`}>
              {getReviewStatusLabel(status)}
            </span>
            {status === 'rejected' && record.reject_reason && (
              <div className="text-xs text-red-600 max-w-32 truncate" title={record.reject_reason}>
                {record.reject_reason}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'is_active',
      title: '启用状态',
      width: '80px',
      render: (value: string | boolean | string[] | AdminCategory | AdminSubcategory | AdminCountry | AdminProvince | AdminDevelopmentZone | AdminCompany | TechnologyAttachment[] | undefined, record: AdminTechnology, index: number) => (
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
      render: (value: string | boolean | string[] | AdminCategory | AdminSubcategory | AdminCountry | AdminProvince | AdminDevelopmentZone | AdminCompany | TechnologyAttachment[] | undefined, record: AdminTechnology, index: number) => (
        <span className="text-sm text-gray-500">
          {new Date(value as string).toLocaleDateString('zh-CN')}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: '160px',
      render: (_: any, record: AdminTechnology) => {
        const status = record.review_status || 'published'
        const isPendingReview = status === 'pending_review'
        
        return (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleView(record)}
              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
              title="浏览详情"
            >
              <Eye className="w-4 h-4" />
            </button>
            
            {status === 'rejected' && (
              <button
                onClick={() => handleResubmit(record)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="重新提交"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => handleEdit(record)}
              disabled={isPendingReview}
              className={`p-1 rounded ${
                isPendingReview 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title={isPendingReview ? '待审核状态不可编辑' : '编辑'}
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
          <h1 className="text-2xl font-bold text-gray-900">技术发布</h1>
          <p className="text-gray-600 mt-1">发布您的绿色低碳技术和更新技术信息</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          发布新技术
        </button>
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
        onSearch={handleSearch}
        onSort={handleSort}
        searchPlaceholder="搜索技术名称、描述或简介..."
        className="shadow-sm"
      />

      {/* 技术表单弹窗 */}
      {showForm && (
        <UserTechnologyForm
          technology={editingTechnology}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 技术详情浏览弹窗 */}
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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8">
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
                
                <div className="grid grid-cols-1 gap-6">
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
                    <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
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
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {filename}
                                </p>
                                <p className="text-xs text-gray-500">点击下载</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
