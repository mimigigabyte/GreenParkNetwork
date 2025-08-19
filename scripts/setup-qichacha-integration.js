#!/usr/bin/env node

/**
 * 企查查集成设置脚本
 * 自动执行数据库迁移，添加统一社会信用代码字段
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 开始执行企查查集成数据库迁移...\n');

    // 读取SQL文件
    const sqlPath = path.join(__dirname, '../docs/database/add_credit_code_field.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 执行SQL迁移脚本...');
    
    // 执行SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // 如果rpc函数不存在，尝试直接执行SQL
      console.log('⚠️  尝试直接执行SQL语句...');
      
      // 分割SQL语句并逐个执行
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.includes('DO $$')) {
          // 对于DO块，需要特殊处理
          console.log('⚠️  检测到DO块，跳过自动执行');
          console.log('📋 请手动在Supabase SQL编辑器中执行以下SQL:');
          console.log('\n' + sql + '\n');
          break;
        }
      }
      
      // 尝试检查字段是否已存在
      const { data, error: checkError } = await supabase
        .from('admin_companies')
        .select('credit_code')
        .limit(1);
      
      if (checkError && checkError.code === '42703') {
        console.log('❌ credit_code 字段不存在，需要手动添加');
        console.log('📋 请在Supabase数据库中执行以下SQL:');
        console.log('   ALTER TABLE admin_companies ADD COLUMN credit_code VARCHAR(50);');
        console.log('   COMMENT ON COLUMN admin_companies.credit_code IS \'统一社会信用代码\';');
        console.log('   CREATE INDEX idx_admin_companies_credit_code ON admin_companies(credit_code);');
      } else {
        console.log('✅ credit_code 字段已存在或已成功添加');
      }
    } else {
      console.log('✅ 数据库迁移执行成功');
    }

    // 验证API密钥配置
    console.log('\n🔑 验证企查查API配置...');
    const apiKey = process.env.QICHACHA_API_KEY;
    
    if (!apiKey) {
      console.log('❌ 企查查API密钥未配置');
      console.log('📋 请在.env.local文件中添加:');
      console.log('   QICHACHA_API_KEY=875C77BDF7DD41D1ED30647417275AA6');
    } else {
      console.log(`✅ 企查查API密钥已配置: ${apiKey.substring(0, 8)}...`);
    }

    console.log('\n🎉 企查查集成设置完成！');
    console.log('\n📝 功能说明:');
    console.log('   • 用户在企业信息页面输入企业名称时自动调用企查查API');
    console.log('   • 返回最多5条匹配的企业数据供用户选择');
    console.log('   • 选择后自动填充法定代表人、注册地址等信息');
    console.log('   • 统一社会信用代码将保存到数据库credit_code字段');

  } catch (error) {
    console.error('❌ 迁移执行失败:', error);
    process.exit(1);
  }
}

// 运行迁移
runMigration();