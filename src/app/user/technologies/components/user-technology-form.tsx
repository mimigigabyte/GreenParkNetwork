'use client'

import { useState, useEffect } from 'react'
import { X, Upload, FileText, Trash2 } from 'lucide-react'
import { AdminTechnology, AdminCategory, AdminSubcategory, TECH_SOURCE_OPTIONS, TechnologyAttachment, TechSource, TechReviewStatus } from '@/lib/types/admin'
import { getPublicCategoriesApi, getPublicSubcategoriesApi } from '@/lib/api/public-categories'
import { createUserTechnologyApi, updateUserTechnologyApi } from '@/lib/api/user-technologies'
import { CompactImageUpload } from '@/components/ui/compact-image-upload'
import { LanguageTabs, LanguageField } from '@/components/admin/forms/language-tabs'
import { uploadMultipleFilesWithInfo, FileAttachment } from '@/lib/supabase-storage'
import { useAuthContext } from '@/components/auth/auth-provider'

interface UserTechnologyFormProps {
  technology?: AdminTechnology | null
  onSuccess: () => void
  onCancel: () => void
}

export function UserTechnologyForm({ technology, onSuccess, onCancel }: UserTechnologyFormProps) {
  const { user } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([])
  
  const [formData, setFormData] = useState({
    name_zh: technology?.name_zh || '',
    name_en: technology?.name_en || '',
    description_zh: technology?.description_zh || '',
    description_en: technology?.description_en || '',
    tech_source: (technology?.tech_source || '') as TechSource,
    category_id: technology?.category_id || '',
    subcategory_id: technology?.subcategory_id || '',
    image_url: technology?.image_url || '',
    attachment_urls: technology?.attachment_urls || [],
    attachments: technology?.attachments || [],
    review_status: (technology?.review_status || 'pending_review') as TechReviewStatus
  })

  // 企业信息状态（用于显示，自动填充）
  const [companyInfo, setCompanyInfo] = useState({
    company_id: '',
    company_name_zh: '',
    company_name_en: '',
    company_logo_url: '',
    company_country_id: '',
    company_province_id: '',
    company_development_zone_id: ''
  })

  useEffect(() => {
    loadCategories()
    loadUserCompanyInfo()
    
    // 如果是编辑模式，加载子分类
    if (technology?.category_id) {
      loadSubcategories(technology.category_id)
    }
  }, [technology])

  const loadUserCompanyInfo = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/user/company?userId=${user.id}`)
      if (response.ok) {
        const company = await response.json()
        setCompanyInfo({
          company_id: company.id || '',
          company_name_zh: company.name_zh || '',
          company_name_en: company.name_en || '',
          company_logo_url: company.logo_url || '',
          company_country_id: company.country_id || '',
          company_province_id: company.province_id || '',
          company_development_zone_id: company.development_zone_id || ''
        })
      }
    } catch (error) {
      console.error('获取用户企业信息失败:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const result = await getPublicCategoriesApi()
      setCategories(result || [])
    } catch (error) {
      console.error('加载分类失败:', error)
      setCategories([])
    }
  }

  const loadSubcategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }
    
    try {
      const result = await getPublicSubcategoriesApi(categoryId)
      setSubcategories(result || [])
    } catch (error) {
      console.error('加载子分类失败:', error)
      setSubcategories([])
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 当分类改变时，重新加载子分类
    if (field === 'category_id') {
      setFormData(prev => ({ ...prev, subcategory_id: '' }))
      loadSubcategories(value)
    }
  }


  const handleAttachmentUpload = async (files: File[]) => {
    if (!files || files.length === 0) return
    
    // 限制最多5个附件
    const currentAttachments = formData.attachments || []
    const remainingSlots = 5 - currentAttachments.length
    
    if (files.length > remainingSlots) {
      alert(`最多只能上传${remainingSlots}个附件（当前已有${currentAttachments.length}个）`)
      return
    }

    // 验证文件大小和类型
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB限制
        alert(`文件 "${file.name}" 超过10MB限制，请选择更小的文件`)
        return
      }
    }

    // 设置上传状态
    setIsUploadingAttachment(true)

    try {
      console.log('开始上传附件:', files)
      
      // 为每个文件单独上传，这样可以更好地跟踪进度和错误
      const newAttachments: FileAttachment[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`正在上传第${i + 1}个文件: ${file.name}`)
        
        try {
          // 使用Promise.race添加超时机制
          const uploadPromise = uploadMultipleFilesWithInfo([file], 'images', 'technology-attachments')
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('上传超时，请检查网络连接')), 30000)
          )
          
          const result = await Promise.race([uploadPromise, timeoutPromise]) as FileAttachment[]
          if (result && result.length > 0) {
            newAttachments.push(result[0])
            console.log(`文件 ${file.name} 上传成功`)
          }
        } catch (fileError) {
          console.error(`文件 ${file.name} 上传失败:`, fileError)
          setIsUploadingAttachment(false)
          const errorMsg = fileError instanceof Error ? fileError.message : '未知错误'
          alert(`❌ 文件 "${file.name}" 上传失败: ${errorMsg}`)
          return
        }
      }
      
      if (newAttachments.length > 0) {
        console.log('所有文件上传完成，新附件:', newAttachments)
        
        // 更新表单数据 - 直接使用setFormData确保更新
        const updatedAttachments = [...currentAttachments, ...newAttachments]
        console.log('准备更新attachments:', updatedAttachments)
        
        setFormData(prev => {
          const newData = { ...prev, attachments: updatedAttachments }
          console.log('直接更新formData - attachments:', newData.attachments)
          return newData
        })
        
        // 同时也调用handleInputChange作为备份
        handleInputChange('attachments', updatedAttachments)
        
        // 成功通知
        const fileNames = files.length === 1 ? `"${files[0].name}"` : `${files.length}个文件`
        alert(`✅ ${fileNames} 上传成功！`)
      }
      
    } catch (error) {
      console.error('附件上传失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`❌ 附件上传失败: ${errorMessage}`)
    } finally {
      // 确保始终重置上传状态
      setIsUploadingAttachment(false)
    }
  }

  const removeAttachment = (index: number) => {
    const currentAttachments = formData.attachments || []
    const newAttachments = currentAttachments.filter((_, i) => i !== index)
    handleInputChange('attachments', newAttachments)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证必填字段
    if (!formData.name_zh.trim()) {
      alert('请填写技术名称')
      return
    }
    
    if (!formData.category_id) {
      alert('请选择技术分类')
      return
    }
    
    if (!formData.tech_source) {
      alert('请选择技术来源')
      return
    }

    setIsLoading(true)
    
    try {
      // 合并用户企业信息到技术数据
      const technologyData = {
        ...formData,
        // 企业关联信息（自动填充）
        ...companyInfo,
        // 添加用户ID用于创建者跟踪
        userId: user?.id,
        // 用户创建的技术默认启用
        is_active: true
      }
      
      if (technology?.id) {
        // 检查是否是已发布的技术
        const isPublishedTech = technology.review_status === 'published';
        
        if (isPublishedTech) {
          // 已发布的技术修改后需要重新审核
          technologyData.review_status = 'pending_review';
          await updateUserTechnologyApi(technology.id, technologyData);
          alert('您的技术修改申请已提交，我们正在对其进行审核，结果将在3-5个工作日内通过站内信、短信、邮件的形式通知您。技术将暂时从首页移除，审核通过后重新展示。');
        } else {
          // 其他状态的技术正常更新
          await updateUserTechnologyApi(technology.id, technologyData);
          alert('技术更新成功');
        }
      } else {
        await createUserTechnologyApi(technologyData)
        alert('您的技术发布申请已提交，我们正在对其进行审核，结果将在3-5个工作日内通过站内信、短信、邮件的形式通知您')
      }
      
      onSuccess()
    } catch (error) {
      console.error('保存技术失败:', error)
      alert(`保存技术失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 表单头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {technology ? '编辑技术' : '新增技术'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={(e) => { e.preventDefault(); }} className="p-6 space-y-8">
            
            {/* 第一部分：基本信息 */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左列 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      技术中文名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name_zh}
                      onChange={(e) => handleInputChange('name_zh', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="请输入技术名称"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      技术英文名称 <span className="text-gray-400 text-xs">（可选）</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) => handleInputChange('name_en', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="请输入英文名称"
                    />
                  </div>
                </div>

                {/* 右列 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    技术图片 <span className="text-gray-400 text-xs">（可选，用于封面宣传展示）</span>
                  </label>
                  <CompactImageUpload
                    value={formData.image_url}
                    onChange={(url) => handleInputChange('image_url', url)}
                    maxSize={5}
                    bucket="images"
                    folder="technologies"
                  />
                </div>
              </div>
            </div>

            {/* 第二部分：技术来源与分类 */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <h3 className="text-lg font-medium text-gray-900">技术来源与分类</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    技术分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">请选择技术分类</option>
                    {categories && categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name_zh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    技术子分类
                  </label>
                  <select
                    value={formData.subcategory_id}
                    onChange={(e) => handleInputChange('subcategory_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={!formData.category_id}
                  >
                    <option value="">请选择技术子分类</option>
                    {subcategories && subcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name_zh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    技术来源 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tech_source}
                    onChange={(e) => handleInputChange('tech_source', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">请选择技术来源</option>
                    {TECH_SOURCE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label_zh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 第三部分：技术简介与附件 */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="text-lg font-medium text-gray-900">技术简介与附件</h3>
              </div>
              
              {/* 技术描述 - 使用语言切换标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  技术描述
                </label>
                <LanguageTabs>
                  {(language) => (
                    <LanguageField
                      label={language === 'zh' ? '中文描述' : 'English Description'}
                      value={language === 'zh' ? formData.description_zh : formData.description_en}
                      onChange={(value) => handleInputChange(
                        language === 'zh' ? 'description_zh' : 'description_en',
                        value
                      )}
                      placeholder={language === 'zh' ? '请输入技术的中文描述' : 'Please enter the English description of the technology'}
                      type="textarea"
                      rows={4}
                    />
                  )}
                </LanguageTabs>
              </div>

              {/* 技术资料 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  技术资料
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isUploadingAttachment ? 'border-green-400 bg-green-50' : 'border-gray-300'
                }`}>
                  <div className="text-center">
                    <div className="text-gray-500 mb-4">
                      {isUploadingAttachment ? (
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-green-600 font-medium">正在上传附件...</p>
                          <p className="text-sm text-gray-500 mt-1">请稍候，文件正在上传中</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>支持上传图片、PDF、Word、Excel等文档</p>
                          <p className="text-sm mt-1">点击或拖拽文件到此处上传（单个文件不超过10MB）</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleAttachmentUpload(Array.from(e.target.files))
                          // 清空文件输入框，允许重复选择相同文件
                          e.target.value = ''
                        }
                      }}
                      className="hidden"
                      id="attachment-upload"
                      disabled={isUploadingAttachment}
                    />
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('attachment-upload')?.click()}
                        disabled={isUploadingAttachment}
                        className={`px-4 py-2 text-white rounded-lg transition-colors ${
                          isUploadingAttachment 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isUploadingAttachment ? '上传中...' : '选择文件'}
                      </button>
                      {isUploadingAttachment && (
                        <button
                          type="button"
                          onClick={() => setIsUploadingAttachment(false)}
                          className="px-3 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm"
                          title="如果上传卡住，点击此按钮重置状态"
                        >
                          取消上传
                        </button>
                      )}
                    </div>
                  </div>
                  
                  
                  {/* 已上传附件列表 */}
                  {formData.attachments && formData.attachments.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">已上传的文件（{formData.attachments.length}/5）：</h4>
                      <div className="space-y-2">
                        {formData.attachments.map((attachment, index) => (
                          <div key={`${attachment.url}-${attachment.filename}-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-blue-500 mr-2" />
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-700">{attachment.filename}</span>
                                <span className="text-xs text-gray-500">
                                  {attachment.size ? (attachment.size / 1024 / 1024).toFixed(2) + ' MB' : '未知大小'}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="删除附件"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* 表单底部 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || isUploadingAttachment}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '保存中...' : isUploadingAttachment ? '文件上传中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}