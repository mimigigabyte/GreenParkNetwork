'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { TechProduct, SortType } from '@/api/tech';
import { Clock, ArrowDownAZ, ArrowUpAZ, ChevronDown, ChevronDown as ChevronDownIcon, FileText, Download, Mail } from 'lucide-react';
import { ContactUsModal } from '@/components/contact/contact-us-modal';
import { useAuthContext } from '@/components/auth/auth-provider';

interface SearchResultsProps {
  products: TechProduct[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalResults: number;
  currentCategory: string;
  // 新增接口参数
  companyCount?: number;
  technologyCount?: number;
  onSortChange?: (sortType: SortType) => void;
  locale?: string;
}

export function SearchResults({ 
  products, 
  currentPage, 
  totalPages, 
  onPageChange,
  totalResults,
  currentCategory,
  companyCount, // 可选参数，如果未提供则基于搜索结果计算
  technologyCount, // 可选参数，如果未提供则使用totalResults
  onSortChange,
  locale
}: SearchResultsProps) {
  const { user } = useAuthContext();
  const t = useTranslations('home');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [currentSort, setCurrentSort] = useState<SortType>('updateTime');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 计算实际的企业数量（基于搜索结果去重）
  const actualCompanyCount = companyCount ?? new Set(products.map(product => product.companyName)).size;
  
  // 计算实际的技术数量
  const actualTechnologyCount = technologyCount ?? totalResults;
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedTechnology, setSelectedTechnology] = useState<{
    id: string;
    name: string;
    companyName: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部区域关闭下拉框
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDescription = (productId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const getCategoryName = (categoryId: string) => {
    const categoryMapZh: { [key: string]: string } = {
      'energy-saving': '节能环保技术',
      'clean-energy': '清洁能源技术',
      'clean-production': '清洁生产技术',
      'new-energy-vehicle': '新能源汽车技术'
    };
    
    const categoryMapEn: { [key: string]: string } = {
      'energy-saving': 'Energy Saving',
      'clean-energy': 'Clean Energy',
      'clean-production': 'Clean Production',
      'new-energy-vehicle': 'New Energy Vehicle'
    };
    
    const categoryMap = locale === 'en' ? categoryMapEn : categoryMapZh;
    const fallback = locale === 'en' ? 'Technology' : '技术';
    return categoryMap[categoryId] || fallback;
  };

  const handleSortChange = (sortType: SortType) => {
    setCurrentSort(sortType);
    setIsDropdownOpen(false);
    onSortChange?.(sortType);
  };

  const sortOptions = [
    {
      value: 'updateTime' as SortType,
      label: locale === 'en' ? 'Update Time' : '更新时间',
      icon: Clock,
      className: 'text-gray-600'
    },
    {
      value: 'nameDesc' as SortType,
      label: locale === 'en' ? 'Name Descending' : '中文名称降序',
      icon: ArrowDownAZ,
      className: 'text-red-600'
    },
    {
      value: 'nameAsc' as SortType,
      label: locale === 'en' ? 'Name Ascending' : '中文名称升序',
      icon: ArrowUpAZ,
      className: 'text-green-600'
    }
  ];

  const currentSortOption = sortOptions.find(option => option.value === currentSort);
  const CurrentIcon = currentSortOption?.icon || Clock;

  // 从URL中提取或生成有意义的文件名
  const getDisplayFilename = (url: string, originalName?: string) => {
    if (originalName) return originalName;
    
    // 从URL中提取文件名部分
    const urlPath = url.split('/').pop() || '';
    const parts = urlPath.split('.');
    
    if (parts.length > 1) {
      const ext = parts.pop(); // 获取文件扩展名
      // 如果文件名看起来像是时间戳+随机字符，则生成更友好的名称
      return locale === 'en' ? `Technical_Document.${ext}` : `技术资料.${ext}`;
    }
    
    return locale === 'en' ? 'Technical_Document' : '技术资料';
  };

  const handleDownloadAttachment = async (attachmentUrl: string, originalFilename?: string) => {
    try {
      // 获取有意义的文件名
      const filename = getDisplayFilename(attachmentUrl, originalFilename);
      
      // 使用API接口进行下载
      const downloadUrl = `/api/files/download?url=${encodeURIComponent(attachmentUrl)}&filename=${encodeURIComponent(filename)}`
      
      // 创建隐藏的下载链接
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('下载附件失败:', error)
      alert(locale === 'en' ? 'Download failed, please try again' : '下载附件失败，请重试')
    }
  }

  // 处理联系我们按钮点击
  const handleContactUs = (product: TechProduct) => {
    if (!user) {
      alert(locale === 'en' ? 'You must register and login to contact technology providers' : '必须注册登录才能联系技术提供方');
      return;
    }

    setSelectedTechnology({
      id: product.id,
      name: locale === 'en' ? (product.solutionTitleEn || product.solutionTitle) : product.solutionTitle,
      companyName: locale === 'en' ? (product.companyNameEn || product.companyName) : product.companyName
    });
    setContactModalOpen(true);
  };

  // 关闭联系对话框
  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setSelectedTechnology(null);
  };

  return (
    <section className="pt-2 pb-8" style={{backgroundColor: '#edeef7'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 结果信息和排序 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-sm text-gray-600">
            {locale === 'en' ? (
              <>
                Search Results: Found{' '}
                <span className="font-black text-blue-600 mx-1">{actualTechnologyCount}</span>
                green low-carbon technologies from{' '}
                <span className="font-black text-blue-600 mx-1">{actualCompanyCount}</span>
                companies
              </>
            ) : (
              <>
                相关结果：为您搜索到来自
                <span className="font-black text-blue-600 mx-1">{actualCompanyCount}</span>
                家企业的
                <span className="font-black text-blue-600 mx-1">{actualTechnologyCount}</span>
                项绿色低碳技术
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{locale === 'en' ? 'Sort by:' : '排序方式:'}</span>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <CurrentIcon className={`w-4 h-4 ${currentSortOption?.className || 'text-gray-600'}`} />
                <span>{currentSortOption?.label || (locale === 'en' ? 'Update Time' : '更新时间')}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                  {sortOptions.map((option) => {
                    const IconComponent = option.icon;
                    const isActive = currentSort === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                          isActive ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${option.className}`} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 产品列表 */}
        <div className="space-y-6">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                             {/* 上方区域：公司信息 */}
               <div className="relative px-6 py-4 flex justify-between items-center bg-green-50">
                 {/* 左侧绿色小竖条 */}
                 <div className="absolute left-0 top-0 bottom-0 w-2 bg-green-500"></div>
                
                {/* 左侧：公司名称和标签 */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {locale === 'en' ? (product.companyNameEn || product.companyName) : product.companyName}
                  </h3>
                  {/* 四个标签：产业分类、子分类、国别（带国旗）、经开区 */}
                  <div className="flex flex-wrap gap-2">
                    {/* 产业分类标签 */}
                    {(product.categoryName || product.categoryNameEn) && (
                      <span className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-400 transition-colors cursor-pointer">
                        {locale === 'en' ? (product.categoryNameEn || product.categoryName) : product.categoryName}
                      </span>
                    )}
                    
                    {/* 子分类标签 */}
                    {(product.subCategoryName || product.subCategoryNameEn) && (
                      <span className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-400 transition-colors cursor-pointer">
                        {locale === 'en' ? (product.subCategoryNameEn || product.subCategoryName) : product.subCategoryName}
                      </span>
                    )}
                    
                    {/* 国别标签（带国旗） */}
                    {(product.countryName || product.countryNameEn) && (
                      <span className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-400 transition-colors cursor-pointer">
                        {product.countryFlagUrl && (
                          <img 
                            src={product.countryFlagUrl} 
                            alt={`${locale === 'en' ? (product.countryNameEn || product.countryName) : product.countryName} flag`}
                            className="w-4 h-3 mr-1 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        {locale === 'en' ? (product.countryNameEn || product.countryName) : product.countryName}
                      </span>
                    )}
                    
                    {/* 国家级经开区标签 */}
                    {(product.developmentZoneName || product.developmentZoneNameEn) && (
                      <span className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-400 transition-colors cursor-pointer">
                        {locale === 'en' ? (product.developmentZoneNameEn || product.developmentZoneName) : product.developmentZoneName}
                      </span>
                    )}
                  </div>
                </div>
                {/* 右侧：公司LOGO */}
                <div className="flex items-center">
                  {product.companyLogoUrl ? (
                    <img
                      src={product.companyLogoUrl}
                      alt={locale === 'en' ? (product.companyNameEn || product.companyName) : product.companyName}
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // 如果logo加载失败，使用默认占位符
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {locale === 'en' ? 
                          (product.companyNameEn || product.companyName)?.slice(0, 4) || 'Corp' : 
                          product.companyName?.slice(0, 4) || '企业'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 下方区域：技术信息 */}
              <div className="p-6 bg-white">
                <div className="flex flex-col lg:flex-row gap-6">
                                     {/* 左侧：技术简介缩略图 */}
                   <div className="lg:w-1/4">
                     <img
                       src={product.solutionThumbnail || product.solutionImage}
                       alt={locale === 'en' ? (product.solutionTitleEn || product.solutionTitle) : product.solutionTitle}
                       className="w-full h-64 object-cover rounded-lg"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
                       }}
                     />
                   </div>

                                     {/* 右侧：技术名称和简介 */}
                   <div className="lg:w-3/4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4">
                        {locale === 'en' ? (product.solutionTitleEn || product.solutionTitle) : product.solutionTitle}
                      </h4>
                      
                      {/* 简介文字 - 最多6行 */}
                      <div className="mb-4">
                        <p className="text-gray-700"
                        style={
                          !expandedDescriptions.has(product.id)
                            ? {
                                display: '-webkit-box',
                                WebkitLineClamp: 6,
                                WebkitBoxOrient: 'vertical' as const,
                                overflow: 'hidden',
                                lineHeight: '1.5',
                                fontSize: '1rem'
                              }
                            : {
                                lineHeight: '1.5'
                              }
                        }>
                          {locale === 'en' ? 
                            (product.fullDescriptionEn || product.solutionDescriptionEn || product.fullDescription || product.solutionDescription) : 
                            (product.fullDescription || product.solutionDescription)}
                        </p>
                        
                        {/* 展开更多按钮 */}
                        {(product.fullDescription || product.solutionDescription.length > 400) && (
                          <button
                            onClick={() => toggleDescription(product.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-flex items-center"
                          >
                            {expandedDescriptions.has(product.id) 
                              ? (locale === 'en' ? 'Show Less' : '收起') 
                              : (locale === 'en' ? 'Show More' : '展开更多')}
                            <ChevronDownIcon
                              className={`w-4 h-4 ml-1 transition-transform ${
                                expandedDescriptions.has(product.id) ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* 技术资料附件区域 - 只在展开状态下显示 */}
                      {expandedDescriptions.has(product.id) && product.attachmentUrls && product.attachmentUrls.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center mb-3">
                            <FileText className="w-5 h-5 text-gray-600 mr-2" />
                            <h5 className="text-sm font-medium text-gray-900">{locale === 'en' ? 'Technical Documents' : '技术资料附件'}</h5>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {product.attachmentUrls.map((attachment, index) => {
                              // 使用原始文件名如果可用，否则生成友好的文件名
                              const originalName = product.attachmentNames?.[index];
                              const filename = originalName || getDisplayFilename(attachment);
                              const shortName = filename.length > 25 ? filename.substring(0, 25) + '...' : filename;
                              return (
                                <button
                                  key={index}
                                  onClick={() => handleDownloadAttachment(attachment, filename)}
                                  className="flex items-center p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-gray-200 transition-colors group"
                                  title={filename}
                                >
                                  <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{shortName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                                         {/* 右下角：联系我们按钮 */}
                     <div className="flex justify-end">
                       <button 
                         onClick={() => handleContactUs(product)}
                         className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                         title={!user 
                           ? (locale === 'en' ? "You must register and login to contact technology providers" : "必须注册登录才能联系技术提供方")
                           : (locale === 'en' ? "Contact Us" : "联系我们")}
                       >
                         <Mail className="w-4 h-4 mr-2" />
{locale === 'en' ? 'Contact Us' : '联系我们'}
                       </button>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 分页 */}
        <div className="mt-8 flex flex-col items-center space-y-4">
          <div className="text-sm text-gray-600">
{locale === 'en' 
              ? `10 items per page, total ${products.length * totalPages} records`
              : `每页10条 共${products.length * totalPages}条记录`}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            
            {/* 页码 */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-green-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-green-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <span className="px-2 text-gray-500">...</span>
                <button
                  onClick={() => onPageChange(totalPages)}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-green-50"
                >
                  {totalPages}
                </button>
              </>
            )}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 联系我们对话框 */}
      <ContactUsModal
        isOpen={contactModalOpen}
        onClose={handleCloseContactModal}
        technologyId={selectedTechnology?.id}
        technologyName={selectedTechnology?.name}
        companyName={selectedTechnology?.companyName}
        locale={locale}
      />
    </section>
  );
} 