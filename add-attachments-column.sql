-- 为 admin_technologies 表添加 attachments 列，支持存储完整的附件信息
-- 可以在 Supabase 控制台的 SQL Editor 中直接运行

-- 1. 添加 attachments 列（JSONB 类型，支持存储复杂的附件对象）
ALTER TABLE admin_technologies 
ADD COLUMN IF NOT EXISTS attachments JSONB;

-- 2. 为 attachments 列添加注释
COMMENT ON COLUMN admin_technologies.attachments IS '存储完整的附件信息，包含url、filename、size、type等';

-- 3. 添加 attachments 列的索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_admin_technologies_attachments 
ON admin_technologies USING GIN (attachments);

-- 4. 检查表结构
\d admin_technologies;

-- 5. 显示示例数据结构（注释形式）
/*
attachments 字段将存储如下格式的 JSON 数组：
[
  {
    "url": "https://storage.example.com/file1.pdf",
    "filename": "技术报告.pdf",
    "size": 2048000,
    "type": "application/pdf"
  },
  {
    "url": "https://storage.example.com/file2.docx",
    "filename": "产品说明书.docx", 
    "size": 1024000,
    "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }
]
*/