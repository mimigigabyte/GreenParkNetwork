'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdvancedPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  locale?: string;
}

export function AdvancedPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  locale = 'zh'
}: AdvancedPaginationProps) {
  const pageSizeOptions = [10, 20, 50, 100];

  // 生成页码选择选项
  const generatePageOptions = () => {
    const options = [];
    for (let i = 1; i <= Math.min(totalPages, 100); i++) {
      options.push(i);
    }
    return options;
  };

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      {/* 左侧：统计信息 */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          {locale === 'en' 
            ? `Total ${totalItems} items`
            : `共 ${totalItems} 条记录`}
        </span>
        <span>
          {locale === 'en' 
            ? `Page ${currentPage} of ${totalPages}`
            : `第 ${currentPage} 页，共 ${totalPages} 页`}
        </span>
      </div>

      {/* 右侧：分页控件 */}
      <div className="flex items-center gap-6">
        {/* 每页条数选择 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {locale === 'en' ? 'Show' : '每页显示'}
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">
            {locale === 'en' ? 'items' : '条'}
          </span>
        </div>

        {/* 页码选择器 */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {locale === 'en' ? 'Go to page' : '跳转到'}
            </span>
            <Select
              value={currentPage.toString()}
              onValueChange={(value) => onPageChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generatePageOptions().map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 分页按钮 */}
        <div className="flex items-center gap-1">
          {/* 首页 */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
            title={locale === 'en' ? 'First page' : '首页'}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* 上一页 */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirstPage}
            title={locale === 'en' ? 'Previous page' : '上一页'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* 当前页码显示 */}
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-medium min-w-[2rem] text-center">
              {currentPage}
            </span>
            <span className="text-sm text-gray-500">/</span>
            <span className="text-sm text-gray-500 min-w-[2rem] text-center">
              {totalPages}
            </span>
          </div>

          {/* 下一页 */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLastPage}
            title={locale === 'en' ? 'Next page' : '下一页'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* 末页 */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={isLastPage}
            title={locale === 'en' ? 'Last page' : '末页'}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}