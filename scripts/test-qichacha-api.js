#!/usr/bin/env node

/**
 * 企查查API连接测试脚本
 */

const crypto = require('crypto');
const path = require('path');
const https = require('https');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

/**
 * 生成企查查API认证Token
 */
function generateQichachaToken(key, timespan, secretKey) {
  const input = key + timespan + secretKey;
  return crypto.createHash('md5').update(input).digest('hex').toUpperCase();
}

/**
 * 测试企查查API连接
 */
async function testQichachaAPI() {
  console.log('🧪 开始测试企查查API连接...\n');

  const apiKey = process.env.QICHACHA_API_KEY;
  const secretKey = process.env.QICHACHA_SECRET_KEY;
  
  if (!apiKey || !secretKey) {
    console.error('❌ 错误：未找到企查查API密钥或SecretKey');
    console.error('   请在 .env.local 文件中设置 QICHACHA_API_KEY 和 QICHACHA_SECRET_KEY');
    process.exit(1);
  }

  console.log(`🔑 API密钥: ${apiKey.substring(0, 8)}...`);
  console.log(`🔐 SecretKey: ${secretKey.substring(0, 8)}...`);

  // 测试搜索关键词
  const testSearchKey = '腾讯';

  try {
    // 生成认证信息
    const timespan = Math.floor(Date.now() / 1000).toString();
    const token = generateQichachaToken(apiKey, timespan, secretKey);

    console.log(`⏰ 时间戳: ${timespan}`);
    console.log(`🔐 Token: ${token.substring(0, 16)}...`);
    console.log(`🔍 搜索关键词: ${testSearchKey}\n`);

    // 构建请求URL
    const url = new URL('https://api.qichacha.com/FuzzySearch/GetList');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('searchKey', testSearchKey);

    console.log('📡 发送请求到:', url.toString().replace(apiKey, apiKey.substring(0, 8) + '...'));

    // 使用Promise包装https请求
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'Token': token,
          'Timespan': timespan,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; GreenTechPlatform/1.0)',
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        console.log(`📊 HTTP状态: ${res.statusCode} ${res.statusMessage}`);
        
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP错误: ${res.statusCode} ${res.statusMessage}\n${body.substring(0, 500)}`));
              return;
            }
            const jsonData = JSON.parse(body);
            resolve(jsonData);
          } catch (parseError) {
            reject(new Error(`JSON解析失败: ${parseError.message}\n响应内容: ${body.substring(0, 500)}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });

      req.end();
    });

    console.log('\n📋 API响应详情:');
    console.log(`   状态码: ${data.Status}`);
    console.log(`   消息: ${data.Message}`);
    console.log(`   订单号: ${data.OrderNumber || 'N/A'}`);
    
    if (data.Result) {
      console.log(`   结果数量: ${data.Result.length}`);
      
      if (data.Result.length > 0) {
        console.log('\n📝 企业信息示例:');
        const company = data.Result[0];
        console.log(`   企业名称: ${company.Name}`);
        console.log(`   法定代表人: ${company.OperName}`);
        console.log(`   状态: ${company.Status}`);
        console.log(`   统一社会信用代码: ${company.CreditCode || 'N/A'}`);
        console.log(`   注册地址: ${company.Address || 'N/A'}`);
      }
    }

    if (data.Status === '200') {
      console.log('\n✅ 企查查API连接测试成功！');
      console.log('🎉 现在可以在应用中正常使用企业搜索功能了。');
      return true;
    } else {
      // 根据状态码提供具体的解决建议
      const errorSolutions = {
        '101': '请检查API密钥是否正确，或联系企查查确认密钥状态',
        '102': '请联系企查查客服充值续费',
        '103': '请联系企查查客服解除暂停状态',
        '107': '请检查服务器IP是否在白名单中，或联系企查查客服',
        '201': '这是正常情况，表示没有找到匹配的企业（测试用关键词可能确实没有结果）',
        '202': '请检查搜索关键词格式是否正确',
      };

      const solution = errorSolutions[data.Status];
      console.error(`❌ API业务错误 (${data.Status}): ${data.Message}`);
      if (solution) {
        console.error(`💡 解决建议: ${solution}`);
      }
      return false;
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 网络连接问题，请检查：');
      console.error('   1. 网络连接是否正常');
      console.error('   2. 防火墙设置是否阻止了请求');
      console.error('   3. 代理设置是否正确');
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.error('💡 请求超时或连接被重置，可能的原因：');
      console.error('   1. 服务器响应缓慢');
      console.error('   2. 网络不稳定');
      console.error('   3. 企查查服务临时不可用');
    }
    
    return false;
  }
}

// 运行测试
testQichachaAPI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 测试脚本运行失败:', error);
    process.exit(1);
  });