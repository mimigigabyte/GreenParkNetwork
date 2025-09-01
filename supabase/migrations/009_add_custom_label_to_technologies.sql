-- 为 admin_technologies 表添加自定义标签字段
-- 日期: 2025-09-01
-- 描述: 添加 custom_label 字段，允许用户为技术添加不超过20字的自定义标签

ALTER TABLE admin_technologies 
ADD COLUMN custom_label VARCHAR(20);

-- 添加注释说明
COMMENT ON COLUMN admin_technologies.custom_label IS '自定义标签，用户可自定义输入，不超过20字符';

-- 为新字段创建索引以提高查询性能
CREATE INDEX idx_admin_technologies_custom_label ON admin_technologies(custom_label) WHERE custom_label IS NOT NULL;