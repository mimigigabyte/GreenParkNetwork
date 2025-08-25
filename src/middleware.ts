import createIntlMiddleware from 'next-intl/middleware';

export default createIntlMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always'
});

export const config = {
  matcher: [
    // 匹配所有路径除了静态文件、API路由和管理员路径
    '/((?!api|admin|_next/static|_next/image|favicon.ico|manifest.json|images|icon-).*)'
  ]
}