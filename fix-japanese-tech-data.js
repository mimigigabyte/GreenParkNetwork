const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * 修复日本技术数据的问题：
 * 1. 修复logo显示问题
 * 2. 改进英文翻译质量
 * 3. 修复英文单词间距
 */

// Supabase 配置
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 改进的翻译函数
function improvedEnglishTranslation(chineseText, isName = false) {
  // 完整的专业翻译映射
  const professionalTranslations = {
    // 完整技术名称
    '炉排炉(垃圾焚烧发电)': 'Grate Furnace for Waste-to-Energy Power Generation',
    '氢气燃气轮机': 'Hydrogen-Fired Gas Turbine',
    '净零排放一站式解决方案VOF': 'Net Zero Emission One-Stop Solution (VOF)',
    'RO系统化学品ORPERSION E26系列 杀菌剂': 'RO System Chemical ORPERSION E26 Series Bactericide',
    
    // 技术描述关键词
    '利用焚烧废弃物所产生的热量进行发电来回收能源': 'Utilizes heat generated from waste incineration for power generation to recover energy',
    '处理烟气使烟气中的有害物质能控制在有关环境标准之内': 'Processes flue gas to control harmful substances within relevant environmental standards',
    '利用JFE独自开发的超级往复移动式炉排炉系统实现了垃圾的完全燃烧': 'Achieves complete waste combustion using JFE\'s independently developed super reciprocating grate furnace system',
    
    // 专业术语
    '废弃物': 'waste',
    '生活垃圾': 'municipal solid waste',
    '焚烧发电': 'waste-to-energy incineration',
    '热电联产': 'combined heat and power (CHP)',
    '二氧化碳排放': 'carbon dioxide emissions',
    '节能减排': 'energy conservation and emission reduction',
    '环境标准': 'environmental standards',
    '有害物质': 'hazardous substances',
    '完全燃烧': 'complete combustion',
    '往复移动式': 'reciprocating',
    '炉排炉系统': 'grate furnace system',
    '独自开发': 'independently developed',
    'RO系统': 'reverse osmosis (RO) system',
    '杀菌剂': 'bactericide',
    '膜式干燥器': 'membrane dryer',
    '楼宇管理系统': 'building management system',
    '一站式解决方案': 'one-stop solution',
    '综合管理': 'integrated management',
    
    // 企业类型
    '有限公司': 'Co., Ltd.',
    '株式会社': 'Corporation',
    '工程': 'Engineering',
    '技术': 'Technology',
    '重工业': 'Heavy Industries',
    '电机': 'Electric',
    '投资': 'Investment',
    '水处理': 'Water Treatment'
  };

  // 如果是完整匹配，直接返回
  if (professionalTranslations[chineseText]) {
    return professionalTranslations[chineseText];
  }

  let result = chineseText;
  
  // 按长度排序，优先处理长词组
  const sortedTranslations = Object.entries(professionalTranslations)
    .sort(([a], [b]) => b.length - a.length);
  
  for (const [chinese, english] of sortedTranslations) {
    if (result.includes(chinese)) {
      result = result.replace(new RegExp(chinese, 'g'), english);
    }
  }

  // 修复英文单词间距问题
  result = result
    .replace(/([a-zA-Z])([一-龯])/g, '$1 $2') // 英文后接中文
    .replace(/([一-龯])([a-zA-Z])/g, '$1 $2') // 中文后接英文
    .replace(/([a-zA-Z])([a-zA-Z])/g, '$1 $2') // 确保英文单词间有空格
    .replace(/\s+/g, ' ') // 清理多余空格
    .trim();

  // 如果仍有大量中文字符，提供更好的英文描述
  const chineseCharCount = (result.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalLength = result.length;
  
  if (chineseCharCount > totalLength * 0.3) {
    if (isName) {
      // 为技术名称添加通用后缀
      return result + ' Technology System';
    } else {
      // 为描述添加标准化格式
      const cleanEnglish = result.replace(/[\u4e00-\u9fff]/g, '').trim();
      if (cleanEnglish.length > 10) {
        return `Advanced ${cleanEnglish} for industrial environmental applications`;
      } else {
        return 'Advanced industrial technology system for environmental applications and energy efficiency';
      }
    }
  }

  return result;
}

// 生成改进的SVG Logo
function generateImprovedLogo(companyName, size = 256) {
  const firstFourChars = getFirstFourChars(companyName);
  
  const centerX = size / 2;
  const centerY = size / 2;
  const fontSize = Math.floor(size / 4);
  const spacing = fontSize * 1.2;
  
  // 使用更现代的渐变背景和阴影效果
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.1"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGradient)" rx="12" ry="12" filter="url(#shadow)"/>
      <text x="${centerX - spacing/2}" y="${centerY - spacing/2}" 
            font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif" 
            font-size="${fontSize}" font-weight="600" fill="white" 
            text-anchor="middle" dominant-baseline="middle">${firstFourChars[0] || ''}</text>
      <text x="${centerX + spacing/2}" y="${centerY - spacing/2}" 
            font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif" 
            font-size="${fontSize}" font-weight="600" fill="white" 
            text-anchor="middle" dominant-baseline="middle">${firstFourChars[1] || ''}</text>
      <text x="${centerX - spacing/2}" y="${centerY + spacing/2}" 
            font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif" 
            font-size="${fontSize}" font-weight="600" fill="white" 
            text-anchor="middle" dominant-baseline="middle">${firstFourChars[2] || ''}</text>
      <text x="${centerX + spacing/2}" y="${centerY + spacing/2}" 
            font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif" 
            font-size="${fontSize}" font-weight="600" fill="white" 
            text-anchor="middle" dominant-baseline="middle">${firstFourChars[3] || ''}</text>
    </svg>
  `;
  
  return Buffer.from(svg);
}

function getFirstFourChars(companyName) {
  const cleanName = companyName
    .replace(/(有限公司|株式会社|股份有限公司|有限责任公司|集团|公司|科技|技术|工程|重工业|电机|投资)$/g, '')
    .replace(/\s+/g, '');

  if (cleanName.length >= 4) {
    return cleanName.slice(0, 4).split('');
  }
  
  const result = cleanName.split('');
  const remainingChars = companyName.replace(/\s+/g, '').slice(cleanName.length);
  
  for (let i = 0; i < remainingChars.length && result.length < 4; i++) {
    const char = remainingChars[i];
    if (!result.includes(char)) {
      result.push(char);
    }
  }
  
  while (result.length < 4 && result.length > 0) {
    result.push(result[0]);
  }
  
  return result.slice(0, 4);
}

// 上传文件到Supabase Storage
async function uploadToStorage(bucket, fileName, buffer, contentType) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType,
        upsert: true // 允许覆盖现有文件
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      success: true,
      data,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function fixTechnologyData() {
  console.log('🔧 开始修复日本技术数据...');

  try {
    // 1. 查询需要修复的技术数据（来自日本的数据）
    const { data: technologies, error } = await supabase
      .from('admin_technologies')
      .select('*')
      .eq('acquisition_method', 'japan_china_cooperation');

    if (error) {
      throw error;
    }

    console.log(`📋 找到 ${technologies.length} 条需要修复的技术数据`);

    for (const tech of technologies) {
      console.log(`🔄 修复技术: ${tech.name_zh}`);
      
      const updates = {};
      
      // 2. 改进英文翻译
      const improvedNameEn = improvedEnglishTranslation(tech.name_zh, true);
      const improvedDescEn = improvedEnglishTranslation(tech.description_zh, false);
      
      if (improvedNameEn !== tech.name_en) {
        updates.name_en = improvedNameEn;
        console.log(`  ✏️  技术名称翻译: ${tech.name_en} → ${improvedNameEn}`);
      }
      
      if (improvedDescEn !== tech.description_en) {
        updates.description_en = improvedDescEn;
        console.log(`  ✏️  技术描述翻译已改进`);
      }

      // 3. 修复企业Logo（重新生成并上传）
      if (tech.company_name_zh) {
        const companyName = tech.company_name_zh;
        const logoBuffer = generateImprovedLogo(companyName, 256);
        const timestamp = Date.now();
        const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'company';
        const logoFileName = `company-logos/jp-${timestamp}-${safeCompanyName}-fixed.svg`;
        
        const logoUploadResult = await uploadToStorage('images', logoFileName, logoBuffer, 'image/svg+xml');
        
        if (logoUploadResult.success) {
          updates.company_logo_url = logoUploadResult.publicUrl;
          console.log(`  🖼️  Logo已更新: ${logoFileName}`);
        }
      }

      // 4. 应用更新
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('admin_technologies')
          .update(updates)
          .eq('id', tech.id);

        if (updateError) {
          console.error(`❌ 更新技术失败 ${tech.name_zh}:`, updateError);
        } else {
          console.log(`✅ 技术修复完成: ${tech.name_zh}`);
        }
      } else {
        console.log(`ℹ️  技术无需修复: ${tech.name_zh}`);
      }
    }

    console.log('🎉 所有技术数据修复完成！');

  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  }
}

// 运行修复程序
if (require.main === module) {
  fixTechnologyData();
}

module.exports = {
  improvedEnglishTranslation,
  generateImprovedLogo,
  fixTechnologyData
};