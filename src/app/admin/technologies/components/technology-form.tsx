'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { AdminTechnology, TECH_SOURCE_OPTIONS, TECH_ACQUISITION_METHOD_OPTIONS, AdminCategory, AdminSubcategory, AdminCompany, AdminCountry, AdminProvince, AdminDevelopmentZone, TechSource, TechAcquisitionMethod, TechnologyAttachment } from '@/lib/types/admin'
import { LanguageTabs, LanguageField } from '@/components/admin/forms/language-tabs'
import { ImageUpload } from '@/components/admin/forms/image-upload'
import { uploadMultipleFilesWithInfo } from '@/lib/supabase-storage'
import { isAllowedTechAttachment, allowedAttachmentHint } from '@/lib/validators'
import { getCountries } from '@/lib/supabase/admin-locations'
import { generateCompanyLogo } from '@/lib/logoGenerator'
import { FileText, Trash2, Upload } from 'lucide-react'

interface TechnologyFormProps {
  technology?: AdminTechnology | null
  onSuccess: () => void
  onCancel: () => void
}

export function TechnologyForm({ technology, onSuccess, onCancel }: TechnologyFormProps) {
  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    description_zh: '',
    description_en: '',
    image_url: '',
    website_url: '',
    tech_source: 'self_developed' as TechSource,
    acquisition_method: '' as TechAcquisitionMethod,
    category_id: '',
    subcategory_id: '',
    custom_label: '', // 自定义标签
    attachment_urls: [] as string[], // 技术资料（为了向后兼容）
    attachments: [] as TechnologyAttachment[], // 新的附件结构
    is_active: true,
    
    // 企业关联信息
    company_id: '',
    company_name_zh: '',
    company_name_en: '',
    company_logo_url: '',
    company_country_id: '',
    company_province_id: '',
    company_development_zone_id: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // 分类数据状态
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  
  // 企业相关数据状态
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [countries, setCountries] = useState<AdminCountry[]>([])
  const [provinces, setProvinces] = useState<AdminProvince[]>([])
  const [developmentZones, setDevelopmentZones] = useState<AdminDevelopmentZone[]>([])
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)

  // 生成企业logo预览
  const generateLogoPreview = async (companyName: string) => {
    if (companyName.length < 2) {
      setLogoPreview(null)
      return
    }
    
    try {
      const logoDataUrl = await generateCompanyLogo({
        companyName,
        size: 128, // 预览时使用较小尺寸
      })
      setLogoPreview(logoDataUrl)
      console.log('✅ 技术表单-生成企业logo预览成功')
    } catch (error) {
      console.error('❌ 技术表单-生成企业logo预览失败:', error)
      setLogoPreview(null)
    }
  }

  // 加载分类数据
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        // API直接返回数组，不需要提取data字段
        setCategories(Array.isArray(data) ? data : [])
        console.log('✅ 加载分类数据成功:', data)
      } else {
        console.error('❌ 加载分类数据失败:', response.status)
      }
    } catch (error) {
      console.error('加载分类数据失败:', error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // 加载子分类数据
  const loadSubcategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }
    
    try {
      const response = await fetch(`/api/admin/subcategories?category_id=${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        // API直接返回数组，不需要提取data字段
        setSubcategories(Array.isArray(data) ? data : [])
        console.log('✅ 加载子分类数据成功:', data)
      } else {
        console.error('❌ 加载子分类数据失败:', response.status)
        setSubcategories([])
      }
    } catch (error) {
      console.error('加载子分类数据失败:', error)
      setSubcategories([])
    }
  }

  // 加载企业数据
  const loadCompanies = async () => {
    try {
      setIsLoadingCompanies(true)
      const response = await fetch('/api/admin/companies')
      if (response.ok) {
        const result = await response.json()
        setCompanies(result.data || [])
        console.log('✅ 加载企业数据成功:', result.data)
      } else {
        console.error('❌ 加载企业数据失败:', response.status)
      }
    } catch (error) {
      console.error('加载企业数据失败:', error)
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  // 加载国家数据
  const loadCountries = async () => {
    try {
      const countriesData = await getCountries()
      setCountries(countriesData)
      console.log('✅ 技术表单-加载国家数据成功:', countriesData.length, '个国家（包含中国）')
    } catch (error) {
      console.error('❌ 技术表单-加载国家数据失败:', error)
      setCountries([])
    }
  }

  // 加载省份数据
  const loadProvinces = async (countryId: string) => {
    if (!countryId) {
      setProvinces([])
      return
    }
    
    try {
      // 使用与企业管理表单相同的参数名和响应处理逻辑
      console.log('🔍 技术表单-开始加载省份数据，国家ID:', countryId)
      const response = await fetch(`/api/admin/provinces?countryId=${countryId}`)
      console.log('技术表单-省份API响应状态:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('技术表单-省份API返回数据:', result)
        // API返回格式是 { success: true, data: [...] }
        const data = result.success ? result.data : []
        console.log('技术表单-处理后的省份数据:', data)
        setProvinces(Array.isArray(data) ? data : [])
      } else {
        console.log('技术表单-省份API请求失败')
        setProvinces([])
      }
    } catch (error) {
      console.error('技术表单-加载省份数据失败:', error)
      setProvinces([])
    }
  }

  // 加载开发区数据
  const loadDevelopmentZones = async (provinceId: string) => {
    if (!provinceId) {
      setDevelopmentZones([])
      return
    }
    
    try {
      // 使用与企业管理表单相同的参数名和响应处理逻辑
      console.log('🔍 技术表单-开始加载经开区数据，省份ID:', provinceId)
      const response = await fetch(`/api/admin/development-zones?provinceId=${provinceId}`)
      console.log('技术表单-经开区API响应状态:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('技术表单-经开区API返回数据:', result)
        // API返回格式是 { success: true, data: [...] }
        const data = result.success ? result.data : []
        console.log('技术表单-处理后的经开区数据:', data)
        setDevelopmentZones(Array.isArray(data) ? data : [])
      } else {
        console.log('技术表单-经开区API请求失败')
        setDevelopmentZones([])
      }
    } catch (error) {
      console.error('技术表单-加载经开区数据失败:', error)
      setDevelopmentZones([])
    }
  }

  useEffect(() => {
    loadCategories()
    loadCompanies()
    loadCountries()
  }, [])

  useEffect(() => {
    if (technology) {
      setFormData({
        name_zh: technology.name_zh,
        name_en: technology.name_en || '',
        description_zh: technology.description_zh || '',
        description_en: technology.description_en || '',
        image_url: technology.image_url || '',
        website_url: technology.website_url || '',
        tech_source: technology.tech_source || 'self_developed',
        acquisition_method: (technology.acquisition_method || '') as TechAcquisitionMethod,
        category_id: technology.category_id || '',
        subcategory_id: technology.subcategory_id || '',
        custom_label: technology.custom_label || '',
        attachment_urls: technology.attachment_urls || [],
        attachments: technology.attachments || [],
        is_active: technology.is_active,
        
        // 企业关联信息
        company_id: technology.company_id || '',
        company_name_zh: technology.company_name_zh || '',
        company_name_en: technology.company_name_en || '',
        company_logo_url: technology.company_logo_url || '',
        company_country_id: technology.company_country_id || '',
        company_province_id: technology.company_province_id || '',
        company_development_zone_id: technology.company_development_zone_id || ''
      })
      
      // 如果编辑时有分类ID，加载对应的子分类
      if (technology.category_id) {
        loadSubcategories(technology.category_id)
      }
      
      // 如果编辑时有企业国家ID，加载对应的省份
      if (technology.company_country_id) {
        loadProvinces(technology.company_country_id)
      }
      
      // 如果编辑时有企业省份ID，加载对应的开发区
      if (technology.company_province_id) {
        loadDevelopmentZones(technology.company_province_id)
      }
    }
  }, [technology])

  // 处理主分类变化
  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category_id: categoryId, subcategory_id: '' }))
    loadSubcategories(categoryId)
  }

  // 处理企业选择变化
  const handleCompanyChange = (companyId: string) => {
    const selectedCompany = companies.find(c => c.id === companyId)
    if (selectedCompany) {
      setFormData(prev => ({
        ...prev,
        company_id: companyId,
        company_name_zh: selectedCompany.name_zh,
        company_name_en: selectedCompany.name_en || '',
        company_logo_url: selectedCompany.logo_url || '',
        company_country_id: selectedCompany.country_id || '',
        company_province_id: selectedCompany.province_id || '',
        company_development_zone_id: selectedCompany.development_zone_id || ''
      }))
      
      // 选择已有企业时清除logo预览，因为使用企业现有logo
      setLogoPreview(null)
      
      // 检查企业是否在中国，只有中国企业才加载省份和开发区
      const companyCountry = countries.find(c => c.id === selectedCompany.country_id)
      const isChinaCompany = companyCountry?.code === 'china'
      
      if (isChinaCompany) {
        // 加载对应的省份和开发区
        if (selectedCompany.country_id) {
          loadProvinces(selectedCompany.country_id)
        }
        if (selectedCompany.province_id) {
          loadDevelopmentZones(selectedCompany.province_id)
        }
      } else {
        // 非中国企业，清空省份和开发区数据
        setProvinces([])
        setDevelopmentZones([])
      }
    } else {
      // 如果是手动填写模式，清空企业关联数据
      setFormData(prev => ({
        ...prev,
        company_id: '',
        company_name_zh: '',
        company_name_en: '',
        company_logo_url: '',
        company_country_id: '',
        company_province_id: '',
        company_development_zone_id: ''
      }))
      setProvinces([])
      setDevelopmentZones([])
      setLogoPreview(null)
    }
  }

  // 处理国家变化
  const handleCountryChange = (countryId: string) => {
    const selectedCountry = countries.find(c => c.id === countryId)
    const isChinaSelected = selectedCountry?.code === 'china'
    
    setFormData(prev => ({
      ...prev,
      company_country_id: countryId,
      company_province_id: '',
      company_development_zone_id: ''
    }))
    
    // 只有选择中国时才加载省份数据
    if (isChinaSelected) {
      loadProvinces(countryId)
    } else {
      setProvinces([])
    }
    setDevelopmentZones([])
  }

  // 处理省份变化
  const handleProvinceChange = (provinceId: string) => {
    setFormData(prev => ({
      ...prev,
      company_province_id: provinceId,
      company_development_zone_id: ''
    }))
    loadDevelopmentZones(provinceId)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name_zh.trim()) {
      newErrors.name_zh = '技术中文名称不能为空'
    }

    // 子分类必填
    if (!formData.subcategory_id) {
      newErrors.subcategory_id = '技术子分类不能为空'
    }

    if (formData.description_zh && formData.description_zh.length > 2000) {
      newErrors.description_zh = '技术介绍不能超过2000字'
    }

    if (formData.description_en && formData.description_en.length > 2000) {
      newErrors.description_en = '技术介绍不能超过2000字'
    }

    if (formData.website_url) {
      // Accept scheme-less domains like "www.example.com" by using a relaxed regex
      const url = formData.website_url.trim()
      const relaxed = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}([\/:?#].*)?$/i
      if (!relaxed.test(url)) {
        newErrors.website_url = '请输入有效的网址链接'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理附件上传
  const handleAttachmentUpload = async (files: File[]) => {
    try {
      // 限制最多5个附件
      const currentAttachments = formData.attachments || []
      const remainingSlots = 5 - currentAttachments.length
      
      if (files.length > remainingSlots) {
        alert(`最多只能上传${remainingSlots}个附件（当前已有${currentAttachments.length}个）`)
        return
      }

      // 类型校验
      const invalid = files.find(f => !isAllowedTechAttachment(f))
      if (invalid) {
        alert(`文件类型不允许：${invalid.name}\n${allowedAttachmentHint('zh')}`)
        return
      }

      // 使用新的上传函数，返回包含原始文件名的附件信息
      const newAttachments = await uploadMultipleFilesWithInfo(files, 'images', 'technology-attachments')
      const updatedAttachments = [...currentAttachments, ...newAttachments]
      setFormData(prev => ({ ...prev, attachments: updatedAttachments }))
    } catch (error) {
      console.error('附件上传失败:', error)
      alert(`附件上传失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 删除附件
  const removeAttachment = (index: number) => {
    const currentAttachments = formData.attachments || []
    const newAttachments = currentAttachments.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, attachments: newAttachments }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    const isValid = validateForm()
    if (!isValid) return

    try {
      setIsSubmitting(true)
      // 注意：企业logo自动生成现在在后端处理，无需前端处理

      // Normalize website URL (auto-prefix https if scheme missing)
      const normalizedWebsite = formData.website_url?.trim()
        ? (/^https?:\/\//i.test(formData.website_url.trim())
            ? formData.website_url.trim()
            : `https://${formData.website_url.trim()}`)
        : undefined

      const submitData = {
        name_zh: formData.name_zh.trim(),
        name_en: formData.name_en.trim() || undefined,
        description_zh: formData.description_zh.trim() || undefined,
        description_en: formData.description_en.trim() || undefined,
        image_url: formData.image_url || undefined,
        website_url: normalizedWebsite,
        tech_source: formData.tech_source,
        acquisition_method: formData.acquisition_method || undefined,
        category_id: formData.category_id || undefined,
        subcategory_id: formData.subcategory_id || undefined,
        custom_label: formData.custom_label.trim() || undefined,
        attachment_urls: formData.attachment_urls.length > 0 ? formData.attachment_urls : undefined,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
        is_active: formData.is_active,
        
        // 企业关联信息
        company_id: formData.company_id || undefined,
        company_name_zh: formData.company_name_zh.trim() || undefined,
        company_name_en: formData.company_name_en.trim() || undefined,
        company_logo_url: formData.company_logo_url || undefined,
        company_country_id: formData.company_country_id || undefined,
        company_province_id: formData.company_province_id || undefined,
        company_development_zone_id: (formData.company_development_zone_id === 'none')
          ? undefined
          : (formData.company_development_zone_id || undefined)
      }

      if (technology) {
        // 更新技术
        const response = await fetch(`/api/admin/technologies/${technology.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '更新失败')
        }
      } else {
        // 创建技术
        const response = await fetch('/api/admin/technologies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '创建失败')
        }
        
        // 处理成功响应，检查是否创建了新企业
        const responseData = await response.json()
        console.log('技术创建响应:', responseData)
        
        if (responseData.company_created) {
          alert(`✅ 技术创建成功！\n🏢 同时已创建新企业："${formData.company_name_zh}"，可在企业管理中查看。`)
        }
      }

      onSuccess()
    } catch (error) {
      console.error('保存技术失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {technology ? '编辑技术' : '新增技术'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 技术图片 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  技术图片
                </label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  placeholder="上传技术图片"
                  maxSize={2}
                />
              </div>

              {/* 技术名称 */}
              <div className="lg:col-span-2">
                <LanguageTabs>
                  {(language) => (
                    <LanguageField
                      label={language === 'zh' ? '技术中文名称' : '技术英文名称'}
                      value={language === 'zh' ? formData.name_zh : formData.name_en}
                      onChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        [language === 'zh' ? 'name_zh' : 'name_en']: value 
                      }))}
                      placeholder={language === 'zh' ? '例如：太阳能光伏技术' : 'e.g. Solar Photovoltaic Technology'}
                      required={language === 'zh'}
                      error={language === 'zh' ? errors.name_zh : undefined}
                    />
                  )}
                </LanguageTabs>
              </div>
            </div>
          </div>

          {/* 技术描述 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">技术描述</h3>
            
            <LanguageTabs>
              {(language) => (
                <LanguageField
                  label={language === 'zh' ? '中文描述' : '英文描述'}
                  value={language === 'zh' ? formData.description_zh : formData.description_en}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    [language === 'zh' ? 'description_zh' : 'description_en']: value 
                  }))}
                  placeholder={language === 'zh' ? '详细描述技术特点、应用场景等（限500字）' : 'Detailed description of technology features, applications, etc. (max 500 characters)'}
                  type="textarea"
                  rows={4}
                  error={language === 'zh' ? errors.description_zh : errors.description_en}
                />
              )}
            </LanguageTabs>
          </div>

          {/* 技术来源和分类 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">技术来源与分类</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  技术来源
                </label>
                <select
                  value={formData.tech_source}
                  onChange={(e) => setFormData(prev => ({ ...prev, tech_source: e.target.value as TechSource }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {TECH_SOURCE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label_zh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  技术获取方式 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.acquisition_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquisition_method: e.target.value as TechAcquisitionMethod }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择技术获取方式</option>
                  {TECH_ACQUISITION_METHOD_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label_zh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  技术类型（主分类）
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={isLoadingCategories}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">请选择主分类</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name_zh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  技术类型（子分类） <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subcategory_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory_id: e.target.value }))}
                  disabled={!formData.category_id}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 ${
                    errors.subcategory_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">请选择子分类</option>
                  {subcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name_zh}
                    </option>
                  ))}
                </select>
                {errors.subcategory_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.subcategory_id}</p>
                )}
              </div>
            </div>
            
          {/* 自定义标签 */}
          <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自定义标签（可选）
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.custom_label}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 20) {
                      setFormData(prev => ({ ...prev, custom_label: value }))
                    }
                  }}
                  placeholder="输入自定义标签，如：节能环保、智能制造..."
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-16"
                />
                <div className="absolute right-3 top-2 text-xs text-gray-400">
                  {formData.custom_label.length}/20
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">用于在技术展示页面显示的自定义标签，最多20个字符</p>
            </div>
          </div>

          {/* 技术网址（可选） */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              技术网址链接（可选）
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              placeholder="https://example.com/tech"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.website_url ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.website_url && (
              <p className="mt-1 text-xs text-red-600">{errors.website_url}</p>
            )}
          </div>

          {/* 企业信息 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">所属企业信息</h3>
            
            {/* 企业选择方式 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                企业关联方式
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择现有企业
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    disabled={isLoadingCompanies}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">选择企业（自动填充企业信息）</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name_zh}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">选择企业会自动填充下方的企业信息</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    或手动填写企业信息
                  </label>
                  <p className="text-xs text-gray-500 py-2">如果选择了上方的企业，下方信息会自动填充。也可以不选择企业直接手动填写。</p>
                </div>
              </div>
            </div>

            {/* 企业基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业中文名称
                </label>
                <input
                  type="text"
                  value={formData.company_name_zh}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, company_name_zh: value }))
                    
                    // 当企业中文名称改变且没有上传logo时，生成预览logo
                    if (value && !formData.company_logo_url) {
                      generateLogoPreview(value)
                    } else {
                      setLogoPreview(null)
                    }
                  }}
                  placeholder="请输入企业中文名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业英文名称
                </label>
                <input
                  type="text"
                  value={formData.company_name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name_en: e.target.value }))}
                  placeholder="请输入企业英文名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业Logo
                </label>
                <ImageUpload
                  value={formData.company_logo_url}
                  onChange={(url) => {
                    setFormData(prev => ({ ...prev, company_logo_url: url }))
                    // 当用户上传logo时，清除预览
                    if (url) {
                      setLogoPreview(null)
                    }
                  }}
                  placeholder="上传企业Logo"
                  maxSize={1}
                />
                
                {/* 显示logo预览 */}
                {!formData.company_logo_url && logoPreview && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">自动生成预览</div>
                    <img 
                      src={logoPreview} 
                      alt="Logo预览" 
                      className="w-16 h-16 rounded border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 企业地区信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  国别
                </label>
                <select
                  value={formData.company_country_id}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">请选择国别</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>
                      {country.name_zh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  省份
                </label>
                <select
                  value={formData.company_province_id}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  disabled={!formData.company_country_id || (Array.isArray(countries) && countries.find(c => c.id === formData.company_country_id)?.code !== 'china')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    {Array.isArray(countries) && countries.find(c => c.id === formData.company_country_id)?.code === 'china' ? '请选择省份' : '仅限中国企业选择省份'}
                  </option>
                  {provinces.map(province => (
                    <option key={province.id} value={province.id}>
                      {province.name_zh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  国家级经开区
                </label>
                <select
                  value={formData.company_development_zone_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_development_zone_id: e.target.value }))}
                  disabled={!formData.company_province_id || (Array.isArray(countries) && countries.find(c => c.id === formData.company_country_id)?.code !== 'china')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    {Array.isArray(countries) && countries.find(c => c.id === formData.company_country_id)?.code === 'china' ? '请选择开发区（可选）' : '仅限中国企业选择经开区'}
                  </option>
                  <option value="none">不在国家级经开区内</option>
                  {developmentZones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name_zh}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 技术资料 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">技术资料</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  技术资料（图片、文档等）
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="text-gray-500 mb-4">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>支持上传图片、PDF、Word、Excel等文档</p>
                    <p className="text-sm mt-1">点击或拖拽文件到此处上传</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                    id="attachment-upload"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        handleAttachmentUpload(files)
                      }
                      // 清空文件输入框
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => document.getElementById('attachment-upload')?.click()}
                  >
                    选择文件
                  </button>
                </div>
              </div>

              {/* 已上传的文件列表 */}
              {formData.attachments && formData.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">已上传的文件（{formData.attachments.length}/5）：</h4>
                  <div className="space-y-2">
                    {formData.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-blue-500 mr-2" />
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700">{attachment.filename}</span>
                            <span className="text-xs text-gray-500">
                              {attachment.size ? (attachment.size / 1024 / 1024).toFixed(2) : '0'} MB
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

          {/* 状态 */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                启用状态
              </label>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
