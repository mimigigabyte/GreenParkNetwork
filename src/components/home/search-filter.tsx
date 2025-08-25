import { useState, useEffect } from 'react';
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

interface SearchFilterProps {
  onSearch: (keyword: string) => void;
  onFilterChange: (filters: any) => void;
  onOpenAuth?: () => void;
  totalResults: number;
  currentCategory: string;
  locale?: string;
}

export function SearchFilter({ 
  onSearch, 
  onFilterChange, 
  onOpenAuth,
  totalResults, 
  currentCategory,
  locale 
}: SearchFilterProps) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const t = useTranslations('home');
  const common = useTranslations('common');
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    subCategory: 'all',
    country: 'all',
    province: 'all',
    developmentZone: 'all'
  });
  
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('all');
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

  const handleSearch = () => {
    onSearch(keyword);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // 如果选择了新的主分类，重置子分类
    if (key === 'category' && value !== 'all') {
      newFilters.subCategory = 'all';
      setSelectedMainCategory(value);
    }
    
    // 如果选择了非中国，重置省份选择
    if (key === 'country' && value !== 'china') {
      newFilters.province = 'all';
      newFilters.developmentZone = 'all';
      setProvinces([]);
      setDevelopmentZones([]);
    }
    
    // 如果选择了中国，加载省份数据
    if (key === 'country' && value === 'china') {
      // 查找中国的ID
      const chinaCountry = filterData.countries.find(c => c.code === 'china');
      if (chinaCountry) {
        loadProvinces(chinaCountry.id).then(provincesData => {
          const transformedProvinces = provincesData.map(p => ({
            value: p.code,
            label: locale === 'en' ? (p.name_en || p.name_zh) : p.name_zh
          }));
          setProvinces(transformedProvinces);
        });
      }
    }
    
    // 如果选择了新的省份，重置经开区选择并加载新的经开区
    if (key === 'province' && value !== 'all') {
      newFilters.developmentZone = 'all';
      // 查找省份ID
      const province = filterData.provinces.find(p => p.code === value);
      if (province) {
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
        });
      }
    }
    
    // 如果选择了all省份，清空经开区
    if (key === 'province' && value === 'all') {
      setDevelopmentZones([]);
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleMainCategoryChange = (categoryId: string) => {
    setSelectedMainCategory(categoryId);
    handleFilterChange('category', categoryId);
  };

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
    if (selectedMainCategory === 'all') return [];
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
    if (filters.country !== 'china' || filters.province === 'all') return [];
    return developmentZones;
  };

  return (
    <section style={{backgroundColor: '#edeef7'}}>
      {/* 标题部分 */}
      <div className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            {/* 左侧装饰图案 */}
            <div className="hidden md:flex flex-1 items-center justify-end mr-6 lg:mr-8">
              <svg className="w-16 lg:w-24 h-6 lg:h-8 text-green-500" fill="currentColor" viewBox="0 0 200 32">
                <path d="M0 16 C20 8, 40 24, 60 16 C80 8, 100 24, 120 16 C140 8, 160 24, 180 16 L200 16" 
                      stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="30" cy="16" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="90" cy="16" r="2.5" fill="currentColor" opacity="0.4"/>
                <circle cx="150" cy="16" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="170" cy="16" r="2" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            
            {/* 标题文字 */}
            <h2 className="text-2xl md:text-3xl font-bold text-green-600 text-center">
              {t('searchTitle')}
            </h2>
            
            {/* 右侧装饰图案 */}
            <div className="hidden md:flex flex-1 items-center justify-start ml-6 lg:ml-8">
              <svg className="w-16 lg:w-24 h-6 lg:h-8 text-green-500" fill="currentColor" viewBox="0 0 200 32">
                <path d="M200 16 C180 8, 160 24, 140 16 C120 8, 100 24, 80 16 C60 8, 40 24, 20 16 L0 16" 
                      stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="170" cy="16" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="110" cy="16" r="2.5" fill="currentColor" opacity="0.4"/>
                <circle cx="50" cy="16" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="30" cy="16" r="2" fill="currentColor" opacity="0.3"/>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 产业分类 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('categoryLabel')}</label>
              <select
                value={selectedMainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                value={filters.subCategory}
                onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={selectedMainCategory === 'all'}
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
              <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
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
                value={filters.province}
                onChange={(e) => handleFilterChange('province', e.target.value)}
                disabled={filters.country !== 'china'}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  filters.country !== 'china' ? 'bg-gray-100 text-gray-400' : ''
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
                value={filters.developmentZone}
                onChange={(e) => handleFilterChange('developmentZone', e.target.value)}
                disabled={filters.country !== 'china' || filters.province === 'all'}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  filters.country !== 'china' || filters.province === 'all' ? 'bg-gray-100 text-gray-400' : ''
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