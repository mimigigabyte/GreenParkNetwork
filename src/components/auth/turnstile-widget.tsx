'use client';

import { useEffect, useRef, useState } from 'react';
import { shouldSkipTurnstile, getEnvironmentInfo } from '@/lib/environment';

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: (error: any) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  tabindex?: number;
  'response-field'?: boolean;
  'response-field-name'?: string;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: (error: any) => void;
  onExpired?: () => void;
  onTimeout?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
}

export function TurnstileWidget({
  siteKey,
  onSuccess,
  onError,
  onExpired,
  onTimeout,
  theme = 'auto',
  size = 'normal',
  className = ''
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否应该跳过Turnstile验证
  const skipTurnstile = shouldSkipTurnstile();
  
  // 如果是本地环境，直接调用成功回调
  useEffect(() => {
    if (skipTurnstile) {
      const envInfo = getEnvironmentInfo();
      console.log('🏠 本地环境检测到，自动跳过Turnstile验证:', envInfo);
      // 模拟一个成功的token
      onSuccess('localhost-bypass-token');
    }
  }, [skipTurnstile, onSuccess]);

  // 本地环境显示跳过提示
  if (skipTurnstile) {
    return (
      <div className={`turnstile-local-bypass ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                本地开发环境 - 已自动跳过人机验证
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 加载Turnstile脚本
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setError('Failed to load Turnstile script');
    };

    // 检查脚本是否已经加载
    if (!document.querySelector('script[src*="turnstile"]')) {
      document.head.appendChild(script);
    } else if (window.turnstile) {
      setIsLoaded(true);
    }

    return () => {
      // 清理脚本（如果需要）
    };
  }, []);

  // 渲染Turnstile小部件
  useEffect(() => {
    if (isLoaded && window.turnstile && containerRef.current && !widgetIdRef.current) {
      try {
        const options: TurnstileOptions = {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log('Turnstile验证成功，获得token:', token);
            onSuccess(token);
          },
          'error-callback': (error: any) => {
            console.error('Turnstile验证错误:', error);
            setError('人机验证失败，请重试');
            onError?.(error);
          },
          'expired-callback': () => {
            console.warn('Turnstile验证已过期');
            setError('验证已过期，请重新验证');
            onExpired?.();
          },
          'timeout-callback': () => {
            console.warn('Turnstile验证超时');
            setError('验证超时，请重试');
            onTimeout?.();
          },
          theme,
          size
        };

        widgetIdRef.current = window.turnstile.render(containerRef.current, options);
      } catch (err) {
        console.error('Turnstile渲染错误:', err);
        setError('加载人机验证失败');
      }
    }
  }, [isLoaded, siteKey, onSuccess, onError, onExpired, onTimeout, theme, size]);

  // 重置小部件
  const reset = () => {
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
      setError(null);
    }
  };

  // 获取当前响应token
  const getResponse = () => {
    if (window.turnstile && widgetIdRef.current) {
      return window.turnstile.getResponse(widgetIdRef.current);
    }
    return null;
  };

  // 清理小部件
  useEffect(() => {
    return () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          console.warn('Turnstile清理错误:', err);
        }
      }
    };
  }, []);

  if (error) {
    return (
      <div className={`turnstile-error ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={reset}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`turnstile-loading ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00b899]"></div>
            <span className="ml-3 text-sm text-gray-600">加载人机验证...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`turnstile-container ${className}`}>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}

export default TurnstileWidget;