'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { AdminProvince } from '@/lib/types/admin'
import { createMockProvince, updateMockProvince } from '@/lib/supabase/admin-locations-mock'
import { createProvinceApi, updateProvinceApi } from '@/lib/api/admin-provinces'

interface ProvinceFormProps {
  province?: AdminProvince | null
  onSuccess: () => void
  onCancel: () => void
  isUsingMockData: boolean
}

export function ProvinceForm({ province, onSuccess, onCancel, isUsingMockData }: ProvinceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name_zh: province?.name_zh || '',
    name_en: province?.name_en || '',
    code: province?.code || '',
    sort_order: province?.sort_order || 0,
    is_active: province?.is_active ?? true
  })

  // 中国ID常量 - 使用从脚本中获得的实际ID
  const CHINA_ID = 'f60beb71-056e-4878-8d9d-655a11c03eaa'

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
      alert('请填写省份代码')
      return
    }
    
    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        country_id: CHINA_ID
      }
      
      if (province) {
        // 更新省份
        if (isUsingMockData) {
          await updateMockProvince(province.id, formData)
        } else {
          await updateProvinceApi(province.id, formData)
        }
        alert('省份更新成功')
      } else {
        // 创建新省份
        if (isUsingMockData) {
          await createMockProvince(submitData)
        } else {
          await createProvinceApi(submitData)
        }
        alert('省份创建成功')
      }
      
      onSuccess()
    } catch (error) {
      console.error('保存省份失败:', error)
      alert(`保存省份失败: ${error instanceof Error ? error.message : '未知错误'}`)
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {province ? '编辑省份' : '新增省份'}
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
              💡 此处管理中国的省份、直辖市、自治区和特别行政区信息
            </p>
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

          {/* 省份代码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              省份代码 *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value.toLowerCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="请输入省份代码（如：beijing, shanghai, guangdong）"
              pattern="^[a-z0-9-]+$"
              title="只能包含小写字母、数字和连字符"
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
              禁用后该省份将不会在前端显示
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
              {isSubmitting ? '保存中...' : (province ? '更新' : '创建')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}