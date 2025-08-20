'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { AdminCategory, CreateCategoryData, UpdateCategoryData } from '@/lib/types/admin'
import { createCategoryApi, updateCategoryApi } from '@/lib/api/admin-categories'

interface CategoryFormProps {
  category?: AdminCategory | null
  onSuccess: () => void
  onCancel: () => void
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    slug: '',
    sort_order: 0,
    is_active: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category) {
      setFormData({
        name_zh: category.name_zh,
        name_en: category.name_en,
        slug: category.slug,
        sort_order: category.sort_order,
        is_active: category.is_active
      })
    }
  }, [category])

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[\u4e00-\u9fff]/g, '') // 移除中文字符
      .replace(/[^a-z0-9]+/g, '-')    // 非字母数字字符替换为连字符
      .replace(/^-+|-+$/g, '')        // 移除首尾连字符
  }

  const handleNameZhChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name_zh: value,
      // 如果是新建且slug为空，自动生成slug
      slug: !category && !prev.slug ? generateSlug(value) : prev.slug
    }))
    // 清除相关错误
    if (errors.name_zh) {
      setErrors(prev => ({ ...prev, name_zh: '' }))
    }
  }

  const handleSlugChange = (value: string) => {
    const slug = generateSlug(value)
    setFormData(prev => ({ ...prev, slug }))
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }))
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    // 验证中文名称
    if (!formData.name_zh.trim()) {
      newErrors.name_zh = '中文名称不能为空'
    }

    // 验证英文名称
    if (!formData.name_en.trim()) {
      newErrors.name_en = '英文名称不能为空'
    }

    // 验证slug
    if (!formData.slug.trim()) {
      newErrors.slug = '标识符不能为空'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = '标识符只能包含小写字母、数字和连字符'
    }

    // 验证排序
    if (formData.sort_order < 0) {
      newErrors.sort_order = '排序值不能为负数'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    const isValid = await validateForm()
    if (!isValid) return

    try {
      setIsSubmitting(true)

      if (category) {
        // 更新
        const updateData = {
          name_zh: formData.name_zh.trim(),
          name_en: formData.name_en.trim(),
          slug: formData.slug.trim(),
          sort_order: formData.sort_order,
          is_active: formData.is_active
        }
        await updateCategoryApi(category.id, updateData)
      } else {
        // 创建
        const createData: CreateCategoryData = {
          name_zh: formData.name_zh.trim(),
          name_en: formData.name_en.trim(),
          slug: formData.slug.trim(),
          sort_order: formData.sort_order,
          is_active: formData.is_active
        }
        await createCategoryApi(createData)
      }

      onSuccess()
    } catch (error) {
      console.error('保存分类失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {category ? '编辑分类' : '新增分类'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 中文名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              中文名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name_zh}
              onChange={(e) => handleNameZhChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.name_zh ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="例如：节能环保技术"
            />
            {errors.name_zh && (
              <p className="text-red-500 text-sm mt-1">{errors.name_zh}</p>
            )}
          </div>

          {/* 英文名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              英文名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.name_en ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="例如：Energy Saving Technology"
            />
            {errors.name_en && (
              <p className="text-red-500 text-sm mt-1">{errors.name_en}</p>
            )}
          </div>

          {/* 标识符 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标识符 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.slug ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="例如：energy-saving"
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              只能包含小写字母、数字和连字符，用于URL和API
            </p>
          </div>

          {/* 排序 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              排序值
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.sort_order ? 'border-red-300' : 'border-gray-300'
              }`}
              min="0"
            />
            {errors.sort_order && (
              <p className="text-red-500 text-sm mt-1">{errors.sort_order}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              数值越小排序越靠前
            </p>
          </div>

          {/* 状态 */}
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

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 pt-4">
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