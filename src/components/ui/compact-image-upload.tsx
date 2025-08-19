'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { uploadFileToSupabase, deleteFileFromSupabase } from '@/lib/supabase-storage'

interface CompactImageUploadProps {
  value?: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  maxSize?: number // MB
  placeholder?: string
  disabled?: boolean
}

export function CompactImageUpload({
  value,
  onChange,
  bucket = 'images',
  folder = 'uploads',
  maxSize = 5,
  placeholder = '点击上传',
  disabled = false
}: CompactImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      alert(`文件大小不能超过 ${maxSize}MB`)
      return
    }

    try {
      setUploading(true)
      
      // 上传到 Supabase Storage
      const imageUrl = await uploadFileToSupabase(file, bucket, folder)
      
      onChange(imageUrl)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败：' + (error instanceof Error ? error.message : '请重试'))
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (value) {
      try {
        // 如果是 Supabase Storage 的URL，删除文件
        if (value.includes('supabase')) {
          await deleteFileFromSupabase(value, bucket)
        }
      } catch (error) {
        console.error('删除文件失败:', error)
        // 即使删除失败，也继续清除URL引用
      }
    }
    
    onChange('')
  }


  return (
    <div className="h-10 flex items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
      
      {value ? (
        // 显示缩略图和操作按钮
        <div className="flex items-center space-x-2 w-full h-full">
          <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden flex-shrink-0">
            <img
              src={value}
              alt="Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('图片加载失败:', value);
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-600 truncate block">已上传Logo</span>
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            <button
              type="button"
              onClick={handleClick}
              disabled={disabled || uploading}
              className="px-2 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              title="更换"
            >
              更换
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
              title="删除"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        // 上传按钮
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className={`
            w-full h-full px-3 py-2 border border-gray-300 rounded text-sm transition-colors
            flex items-center justify-between
            ${disabled || uploading 
              ? 'cursor-not-allowed opacity-50 bg-gray-100' 
              : 'cursor-pointer hover:bg-gray-50'
            }
          `}
        >
          {uploading ? (
            <div className="flex items-center space-x-2 flex-1">
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">上传中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{placeholder}</span>
              </div>
              <div className="text-xs text-gray-400">
                支持PNG、JPG，不超过{maxSize}MB
              </div>
            </div>
          )}
        </button>
      )}
    </div>
  )
}