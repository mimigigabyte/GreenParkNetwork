const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://qpeanozckghazlzzhrni.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
);

async function verifyImport() {
  console.log('🔍 验证日本技术数据导入情况...\n');

  try {
    // 1. 查询所有已导入的日本技术数据
    const { data: importedData, error } = await supabase
      .from('admin_technologies')
      .select('name_zh, company_name_zh, custom_label, name_en, created_at')
      .eq('acquisition_method', 'japan_china_cooperation')
      .order('created_at');

    if (error) {
      throw error;
    }

    // 2. 读取原始数据文件
    const dataPath = path.join(__dirname, 'data', 'japanese-tech-database.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log(`📊 导入统计:`);
    console.log(`   原始数据: ${jsonData.technologies.length} 条`);
    console.log(`   已导入: ${importedData.length} 条`);
    console.log(`   导入率: ${((importedData.length / jsonData.technologies.length) * 100).toFixed(1)}%\n`);

    // 3. 检查翻译质量
    let translationGood = 0;
    let translationBad = 0;
    
    importedData.forEach(tech => {
      if (tech.name_en && tech.name_en.includes('Technology System')) {
        translationGood++;
      } else if (tech.name_en && /[\u4e00-\u9fff]/.test(tech.name_en)) {
        translationBad++;
      }
    });

    console.log(`📝 翻译质量检查:`);
    console.log(`   标准翻译: ${translationGood} 条`);
    console.log(`   含中文残留: ${translationBad} 条\n`);

    // 4. 按企业统计
    const companyStats = {};
    importedData.forEach(tech => {
      const company = tech.company_name_zh;
      companyStats[company] = (companyStats[company] || 0) + 1;
    });

    console.log(`🏢 企业技术数量统计 (前10名):`);
    Object.entries(companyStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([company, count], i) => {
        console.log(`   ${i+1}. ${company}: ${count} 项技术`);
      });

    console.log(`\n✅ 导入验证完成！`);
    
    if (importedData.length === jsonData.technologies.length) {
      console.log(`🎉 所有 ${jsonData.technologies.length} 条日本技术数据已成功导入！`);
    } else {
      const missing = jsonData.technologies.length - importedData.length;
      console.log(`⚠️  还有 ${missing} 条数据未导入`);
    }

  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

verifyImport();