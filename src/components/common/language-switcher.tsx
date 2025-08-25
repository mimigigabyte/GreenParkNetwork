'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe, ChevronDown } from 'lucide-react';
import { locales, type Locale } from '@/i18n/request';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale() as Locale;
  const t = useTranslations('header');

  const languages = [
    {
      code: 'zh' as const,
      name: t('chinese'),
      flag: '🇨🇳'
    },
    {
      code: 'en' as const, 
      name: t('english'),
      flag: '🇬🇧'
    }
  ];

  const currentLangData = languages.find(lang => lang.code === currentLocale);

  const handleLanguageChange = (langCode: Locale) => {
    setIsDropdownOpen(false);
    
    // 构建新的路径：替换当前语言为新语言
    const segments = pathname.split('/');
    segments[1] = langCode; // 第一个segment是空字符串，第二个是语言代码
    const newPath = segments.join('/');
    
    router.push(newPath);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
        title={t('language')}
      >
        <Globe className="w-4 h-4" />
        <span className="flex items-center space-x-1">
          <span>{currentLangData?.flag}</span>
          <span>{currentLangData?.name}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isDropdownOpen && (
        <>
          {/* 背景遮罩，点击关闭下拉菜单 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    currentLocale === language.code 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-base">{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLocale === language.code && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}