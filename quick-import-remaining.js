const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 快速导入剩余日本技术数据...');

async function quickImport() {
  try {
    // 读取数据
    const dataPath = path.join(__dirname, 'data', 'japanese-tech-database.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // 获取已导入的数据
    const { data: imported } = await supabase
      .from('admin_technologies')
      .select('name_zh')
      .eq('acquisition_method', 'japan_china_cooperation');
      
    const importedNames = new Set(imported?.map(t => t.name_zh) || []);
    console.log(`已导入: ${importedNames.size} 条`);
    
    // 获取需要导入的数据
    const remainingTechs = jsonData.technologies.filter(tech => 
      !importedNames.has(tech.technologyName)
    );
    
    console.log(`剩余待导入: ${remainingTechs.length} 条`);
    
    if (remainingTechs.length === 0) {
      console.log('✅ 所有数据已导入完成！');
      return;
    }
    
    // 获取必需的ID
    const { data: japanData } = await supabase
      .from('admin_countries')
      .select('id')
      .eq('name_zh', '日本')
      .single();
    
    const { data: categoryData } = await supabase
      .from('admin_categories')
      .select('id')
      .eq('name_zh', '节能环保技术')
      .single();

    console.log('📋 开始快速导入（跳过文件下载）...');
    
    let count = 0;
    for (const tech of remainingTechs.slice(0, 20)) { // 增加到20条
      count++;
      console.log(`[${count}/20] ${tech.technologyName}`);
      
      // 简化的数据插入，跳过图片和PDF下载
      const { data, error } = await supabase
        .from('admin_technologies')
        .insert({
          name_zh: tech.technologyName,
          name_en: tech.technologyName + ' Technology System',
          description_zh: tech.technologyDescription,
          description_en: 'Advanced industrial technology system for environmental applications',
          category_id: categoryData.id,
          custom_label: tech.customLabel,
          company_name_zh: tech.chineseCompanyName,
          company_name_en: tech.englishCompanyName,
          company_country_id: japanData.id,
          tech_source: 'self_developed',
          acquisition_method: 'japan_china_cooperation',
          review_status: 'published',
          is_active: true
        })
        .select()
        .single();
        
      if (error) {
        console.error(`❌ ${tech.technologyName}: ${error.message}`);
      } else {
        console.log(`✅ ${tech.technologyName} (ID: ${data.id})`);
      }
    }
    
    console.log(`\n🎉 已快速导入 ${Math.min(count, 20)} 条数据`);
    
    if (remainingTechs.length > 20) {
      console.log(`💡 还有 ${remainingTechs.length - 20} 条数据待处理`);
    }
    
  } catch (error) {
    console.error('❌ 快速导入失败:', error);
  }
}

quickImport();