'use client'

import { useState, useEffect } from 'react'
import { Heart, Tag, Building } from 'lucide-react'
import { AdminTechnology } from '@/lib/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

// 模拟的收藏技术数据
const mockFavoriteTechnologies: Partial<AdminTechnology>[] = [
  {
    id: 'tech_001',
    name_zh: '高效太阳能光伏板技术',
    name_en: 'High-Efficiency Solar PV Panel Technology',
    description_zh: '采用新型半导体材料，光电转换效率提升至25%，在低光照条件下依然表现出色。适合大规模电站和分布式屋顶应用。',
    category: { 
      id: 'cat_01', 
      name_zh: '新能源',
      name_en: 'New Energy',
      slug: 'new-energy',
      sort_order: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    },
    subcategory: { 
      id: 'sub_01', 
      name_zh: '太阳能',
      name_en: 'Solar Energy',
      slug: 'solar-energy',
      sort_order: 1,
      category_id: 'cat_01',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    },
    image_url: 'https://images.unsplash.com/photo-1545208942-7632f264f288?q=80&w=800&auto=format&fit=crop',
    is_active: true,
    created_at: '2024-05-10T10:00:00Z',
    tech_source: 'self_developed',
    company: { 
      id: 'comp_A', 
      name_zh: '光能无限公司',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    }
  },
  {
    id: 'tech_002',
    name_zh: '智能电网优化调度系统',
    name_en: 'Smart Grid Optimized Dispatch System',
    description_zh: '基于AI算法，实时预测电网负荷与可再生能源发电量，智能调度电力资源，减少能源损耗，提高电网稳定性。',
    category: { 
      id: 'cat_02', 
      name_zh: '节能环保',
      name_en: 'Energy Conservation',
      slug: 'energy-conservation',
      sort_order: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    },
    subcategory: { 
      id: 'sub_02', 
      name_zh: '智能电网',
      name_en: 'Smart Grid',
      slug: 'smart-grid',
      sort_order: 2,
      category_id: 'cat_02',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    },
    image_url: 'https://images.unsplash.com/photo-1624397840027-9b044178b3a4?q=80&w=800&auto=format&fit=crop',
    is_active: true,
    created_at: '2024-03-15T14:30:00Z',
    tech_source: 'cooperative',
    company: { 
      id: 'comp_B', 
      name_zh: '未来电网集团',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    }
  },
  {
    id: 'tech_003',
    name_zh: '工业余热回收利用技术',
    name_en: 'Industrial Waste Heat Recovery Technology',
    description_zh: '将工业生产过程中产生的废热通过热交换器回收，用于供暖、发电或生产其他产品，能源利用效率提高15%。',
    category: { 
      id: 'cat_02', 
      name_zh: '节能环保',
      name_en: 'Energy Conservation',
      slug: 'energy-conservation',
      sort_order: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    },
    subcategory: { 
      id: 'sub_03', 
      name_zh: '能源回收',
      name_en: 'Energy Recovery',
      slug: 'energy-recovery',
      sort_order: 3,
      category_id: 'cat_02',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    },
    image_url: 'https://images.unsplash.com/photo-1578316892875-0e4835315216?q=80&w=800&auto=format&fit=crop',
    is_active: false,
    created_at: '2023-11-20T09:00:00Z',
    tech_source: 'self_developed',
    company_id: 'comp_C'
  }
]

export default function Favorites() {
  const [favorites, setFavorites] = useState<Partial<AdminTechnology>[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: 替换为真实的API调用
    const fetchFavorites = async () => {
      setIsLoading(true)
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      setFavorites(mockFavoriteTechnologies)
      setIsLoading(false)
    }

    fetchFavorites()
  }, [])

  if (isLoading) {
    return <FavoritesSkeleton />
  }

  if (favorites.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">我的收藏</h3>
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无收藏</h3>
          <p className="mt-1 text-sm text-gray-500">快去技术市场逛逛，发现感兴趣的技术吧！</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">我的收藏 ({favorites.length})</h3>
      <div className="space-y-4">
        {favorites.map(tech => (
          <div key={tech.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
            <img 
              src={tech.image_url} 
              alt={tech.name_zh}
              className="w-32 h-24 object-cover rounded-md border"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-600">{tech.category?.name_zh} / {tech.subcategory?.name_zh}</p>
              <h4 className="text-md font-bold text-gray-900 hover:underline cursor-pointer">{tech.name_zh}</h4>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tech.description_zh}</p>
              <div className="flex items-center text-xs text-gray-500 mt-2">
                <Building className="w-3 h-3 mr-1" />
                <span>{'未知来源'}</span>
                <span className="mx-2">|</span>
                <span>收藏于: {tech.created_at ? new Date(tech.created_at).toLocaleDateString() : '未知'}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
              <Heart className="w-4 h-4 mr-2" />
              取消收藏
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function FavoritesSkeleton() {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4"><Skeleton className="h-6 w-32"/></h3>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
            <Skeleton className="w-32 h-24 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
