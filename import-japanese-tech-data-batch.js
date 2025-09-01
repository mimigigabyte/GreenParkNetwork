const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * 分批导入日中经协技术数据
 * 避免超时问题，支持断点续传
 */

// Supabase 配置
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 导入原有的函数
const { 
  downloadFile, 
  uploadToStorage, 
  translateToEnglish, 
  processTechnologyData 
} = require('./import-japanese-tech-data.js');

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function logError(message, error = null) {
  log(`ERROR: ${message}${error ? `: ${error.message}` : ''}`, 'ERROR');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'SUCCESS');
}

// 获取已导入的技术ID列表
async function getImportedTechIds() {
  try {
    const { data, error } = await supabase
      .from('admin_technologies')
      .select('custom_label')
      .eq('acquisition_method', 'japan_china_cooperation');

    if (error) {
      throw error;
    }

    // 提取已导入的技术标签
    return data.map(tech => tech.custom_label).filter(label => label);
  } catch (error) {
    logError('获取已导入技术列表失败', error);
    return [];
  }
}

// 获取日本国家ID
async function getJapanCountryId() {
  try {
    const { data, error } = await supabase
      .from('admin_countries')
      .select('id')
      .eq('name_zh', '日本')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error) {
    logError('查询日本国家ID失败', error);
    return null;
  }
}

// 获取或创建技术分类
async function getOrCreateCategory(categoryName) {
  try {
    // 先查询是否存在
    const { data: existingCategory } = await supabase
      .from('admin_categories')
      .select('id')
      .eq('name_zh', categoryName)
      .single();

    if (existingCategory) {
      return existingCategory.id;
    }

    // 不存在则创建
    const { data: newCategory, error } = await supabase
      .from('admin_categories')
      .insert({
        name_zh: categoryName,
        name_en: categoryName === '节能环保技术' ? 'Energy Saving & Environmental Technology' : categoryName,
        slug: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        is_active: true,
        sort_order: 1
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    logSuccess(`创建新分类: ${categoryName}`);
    return newCategory.id;
  } catch (error) {
    logError('处理技术分类失败', error);
    return null;
  }
}

async function importBatch(startIndex, batchSize = 5) {
  log(`🚀 开始分批导入 (批次: ${startIndex}-${startIndex + batchSize - 1})`);

  try {
    // 1. 读取数据文件
    const dataPath = path.join(__dirname, 'data', 'japanese-tech-database.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const totalTechs = jsonData.technologies.length;
    log(`📄 总技术数据: ${totalTechs} 条`);

    // 2. 获取已导入的技术
    const importedLabels = await getImportedTechIds();
    log(`📋 已导入技术: ${importedLabels.length} 条`);

    // 3. 获取日本国家ID和分类ID
    const japanCountryId = await getJapanCountryId();
    if (!japanCountryId) {
      throw new Error('无法获取日本国家ID');
    }

    const categoryId = await getOrCreateCategory('节能环保技术');
    if (!categoryId) {
      throw new Error('无法获取技术分类ID');
    }

    // 4. 确定要处理的技术范围
    const endIndex = Math.min(startIndex + batchSize, totalTechs);
    const batchTechs = jsonData.technologies.slice(startIndex, endIndex);
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    // 5. 处理批次中的技术
    for (let i = 0; i < batchTechs.length; i++) {
      const tech = batchTechs[i];
      const globalIndex = startIndex + i;
      
      log(`\n📋 [${globalIndex + 1}/${totalTechs}] 检查技术: ${tech.technologyName}`);
      
      // 检查是否已导入
      if (importedLabels.includes(tech.customLabel)) {
        skipCount++;
        log(`⏭️  已存在，跳过: ${tech.customLabel}`);
        continue;
      }

      const result = await processTechnologyData(tech, japanCountryId, categoryId);
      
      if (result.success) {
        successCount++;
        logSuccess(`✅ 导入成功!`);
        log(`  技术ID: ${result.technologyId}`);
        log(`  企业: ${result.data.company_name_zh}`);
        log(`  标签: ${result.data.custom_label}`);
      } else {
        failCount++;
        logError(`❌ 导入失败: ${result.error}`);
      }
      
      // 添加延迟避免API频率限制
      if (i < batchTechs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 6. 输出批次统计
    log(`\n📊 批次 ${startIndex}-${endIndex - 1} 统计:`);
    logSuccess(`成功: ${successCount}`);
    if (skipCount > 0) log(`⏭️  跳过: ${skipCount}`);
    if (failCount > 0) logError(`失败: ${failCount}`);
    
    // 7. 检查是否还有更多批次需要处理
    if (endIndex < totalTechs) {
      log(`\n🔄 还有 ${totalTechs - endIndex} 条数据待处理`);
      log(`💡 运行下一批次: node import-japanese-tech-data-batch.js ${endIndex} ${batchSize}`);
    } else {
      logSuccess(`🎉 所有数据处理完成！`);
    }

  } catch (error) {
    logError('批次导入失败', error);
    process.exit(1);
  }
}

// 主程序
async function main() {
  // 从命令行参数获取起始索引和批次大小
  const startIndex = parseInt(process.argv[2]) || 0;
  const batchSize = parseInt(process.argv[3]) || 5;
  
  await importBatch(startIndex, batchSize);
}

// 运行程序
if (require.main === module) {
  main();
}

module.exports = {
  importBatch,
  getImportedTechIds
};