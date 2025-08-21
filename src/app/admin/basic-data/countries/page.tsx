'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Globe } from 'lucide-react'
import { AdminCountry } from '@/lib/types/admin'
// 不再需要导入模拟数据相关的函数
import { CountryForm } from './components/country-form'

export default function CountriesPage() {
  const [countries, setCountries] = useState<AdminCountry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 表单状态
  const [showCountryForm, setShowCountryForm] = useState(false)
  const [editingCountry, setEditingCountry] = useState<AdminCountry | null>(null)

  useEffect(() => {
    loadCountries()
  }, [])

  const loadCountries = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/countries')
      if (!response.ok) {
        throw new Error('获取国家数据失败')
      }
      
      const result = await response.json()
      console.log('📊 国别API返回的数据:', result)
      
      // 处理API返回格式 {success: true, data: [...]} 或直接数组
      const data = result.data || result
      
      if (!Array.isArray(data)) {
        console.error('❌ 国别数据不是数组格式:', data)
        throw new Error('国别数据格式错误')
      }
      
      // 过滤掉中国，国别管理只管理其他国家
      const filteredData = data.filter((country: AdminCountry) => country.code !== 'china')
      setCountries(filteredData)
      console.log('✅ 从数据库加载国家数据成功:', filteredData.length, '个国家')
      
    } catch (error) {
      console.error('加载国家数据失败:', error)
      setError(error instanceof Error ? error.message : '加载国家数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCountry = () => {
    setEditingCountry(null)
    setShowCountryForm(true)
  }

  const handleEditCountry = (country: AdminCountry) => {
    setEditingCountry(country)
    setShowCountryForm(true)
  }

  const handleDeleteCountry = async (country: AdminCountry) => {
    if (!confirm(`确定要删除国家"${country.name_zh}"吗？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/countries/${country.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '删除失败')
      }
      
      alert('国家删除成功')
      loadCountries()
    } catch (error) {
      console.error('删除国家失败:', error)
      alert(`删除国家失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleFormSuccess = () => {
    setShowCountryForm(false)
    setEditingCountry(null)
    loadCountries()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">加载失败</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={loadCountries}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  重新加载
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">国别管理</h1>
          <p className="text-gray-600 mt-1">管理除中国以外的其他国家信息，支持自动获取国旗图片</p>
        </div>
        <button
          onClick={handleAddCountry}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增国家
        </button>
      </div>

      {/* 国家列表 */}
      <div className="bg-white rounded-lg border border-gray-200">
        {countries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>暂无国家数据</p>
            <button
              onClick={handleAddCountry}
              className="mt-4 text-green-600 hover:text-green-700"
            >
              立即创建第一个国家
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* 表头 */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-1">标志</div>
                <div className="col-span-3">国家名称</div>
                <div className="col-span-2">国家代码</div>
                <div className="col-span-2">排序权重</div>
                <div className="col-span-2">状态</div>
                <div className="col-span-2">操作</div>
              </div>
            </div>

            {/* 数据行 */}
            <div className="divide-y divide-gray-200">
              {countries.map((country) => (
                <div key={country.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* 国家标志 */}
                    <div className="col-span-1">
                      {country.logo_url ? (
                        <img 
                          src={country.logo_url} 
                          alt={`${country.name_zh}国旗`}
                          className="w-8 h-6 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* 国家名称 */}
                    <div className="col-span-3">
                      <div className="font-medium text-gray-900">{country.name_zh}</div>
                      <div className="text-sm text-gray-500">{country.name_en}</div>
                    </div>

                    {/* 国家代码 */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {country.code}
                      </span>
                    </div>

                    {/* 排序权重 */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">{country.sort_order}</span>
                    </div>

                    {/* 状态 */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        country.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {country.is_active ? '启用' : '禁用'}
                      </span>
                    </div>

                    {/* 操作 */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCountry(country)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="编辑国家"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCountry(country)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="删除国家"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 表单弹窗 */}
      {showCountryForm && (
        <CountryForm
          country={editingCountry}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowCountryForm(false)}
        />
      )}
    </div>
  )
}