# 绿色技术平台项目概览

## 项目目标
这是一个绿色低碳技术搜索平台，旨在帮助用户搜索和发现绿色环保技术，同时允许企业提交自己的技术产品。

## 技术栈
- **前端**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Spring Boot 3.2.5 + Java 17  
- **数据库**: Supabase (开发) / HuaweiCloud RDS (生产)
- **身份验证**: Supabase Auth + SMS验证
- **UI组件**: shadcn/ui + Radix UI + Lucide React图标
- **状态管理**: URL搜索参数 (nuqs)
- **部署**: Vercel (前端) + 多种云服务

## 关键特性
- 技术搜索和筛选系统
- 用户认证（SMS验证、密码登录、微信登录）
- 管理员和用户控制台
- 企业档案管理
- 技术分类和地理位置筛选
- 联系表单和消息系统

## 项目结构
- `src/app/` - Next.js App Router页面和API路由
- `src/components/` - React组件（按功能分组）
- `src/api/` - 前端API客户端函数
- `backend/` - Spring Boot后端应用
- `docs/` - 项目文档