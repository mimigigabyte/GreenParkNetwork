'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'
import { Edit, Trash2, Eye, GripVertical } from 'lucide-react'
import { AdminCarouselImage } from '@/lib/types/admin'

interface DragDropCarouselListProps {
  images: AdminCarouselImage[]
  loading: boolean
  onOrderChange: (images: AdminCarouselImage[]) => void
  onEdit: (image: AdminCarouselImage) => void
  onDelete: (image: AdminCarouselImage) => void
  onPreview: (image: AdminCarouselImage) => void
}

interface SortableItemProps {
  image: AdminCarouselImage
  onEdit: (image: AdminCarouselImage) => void
  onDelete: (image: AdminCarouselImage) => void
  onPreview: (image: AdminCarouselImage) => void
}

function SortableItem({ image, onEdit, onDelete, onPreview }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* 图片预览 */}
        <div className="flex-shrink-0">
          <img
            src={image.image_url}
            alt={image.title_zh || '轮播图'}
            className="w-20 h-12 object-cover rounded border border-gray-200"
          />
        </div>

        {/* 内容信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {image.title_zh || '无标题'}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              image.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {image.is_active ? '启用' : '禁用'}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span>排序: {image.sort_order}</span>
            {image.title_en && (
              <span className="truncate">{image.title_en}</span>
            )}
            <span>
              {new Date(image.created_at).toLocaleDateString('zh-CN')}
            </span>
          </div>
          {image.description_zh && (
            <p className="text-sm text-gray-600 mt-1 truncate">
              {image.description_zh}
            </p>
          )}
          {image.link_url && (
            <a
              href={image.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 truncate block mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {image.link_url}
            </a>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPreview(image)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="预览"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(image)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(image)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function DragDropCarouselList({
  images,
  loading,
  onOrderChange,
  onEdit,
  onDelete,
  onPreview
}: DragDropCarouselListProps) {
  const [items, setItems] = useState(images)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 当外部images更新时，同步更新内部状态
  if (items.length !== images.length || 
      items.some((item, index) => item.id !== images[index]?.id)) {
    setItems(images)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)
      
      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)
      onOrderChange(newItems)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <GripVertical className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>暂无轮播图数据</p>
          <p className="text-sm mt-1">点击上方&quot;新增轮播图&quot;按钮添加第一张轮播图</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <GripVertical className="w-5 h-5 text-blue-600 mr-2" />
          <p className="text-blue-800 text-sm">
            <strong>排序模式：</strong>拖拽左侧手柄可以调整轮播图的显示顺序，拖拽后会自动保存排序
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((image) => (
              <SortableItem
                key={image.id}
                image={image}
                onEdit={onEdit}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}