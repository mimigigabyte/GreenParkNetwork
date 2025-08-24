'use client';

import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh');

  const languages = [
    {
      code: 'zh',
      name: '中文',
      flag: '🇨🇳'
    },
    {
      code: 'en', 
      name: 'English',
      flag: '🇬🇧'
    }
  ];

  const currentLangData = languages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = (langCode: 'zh' | 'en') => {
    setCurrentLanguage(langCode);
    setIsDropdownOpen(false);
    // TODO: 这里可以添加实际的语言切换逻辑
    console.log('切换语言到:', langCode);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
        title="语言切换"
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
                  onClick={() => handleLanguageChange(language.code as 'zh' | 'en')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    currentLanguage === language.code 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-base">{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLanguage === language.code && (
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