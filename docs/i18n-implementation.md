# 中英文双语国际化功能实现文档

## 项目概述

本项目成功实现了基于 Next.js 14 App Router 的中英文双语国际化功能，支持动态数据的多语言显示。

## 核心功能

### 1. 多语言路由系统
- **路由结构**: `/[locale]/page.tsx` 动态路由
- **支持语言**: 中文 (zh)、英文 (en)  
- **URL 格式**: `/zh/...` 和 `/en/...`
- **自动重定向**: 访问根路径 `/` 自动跳转到 `/zh`

### 2. 动态数据多语言支持
- **产品分类**: 使用 `nameEn` 字段显示英文分类名
- **公司信息**: 使用 `companyNameEn` 字段显示英文公司名  
- **日期本地化**: 根据语言显示不同的日期格式
- **UI 标签**: 界面文本根据当前语言动态切换

### 3. 语言切换功能
- **页面级切换器**: 每个页面顶部的语言按钮
- **实时切换**: 点击即可切换语言，URL 自动更新
- **状态保持**: 当前语言高亮显示

## 技术架构

### 文件结构
```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx          # 语言布局
│   │   ├── page.tsx           # 多语言首页
│   │   └── demo/
│   │       └── page.tsx       # 动态数据演示
│   ├── layout.tsx             # 根布局
│   └── page.tsx              # 根路径重定向
├── utils/
│   └── i18n-data.ts          # 多语言工具函数
├── middleware.ts             # 国际化中间件
└── i18n/
    └── request.ts           # next-intl 配置
```

### 核心组件

#### 1. 多语言工具函数 (`src/utils/i18n-data.ts`)
```typescript
// 通用多语言文本处理
export function getLocalizedText(zhText: string, enText: string, locale: string): string

// 分类名称本地化  
export function getCategoryName(category: {name: string; nameEn: string}, locale: string): string

// 公司名称本地化
export function getCompanyName(company: {companyName: string; companyNameEn: string}, locale: string): string

// 日期格式本地化
export function formatDate(dateString: string, locale: string): string

// UI标签本地化
export function getLocalizedLabels(locale: string): object
```

#### 2. 路由配置 (`src/app/[locale]/layout.tsx`)
```typescript
export function generateStaticParams() {
  return [
    { locale: 'zh' },
    { locale: 'en' }
  ]
}
```

#### 3. 中间件配置 (`src/middleware.ts`)
```typescript
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always'
});
```

## 数据库字段要求

为支持多语言功能，数据库表需要包含以下英文字段：

### 产品分类表
- `name` (中文名称)
- `nameEn` (英文名称)

### 技术产品表  
- `companyName` (中文公司名)
- `companyNameEn` (英文公司名)
- `solutionTitle` (解决方案标题)
- `solutionTitleEn` (英文解决方案标题) *可选*

### 地区数据表
- `countryName` (中文国家名)
- `countryNameEn` (英文国家名)
- `provinceName` (中文省份名)  
- `provinceNameEn` (英文省份名) *可选*

## 使用方法

### 1. 在组件中获取当前语言
```typescript
interface PageProps {
  params: { locale: string }
}

export default function MyPage({ params }: PageProps) {
  const currentLocale = params.locale; // 'zh' 或 'en'
  // ...
}
```

### 2. 显示多语言数据
```typescript
import { getCategoryName, getCompanyName } from '@/utils/i18n-data';

// 显示分类名称
const categoryDisplay = getCategoryName(category, params.locale);

// 显示公司名称  
const companyDisplay = getCompanyName(product, params.locale);

// 条件渲染
{params.locale === 'zh' ? '中文内容' : 'English Content'}
```

### 3. 创建语言切换器
```typescript
import Link from 'next/link';

<Link href="/zh/current-page">🇨🇳 中文</Link>
<Link href="/en/current-page">🇬🇧 English</Link>
```

## 性能优化

1. **静态生成**: 使用 `generateStaticParams` 预生成语言路由
2. **条件渲染**: 避免不必要的数据处理和 API 调用
3. **模块化工具**: 可复用的多语言处理函数
4. **服务端渲染**: 首屏加载即显示正确语言内容

## 测试验证

### 功能测试
1. 访问 `/zh` 查看中文内容
2. 访问 `/en` 查看英文内容
3. 点击语言切换器测试切换功能
4. 访问 `/zh/demo` 查看动态数据演示

### 数据测试
1. 分类名称正确显示中英文
2. 公司名称正确显示中英文
3. 日期格式符合语言习惯
4. UI 标签完全本地化

## 扩展功能建议

### 1. 更多语言支持
- 在 `locales` 数组中添加新语言代码
- 在 `generateStaticParams` 中添加对应配置
- 添加相应的翻译逻辑

### 2. 翻译文件管理
- 集成 next-intl 的翻译文件系统
- 使用 JSON 文件管理静态翻译内容
- 支持命名空间和嵌套结构

### 3. SEO 优化
- 添加 `hreflang` 标签
- 本地化的 meta 标题和描述
- 结构化数据的多语言支持

### 4. 用户体验增强
- 语言偏好记忆 (localStorage/cookies)
- 基于地理位置的自动语言选择
- 渐进式语言切换动画

## 总结

本实现提供了完整的中英文双语支持，包括：
- ✅ 稳定的路由系统
- ✅ 动态数据多语言显示  
- ✅ 用户友好的切换体验
- ✅ 可扩展的技术架构
- ✅ 生产环境就绪

系统现已完全可用于生产环境部署。