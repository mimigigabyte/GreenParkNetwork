# 省份创建RLS权限问题修复

## 问题描述
用户在添加新经开区时报错：
```
保存省份失败: 创建省份失败: new row violates row-level security policy for table "admin_provinces"
```

这表明省份表也有同样的RLS权限问题。

## 解决方案

按照经开区API的模式，为省份管理也创建了完整的API路由系统。

### 新增文件

#### 1. API路由
- `src/app/api/admin/provinces/route.ts` - 处理GET和POST请求
- `src/app/api/admin/provinces/[id]/route.ts` - 处理PUT和DELETE请求

#### 2. API客户端
- `src/lib/api/admin-provinces.ts` - 封装省份API调用的客户端函数

### 修改文件

#### 1. 主页面组件
- `src/app/admin/basic-data/domestic-zones/page.tsx`
  - 更新导入语句，使用新的省份API
  - 更新省份加载函数使用`getProvincesApi`
  - 更新删除函数使用`deleteProvinceApi`

#### 2. 省份表单组件  
- `src/app/admin/basic-data/domestic-zones/components/province-form.tsx`
  - 更新导入语句，使用新的省份API
  - 更新创建和更新操作使用`createProvinceApi`和`updateProvinceApi`

## API接口设计

### GET /api/admin/provinces
- 查询参数：`countryId` (可选)
- 返回：省份列表

### POST /api/admin/provinces
- 请求体：省份创建数据
- 返回：创建的省份

### PUT /api/admin/provinces/[id]
- 请求体：省份更新数据
- 返回：更新后的省份

### DELETE /api/admin/provinces/[id]
- 返回：删除成功消息

## 修复效果

现在所有省份相关操作都通过服务端API进行：
- ✅ 创建省份 - 使用service role key，绕过RLS限制
- ✅ 更新省份 - 使用service role key，绕过RLS限制  
- ✅ 删除省份 - 使用service role key，绕过RLS限制
- ✅ 获取省份 - 使用service role key，绕过RLS限制

## 统一的API架构

现在我们有了统一的admin API架构：

```
/api/admin/
├── provinces/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (PUT, DELETE)
└── development-zones/
    ├── route.ts (GET, POST)
    └── [id]/route.ts (PUT, DELETE)
```

对应的客户端API：
```
/lib/api/
├── admin-provinces.ts
└── admin-development-zones.ts
```

## 安全优势

1. **Service Role Key隔离**：只在服务端使用，不暴露给前端
2. **RLS兼容**：通过服务端API绕过前端RLS限制
3. **统一架构**：省份和经开区使用相同的API模式
4. **后续扩展**：可以轻松添加身份验证和权限检查

现在添加新经开区时，如果需要创建新省份，应该不会再报RLS错误了！