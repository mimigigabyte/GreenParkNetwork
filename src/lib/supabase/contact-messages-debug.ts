import { supabase } from '@/lib/supabase';
import { ContactMessage } from './contact-messages';

/**
 * 调试版本 - 获取所有联系消息（跳过严格认证检查）
 */
export async function getAllContactMessagesDebug(
  page = 1, 
  pageSize = 10, 
  status?: 'pending' | 'processed'
): Promise<{
  data: ContactMessage[];
  count: number;
  totalPages: number;
  debug: any;
}> {
  console.log('🚀 调试版本 - 开始获取联系消息');
  
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    parameters: { page, pageSize, status },
    steps: []
  };

  try {
    // 步骤1: 检查认证状态
    debugInfo.steps.push('检查认证状态');
    const authResult = await supabase.auth.getUser();
    debugInfo.auth = {
      error: authResult.error,
      hasUser: !!authResult.data?.user,
      userId: authResult.data?.user?.id,
      userEmail: authResult.data?.user?.email
    };
    console.log('🔐 认证状态:', debugInfo.auth);

    // 步骤2: 检查数据库连接
    debugInfo.steps.push('测试数据库连接');
    const connectionTest = await supabase.from('contact_messages').select('count', { count: 'exact', head: true });
    debugInfo.connection = {
      error: connectionTest.error,
      count: connectionTest.count
    };
    console.log('🔗 数据库连接:', debugInfo.connection);

    // 步骤3: 构建查询
    debugInfo.steps.push('构建查询');
    let query = supabase
      .from('contact_messages')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
      debugInfo.hasStatusFilter = true;
      debugInfo.statusFilter = status;
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    debugInfo.pagination = { from, to, page, pageSize };

    // 步骤4: 执行查询
    debugInfo.steps.push('执行查询');
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    debugInfo.queryResult = {
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      } : null,
      dataLength: data?.length,
      count: count
    };

    console.log('📊 查询结果:', debugInfo.queryResult);

    if (error) {
      console.error('❌ 查询失败:', error);
      throw new Error(`数据库查询失败: ${error.message} (${error.code})`);
    }

    const totalPages = Math.ceil((count || 0) / pageSize);
    debugInfo.totalPages = totalPages;

    console.log('✅ 成功获取联系消息:', { dataCount: data?.length, totalCount: count });

    return {
      data: data || [],
      count: count || 0,
      totalPages,
      debug: debugInfo
    };

  } catch (err) {
    console.error('💥 调试版本获取消息失败:', err);
    debugInfo.error = {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    };
    
    throw err;
  }
}

/**
 * 创建测试联系消息
 */
export async function createTestContactMessage(testData: {
  contact_name: string;
  contact_phone: string;  
  contact_email: string;
  message: string;
  technology_name?: string;
  company_name?: string;
}): Promise<ContactMessage> {
  console.log('🧪 创建测试联系消息:', testData);
  
  // 获取当前用户
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('用户未登录，无法创建测试消息');
  }

  const messageData = {
    user_id: user.id,
    technology_id: 'test-tech-id',
    technology_name: testData.technology_name || '测试技术',
    company_name: testData.company_name || '测试公司',
    contact_name: testData.contact_name,
    contact_phone: testData.contact_phone,
    contact_email: testData.contact_email,
    message: testData.message,
    status: 'pending' as const
  };

  console.log('📝 插入数据:', messageData);

  const { data, error } = await supabase
    .from('contact_messages')
    .insert([messageData])
    .select()
    .single();

  if (error) {
    console.error('❌ 创建测试消息失败:', error);
    throw new Error(`创建失败: ${error.message}`);
  }

  console.log('✅ 测试消息创建成功:', data);
  return data;
}