# 🔧 数据库设置指南

## ⚠️ 重要说明

产业分类管理页面报错"加载产业分类失败，请重试"的原因是：**数据库表还没有创建**。

### 当前状态
- ✅ Supabase连接正常
- ❌ `admin_categories` 表不存在
- ❌ `admin_subcategories` 表不存在
- 🔄 **当前使用模拟数据运行**（功能正常，但数据不会保存）

## 🚀 解决方案

### 第一步：通过Supabase控制台创建数据库表

1. **访问Supabase控制台**
   ```
   https://supabase.com/dashboard
   ```

2. **选择项目**
   - 项目ID: `qpeanozckghazlzzhrni`
   - 项目名称: 绿色技术平台

3. **进入SQL编辑器**
   - 点击左侧菜单 "SQL Editor"
   - 点击 "New query"

4. **执行建表脚本**
   - 打开文件：`supabase/migrations/001_create_admin_tables.sql`
   - 复制全部内容到SQL编辑器
   - 点击 "Run" 执行

5. **执行初始数据脚本**
   - 新建查询
   - 打开文件：`supabase/seed.sql` 
   - 复制全部内容到SQL编辑器
   - 点击 "Run" 执行

### 第二步：验证数据库设置

1. **在产业分类管理页面**
   - 点击"重新连接数据库"按钮
   - 如果成功，黄色提示条将消失
   - 数据将从数据库加载而非模拟数据

2. **验证功能**
   - 创建新分类/子分类
   - 编辑现有分类
   - 删除测试数据
   - 所有操作应该正常工作并持久保存

## 📋 需要执行的SQL脚本内容

### 建表脚本 (001_create_admin_tables.sql)
包含以下表结构：
- `admin_categories` - 产业分类表
- `admin_subcategories` - 产业子分类表  
- `admin_countries` - 国别表
- `admin_provinces` - 省份表
- `admin_development_zones` - 经开区表
- `admin_carousel_images` - 轮播图表
- `admin_companies` - 企业表
- `admin_technologies` - 技术表

### 初始数据脚本 (seed.sql)
包含基础数据：
- 常用产业分类和子分类
- 国家和地区数据
- 示例轮播图

## 🎯 完成后的功能

设置完成后，整个管理员Dashboard将完全可用：

### ✅ 基础数据管理
- 产业分类和子分类管理
- 国别、省份、经开区管理
- 数据联动和验证

### ✅ 内容管理
- 轮播图管理
- 企业信息管理  
- 技术信息管理

### ✅ 前端集成
- 首页筛选功能使用真实数据
- 中英双语支持
- 完整的搜索和过滤

## 🆘 遇到问题？

如果遇到以下问题：

**SQL执行失败**
- 检查是否有管理员权限
- 确认项目ID正确
- 查看具体错误信息

**数据库连接失败**  
- 检查网络连接
- 验证API密钥
- 确认Supabase服务状态

**功能异常**
- 检查浏览器控制台错误
- 清除浏览器缓存
- 重启开发服务器

## 📞 技术支持

如需进一步帮助，请提供：
1. 具体错误信息截图
2. 浏览器控制台日志
3. Supabase控制台状态