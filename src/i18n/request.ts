import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// 支持的语言列表
export const locales = ['zh', 'en'] as const;
export type Locale = typeof locales[number];

// 默认语言
export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  // Fallback to default locale if undefined
  const resolvedLocale = locale || defaultLocale;
  
  return {
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
    locale: resolvedLocale
  };
});