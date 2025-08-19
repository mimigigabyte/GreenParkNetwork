'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Mail, ArrowUp } from 'lucide-react';

export function FloatingActions() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContact = () => {
    // 处理联系我们逻辑
    console.log('联系我们');
  };

  const handleConsultation = () => {
    // 处理在线咨询逻辑
    console.log('在线咨询');
  };

  return (
    <div className="fixed right-6 bottom-6 z-50 space-y-3">
      {/* 在线咨询 */}
      <button
        onClick={handleConsultation}
        className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 group"
        title="在线咨询"
      >
        <MessageCircle className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
        <span className="absolute right-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          在线咨询
        </span>
      </button>

      {/* 联系我们 */}
      <button
        onClick={handleContact}
        className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 group"
        title="联系我们"
      >
        <Mail className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
        <span className="absolute right-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          联系我们
        </span>
      </button>

      {/* 返回顶部 */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 group"
          title="返回顶部"
        >
          <ArrowUp className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
          <span className="absolute right-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            返回顶部
          </span>
        </button>
      )}
    </div>
  );
} 