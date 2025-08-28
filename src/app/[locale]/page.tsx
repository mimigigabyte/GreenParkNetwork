'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/home/hero-section';
import { ProductCategories } from '@/components/home/product-categories';
import { SearchFilter } from '@/components/home/search-filter';
import { SearchResults } from '@/components/home/search-results';
import { FloatingActions } from '@/components/home/floating-actions';
import { AuthModal } from '@/components/auth/auth-modal';
import { ProductCategory, TechProduct, SearchParams, SortType, getProductCategories, searchTechProducts, getSearchStats } from '@/api/tech';
import { useAuthContext } from '@/components/auth/auth-provider';

interface PageProps {
  params: { locale: string };
}

// 分离SearchParams逻辑的组件
function HomePageContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const t = useTranslations('home');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<TechProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // 统一的筛选状态管理
  const [filterState, setFilterState] = useState({
    category: null as string | null,
    subCategory: null as string | null,
    country: null as string | null,
    province: null as string | null,
    developmentZone: null as string | null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSort, setCurrentSort] = useState<SortType>('updateTime');
  
  // 新增状态：企业数量和技术数量
  const [companyCount, setCompanyCount] = useState(39);
  const [technologyCount, setTechnologyCount] = useState(400);

  // 登录弹窗状态
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 监听用户登录状态，登录成功后关闭模态框
  useEffect(() => {
    if (user && isAuthModalOpen) {
      console.log('用户已登录，关闭认证模态框');
      setIsAuthModalOpen(false);
    }
  }, [user, isAuthModalOpen]);

  // 打开登录弹窗
  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  // 关闭登录弹窗
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // 处理魔法链接登录成功
  const handleMagicLinkLogin = () => {
    console.log('魔法链接登录成功');
    setIsAuthModalOpen(false);
    
    // 清除URL中的魔法链接参数
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = ''; // 清除哈希参数
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  // 检查URL参数和哈希值，处理邮件链接跳转
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'register' || action === 'login' || action === 'reset-password') {
      setIsAuthModalOpen(true);
    }
    
    // 处理 Supabase 魔法链接的哈希值
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('access_token=') || hash.includes('type=recovery')) {
        // 如果是魔法链接访问，自动打开认证弹窗
        setIsAuthModalOpen(true);
        
        // Supabase 会自动处理认证，我们只需要监听状态变化
        console.log('检测到 Supabase 魔法链接访问');
      }
    }
  }, [searchParams]);

  // 加载初始数据
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      try {
        // 加载分类数据
        const categoriesResponse = await getProductCategories();
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
          
          // 首页默认显示所有技术，不自动选择分类
          // setSelectedCategory('') - 已经在初始状态中设置为空字符串
        }
        
        // 加载统计数据
        const statsResponse = await getSearchStats({});
        if (statsResponse.success && statsResponse.data) {
          setCompanyCount(statsResponse.data.companyCount);
          setTechnologyCount(statsResponse.data.technologyCount);
        }
        
      } catch (error) {
        console.error('加载初始数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // 加载产品数据 - 使用统一的筛选状态
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const searchParams: SearchParams = {
          category: filterState.category || selectedCategory || undefined,
          subCategory: filterState.subCategory || undefined,
          country: filterState.country || undefined,
          province: filterState.province || undefined,
          developmentZone: filterState.developmentZone || undefined,
          page: currentPage,
          pageSize: 20,
          sortBy: currentSort
        };
        
        console.log('🔍 loadProducts 使用统一筛选状态:', {
          filterState,
          selectedCategory,
          finalSearchParams: searchParams
        });
        
        const response = await searchTechProducts(searchParams);
        if (response.success && response.data) {
          setProducts(response.data.products);
          setTotalPages(Math.ceil(response.data.total / response.data.pageSize));
          
          // 更新统计数据
          if (response.data.stats) {
            setCompanyCount(response.data.stats.companyCount);
            setTechnologyCount(response.data.stats.technologyCount);
          }
        }
      } catch (error) {
        console.error('加载产品数据失败:', error);
      }
    };

    loadProducts();
  }, [selectedCategory, currentPage, currentSort, filterState]);

  // 处理分类选择
  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    
    // 更新统一的筛选状态，保持所有现有筛选条件
    const newFilterState = {
      ...filterState,
      category: categoryId || null
    };
    
    setFilterState(newFilterState);
    
    // 构建完整的搜索参数，确保所有筛选条件都被保持
    const searchParams: SearchParams = {
      category: categoryId || undefined,
      subCategory: newFilterState.subCategory || undefined,
      country: newFilterState.country || undefined,
      province: newFilterState.province || undefined,
      developmentZone: newFilterState.developmentZone || undefined,
      page: 1,
      pageSize: 20,
      sortBy: currentSort
    };
    
    console.log('🔍 左侧分类选择统一状态管理:', {
      selectedCategory: categoryId,
      previousFilterState: filterState,
      newFilterState,
      finalSearchParams: searchParams
    });
    
    try {
      const response = await searchTechProducts(searchParams);
      if (response.success && response.data) {
        setProducts(response.data.products);
        setTotalPages(Math.ceil(response.data.total / response.data.pageSize));
        
        // 更新统计数据
        if (response.data.stats) {
          setCompanyCount(response.data.stats.companyCount);
          setTechnologyCount(response.data.stats.technologyCount);
        }
      }
    } catch (error) {
      console.error('分类选择查询失败:', error);
    }
  };

  // 处理搜索
  const handleSearch = async (keyword: string) => {
    try {
      const searchParams: SearchParams = {
        keyword,
        category: selectedCategory,
        page: 1,
        pageSize: 20,
        sortBy: currentSort
      };
      
      const response = await searchTechProducts(searchParams);
      if (response.success && response.data) {
        setProducts(response.data.products);
        setTotalPages(Math.ceil(response.data.total / response.data.pageSize));
        setCurrentPage(1);
        
        // 更新统计数据
        if (response.data.stats) {
          setCompanyCount(response.data.stats.companyCount);
          setTechnologyCount(response.data.stats.technologyCount);
        }
      }
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  // 处理筛选
  const handleFilterChange = async (filters: {
    category: string | null;
    subCategory: string | null;
    country: string | null;
    province: string | null;
    developmentZone: string | null;
  }) => {
    try {
      console.log('🔍 HomePage handleFilterChange 接收到筛选条件:', {
        incomingFilters: filters,
        currentFilterState: filterState,
        currentSelectedCategory: selectedCategory
      });
      
      // 更新统一的筛选状态
      setFilterState(filters);
      
      // 如果筛选条件包含分类变化，同步更新selectedCategory状态
      if (filters.category && filters.category !== selectedCategory) {
        console.log('🔍 HomePage 同步更新左侧分类选择:', filters.category);
        setSelectedCategory(filters.category);
      } else if (filters.category === null && selectedCategory) {
        console.log('🔍 HomePage 筛选面板选择全部分类，清除左侧分类选择');
        setSelectedCategory('');
      }
      
      // 构建完整的搜索参数，直接使用筛选条件（不再有冲突的状态合并）
      const searchParams: SearchParams = {
        category: filters.category || undefined,
        subCategory: filters.subCategory || undefined,
        country: filters.country || undefined,
        province: filters.province || undefined,
        developmentZone: filters.developmentZone || undefined,
        page: 1,
        pageSize: 20,
        sortBy: currentSort
      };
      
      console.log('🔍 HomePage 构建最终查询参数:', { 
        统一筛选状态: filters,
        finalSearchParams: searchParams,
        详细字段检查: {
          category: searchParams.category,
          subCategory: searchParams.subCategory,
          country: searchParams.country,
          province: searchParams.province,
          developmentZone: searchParams.developmentZone
        }
      });
      
      const response = await searchTechProducts(searchParams);
      console.log('🔍 HomePage 查询响应结果:', {
        success: response.success,
        productCount: response.data?.products?.length || 0,
        total: response.data?.total || 0,
        查询参数回显: searchParams
      });
      
      if (response.success && response.data) {
        setProducts(response.data.products);
        setTotalPages(Math.ceil(response.data.total / response.data.pageSize));
        setCurrentPage(1);
        
        // 更新统计数据
        if (response.data.stats) {
          setCompanyCount(response.data.stats.companyCount);
          setTechnologyCount(response.data.stats.technologyCount);
        }
      }
    } catch (error) {
      console.error('筛选失败:', error);
    }
  };

  // 处理排序
  const handleSortChange = (sortType: SortType) => {
    setCurrentSort(sortType);
    setCurrentPage(1);
    // 排序逻辑通过useEffect中的loadProducts处理
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 分页逻辑通过useEffect中的loadProducts处理
  };

  // 获取当前分类的产品数量
  const getCurrentCategoryCount = () => {
    const category = categories.find(cat => cat.id === selectedCategory);
    return category?.count || 0;
  };

  // 获取当前分类名称
  const getCurrentCategoryName = () => {
    const category = categories.find(cat => cat.id === selectedCategory);
    return category?.name || '技术';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        <HeroSection onOpenAuth={openAuthModal} />
        
        <ProductCategories
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          locale={locale}
        />
        
        <SearchFilter
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onOpenAuth={openAuthModal}
          totalResults={getCurrentCategoryCount()}
          currentCategory={selectedCategory}
          currentFilters={filterState}
          locale={locale}
        />
        
        <SearchResults
          products={products}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalResults={products.length}
          currentCategory={selectedCategory}
          onSortChange={handleSortChange}
          locale={locale}
        />
      </main>
      
      <Footer />
      <FloatingActions />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialAction={searchParams.get('action') as 'register' | 'login' | 'reset-password' | null}
      />
    </div>
  );
}

// 主组件，用Suspense包装
export default function HomePage({ params: { locale } }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{locale === 'en' ? 'Loading...' : '加载中...'}</p>
          </div>
        </div>
      </div>
    }>
      <HomePageContent locale={locale} />
    </Suspense>
  );
}