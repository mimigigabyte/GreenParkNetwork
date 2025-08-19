# 🔥 修复数据库连接问题

## 问题原因
**环境变量未正确设置**，导致API路由无法访问Supabase数据库。

## 🚀 立即解决方案

### 方法1：使用设置脚本（推荐）

1. **停止开发服务器**：在终端按 `Ctrl+C`

2. **运行环境设置脚本**：
   ```bash
   ./setup-env.bat
   ```
   这个脚本会自动设置所有必要的环境变量并启动服务器。

### 方法2：手动设置环境变量

如果脚本不工作，请手动执行：

1. **停止开发服务器** (Ctrl+C)

2. **在项目根目录创建 `.env.local` 文件**，内容如下：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://qpeanozckghazlzzhrni.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.xrI4oJE4-VjS_d5e5qsY7O5Y5VJmq2iWlJb2Jf5C1J4
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8
   ```

3. **重新启动开发服务器**：
   ```bash
   npm run dev
   ```

## ✅ 验证修复成功

修复后，请检查：

1. **访问产业分类管理页面**
2. **应该看到**：
   - ✅ 无错误提示
   - ✅ 显示4个主分类
   - ✅ 可展开查看子分类
   - ✅ 可以正常操作（新增、编辑、删除）

## 🧪 快速测试

在浏览器地址栏直接访问：
```
http://localhost:3000/api/admin/categories
```

**正常响应示例**：
```json
[
  {
    "id": "xxxx-xxxx-xxxx",
    "name_zh": "节能环保技术",
    "name_en": "Energy Saving and Environmental Protection Technology",
    "slug": "energy-saving",
    ...
  }
]
```

## 🚨 如果仍有问题

请在浏览器开发者工具(F12)的控制台中查看具体错误信息，并提供：
1. 控制台错误截图
2. Network请求状态截图
3. 确认是否已按照上述步骤重启服务器

---

**重要**：Service Role Key是访问数据库的关键，必须正确设置才能让API路由正常工作！