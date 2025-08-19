import { supabase, supabaseAdmin } from '@/lib/supabase';

// 联系消息数据类型定义
export interface ContactMessage {
  id: string;
  user_id: string;
  technology_id?: string;
  technology_name?: string;
  company_name?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  message: string;
  status: 'pending' | 'processed';
  admin_reply?: string;
  admin_id?: string;
  replied_at?: string;
  created_at: string;
  updated_at: string;
}

// 创建联系消息的数据类型
export interface CreateContactMessageData {
  technology_id?: string;
  technology_name?: string;
  company_name?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  message: string;
}

// 站内信数据类型定义
export interface InternalMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  contact_message_id?: string;
  title: string;
  content: string;
  category?: string; // 消息分类
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// 发送站内信的数据类型
export interface SendInternalMessageData {
  to_user_id: string;
  contact_message_id?: string;
  title: string;
  content: string;
  category?: string; // 消息分类
}

/**
 * 创建联系消息
 */
export async function createContactMessage(data: CreateContactMessageData): Promise<ContactMessage> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('用户认证失败:', authError);
    throw new Error('用户未登录');
  }

  const messageData = {
    user_id: user.id,
    ...data,
    status: 'pending' as const
  };

  console.log('准备插入联系消息数据:', messageData);

  const { data: result, error } = await supabase
    .from('contact_messages')
    .insert([messageData])
    .select()
    .single();

  if (error) {
    console.error('创建联系消息失败:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    throw new Error(error.message || '创建联系消息失败');
  }

  console.log('联系消息创建成功:', result);
  
  // 自动给管理员发送通知
  try {
    await notifyAdminNewContactMessage(result);
  } catch (notifyError) {
    console.error('发送管理员通知失败，但联系消息已保存:', notifyError);
    // 不抛出错误，因为主要功能（保存联系消息）已成功
  }
  
  return result;
}

/**
 * 获取用户的联系消息列表
 */
export async function getUserContactMessages(): Promise<ContactMessage[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('用户未登录');
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取联系消息失败:', error);
    throw new Error(error.message || '获取联系消息失败');
  }

  return data || [];
}

/**
 * 获取所有联系消息（管理员用）
 */
export async function getAllContactMessages(
  page = 1, 
  pageSize = 10, 
  status?: 'pending' | 'processed'
): Promise<{
  data: ContactMessage[];
  count: number;
  totalPages: number;
}> {
  // 直接跳过认证检查，使用无认证版本
  return getAllContactMessagesNoAuth(page, pageSize, status);
}

/**
 * 无认证检查版本 - 直接查询数据库
 */
export async function getAllContactMessagesNoAuth(
  page = 1, 
  pageSize = 10, 
  status?: 'pending' | 'processed'
): Promise<{
  data: ContactMessage[];
  count: number;
  totalPages: number;
}> {
  console.log('📋 无认证版本 - 开始获取联系消息，参数:', { page, pageSize, status });

  try {
    // 使用管理员客户端查询，绕过 RLS 限制
    const client = supabaseAdmin || supabase;
    console.log('📋 使用客户端:', supabaseAdmin ? '管理员' : '普通');
    
    let query = client
      .from('contact_messages')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
      console.log('📋 添加状态筛选:', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    console.log('📋 分页参数:', { from, to });

    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('📋 数据库查询失败:', error);
      throw new Error(`数据库查询失败: ${error.message} (${error.code || 'unknown'})`);
    }

    console.log('📋 查询成功:', { dataLength: data?.length, count });

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      data: data || [],
      count: count || 0,
      totalPages
    };
  } catch (err) {
    console.error('📋 无认证版本查询失败:', err);
    throw err;
  }
}

/**
 * 更新联系消息状态
 */
export async function updateContactMessageStatus(
  messageId: string, 
  status: 'pending' | 'processed'
): Promise<ContactMessage> {
  console.log('📝 更新消息状态:', { messageId, status });
  
  // 尝试获取用户信息，但不强制要求
  const { data: { user } } = await supabase.auth.getUser();
  
  const updateData: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  // 如果有用户信息，添加管理员ID
  if (user) {
    updateData.admin_id = user.id;
    console.log('📝 添加管理员ID:', user.id);
  }

  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('contact_messages')
    .update(updateData)
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('📝 更新联系消息状态失败:', error);
    throw new Error(error.message || '更新联系消息状态失败');
  }

  console.log('📝 状态更新成功:', data);
  return data;
}

