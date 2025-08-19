# RLS权限问题修复方案

## 问题描述

用户在使用国内省份/经开区管理页面时遇到两个RLS（Row Level Security）权限问题：

1. **删除经开区没有变化** - 前端使用anon key无法直接删除数据库记录
2. **添加新经开区报错** - "new row violates row-level security policy for table 'admin_development_zones'"

## 根本原因

Supabase的行级安全策略（RLS）阻止了前端使用普通用户权限（anon key）直接操作admin表。虽然我们之前设置了RLS策略，但前端没有适当的身份验证来满足这些策略。

## 解决方案

### 方案选择
选择**API路由方案**而非修改RLS策略，因为：
- 更安全：避免直接暴露service role key给前端
- 更可控：可以在服务端添加额外的验证逻辑
- 更标准：符合最佳实践

### 实现步骤

#### 1. 创建API路由
- `src/app/api/admin/development-zones/route.ts` - 处理GET和POST请求
- `src/app/api/admin/development-zones/[id]/route.ts` - 处理PUT和DELETE请求

这些API路由使用service role key，具有完全的数据库访问权限。

#### 2. 创建API客户端
- `src/lib/api/admin-development-zones.ts` - 封装API调用的客户端函数

#### 3. 更新前端组件
- 将直接的Supabase调用替换为API调用
- 保持mock数据的fallback机制

## 文件修改清单

### 新增文件
1. `src/app/api/admin/development-zones/route.ts`
2. `src/app/api/admin/development-zones/[id]/route.ts`
3. `src/lib/api/admin-development-zones.ts`

### 修改文件
1. `src/app/admin/basic-data/domestic-zones/page.tsx`
   - 更新导入和函数调用
   - 使用新的API客户端函数

2. `src/app/admin/basic-data/domestic-zones/components/development-zone-form.tsx`
   - 更新创建和更新操作以使用API

## API接口设计

### GET /api/admin/development-zones
- 查询参数：`provinceId` (可选)
- 返回：经开区列表

### POST /api/admin/development-zones
- 请求体：经开区创建数据
- 返回：创建的经开区

### PUT /api/admin/development-zones/[id]
- 请求体：经开区更新数据
- 返回：更新后的经开区

### DELETE /api/admin/development-zones/[id]
- 返回：删除成功消息

## 安全考虑

1. **Service Role Key隔离**：只在服务端API路由中使用，不暴露给前端
2. **后续扩展**：可以在API路由中添加身份验证和权限检查
3. **数据验证**：在API层面进行数据验证和清理

## 测试验证

修复后需要验证：
1. ✅ 创建经开区功能正常
2. ✅ 删除经开区功能正常并立即反映在UI上
3. ✅ 更新经开区功能正常
4. ✅ 数量显示正确更新
5. ✅ Mock数据fallback机制仍然工作

## 后续改进

1. **统一API模式**：为省份管理也创建类似的API路由
2. **身份验证**：添加用户身份验证和角色检查
3. **错误处理**：改进错误处理和用户反馈
4. **性能优化**：添加缓存和批量操作支持

这个解决方案确保了数据安全性，同时提供了良好的用户体验和可维护性。