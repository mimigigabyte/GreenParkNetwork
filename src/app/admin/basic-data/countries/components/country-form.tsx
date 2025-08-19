'use client'

import { useState } from 'react'
import { X, Upload, Globe, Sparkles } from 'lucide-react'
import { AdminCountry } from '@/lib/types/admin'

interface CountryFormProps {
  country?: AdminCountry | null
  onSuccess: () => void
  onCancel: () => void
}

export function CountryForm({ country, onSuccess, onCancel }: CountryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoFetchingFlag, setIsAutoFetchingFlag] = useState(false)
  const [formData, setFormData] = useState({
    name_zh: country?.name_zh || '',
    name_en: country?.name_en || '',
    code: country?.code || '',
    logo_url: country?.logo_url || '',
    sort_order: country?.sort_order || 0,
    is_active: country?.is_active ?? true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 基础验证
    if (!formData.name_zh.trim()) {
      alert('请填写中文名称')
      return
    }
    if (!formData.name_en.trim()) {
      alert('请填写英文名称')
      return
    }
    if (!formData.code.trim()) {
      alert('请填写国家代码')
      return
    }
    
    // 检查是否为中国（不允许添加中国）
    if (formData.code.toLowerCase() === 'china' || formData.code.toLowerCase() === 'cn') {
      alert('中国的信息请在"国内省份/经开区管理"中管理')
      return
    }
    
    setIsSubmitting(true)

    try {
      if (country) {
        // 更新国家
        const response = await fetch(`/api/admin/countries/${country.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '更新失败')
        }

        alert('国家更新成功')
      } else {
        // 创建新国家
        const response = await fetch('/api/admin/countries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '创建失败')
        }

        alert('国家创建成功')
      }
      
      onSuccess()
    } catch (error) {
      console.error('保存国家失败:', error)
      alert(`保存国家失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 自动获取国旗图片
  const handleAutoFetchFlag = async () => {
    if (!formData.code.trim()) {
      alert('请先填写国家代码')
      return
    }

    setIsAutoFetchingFlag(true)
    try {
      // 尝试获取国旗图片
      const flagUrl = `https://flagcdn.com/w320/${formData.code.toLowerCase()}.png`
      
      // 验证URL是否可访问
      const response = await fetch(flagUrl, { method: 'HEAD' })
      if (response.ok) {
        handleInputChange('logo_url', flagUrl)
        alert('国旗图片获取成功')
      } else {
        // 备选方案
        const restCountriesUrl = `https://restcountries.com/v3.1/alpha/${formData.code}?fields=flags`
        const restResponse = await fetch(restCountriesUrl)
        if (restResponse.ok) {
          const data = await restResponse.json()
          const flagImageUrl = data.flags?.png || data.flags?.svg
          if (flagImageUrl) {
            handleInputChange('logo_url', flagImageUrl)
            alert('国旗图片获取成功')
          } else {
            alert('未找到该国家的国旗图片')
          }
        } else {
          alert('未找到该国家的国旗图片')
        }
      }
    } catch (error) {
      console.error('获取国旗失败:', error)
      alert('获取国旗图片失败，请手动输入图片URL')
    } finally {
      setIsAutoFetchingFlag(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 这里应该上传到文件服务器，目前使用URL输入代替
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        handleInputChange('logo_url', dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {country ? '编辑国家' : '新增国家'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 说明提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              💡 此处管理除中国以外的其他国家信息。中国的省份和经开区请在"国内省份/经开区管理"中操作。
            </p>
          </div>

          {/* 国家标志上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              国家标志
            </label>
            <div className="flex items-center space-x-4">
              {/* 标志预览 */}
              <div className="flex-shrink-0">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="国家标志预览"
                    className="w-16 h-12 object-cover rounded border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* 上传按钮 */}
              <div className="flex-1">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleAutoFetchFlag}
                    disabled={isAutoFetchingFlag}
                    className="flex items-center px-3 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {isAutoFetchingFlag ? '获取中...' : '自动获取国旗'}
                    </span>
                  </button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-700">上传图片</span>
                    </div>
                  </label>
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => handleInputChange('logo_url', '')}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      移除
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  支持 JPG、PNG 格式，建议尺寸 2:3 比例，或点击"自动获取国旗"
                </p>
              </div>
            </div>
            
            {/* 或者直接输入URL */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                或输入图片URL
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com/flag.png"
              />
            </div>
          </div>

          {/* 中英文名称 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                中文名称 *
              </label>
              <input
                type="text"
                value={formData.name_zh}
                onChange={(e) => handleInputChange('name_zh', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="请输入中文名称"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                英文名称 *
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => handleInputChange('name_en', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="请输入英文名称"
                required
              />
            </div>
          </div>

          {/* 国家代码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              国家代码 *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toLowerCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="请输入国家代码（如：usa, japan）"
              pattern="^[a-z0-9-]+$"
              title="只能包含小写字母、数字和连字符，不允许添加china"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              用于URL和API调用的唯一标识符，只能包含小写字母、数字和连字符
            </p>
          </div>

          {/* 排序权重 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排序权重
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="数字越小排序越靠前"
              min="0"
            />
          </div>

          {/* 状态 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">启用状态</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              禁用后该国家将不会在前端显示
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '保存中...' : (country ? '更新' : '创建')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}