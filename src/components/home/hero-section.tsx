'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/auth/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface CarouselImage {
  id: string
  title_zh?: string
  title_en?: string
  description_zh?: string
  description_en?: string
  image_url: string
  link_url?: string
  sort_order: number
  is_active: boolean
}

interface HeroSectionProps {
  onOpenAuth?: () => void;
}

export function HeroSection({ onOpenAuth }: HeroSectionProps) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('home');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  
  // 检测当前语言
  const locale = pathname.startsWith('/en') ? 'en' : 'zh';

  // 从数据库加载轮播图
  useEffect(() => {
    const loadCarouselImages = async () => {
      try {
        setIsLoadingImages(true);
        const response = await fetch('/api/public/carousel');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setCarouselImages(result.data);
        } else {
          // 如果没有数据库轮播图，使用默认图片
          setCarouselImages([{
            id: 'default',
            image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            title_zh: '国家级经开区绿色技术产品推广平台',
            title_en: 'National Economic Development Zone Green Low-Carbon Technology Promotion Platform',
            description_zh: '推动可持续发展，共建绿色未来',
            description_en: 'Driving sustainable development, building a green future together',
            sort_order: 1,
            is_active: true
          }]);
        }
      } catch (error) {
        console.error('加载轮播图失败:', error);
        // 错误时使用默认图片
        setCarouselImages([{
          id: 'default',
          image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
          title_zh: '国家级经开区绿色技术产品推广平台',
          title_en: 'National Economic Development Zone Green Low-Carbon Technology Promotion Platform',
          description_zh: '推动可持续发展，共建绿色未来',
          description_en: 'Driving sustainable development, building a green future together',
          sort_order: 1,
          is_active: true
        }]);
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadCarouselImages();
  }, []);

  // 自动轮播
  useEffect(() => {
    if (carouselImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % carouselImages.length
      );
    }, 8000); // 每8秒切换一次

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // 手动切换到指定图片
  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  // 处理企业入库申报按钮点击
  const handleCompanyRegisterClick = () => {
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
  };

  // 获取当前轮播图
  const currentImage = carouselImages[currentImageIndex];

  // 检查当前轮播图是否有文字内容
  const hasTextContent = (locale === 'en' ? (currentImage?.title_en || currentImage?.description_en) : (currentImage?.title_zh || currentImage?.description_zh));

  // 处理轮播图点击
  const handleImageClick = () => {
    if (currentImage?.link_url) {
      if (currentImage.link_url.startsWith('http')) {
        window.open(currentImage.link_url, '_blank');
      } else {
        router.push(currentImage.link_url);
      }
    }
  };

  if (isLoadingImages) {
    return (
      <section className="relative h-[600px] bg-gradient-to-r from-green-600 to-green-800 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p>{t('loading')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[600px] bg-gradient-to-r from-green-600 to-green-800 overflow-hidden">
      {/* 背景图片轮播 */}
      {carouselImages.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          } ${image.link_url ? 'cursor-pointer' : ''}`}
          style={{
            backgroundImage: `url('${image.image_url}')`,
          }}
          onClick={image.link_url ? handleImageClick : undefined}
        >
          {/* 渐变遮罩 - 只在有文字内容时显示 */}
          {hasTextContent && (
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          )}
        </div>
      ))}

      {/* 轮播控制器 - 只显示指示器点 */}
      {carouselImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? 'bg-white scale-110'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`切换到第${index + 1}张图片`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 内容 - 只在有文字内容时显示 */}
      {hasTextContent && (
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-relaxed">
              {(() => {
                const title = locale === 'en' ? currentImage?.title_en : currentImage?.title_zh;
                if (title) {
                  return title.split('\n').map((line, index, arr) => (
                    <span key={index}>
                      {line}
                      {index < arr.length - 1 && <br />}
                    </span>
                  ));
                } else {
                  // 默认标题，根据语言显示
                  return locale === 'en' ? (
                    <>
                      Supporting National Economic Development Zones with
                      <br />
                      Professional and Precise Green Technology Solutions
                    </>
                  ) : (
                    <>
                      支撑国家级经开区常态化、专业化、
                      <br />
                      精准化优选应用绿色技术产品
                    </>
                  );
                }
              })()}
            </h2>
            <p className="text-xl md:text-2xl font-medium leading-relaxed mb-12">
              {(() => {
                const description = locale === 'en' ? currentImage?.description_en : currentImage?.description_zh;
                if (description) {
                  return description;
                } else {
                  // 默认描述，根据语言显示
                  return locale === 'en' 
                    ? 'Promoting green transformation of industrial parks and accelerating green industry development in national economic development zones'
                    : '推动园区绿色转型，加速国家级经开区绿色产业发展';
                }
              })()}
            </p>
            
            {/* 入库申报按钮 */}
            <button 
              onClick={handleCompanyRegisterClick}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-semibold text-base rounded-full shadow-md hover:shadow-lg hover:from-emerald-500 hover:to-teal-600 transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t('companyRegistration')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
} 