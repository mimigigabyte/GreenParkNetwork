import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from 'next/image';
import { useAuthContext } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useFilterData, transformFilterDataForComponents } from '@/hooks/admin/use-filter-data';
import { MainCategory } from '@/api/tech';
import { Search, User } from 'lucide-react';

interface FilterState {
  category: string | null;
  subCategory: string | null;
  country: string | null;
  province: string | null;
  developmentZone: string | null;
}

interface SearchFilterProps {
  onSearch: (keyword: string) => void;
  onFilterChange: (filters: FilterState) => void;
  onOpenAuth?: () => void;
  totalResults: number;
  currentCategory: string;
  currentFilters?: FilterState;
  locale?: string;
}

export function SearchFilter({ 
  onSearch, 
  onFilterChange, 
  onOpenAuth,
  totalResults, 
  currentCategory,
  currentFilters,
  locale 
}: SearchFilterProps) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const t = useTranslations('home');
  const common = useTranslations('common');
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    subCategory: null,
    country: null,
    province: null,
    developmentZone: null
  });
  
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  
  // 防抖相关状态
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // 防抖筛选函数
  const debouncedFilterChange = useCallback((newFilters: FilterState) => {
    console.log('🔍 SearchFilter debouncedFilterChange 收到新筛选条件:', newFilters);
    setIsFilterLoading(true);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      console.log('🔍 SearchFilter 防抖完成，调用onFilterChange:', newFilters);
      onFilterChange(newFilters);
      setIsFilterLoading(false);
    }, 500);
  }, [onFilterChange]);

  // 重置所有筛选条件
  const handleResetFilters = useCallback(() => {
    const resetFilters: FilterState = {
      category: null,
      subCategory: null,
      country: null,
      province: null,
      developmentZone: null
    };
    
    // 重置本地状态
    setFilters(resetFilters);
    setSelectedMainCategory(null);
    setProvinces([]);
    setDevelopmentZones([]);
    
    // 调用回调通知父组件
    debouncedFilterChange(resetFilters);
  }, [debouncedFilterChange]);

  // 同步外部状态到本地状态
  useEffect(() => {
    console.log('🔍 SearchFilter useEffect 同步外部状态:', {
      currentFilters,
      当前本地filters: filters
    });
    
    if (currentFilters) {
      console.log('🔍 SearchFilter 更新本地状态为外部状态:', currentFilters);
      setFilters(currentFilters);
      setSelectedMainCategory(currentFilters.category);
    }
  }, [currentFilters]);
  
  // 同步左侧分类选择到筛选面板（仅当没有外部筛选状态时）
  useEffect(() => {
    if (!currentFilters) {
      if (currentCategory && currentCategory !== selectedMainCategory) {
        setSelectedMainCategory(currentCategory);
        setFilters(prev => ({ ...prev, category: currentCategory }));
      } else if (!currentCategory && selectedMainCategory !== null) {
        setSelectedMainCategory(null);
        setFilters(prev => ({ ...prev, category: null }));
      }
    }
  }, [currentCategory, selectedMainCategory, currentFilters]);
  const [provinces, setProvinces] = useState<{ value: string; label: string }[]>([]);
  const [developmentZones, setDevelopmentZones] = useState<{ value: string; label: string }[]>([]);

  // 使用数据库数据Hook
  const { data: filterData, isLoading: isLoadingFilter, loadProvinces, loadDevelopmentZones } = useFilterData();

  useEffect(() => {
    if (filterData.categories.length > 0) {
      const transformedData = transformFilterDataForComponents(filterData, locale);
      setMainCategories(transformedData.mainCategories);
    }
  }, [filterData, locale]);

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearch = () => {
    onSearch(keyword);
  };

  const handleFilterChange = useCallback((key: string, value: string) => {
    console.log('🔍 SearchFilter handleFilterChange 开始:', { key, value, currentFilters: filters });
    
    // 统一处理"all"选项为null值
    const normalizedValue = value === 'all' ? null : value;
    const newFilters = { ...filters, [key]: normalizedValue };
    
    console.log('🔍 SearchFilter 构建新的过滤器状态:', { 
      originalFilters: filters, 
      key, 
      normalizedValue, 
      newFilters 
    });
    
    // 如果选择了新的主分类，重置子分类
    if (key === 'category' && normalizedValue !== null) {
      newFilters.subCategory = null;
      setSelectedMainCategory(normalizedValue);
      console.log('🔍 SearchFilter 选择新主分类，重置子分类:', normalizedValue);
    } else if (key === 'category' && normalizedValue === null) {
      setSelectedMainCategory(null);
      console.log('🔍 SearchFilter 清除主分类选择');
    }
    
    // 如果选择了非中国，重置省份选择
    if (key === 'country' && normalizedValue !== 'china') {
      newFilters.province = null;
      newFilters.developmentZone = null;
      setProvinces([]);
      setDevelopmentZones([]);
      console.log('🔍 SearchFilter 选择非中国国家，重置省份和经开区');
    }
    
    // 如果选择了中国，加载省份数据
    if (key === 'country' && normalizedValue === 'china') {
      // 查找中国的ID
      const chinaCountry = filterData.countries.find(c => c.code === 'china');
      if (chinaCountry) {
        console.log('🔍 SearchFilter 选择中国，开始加载省份数据');
        loadProvinces(chinaCountry.id).then(provincesData => {
          const transformedProvinces = provincesData.map(p => ({
            value: p.code,
            label: locale === 'en' ? (p.name_en || p.name_zh) : p.name_zh
          }));
          setProvinces(transformedProvinces);
          console.log('🔍 SearchFilter 省份数据加载完成:', transformedProvinces.length, '个省份');
        });
      }
    }
    
    // 如果选择了新的省份，重置经开区选择并加载新的经开区
    if (key === 'province' && normalizedValue !== null) {
      newFilters.developmentZone = null;
      // 查找省份ID
      const province = filterData.provinces.find(p => p.code === normalizedValue);
      if (province) {
        console.log('🔍 SearchFilter 选择新省份，开始加载经开区数据:', normalizedValue);
        loadDevelopmentZones(province.id).then(zonesData => {
          const transformedZones = zonesData.map(z => ({
            value: z.code,
            label: locale === 'en' 
              ? (z.name_en && !/[\u4e00-\u9fff]/.test(z.name_en) ? z.name_en : z.name_zh
                  .replace(/经济技术开发区/g, 'Economic and Technological Development Zone')
                  .replace(/经济开发区/g, 'Economic Development Zone')
                  .replace(/高新技术开发区/g, 'High-Tech Development Zone')
                  .replace(/工业园区/g, 'Industrial Park')
                  .replace(/科技园/g, 'Science Park')
                  .replace(/新区/g, 'New Area')
                  .replace(/开发区/g, 'Development Zone')
                  .replace(/自贸区/g, 'Free Trade Zone')
                  .replace(/保税区/g, 'Bonded Zone'))
              : z.name_zh
          }));
          setDevelopmentZones(transformedZones);
          console.log('🔍 SearchFilter 经开区数据加载完成:', transformedZones.length, '个经开区');
        });
      }
    }
    
    // 如果选择了null省份，清空经开区
    if (key === 'province' && normalizedValue === null) {
      setDevelopmentZones([]);
      console.log('🔍 SearchFilter 清除省份选择，重置经开区');
    }
    
    console.log('🔍 SearchFilter 最终状态更新前:', { 
      currentFilters: filters, 
      newFilters,
      willCallOnFilterChange: true
    });
    
    setFilters(newFilters);
    debouncedFilterChange(newFilters);
  }, [filters, filterData.countries, filterData.provinces, loadProvinces, loadDevelopmentZones, locale, debouncedFilterChange]);

  const handleMainCategoryChange = useCallback((categoryId: string) => {
    const normalizedCategoryId = categoryId === 'all' ? null : categoryId;
    setSelectedMainCategory(normalizedCategoryId);
    handleFilterChange('category', categoryId);
  }, [handleFilterChange]);

  const getCategoryName = (categoryId: string) => {
    const categoryMap: { [key: string]: string } = {
      'energy-saving': '节能环保技术',
      'clean-energy': '清洁能源技术',
      'clean-production': '清洁生产技术',
      'new-energy-vehicle': '新能源汽车技术'
    };
    return categoryMap[categoryId] || '技术';
  };

  // 获取当前选中主分类的子分类
  const getCurrentSubCategories = () => {
    if (selectedMainCategory === null) return [];
    const mainCategory = mainCategories.find(cat => cat.id === selectedMainCategory);
    return mainCategory?.subCategories || [];
  };

  // 显示加载状态
  if (isLoadingFilter) {
    return (
      <section className="bg-green-50">
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 获取当前选中省份的经开区
  const getCurrentDevelopmentZones = () => {
    if (filters.country !== 'china' || filters.province === null) return [];
    return developmentZones;
  };

  return (
    <section style={{backgroundColor: '#edeef7'}}>
      {/* 标题部分 */}
      <div className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            {/* 左侧橄榄枝装饰 */}
            <div className="hidden md:flex flex-1 items-center justify-end mr-6 lg:mr-8">
              <svg className="w-20 lg:w-32 h-8 lg:h-12 text-green-500" fill="none" viewBox="0 0 160 48">
                {/* 橄榄枝主茎 */}
                <path d="M20 24 Q50 20, 80 24 Q110 28, 140 24" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8"/>
                {/* 左侧叶片组 */}
                <ellipse cx="35" cy="18" rx="8" ry="4" fill="currentColor" opacity="0.6" transform="rotate(-30 35 18)"/>
                <ellipse cx="42" cy="30" rx="7" ry="3.5" fill="currentColor" opacity="0.5" transform="rotate(25 42 30)"/>
                {/* 中央叶片组 */}
                <ellipse cx="65" cy="16" rx="9" ry="4.5" fill="currentColor" opacity="0.7" transform="rotate(-20 65 16)"/>
                <ellipse cx="75" cy="32" rx="8" ry="4" fill="currentColor" opacity="0.6" transform="rotate(30 75 32)"/>
                {/* 右侧叶片组 */}
                <ellipse cx="105" cy="18" rx="7" ry="3.5" fill="currentColor" opacity="0.5" transform="rotate(-35 105 18)"/>
                <ellipse cx="115" cy="30" rx="8" ry="4" fill="currentColor" opacity="0.6" transform="rotate(20 115 30)"/>
                {/* 末端小叶片 */}
                <ellipse cx="130" cy="22" rx="6" ry="3" fill="currentColor" opacity="0.7" transform="rotate(-15 130 22)"/>
                <ellipse cx="135" cy="26" rx="5" ry="2.5" fill="currentColor" opacity="0.5" transform="rotate(15 135 26)"/>
              </svg>
            </div>
            
            {/* 标题文字 */}
            <h2 className="text-2xl md:text-3xl font-bold text-green-600 text-center">
              {t('searchTitle')}
            </h2>
            
            {/* 右侧橄榄枝装饰 */}
            <div className="hidden md:flex flex-1 items-center justify-start ml-6 lg:ml-8">
              <svg className="w-20 lg:w-32 h-8 lg:h-12 text-green-500" fill="none" viewBox="0 0 160 48" style={{transform: 'scaleX(-1)'}}>
                {/* 橄榄枝主茎 */}
                <path d="M20 24 Q50 20, 80 24 Q110 28, 140 24" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8"/>
                {/* 左侧叶片组 */}
                <ellipse cx="35" cy="18" rx="8" ry="4" fill="currentColor" opacity="0.6" transform="rotate(-30 35 18)"/>
                <ellipse cx="42" cy="30" rx="7" ry="3.5" fill="currentColor" opacity="0.5" transform="rotate(25 42 30)"/>
                {/* 中央叶片组 */}
                <ellipse cx="65" cy="16" rx="9" ry="4.5" fill="currentColor" opacity="0.7" transform="rotate(-20 65 16)"/>
                <ellipse cx="75" cy="32" rx="8" ry="4" fill="currentColor" opacity="0.6" transform="rotate(30 75 32)"/>
                {/* 右侧叶片组 */}
                <ellipse cx="105" cy="18" rx="7" ry="3.5" fill="currentColor" opacity="0.5" transform="rotate(-35 105 18)"/>
                <ellipse cx="115" cy="30" rx="8" ry="4" fill="currentColor" opacity="0.6" transform="rotate(20 115 30)"/>
                {/* 末端小叶片 */}
                <ellipse cx="130" cy="22" rx="6" ry="3" fill="currentColor" opacity="0.7" transform="rotate(-15 130 22)"/>
                <ellipse cx="135" cy="26" rx="5" ry="2.5" fill="currentColor" opacity="0.5" transform="rotate(15 135 26)"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 上部分：搜索栏 */}
      <div className="pt-4 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* 搜索按钮 */}
            <button
              onClick={handleSearch}
              className="w-32 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
{common('search')}
            </button>
            
            {/* 我要加入按钮 */}
            <button
              onClick={() => {
                if (loading) {
                  return; // 还在检查登录状态，暂不处理
                }
                
                if (!user) {
                  // 用户未登录，显示提示并打开登录弹窗
                  alert(t('loginRequired'));
                  if (onOpenAuth) {
                    onOpenAuth();
                  }
                } else {
                  // 用户已登录，跳转到用户控制台-技术维护页面
                  router.push('/user/technologies');
                }
              }}
              disabled={loading}
              className="w-32 px-8 py-3 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 hover:border-green-700 hover:text-green-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" style={{ color: '#059669' }} />
{t('joinUs')}
            </button>
          </div>
          
          {/* 热门搜索 */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
{t('popularSearches')}:
              </span>
              {(() => {
                const popularSearchTags = {
                  zh: ['零碳园区', '太阳能光伏', '绿色建筑', '虚拟电厂', '氢能'],
                  en: ['Zero-Carbon Park', 'Solar Photovoltaic', 'Green Building', 'Virtual Power Plant', 'Hydrogen Energy']
                };
                return (locale === 'en' ? popularSearchTags.en : popularSearchTags.zh);
              })().map((tag, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setKeyword(tag);
                    onSearch(tag);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 rounded-full hover:bg-green-50 hover:text-green-600 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 下部分：筛选器 */}
      <div className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* 筛选状态指示器 */}
            {(isFilterLoading || (() => {
              const activeFilters = Object.values(filters).filter(v => v !== null).length;
              return activeFilters > 0;
            })()) && (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  {isFilterLoading && (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <span className="text-sm text-gray-600">
                        {locale === 'en' ? 'Updating results...' : '正在更新结果...'}
                      </span>
                    </>
                  )}
                  
                  {/* 应用的筛选条件计数 */}
                  {(() => {
                    const activeFilters = Object.values(filters).filter(v => v !== null).length;
                    return activeFilters > 0 ? (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {locale === 'en' 
                          ? `${activeFilters} filters active`
                          : `${activeFilters} 个筛选条件`
                        }
                      </span>
                    ) : null;
                  })()}
                  
                  {/* 重置筛选按钮 */}
                  {(() => {
                    const activeFilters = Object.values(filters).filter(v => v !== null).length;
                    return activeFilters > 0 ? (
                      <button
                        onClick={handleResetFilters}
                        disabled={isFilterLoading}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-full border border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {locale === 'en' ? 'Reset filters' : '重置筛选'}
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 产业分类 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('categoryLabel')}</label>
              <select
                value={selectedMainCategory || 'all'}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isFilterLoading}
              >
                <option value="all">{t('allCategories')}</option>
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 子分类 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('subCategoryLabel')}</label>
              <select
                value={filters.subCategory || 'all'}
                onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={selectedMainCategory === null || isFilterLoading}
              >
                <option value="all">{t('allSubCategories')}</option>
                {getCurrentSubCategories().map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 国别 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('countryLabel')}</label>
              <Select 
                value={filters.country || 'all'} 
                onValueChange={(value) => handleFilterChange('country', value)}
                disabled={isFilterLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('allCountries')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">{t('allCountries')}</div>
                  </SelectItem>
                  {transformFilterDataForComponents(filterData, locale).countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      <div className="flex items-center gap-2">
                        {country.logo_url && (
                          <Image
                            src={country.logo_url}
                            alt={country.label}
                            width={20}
                            height={14}
                            className="rounded-sm object-cover"
                          />
                        )}
                        <span>{country.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 省份 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('provinceLabel')}</label>
              <select
                value={filters.province || 'all'}
                onChange={(e) => handleFilterChange('province', e.target.value)}
                disabled={filters.country !== 'china' || isFilterLoading}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  filters.country !== 'china' || isFilterLoading ? 'bg-gray-100 text-gray-400' : ''
                }`}
              >
                <option value="all">{t('allProvinces')}</option>
                {provinces.map((province) => (
                  <option key={province.value} value={province.value}>
                    {province.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 国家级经开区 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('developmentZoneLabel')}</label>
              <select
                value={filters.developmentZone || 'all'}
                onChange={(e) => handleFilterChange('developmentZone', e.target.value)}
                disabled={filters.country !== 'china' || filters.province === null || isFilterLoading}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  filters.country !== 'china' || filters.province === null || isFilterLoading ? 'bg-gray-100 text-gray-400' : ''
                }`}
              >
                <option value="all">{t('allDevelopmentZones')}</option>
                {getCurrentDevelopmentZones().map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}