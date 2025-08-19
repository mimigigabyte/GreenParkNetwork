'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadFileToSupabase, deleteFileFromSupabase } from '@/lib/supabase-storage'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  multiple?: boolean
  maxSize?: number // MB
  accept?: string
  className?: string
  placeholder?: string
  disabled?: boolean
  bucket?: string // Supabase storage bucket
  folder?: string // Storage folder
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  multiple = false,
  maxSize = 5,
  accept = 'image/*',
  className = '',
  placeholder = '点击或拖拽上传图片',
  disabled = false,
  bucket = 'images',
  folder = 'uploads'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    console.log('📤 开始上传文件:', file.name, file.size, file.type)
    
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
      
      console.log('📤 正在上传到 Supabase Storage...')
      
      // 上传到 Supabase Storage
      const imageUrl = await uploadFileToSupabase(file, bucket, folder)
      
      console.log('✅ 上传成功，新的图片URL:', imageUrl)
      
      // 清除文件输入框，这样同一个文件可以重新选择
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      onChange(imageUrl)
    } catch (error) {
      console.error('❌ 上传失败:', error)
      alert('上传失败：' + (error instanceof Error ? error.message : '请重试'))
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled || uploading) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
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
    
    if (onRemove) {
      onRemove()
    } else {
      onChange('')
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
      
      {value ? (
        // 已上传图片预览
        <div className="relative group">
          <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
            <img
              src={value}
              alt="上传的图片"
              className="w-full h-full object-cover"
            />
            {/* 遮罩层 */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={disabled || uploading}
                  className="px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {uploading ? '上传中...' : '更换'}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 上传区域
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative w-full h-48 border-2 border-dashed rounded-lg transition-colors cursor-pointer
            flex flex-col items-center justify-center space-y-2
            ${dragOver 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled || uploading 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:bg-gray-50'
            }
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              <p className="text-sm text-gray-600">上传中...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">{placeholder}</p>
              <p className="text-xs text-gray-400">
                支持 JPG、PNG、GIF 格式，大小不超过 {maxSize}MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface MultipleImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxCount?: number
  maxSize?: number // MB
  className?: string
  disabled?: boolean
  bucket?: string // Supabase storage bucket
  folder?: string // Storage folder
}

export function MultipleImageUpload({
  value = [],
  onChange,
  maxCount = 5,
  maxSize = 5,
  className = '',
  disabled = false,
  bucket = 'images',
  folder = 'uploads'
}: MultipleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = maxCount - value.length
    if (remainingSlots <= 0) {
      alert(`最多只能上传 ${maxCount} 张图片`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    
    try {
      setUploading(true)
      const newUrls: string[] = []

      for (const file of filesToUpload) {
        // 验证文件
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} 不是图片文件`)
          continue
        }
        
        if (file.size > maxSize * 1024 * 1024) {
          alert(`${file.name} 文件大小超过 ${maxSize}MB`)
          continue
        }

        // 上传到 Supabase Storage
        const imageUrl = await uploadFileToSupabase(file, bucket, folder)
        newUrls.push(imageUrl)
      }

      
      onChange([...value, ...newUrls])
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (index: number) => {
    const urlToRemove = value[index]
    
    if (urlToRemove) {
      try {
        // 如果是 Supabase Storage 的URL，删除文件
        if (urlToRemove.includes('supabase')) {
          await deleteFileFromSupabase(urlToRemove, bucket)
        }
      } catch (error) {
        console.error('删除文件失败:', error)
        // 即使删除失败，也继续清除URL引用
      }
    }
    
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  const handleClick = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* 已上传的图片 */}
        {value.map((url, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square border-2 border-gray-200 rounded-lg overflow-hidden">
              <img
                src={url}
                alt={`图片 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => handleRemove(index)}
              disabled={disabled || uploading}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* 上传按钮 */}
        {value.length < maxCount && (
          <div
            onClick={handleClick}
            className={`
              aspect-square border-2 border-dashed border-gray-300 rounded-lg
              flex flex-col items-center justify-center space-y-2 transition-colors
              ${disabled || uploading 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500">添加图片</span>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        已上传 {value.length}/{maxCount} 张图片
      </p>
    </div>
  )
}