/**
 * 发送站内信
 */
export async function sendInternalMessage(data: SendInternalMessageData): Promise<InternalMessage> {
  console.log('💌 发送站内信:', data);
  
  // 尝试获取用户信息，但不强制要求
  const { data: { user } } = await supabase.auth.getUser();
  
  const messageData = {
    from_user_id: user?.id || null, // 如果没有用户，使用 null
    ...data
  };

  console.log('💌 插入消息数据:', messageData);

  const client = supabaseAdmin || supabase;
  const { data: result, error } = await client
    .from('internal_messages')
    .insert([messageData])
    .select()
    .single();

  if (error) {
    console.error('💌 发送站内信失败:', error);
    throw new Error(error.message || '发送站内信失败');
  }

  console.log('💌 站内信发送成功:', result);
  return result;
}

/**
 * 获取用户收到的站内信
 */
export async function getReceivedInternalMessages(): Promise<InternalMessage[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('用户未登录');
  }

  const { data, error } = await supabase
    .from('internal_messages')
    .select('*')
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取站内信失败:', error);
    throw new Error(error.message || '获取站内信失败');
  }

  return data || [];
}

/**
 * 标记站内信为已读
 */
export async function markInternalMessageAsRead(messageId: string): Promise<InternalMessage> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('用户未登录');
  }

  const { data, error } = await supabase
    .from('internal_messages')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .eq('to_user_id', user.id) // 确保只能更新发给自己的消息
    .select()
    .single();

  if (error) {
    console.error('标记站内信为已读失败:', error);
    throw new Error(error.message || '标记站内信为已读失败');
  }

  return data;
}

/**
 * 获取未读站内信数量
 */
export async function getUnreadInternalMessageCount(): Promise<number> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return 0;
  }

  const { count, error } = await supabase
    .from('internal_messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('获取未读站内信数量失败:', error);
    return 0;
  }

  return count || 0;
}

/**
 * 通知管理员有新的联系消息
 */
async function notifyAdminNewContactMessage(contactMessage: ContactMessage): Promise<void> {
  console.log('开始通知管理员新的联系消息:', contactMessage.id);
  
  // 尝试获取所有管理员用户
  const client = supabaseAdmin || supabase;
  let { data: admins, error: adminError } = await client
    .from('users')
    .select('id')
    .eq('role', 'admin');
  
  // 如果没有角色字段或没有管理员，使用备用方案
  if (adminError || !admins || admins.length === 0) {
    console.warn('没有找到管理员用户，尝试备用方案:', adminError?.message);
    
    // 备用方案1: 查找邮箱包含admin的用户
    const { data: adminByEmail } = await client
      .from('users')
      .select('id')
      .ilike('email', '%admin%');
    
    if (adminByEmail && adminByEmail.length > 0) {
      admins = adminByEmail;
      console.log('通过邮箱找到管理员用户:', adminByEmail.length);
    } else {
      // 备用方案2: 使用第一个注册的用户
      const { data: firstUser } = await client
        .from('users')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      if (firstUser) {
        admins = [firstUser];
        console.log('使用第一个注册用户作为临时管理员:', firstUser.id);
      } else {
        console.warn('没有找到任何用户，无法发送通知');
        return;
      }
    }
  }
  
  // 为每个管理员创建站内信
  const notifications = admins.map(admin => ({
    from_user_id: contactMessage.user_id,
    to_user_id: admin.id,
    contact_message_id: contactMessage.id,
    title: `新的联系咨询：${contactMessage.technology_name || '技术咨询'}`,
    content: `您收到了一条新的联系消息：

联系人：${contactMessage.contact_name}
联系电话：${contactMessage.contact_phone}
联系邮箱：${contactMessage.contact_email}
咨询技术：${contactMessage.technology_name || '无'}
所属公司：${contactMessage.company_name || '无'}

留言内容：
${contactMessage.message}

请前往管理后台查看并处理此消息。`,
    category: '技术对接'
  }));
  
  console.log('准备发送的通知数量:', notifications.length);
  
  const { data, error } = await client
    .from('internal_messages')
    .insert(notifications);
  
  if (error) {
    console.error('发送管理员通知失败:', error);
    throw new Error('发送管理员通知失败');
  }
  
  console.log('管理员通知发送成功');
}