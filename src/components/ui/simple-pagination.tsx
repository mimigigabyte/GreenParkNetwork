'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  locale?: string;
}

export function SimplePagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  locale = 'zh'
}: SimplePaginationProps) {
  const pageSizeOptions = [10, 20, 50, 100];

  // 生成显示的页码数组
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages + 2) {
      // 如果总页数不多，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 复杂情况：显示部分页码和省略号
      if (currentPage <= 3) {
        // 当前页在前面
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // 当前页在后面
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {/* Previous 按钮 */}
      <Button
        variant="outline"
        className="h-10 px-3 border-gray-300 hover:bg-green-50 hover:border-green-300 disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span className="text-sm">{locale === 'en' ? 'Previous' : '上一页'}</span>
      </Button>

      {/* 页码按钮 */}
      <div className="flex items-center gap-1">
        {generatePageNumbers().map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                className={`h-10 w-10 text-sm ${
                  currentPage === page
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                    : 'border-gray-300 hover:bg-green-50 hover:border-green-300'
                }`}
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Next 按钮 */}
      <Button
        variant="outline"
        className="h-10 px-3 border-gray-300 hover:bg-green-50 hover:border-green-300 disabled:opacity-50"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
      >
        <span className="text-sm">{locale === 'en' ? 'Next' : '下一页'}</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>

      {/* 每页条数选择 */}
      <div className="flex items-center gap-2 ml-4">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-10 w-24 border-gray-300 hover:border-green-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} {locale === 'en' ? 'Items' : '条'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}