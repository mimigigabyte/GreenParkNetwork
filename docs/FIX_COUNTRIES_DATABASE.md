# 🔧 修复国别管理数据库问题

## 🚨 问题描述

国别管理页面在保存数据时出现错误：
```
Could not find the 'logo_url' column of 'admin_countries' in the schema cache
```

这是因为 `admin_countries` 表缺少 `logo_url` 列。

## 🛠️ 解决方案

### 方法1：在 Supabase 控制台手动执行（推荐）

1. **打开 Supabase 控制台**
   - 访问：https://supabase.com/dashboard
   - 选择项目：绿色技术平台 (qpeanozckghazlzzhrni)

2. **进入 SQL Editor**
   - 点击左侧菜单的 "SQL Editor"
   - 点击 "New query"

3. **执行修复SQL**
   复制以下SQL代码并执行：

```sql
-- 为 admin_countries 表添加 logo_url 列
ALTER TABLE admin_countries 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- 为现有的国家数据添加国旗URL
UPDATE admin_countries 
SET logo_url = CASE 
  WHEN code = 'china' THEN 'https://flagcdn.com/w320/cn.png'
  WHEN code = 'usa' THEN 'https://flagcdn.com/w320/us.png'
  WHEN code = 'japan' THEN 'https://flagcdn.com/w320/jp.png'
  WHEN code = 'germany' THEN 'https://flagcdn.com/w320/de.png'
  WHEN code = 'uk' THEN 'https://flagcdn.com/w320/gb.png'
  WHEN code = 'france' THEN 'https://flagcdn.com/w320/fr.png'
  ELSE NULL
END
WHERE logo_url IS NULL;

-- 检查结果
SELECT id, name_zh, name_en, code, logo_url 
FROM admin_countries 
ORDER BY sort_order;
```

4. **验证修复**
   执行完成后，应该看到：
   - ✅ "ALTER TABLE" 成功
   - ✅ "UPDATE" 成功更新了数据
   - ✅ "SELECT" 显示所有国家都有了 logo_url

### 方法2：使用提供的SQL文件

项目中已经提供了 `add-logo-url-column.sql` 文件，您可以：

1. 在 Supabase 控制台的 SQL Editor 中
2. 复制 `add-logo-url-column.sql` 文件的内容
3. 粘贴并执行

## 🧪 测试修复

修复完成后：

1. **刷新国别管理页面**
2. **尝试添加新国家**：
   - 填写国家信息
   - 点击"自动获取国旗"
   - 保存数据
3. **应该看到**：
   - ✅ 保存成功
   - ✅ 国旗正常显示
   - ✅ 数据正确保存

## 📋 修复后的功能

修复完成后，国别管理将具备以下功能：

### ✅ 基础CRUD
- **查看**：显示所有国家列表
- **新增**：创建新的国家记录
- **编辑**：修改现有国家信息
- **删除**：删除国家记录

### ✅ 自动国旗功能
- **一键获取**：自动从国际API获取国旗图片
- **多重备用**：确保获取成功率
- **实时预览**：即时显示国旗图片

### ✅ 数据验证
- **唯一性检查**：国家代码不重复
- **中国保护**：不允许删除中国
- **输入验证**：必填字段验证

## 🚨 如果仍有问题

如果执行SQL后仍然出现错误：

1. **检查权限**：确保您有数据库管理权限
2. **清除缓存**：重启 Next.js 开发服务器
3. **重新登录**：重新登录 Supabase 控制台
4. **检查网络**：确保网络连接正常

## 💡 预防措施

为了避免将来出现类似问题：

1. **使用迁移脚本**：所有数据库改动都应该使用迁移文件
2. **测试环境**：先在测试环境验证改动
3. **备份数据**：重要操作前先备份数据

---

🎯 **执行完修复SQL后，国别管理功能就可以正常使用了！**