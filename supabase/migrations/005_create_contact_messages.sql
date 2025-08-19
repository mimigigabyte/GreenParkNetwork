-- 联系消息功能数据库表结构
-- 创建时间: 2025-01-15

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 联系消息表
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  technology_id UUID, -- 关联的技术ID
  technology_name VARCHAR(500), -- 技术名称（冗余存储）
  company_name VARCHAR(200), -- 企业名称（冗余存储）
  contact_name VARCHAR(100) NOT NULL, -- 联系人姓名
  contact_phone VARCHAR(20) NOT NULL, -- 联系电话
  contact_email VARCHAR(255) NOT NULL, -- 联系邮箱
  message TEXT NOT NULL, -- 留言内容
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed')), -- 处理状态
  admin_reply TEXT, -- 管理员回复
  admin_id UUID REFERENCES auth.users(id), -- 处理的管理员ID
  replied_at TIMESTAMP WITH TIME ZONE, -- 回复时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 站内信表
CREATE TABLE internal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 发送者ID
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 接收者ID
  contact_message_id UUID REFERENCES contact_messages(id) ON DELETE SET NULL, -- 关联的联系消息
  title VARCHAR(200) NOT NULL, -- 消息标题
  content TEXT NOT NULL, -- 消息内容
  is_read BOOLEAN DEFAULT false, -- 是否已读
  read_at TIMESTAMP WITH TIME ZONE, -- 阅读时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX idx_contact_messages_technology_id ON contact_messages(technology_id);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);

CREATE INDEX idx_internal_messages_from_user_id ON internal_messages(from_user_id);
CREATE INDEX idx_internal_messages_to_user_id ON internal_messages(to_user_id);
CREATE INDEX idx_internal_messages_contact_message_id ON internal_messages(contact_message_id);
CREATE INDEX idx_internal_messages_is_read ON internal_messages(is_read);
CREATE INDEX idx_internal_messages_created_at ON internal_messages(created_at);

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_contact_messages_updated_at 
  BEFORE UPDATE ON contact_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internal_messages_updated_at 
  BEFORE UPDATE ON internal_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

-- 联系消息权限策略
-- 用户可以创建自己的联系消息
CREATE POLICY "Users can create their own contact messages" 
  ON contact_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户可以查看自己的联系消息
CREATE POLICY "Users can view their own contact messages" 
  ON contact_messages FOR SELECT 
  USING (auth.uid() = user_id);

-- 管理员可以查看和管理所有联系消息（暂时允许所有认证用户，后续根据实际权限调整）
CREATE POLICY "Authenticated users can manage contact messages" 
  ON contact_messages FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- 站内信权限策略
-- 用户可以查看发送给自己的消息
CREATE POLICY "Users can view messages sent to them" 
  ON internal_messages FOR SELECT 
  USING (auth.uid() = to_user_id);

-- 用户可以查看自己发送的消息
CREATE POLICY "Users can view messages they sent" 
  ON internal_messages FOR SELECT 
  USING (auth.uid() = from_user_id);

-- 管理员可以发送站内信（暂时允许所有认证用户，后续根据实际权限调整）
CREATE POLICY "Authenticated users can send internal messages" 
  ON internal_messages FOR INSERT 
  WITH CHECK (auth.uid() = from_user_id);

-- 用户可以更新自己接收到的消息的已读状态
CREATE POLICY "Users can update read status of received messages" 
  ON internal_messages FOR UPDATE 
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);