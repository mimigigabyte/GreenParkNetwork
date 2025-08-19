'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablePaginationProps {
  current: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  showQuickJumper?: boolean
  showTotal?: boolean
}

export function TablePagination({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = true,
  pageSizeOptions = [10, 20, 50, 100],
  showQuickJumper = false,
  showTotal = true
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (current - 1) * pageSize + 1
  const endItem = Math.min(current * pageSize, total)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== current) {
      onChange(page, pageSize)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    const newPage = Math.ceil(((current - 1) * pageSize + 1) / newPageSize)
    onChange(newPage, newPageSize)
  }

  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // 如果总页数不超过最大显示数，显示所有页数
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 复杂的分页逻辑
      if (current <= 3) {
        // 当前页在前面
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (current >= totalPages - 2) {
        // 当前页在后面
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('...')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (total === 0) {
    return null
  }

  return (
    <div className="px-6 py-3 flex items-center justify-between">
      {/* 左侧信息 */}
      <div className="flex items-center space-x-4 text-sm text-gray-700">
        {showTotal && (
          <span>
            显示 {startItem} - {endItem} 条，共 {total} 条
          </span>
        )}
        
        {showSizeChanger && (
          <div className="flex items-center space-x-2">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>条</span>
          </div>
        )}
      </div>

      {/* 右侧分页控件 */}
      <div className="flex items-center space-x-1">
        {/* 上一页 */}
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 页码 */}
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={typeof page === 'string'}
            className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border ${
              page === current
                ? 'z-10 bg-green-50 border-green-500 text-green-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            } ${typeof page === 'string' ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {page}
          </button>
        ))}

        {/* 下一页 */}
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 快速跳转 */}
        {showQuickJumper && (
          <div className="flex items-center space-x-2 ml-4 text-sm text-gray-700">
            <span>跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt((e.target as HTMLInputElement).value)
                  handlePageChange(page)
                }
              }}
            />
            <span>页</span>
          </div>
        )}
      </div>
    </div>
  )
}