'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { AdminCompany, CreateCompanyData, UpdateCompanyData, COMPANY_TYPE_OPTIONS } from '@/lib/types/admin'
// 移除旧的导入，改用API调用
import { LanguageTabs, LanguageField } from '@/components/admin/forms/language-tabs'
import { ImageUpload } from '@/components/admin/forms/image-upload'
import { AdminCountry, AdminProvince, AdminDevelopmentZone } from '@/lib/types/admin'

interface CompanyFormProps {
  company?: AdminCompany | null
  onSuccess: () => void
  onCancel: () => void
}

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    logo_url: '',
    address_zh: '',
    address_en: '',
    company_type: 'private' as const,
    country_id: '',
    province_id: '',
    development_zone_id: '',
    industry_code: '',
    annual_output_value: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    is_active: true
  })
  
  const [countries, setCountries] = useState<AdminCountry[]>([])
  const [provinces, setProvinces] = useState<AdminProvince[]>([])
  const [developmentZones, setDevelopmentZones] = useState<AdminDevelopmentZone[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCountries()
    
    if (company) {
      setFormData({
        name_zh: company.name_zh,
        name_en: company.name_en || '',
        logo_url: company.logo_url || '',
        address_zh: company.address_zh || '',
        address_en: company.address_en || '',
        company_type: company.company_type || 'private',
        country_id: company.country_id || '',
        province_id: company.province_id || '',
        development_zone_id: company.development_zone_id || '',
        industry_code: company.industry_code || '',
        annual_output_value: company.annual_output_value?.toString() || '',
        contact_person: company.contact_person || '',
        contact_phone: company.contact_phone || '',
        contact_email: company.contact_email || '',
        is_active: company.is_active
      })

      // 如果有国家，加载省份
      if (company.country_id) {
        loadProvinces(company.country_id)
      }
      
      // 如果有省份，加载经开区
      if (company.province_id) {
        loadDevelopmentZones(company.province_id)
      }
    }
  }, [company])

  const loadCountries = async () => {
    try {
      const response = await fetch('/api/admin/countries')
      if (response.ok) {
        const data = await response.json()
        // 确保数据是数组格式
        setCountries(Array.isArray(data) ? data : [])
      } else {
        setCountries([])
      }
    } catch (error) {
      console.error('加载国家列表失败:', error)
      setCountries([])
    }
  }

  const loadProvinces = async (countryId: string) => {
    try {
      // 只有选择中国时才加载省份数据
      console.log('🔍 开始加载省份数据，国家ID:', countryId)
      const response = await fetch(`/api/admin/provinces?countryId=${countryId}`)
      console.log('省份API响应状态:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('省份API返回数据:', result)
        // API返回格式是 { success: true, data: [...] }
        const data = result.success ? result.data : []
        console.log('处理后的省份数据:', data)
        setProvinces(Array.isArray(data) ? data : [])
      } else {
        console.log('省份API请求失败')
        setProvinces([])
      }
    } catch (error) {
      console.error('加载省份列表失败:', error)
      setProvinces([])
    }
  }

  const loadDevelopmentZones = async (provinceId: string) => {
    try {
      // 根据省份ID加载经开区数据
      console.log('🔍 开始加载经开区数据，省份ID:', provinceId)
      const response = await fetch(`/api/admin/development-zones?provinceId=${provinceId}`)
      console.log('经开区API响应状态:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('经开区API返回数据:', result)
        // API返回格式是 { success: true, data: [...] }
        const data = result.success ? result.data : []
        console.log('处理后的经开区数据:', data)
        setDevelopmentZones(Array.isArray(data) ? data : [])
      } else {
        console.log('经开区API请求失败')
        setDevelopmentZones([])
      }
    } catch (error) {
      console.error('加载经开区列表失败:', error)
      setDevelopmentZones([])
    }
  }

  const handleCountryChange = (countryId: string) => {
    setFormData(prev => ({
      ...prev,
      country_id: countryId,
      province_id: '',
      development_zone_id: ''
    }))
    setProvinces([])
    setDevelopmentZones([])
    
    // 只有选择中国时才加载省份数据
    if (countryId && Array.isArray(countries)) {
      const selectedCountry = countries.find(c => c.id === countryId)
      if (selectedCountry && selectedCountry.code === 'china') {
        loadProvinces(countryId)
      }
    }
  }

  const handleProvinceChange = (provinceId: string) => {
    setFormData(prev => ({
      ...prev,
      province_id: provinceId,
      development_zone_id: ''
    }))
    setDevelopmentZones([])
    
    if (provinceId) {
      loadDevelopmentZones(provinceId)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 验证企业名称
    if (!formData.name_zh.trim()) {
      newErrors.name_zh = '企业中文名称不能为空'
    }

    // 验证联系电话格式
    if (formData.contact_phone && !/^1[3-9]\d{9}$/.test(formData.contact_phone)) {
      newErrors.contact_phone = '请输入正确的手机号码'
    }

    // 验证邮箱格式
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = '请输入正确的邮箱地址'
    }

    // 验证年产值
    if (formData.annual_output_value && isNaN(Number(formData.annual_output_value))) {
      newErrors.annual_output_value = '年产值必须为数字'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    const isValid = validateForm()
    if (!isValid) return

    try {
      setIsSubmitting(true)

      const submitData = {
        name_zh: formData.name_zh.trim(),
        name_en: formData.name_en.trim() || undefined,
        logo_url: formData.logo_url || undefined,
        address_zh: formData.address_zh.trim() || undefined,
        address_en: formData.address_en.trim() || undefined,
        company_type: formData.company_type,
        country_id: formData.country_id || undefined,
        province_id: formData.province_id || undefined,
        development_zone_id: formData.development_zone_id === 'none' ? undefined : (formData.development_zone_id || undefined),
        industry_code: formData.industry_code.trim() || undefined,
        annual_output_value: formData.annual_output_value ? Number(formData.annual_output_value) : undefined,
        contact_person: formData.contact_person.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        contact_email: formData.contact_email.trim() || undefined,
        is_active: formData.is_active
      }

      if (company) {
        // 更新企业
        const response = await fetch(`/api/admin/companies/${company.id}`, {
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
        // 创建企业
        const response = await fetch('/api/admin/companies', {
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
      }

      onSuccess()
    } catch (error) {
      console.error('保存企业失败:', error)
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
            {company ? '编辑企业' : '新增企业'}
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
              {/* Logo上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企业Logo
                </label>
                <ImageUpload
                  value={formData.logo_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                  placeholder="上传企业Logo"
                  maxSize={2}
                />
              </div>

              {/* 企业名称 */}
              <div className="lg:col-span-2">
                <LanguageTabs>
                  {(language) => (
                    <LanguageField
                      label={language === 'zh' ? '企业中文名称' : '企业英文名称'}
                      value={language === 'zh' ? formData.name_zh : formData.name_en}
                      onChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        [language === 'zh' ? 'name_zh' : 'name_en']: value 
                      }))}
                      placeholder={language === 'zh' ? '例如：绿色科技有限公司' : 'e.g. Green Technology Co., Ltd.'}
                      required={language === 'zh'}
                      error={language === 'zh' ? errors.name_zh : undefined}
                    />
                  )}
                </LanguageTabs>
              </div>
            </div>
          </div>

          {/* 企业性质和地理位置 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">企业性质与地理位置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 企业性质 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业性质
                </label>
                <select
                  value={formData.company_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {COMPANY_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label_zh}
                    </option>
                  ))}
                </select>
              </div>

              {/* 国别 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  国别
                </label>
                <select
                  value={formData.country_id}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">请选择国别</option>
                  {Array.isArray(countries) && countries.map(country => (
                    <option key={country.id} value={country.id}>
                      {country.name_zh}
                    </option>
                  ))}
                </select>
              </div>

              {/* 省份 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  省份
                </label>
                <select
                  value={formData.province_id}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  disabled={!formData.country_id || (Array.isArray(countries) && countries.find(c => c.id === formData.country_id)?.code !== 'china')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    {Array.isArray(countries) && countries.find(c => c.id === formData.country_id)?.code === 'china' ? '请选择省份' : '仅限中国企业选择省份'}
                  </option>
                  {Array.isArray(provinces) && provinces.map(province => (
                    <option key={province.id} value={province.id}>
                      {province.name_zh}
                    </option>
                  ))}
                </select>
              </div>

              {/* 经开区 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  国家级经开区
                </label>
                <select
                  value={formData.development_zone_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, development_zone_id: e.target.value }))}
                  disabled={!formData.province_id || (Array.isArray(countries) && countries.find(c => c.id === formData.country_id)?.code !== 'china')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">请选择经开区</option>
                  <option value="none">不在国家级经开区内</option>
                  {Array.isArray(developmentZones) && developmentZones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name_zh}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 地址信息 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">地址信息</h3>
            
            <LanguageTabs>
              {(language) => (
                <LanguageField
                  label={language === 'zh' ? '中文地址' : '英文地址'}
                  value={language === 'zh' ? formData.address_zh : formData.address_en}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    [language === 'zh' ? 'address_zh' : 'address_en']: value 
                  }))}
                  placeholder={language === 'zh' ? '例如：北京市朝阳区某某街道123号' : 'e.g. No.123, XX Street, Chaoyang District, Beijing'}
                  type="textarea"
                  rows={2}
                />
              )}
            </LanguageTabs>
          </div>

          {/* 企业详情 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">企业详情</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  行业代码
                </label>
                <input
                  type="text"
                  value={formData.industry_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：C38"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工业总产值（亿元）
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.annual_output_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, annual_output_value: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.annual_output_value ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例如：15.6"
                />
                {errors.annual_output_value && (
                  <p className="text-red-500 text-sm mt-1">{errors.annual_output_value}</p>
                )}
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">联系信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系人
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：张三"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.contact_phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例如：13800138000"
                />
                {errors.contact_phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系邮箱
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.contact_email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例如：contact@company.com"
                />
                {errors.contact_email && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
                )}
              </div>
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