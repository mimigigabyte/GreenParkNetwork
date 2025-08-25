'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProductCategory } from '@/api/tech';

interface ProductCategoriesProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  locale?: string;
}

export function ProductCategories({ 
  categories, 
  selectedCategory, 
  onCategorySelect,
  locale 
}: ProductCategoriesProps) {
  const [loadedImages, setLoadedImages] = useState<{[key: number]: string}>({});
  const t = useTranslations('home');

  // 尝试加载不同格式的图片
  const tryLoadImage = async (index: number) => {
    const formats = ['png', 'jpg', 'jpeg', 'webp'];
    
    for (const format of formats) {
      // 直接尝试加载图片，避免fetch被中间件拦截
      const url = `/images/categories/category-${index + 1}.${format}`;
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        setLoadedImages(prev => ({ ...prev, [index]: url }));
        return;
      } catch {
        // 继续尝试下一个格式
      }
    }
  };

  // 组件加载时尝试加载所有图片
  useEffect(() => {
    const loadImages = async () => {
      for (let i = 0; i < Math.min(categories.length, 4); i++) {
        await tryLoadImage(i);
      }
    };
    
    if (categories.length > 0) {
      loadImages();
    }
  }, [categories]);

  return (
    <section className="py-12" style={{backgroundColor: '#edeef7'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center mb-12">
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
            {t('categories')}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {categories.map((category, index) => {
            // 定义每个卡片的背景样式
            const getCardStyle = (index: number) => {
              const styles = [
                'bg-gradient-to-br from-teal-500 to-teal-700', // 第一个 - 青绿色
                'bg-gradient-to-br from-slate-700 to-slate-900', // 第二个 - 深灰色
                'bg-gradient-to-br from-emerald-600 to-emerald-800', // 第三个 - 祖母绿
                'bg-gradient-to-br from-green-700 to-green-900', // 第四个 - 深绿色
              ];
              return styles[index % 4];
            };

            return (
              <div
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`relative cursor-pointer overflow-hidden transition-all duration-300 hover:opacity-90 ${getCardStyle(index)}`}
                style={{
                  height: '300px',
                  backgroundImage: loadedImages[index] 
                    ? `url('${loadedImages[index]}')`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {/* 背景装饰图案 */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-16 h-16 border border-white/20 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border border-white/15 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/10 rounded-full"></div>
                </div>

                                 {/* 选中状态边框 */}
                 {selectedCategory === category.id && (
                   <div className="absolute inset-0 border-3 border-yellow-400"></div>
                 )}

                                 {/* 内容区域 */}
                 <div className="relative p-6 h-full flex flex-col text-white text-center">
                   {/* 顶部标题区域 - 向下调整位置 */}
                   <div className="mt-8 mb-6">
                     <h3 className="text-xl lg:text-2xl font-bold mb-1">
                       {locale === 'en' ? category.nameEn : category.name}
                     </h3>
                     <p className="text-sm text-white/80 uppercase tracking-wider font-medium">
                       {locale === 'en' ? category.name : category.nameEn}
                     </p>
                   </div>

                   {/* 数字统计区域 - 居中定位 */}
                   <div className="flex-1 flex flex-col justify-center items-center">
                     <div className="text-4xl lg:text-5xl font-bold mb-2">
                       {category.count}
                       <span className="text-2xl font-normal">+</span>
                     </div>
                     <div className="text-sm text-white/80 font-medium">
                       {t('relatedTechnology')}
                     </div>
                   </div>

                   
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
} 