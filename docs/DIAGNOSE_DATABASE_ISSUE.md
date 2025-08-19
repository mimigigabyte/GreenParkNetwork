# 🔍 数据库连接问题诊断

## 问题描述
产业分类管理页面仍然显示"数据库表尚未创建"

## 可能的原因

### 1. 环境变量未设置 ⚠️
**最可能的原因**：Next.js无法读取Supabase配置

**解决方案**：
```bash
# 停止开发服务器 (Ctrl+C)
# 运行环境变量设置脚本
./setup-env.bat
```

### 2. 数据库表未正确创建
**检查方法**：
1. 访问Supabase控制台：https://supabase.com/dashboard
2. 选择项目：绿色技术平台 (qpeanozckghazlzzhrni)
3. 进入 "Table Editor"
4. 确认存在以下表：
   - `admin_categories`
   - `admin_subcategories`

### 3. API路由问题
**检查方法**：
1. 打开浏览器开发者工具 (F12)
2. 进入产业分类管理页面
3. 查看控制台(Console)错误信息
4. 查看网络(Network)标签页的请求状态

## 🚀 快速修复步骤

### 步骤1：设置环境变量并重启服务器
```bash
# 1. 停止当前开发服务器 (Ctrl+C)
# 2. 运行设置脚本
./setup-env.bat
```

### 步骤2：验证数据库表存在
在Supabase控制台的SQL Editor中运行：
```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_categories', 'admin_subcategories');
```

如果没有返回结果，请重新执行建表脚本。

### 步骤3：检查数据是否存在
```sql
-- 检查分类数据
SELECT count(*) as category_count FROM admin_categories;
SELECT count(*) as subcategory_count FROM admin_subcategories;
```

### 步骤4：测试API路由
在浏览器中直接访问：
```
http://localhost:3000/api/admin/categories
```

应该返回JSON格式的分类数据。

## 🔧 详细诊断

### 浏览器控制台常见错误

**错误1**: `Failed to fetch categories`
- **原因**: 环境变量未设置
- **解决**: 重启服务器并设置环境变量

**错误2**: `Internal server error`
- **原因**: 数据库表不存在
- **解决**: 重新执行SQL建表脚本

**错误3**: `Network request failed`
- **原因**: API路由问题
- **解决**: 检查开发服务器是否正常运行

### 网络请求检查

在浏览器开发者工具的Network标签中查看：
- 请求URL: `/api/admin/categories`
- 状态码: 应该是 `200`
- 响应: 应该包含分类数据的JSON

## 📞 如果问题仍然存在

1. **截图浏览器控制台错误信息**
2. **截图Network请求详情**
3. **确认Supabase控制台中表是否存在**
4. **提供具体的错误描述**

## 🎯 预期正常状态

完全正常时应该看到：
- ✅ 页面无错误提示
- ✅ 显示4个主分类
- ✅ 每个分类可展开显示子分类
- ✅ 可以正常新增、编辑、删除分类

---

**下一步**: 请先运行 `./setup-env.bat` 重新启动开发服务器，然后访问产业分类管理页面测试。