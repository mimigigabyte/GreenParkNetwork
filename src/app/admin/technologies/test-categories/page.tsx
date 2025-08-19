'use client'

import { useState, useEffect } from 'react'

export default function TestCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // 加载分类数据
  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
        console.log('✅ 分类数据:', data)
      } else {
        console.error('❌ 加载分类失败:', response.status)
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    } finally {
      setLoading(false)
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
        setSubcategories(Array.isArray(data) ? data : [])
        console.log('✅ 子分类数据:', data)
      } else {
        console.error('❌ 加载子分类失败:', response.status)
        setSubcategories([])
      }
    } catch (error) {
      console.error('加载子分类失败:', error)
      setSubcategories([])
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId)
    } else {
      setSubcategories([])
    }
  }, [selectedCategoryId])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">分类数据测试</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">主分类 ({categories.length} 个)</h2>
          <select 
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">请选择主分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name_zh} ({category.name_en})
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">子分类 ({subcategories.length} 个)</h2>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">请选择子分类</option>
            {subcategories.map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name_zh} ({subcategory.name_en})
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">调试信息</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p><strong>选中的分类ID:</strong> {selectedCategoryId || '无'}</p>
            <p><strong>分类数量:</strong> {categories.length}</p>
            <p><strong>子分类数量:</strong> {subcategories.length}</p>
            <p><strong>加载状态:</strong> {loading ? '加载中...' : '完成'}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">分类数据详情</h2>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">主分类:</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(categories, null, 2)}</pre>
          </div>
        </div>

        {subcategories.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">子分类数据详情</h2>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm overflow-auto">{JSON.stringify(subcategories, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
