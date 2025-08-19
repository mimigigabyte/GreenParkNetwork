'use client'

import { useState, useEffect } from 'react'
import { getTechnologiesApi } from '@/lib/api/admin-technologies'

export default function TestTechnologiesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        setLoading(true)
        const result = await getTechnologiesApi()
        setData(result)
        console.log('API测试成功:', result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
        console.error('API测试失败:', err)
      } finally {
        setLoading(false)
      }
    }

    testAPI()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">技术管理API测试</h1>
      
      {loading && (
        <div className="text-blue-600">加载中...</div>
      )}
      
      {error && (
        <div className="text-red-600 mb-4">
          <h2 className="font-semibold">错误:</h2>
          <pre className="bg-red-50 p-2 rounded">{error}</pre>
        </div>
      )}
      
      {data && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">API响应:</h2>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">分页信息:</h3>
            <pre className="text-sm">{JSON.stringify(data.pagination, null, 2)}</pre>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">技术数据 ({data.data.length} 条):</h3>
            <pre className="text-sm">{JSON.stringify(data.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
