'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react'
import { TablePagination } from './table-pagination'

interface Column<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  width?: string
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  onSort?: (field: string, order: 'asc' | 'desc') => void
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
  rowKey?: keyof T | ((record: T) => string)
  className?: string
  hideSearch?: boolean
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onSort,
  onSearch,
  searchPlaceholder = '搜索...',
  actions,
  rowKey = 'id',
  className = '',
  hideSearch = false
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchValue, setSearchValue] = useState('')

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return record[rowKey] || index.toString()
  }

  const handleSort = (field: string) => {
    if (!onSort) return

    let newOrder: 'asc' | 'desc' = 'asc'
    if (sortField === field && sortOrder === 'asc') {
      newOrder = 'desc'
    }

    setSortField(field)
    setSortOrder(newOrder)
    onSort(field, newOrder)
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  const getCellValue = (record: T, column: Column<T>): T[keyof T] => {
    if (typeof column.key === 'string' && column.key.includes('.')) {
      // 支持嵌套属性 'user.name'
      return column.key.split('.').reduce((obj, key) => obj?.[key], record) as T[keyof T]
    }
    return record[column.key as keyof T]
  }

  const renderCell = (column: Column<T>, record: T, index: number) => {
    const value = getCellValue(record, column)
    
    if (column.render) {
      return column.render(value, record, index)
    }
    
    return value
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        {/* 加载状态的表格骨架 */}
        <div className="p-4 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 flex space-x-4">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded animate-pulse flex-1"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 表格头部工具栏 */}
      {(!hideSearch && onSearch) || actions ? (
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!hideSearch && onSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
                />
              </div>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      ) : null}

      {/* 表格内容 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* 表头 */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && column.key && handleSort(column.key as string)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && column.key && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`w-3 h-3 -mb-1 ${
                            sortField === column.key && sortOrder === 'asc' 
                              ? 'text-green-600' 
                              : 'text-gray-400'
                          }`} 
                        />
                        <ChevronDown 
                          className={`w-3 h-3 ${
                            sortField === column.key && sortOrder === 'desc' 
                              ? 'text-green-600' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* 表体 */}
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Filter className="w-12 h-12 text-gray-300 mb-2" />
                    <p>暂无数据</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr key={getRowKey(record, index)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderCell(column, record, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination && (
        <div className="border-t border-gray-200">
          <TablePagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={pagination.onChange}
          />
        </div>
      )}
    </div>
  )
}