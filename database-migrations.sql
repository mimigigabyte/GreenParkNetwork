-- Database migrations for technology review system

-- 1. Add review status fields to admin_technologies table
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'published';
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255);
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- 2. Add category field to internal_messages table
ALTER TABLE internal_messages ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_technologies_review_status ON admin_technologies(review_status);
CREATE INDEX IF NOT EXISTS idx_internal_messages_category ON internal_messages(category);
CREATE INDEX IF NOT EXISTS idx_internal_messages_to_user_unread ON internal_messages(to_user_id, is_read);

-- 4. Update existing technologies to published status (if needed)
UPDATE admin_technologies SET review_status = 'published' WHERE review_status IS NULL;

-- 5. Add some sample data for testing (optional)
-- INSERT INTO internal_messages (from_user_id, to_user_id, title, content, category, is_read, created_at) 
-- VALUES (null, 'YOUR_USER_ID_HERE', '测试技术审核退回', '您提交的技术"测试技术"未通过审核。\n\n退回原因：测试原因', '发布审核', false, NOW());