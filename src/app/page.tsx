'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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

export default function HomePage() {
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<TechProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
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

  // 加载产品数据
  useEffect(() => {
    const loadProducts = async () => {
      // 允许无分类加载所有产品
      
      try {
        const searchParams: SearchParams = {
          category: selectedCategory,
          page: currentPage,
          pageSize: 20,
          sortBy: currentSort
        };
        
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
  }, [selectedCategory, currentPage, currentSort]);

  // 处理分类选择
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
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
  const handleFilterChange = async (filters: any) => {
    try {
      const searchParams: SearchParams = {
        category: filters.category === 'all' ? undefined : filters.category,
        subCategory: filters.subCategory === 'all' ? undefined : filters.subCategory,
        country: filters.country === 'all' ? undefined : filters.country,
        province: filters.province === 'all' ? undefined : filters.province,
        developmentZone: filters.developmentZone === 'all' ? undefined : filters.developmentZone,
        page: 1,
        pageSize: 20,
        sortBy: currentSort
      };
      
      const response = await searchTechProducts(searchParams);
      if (response.success && response.data) {
        setProducts(response.data.products);
        setTotalPages(Math.ceil(response.data.total / response.data.pageSize));
        setCurrentPage(1);
        
        // 如果筛选条件包含分类变化，更新selectedCategory状态
        if (filters.category && filters.category !== 'all' && filters.category !== selectedCategory) {
          setSelectedCategory(filters.category);
        } else if (filters.category === 'all') {
          setSelectedCategory('');
        }
        
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
            <p className="mt-4 text-gray-600">加载中...</p>
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
        />
        
        <SearchFilter
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onOpenAuth={openAuthModal}
          totalResults={getCurrentCategoryCount()}
          currentCategory={selectedCategory}
        />
        
        <SearchResults
          products={products}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalResults={getCurrentCategoryCount()}
          currentCategory={selectedCategory}
          companyCount={companyCount}
          technologyCount={technologyCount}
          onSortChange={handleSortChange}
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