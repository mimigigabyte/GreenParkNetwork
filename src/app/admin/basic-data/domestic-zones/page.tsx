'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, MapPin, Building } from 'lucide-react'
import { AdminProvince, AdminDevelopmentZone } from '@/lib/types/admin'
import { 
  getProvincesByCountryId, 
  getDevelopmentZonesByProvinceId
} from '@/lib/supabase/admin-locations'
import {
  getDevelopmentZonesApi,
  deleteDevelopmentZoneApi
} from '@/lib/api/admin-development-zones'
import {
  getProvincesApi,
  createProvinceApi,
  updateProvinceApi,
  deleteProvinceApi
} from '@/lib/api/admin-provinces'
import { 
  getMockProvincesByCountryId,
  getMockDevelopmentZonesByProvinceId,
  createMockProvince,
  createMockDevelopmentZone,
  updateMockProvince,
  updateMockDevelopmentZone,
  deleteMockProvince,
  deleteMockDevelopmentZone
} from '@/lib/supabase/admin-locations-mock'
import { ProvinceForm } from './components/province-form'
import { DevelopmentZoneForm } from './components/development-zone-form'

export default function DomesticZonesPage() {
  const [provinces, setProvinces] = useState<AdminProvince[]>([])
  const [developmentZones, setDevelopmentZones] = useState<{ [provinceId: string]: AdminDevelopmentZone[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  
  // 表单状态
  const [showProvinceForm, setShowProvinceForm] = useState(false)
  const [showDevelopmentZoneForm, setShowDevelopmentZoneForm] = useState(false)
  
  // 编辑状态
  const [editingProvince, setEditingProvince] = useState<AdminProvince | null>(null)
  const [editingDevelopmentZone, setEditingDevelopmentZone] = useState<AdminDevelopmentZone | null>(null)
  
  // 选择状态
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('')
  
  // 展开状态
  const [expandedProvinces, setExpandedProvinces] = useState<string[]>([])

  // 中国ID常量 - 使用从脚本中获得的实际ID
  const CHINA_ID = 'f60beb71-056e-4878-8d9d-655a11c03eaa'

  useEffect(() => {
    loadProvinces()
  }, [])

  const loadProvinces = async () => {
    try {
      setIsLoading(true)
      
      // 首先尝试从数据库加载
      try {
        const data = await getProvincesApi(CHINA_ID)
        setProvinces(data)
        setIsUsingMockData(false)
        console.log('✅ 从数据库加载省份数据成功')
        
        // 预加载所有省份的经开区数量
        loadAllDevelopmentZonesCounts(data, false)
        return
      } catch (dbError) {
        console.warn('⚠️ 数据库连接失败，使用模拟数据:', dbError)
      }
      
      // 如果数据库失败，使用模拟数据
      const mockData = await getMockProvincesByCountryId(CHINA_ID)
      setProvinces(mockData)
      setIsUsingMockData(true)
      console.log('✅ 使用模拟数据加载成功')
      
      // 预加载所有省份的经开区数量
      loadAllDevelopmentZonesCounts(mockData, true)
      
    } catch (error) {
      console.error('加载省份数据失败:', error)
      alert('加载省份数据失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 预加载所有省份的经开区数据以显示数量
  const loadAllDevelopmentZonesCounts = async (provincesList: AdminProvince[], useMockData: boolean) => {
    for (const province of provincesList) {
      try {
        let data: AdminDevelopmentZone[]
        if (useMockData) {
          data = await getMockDevelopmentZonesByProvinceId(province.id)
        } else {
          data = await getDevelopmentZonesApi(province.id)
        }
        
        setDevelopmentZones(prev => ({
          ...prev,
          [province.id]: data
        }))
      } catch (error) {
        console.error(`加载省份 ${province.name_zh} 的经开区数据失败:`, error)
      }
    }
  }

  const loadDevelopmentZones = async (provinceId: string) => {
    try {
      let data: AdminDevelopmentZone[]
      if (isUsingMockData) {
        data = await getMockDevelopmentZonesByProvinceId(provinceId)
      } else {
        data = await getDevelopmentZonesApi(provinceId)
      }
      
      setDevelopmentZones(prev => ({
        ...prev,
        [provinceId]: data
      }))
    } catch (error) {
      console.error('加载经开区数据失败:', error)
    }
  }

  const toggleExpandedProvince = (provinceId: string) => {
    setExpandedProvinces(prev => {
      const newExpanded = prev.includes(provinceId)
        ? prev.filter(id => id !== provinceId)
        : [...prev, provinceId]
      
      // 如果展开，加载经开区数据
      if (!prev.includes(provinceId)) {
        loadDevelopmentZones(provinceId)
      }
      
      return newExpanded
    })
  }

  // 表单处理函数
  const handleAddProvince = () => {
    setEditingProvince(null)
    setShowProvinceForm(true)
  }

  const handleEditProvince = (province: AdminProvince) => {
    setEditingProvince(province)
    setShowProvinceForm(true)
  }

  const handleDeleteProvince = async (province: AdminProvince) => {
    if (!confirm(`确定要删除省份"${province.name_zh}"吗？这将同时删除所有经开区。`)) {
      return
    }

    try {
      if (isUsingMockData) {
        await deleteMockProvince(province.id)
      } else {
        await deleteProvinceApi(province.id)
      }
      
      alert('省份删除成功')
      loadProvinces()
    } catch (error) {
      console.error('删除省份失败:', error)
      alert('删除省份失败，请重试')
    }
  }

  const handleAddDevelopmentZone = (provinceId: string) => {
    setSelectedProvinceId(provinceId)
    setEditingDevelopmentZone(null)
    setShowDevelopmentZoneForm(true)
  }

  const handleEditDevelopmentZone = (zone: AdminDevelopmentZone) => {
    setSelectedProvinceId(zone.province_id)
    setEditingDevelopmentZone(zone)
    setShowDevelopmentZoneForm(true)
  }

  const handleDeleteDevelopmentZone = async (zone: AdminDevelopmentZone) => {
    if (!confirm(`确定要删除经开区"${zone.name_zh}"吗？`)) {
      return
    }

    try {
      if (isUsingMockData) {
        await deleteMockDevelopmentZone(zone.id)
      } else {
        await deleteDevelopmentZoneApi(zone.id)
      }
      
      alert('经开区删除成功')
      loadDevelopmentZones(zone.province_id)
    } catch (error) {
      console.error('删除经开区失败:', error)
      alert('删除经开区失败，请重试')
    }
  }

  const handleFormSuccess = () => {
    setShowProvinceForm(false)
    setShowDevelopmentZoneForm(false)
    setEditingProvince(null)
    setEditingDevelopmentZone(null)
    
    // 重新加载数据
    loadProvinces()
    
    // 如果有选中的省份，重新加载其经开区数据
    if (selectedProvinceId) {
      loadDevelopmentZones(selectedProvinceId)
    }
    
    setSelectedProvinceId('')
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
      {/* 数据库状态提示 */}
      {isUsingMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">当前使用模拟数据</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>数据库表尚未创建，请按照 <strong>setup-database.md</strong> 文件说明设置数据库。</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={loadProvinces}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
                >
                  重新连接数据库
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">国内省份/经开区管理</h1>
          <p className="text-gray-600 mt-1">管理中国各省份及其国家级经济开发区信息</p>
        </div>
        <button
          onClick={handleAddProvince}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增省份
        </button>
      </div>

      {/* 省份和经开区树形列表 */}
      <div className="bg-white rounded-lg border border-gray-200">
        {provinces.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>暂无省份数据</p>
            <button
              onClick={handleAddProvince}
              className="mt-4 text-green-600 hover:text-green-700"
            >
              立即创建第一个省份
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {provinces.map((province) => (
              <div key={province.id} className="p-4">
                {/* 省份行 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleExpandedProvince(province.id)}
                      className="mr-2 p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedProvinces.includes(province.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <MapPin className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">{province.name_zh}</h3>
                      <p className="text-sm text-gray-500">{province.name_en}</p>
                      <p className="text-xs text-gray-400">代码: {province.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {developmentZones[province.id]?.length || 0} 个经开区
                    </span>
                    <button
                      onClick={() => handleAddDevelopmentZone(province.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="添加经开区"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditProvince(province)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="编辑省份"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProvince(province)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="删除省份"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 经开区列表 */}
                {expandedProvinces.includes(province.id) && (
                  <div className="mt-4 ml-6 space-y-2">
                    {developmentZones[province.id]?.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 text-purple-500 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-800">{zone.name_zh}</h4>
                            <p className="text-xs text-gray-500">{zone.name_en}</p>
                            <p className="text-xs text-gray-400">代码: {zone.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditDevelopmentZone(zone)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="编辑经开区"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteDevelopmentZone(zone)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="删除经开区"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!developmentZones[province.id] || developmentZones[province.id].length === 0) && (
                      <div className="p-3 text-center text-gray-400 text-sm">
                        暂无经开区
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 表单弹窗 */}
      {showProvinceForm && (
        <ProvinceForm
          province={editingProvince}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowProvinceForm(false)}
          isUsingMockData={isUsingMockData}
        />
      )}

      {showDevelopmentZoneForm && (
        <DevelopmentZoneForm
          provinceId={selectedProvinceId}
          zone={editingDevelopmentZone}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowDevelopmentZoneForm(false)}
          isUsingMockData={isUsingMockData}
        />
      )}
    </div>
  )
}