const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

/**
 * 逐条导入日本技术数据 - 包含完整功能
 * 1. 下载并上传技术图片
 * 2. 下载并上传技术资料PDF
 * 3. 生成企业Logo并上传
 * 4. 改进的英文翻译
 * 5. 完整的数据插入
 */

// Supabase 配置
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 日志函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 改进的翻译函数
function improvedTranslation(chineseText, isName = false) {
  const professionalTranslations = {
    // 完整技术名称
    '炉排炉(垃圾焚烧发电)': 'Grate Furnace for Waste-to-Energy Power Generation',
    '氢气燃气轮机': 'Hydrogen-Fired Gas Turbine',
    '净零排放一站式解决方案VOF': 'Net Zero Emission One-Stop Solution (VOF)',
    'RO系统化学品ORPERSION E26系列 杀菌剂': 'RO System Chemical ORPERSION E26 Series Bactericide',
    '电渗析、脱盐/浓缩技术 Zero Liquid Discharge(ZLD)零排放领域的含盐废水的脱盐/浓缩': 'Electrodialysis and Desalination/Concentration Technology for Zero Liquid Discharge (ZLD) of Saline Wastewater',
    '膜式干燥器"sunsep™"': 'Membrane Dryer "sunsep™"',
    '最新楼宇管理系统 savic-net™G5': 'Latest Building Management System savic-net™G5',
    
    // 技术描述关键词
    '利用焚烧废弃物所产生的热量进行发电来回收能源': 'Utilizes heat generated from waste incineration for power generation to recover energy',
    '处理烟气使烟气中的有害物质能控制在有关环境标准之内': 'Processes flue gas to control harmful substances within relevant environmental standards',
    '利用JFE独自开发的超级往复移动式炉排炉系统实现了垃圾的完全燃烧': 'Achieves complete waste combustion using JFE\'s independently developed super reciprocating grate furnace system',
    
    // 专业术语
    '废弃物': 'waste materials',
    '生活垃圾': 'municipal solid waste',
    '焚烧发电': 'waste-to-energy incineration',
    '热电联产': 'combined heat and power (CHP)',
    '二氧化碳排放': 'carbon dioxide emissions',
    '节能减排': 'energy conservation and emission reduction',
    '环境标准': 'environmental standards',
    '有害物质': 'hazardous substances',
    '完全燃烧': 'complete combustion',
    '往复移动式': 'reciprocating type',
    '炉排炉系统': 'grate furnace system',
    '独自开发': 'independently developed',
    'RO系统': 'reverse osmosis (RO) system',
    '杀菌剂': 'bactericide',
    '膜式干燥器': 'membrane dryer',
    '楼宇管理系统': 'building management system',
    '一站式解决方案': 'one-stop solution',
    '综合管理': 'integrated management',
    '电渗析': 'electrodialysis',
    '脱盐': 'desalination',
    '浓缩技术': 'concentration technology',
    '零排放': 'zero liquid discharge',
    '水处理': 'water treatment',
    '锂离子电池': 'lithium-ion battery',
    '空气净化': 'air purification',
    '环境产品': 'environmental products',
    '感应电炉': 'induction furnace',
    '能源管理': 'energy management',
    '太阳能电动车': 'solar electric vehicle',
    '空调系统': 'air conditioning system',
    '数据收集': 'data collection',
    '润滑油': 'lubricating oil',
    '曝气装置': 'aeration device',
    '数码复合机': 'digital multifunction device',
    '打印机': 'printer',
    '氨氮分析仪': 'ammonia nitrogen analyzer',
    '电池评价设备': 'battery evaluation equipment',
    
    // 企业类型
    '有限公司': 'Co., Ltd.',
    '株式会社': 'Corporation',
    '工程': 'Engineering',
    '技术': 'Technology',
    '重工业': 'Heavy Industries',
    '电机': 'Electric',
    '投资': 'Investment'
  };

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

  // 修复英文单词间距
  result = result
    .replace(/([a-zA-Z])([一-龯])/g, '$1 $2')
    .replace(/([一-龯])([a-zA-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  // 如果仍有大量中文，提供标准英文描述
  const chineseCharCount = (result.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseCharCount > result.length * 0.3) {
    if (isName) {
      return result.replace(/[\u4e00-\u9fff]/g, '').trim() + ' Technology System';
    } else {
      const cleanEnglish = result.replace(/[\u4e00-\u9fff]/g, '').trim();
      if (cleanEnglish.length > 15) {
        return `Advanced ${cleanEnglish} for industrial environmental applications and energy efficiency`;
      } else {
        return 'Advanced industrial technology system for environmental protection, energy conservation and sustainable development applications';
      }
    }
  }

  return result;
}

// 生成改进的企业Logo（来自修复脚本）
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

// 下载文件
async function downloadFile(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const request = client.get(url, { timeout }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        downloadFile(redirectUrl, timeout).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`请求超时: ${url}`));
    });
  });
}

// 上传到Supabase Storage
async function uploadToStorage(bucket, fileName, buffer, contentType) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      success: true,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取必需的ID
async function getRequiredIds() {
  // 获取日本国家ID
  const { data: japanData, error: japanError } = await supabase
    .from('admin_countries')
    .select('id')
    .eq('name_zh', '日本')
    .single();

  if (japanError) throw new Error('无法获取日本国家ID');

  // 获取技术分类ID
  const { data: categoryData, error: categoryError } = await supabase
    .from('admin_categories')
    .select('id')
    .eq('name_zh', '节能环保技术')
    .single();

  if (categoryError) throw new Error('无法获取技术分类ID');

  return {
    japanCountryId: japanData.id,
    categoryId: categoryData.id
  };
}

// 创建或查找企业（强制重新生成Logo）
async function createOrFindCompany(companyData, japanCountryId) {
  // 先查询企业是否存在
  const { data: existingCompany } = await supabase
    .from('admin_companies')
    .select('id, logo_url')
    .eq('name_zh', companyData.chineseCompanyName)
    .single();

  // 生成改进的企业Logo（使用修复脚本中的逻辑）
  log(`🎨 为企业生成Logo: ${companyData.chineseCompanyName}`);
  const logoBuffer = generateImprovedLogo(companyData.chineseCompanyName, 256);
  const timestamp = Date.now();
  const safeCompanyName = companyData.chineseCompanyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'company';
  const logoFileName = `company-logos/jp-${timestamp}-${safeCompanyName}-improved.svg`;
  
  const logoUploadResult = await uploadToStorage('images', logoFileName, logoBuffer, 'image/svg+xml');
  
  if (!logoUploadResult.success) {
    log(`⚠ Logo上传失败: ${logoUploadResult.error}`);
  } else {
    log(`✓ Logo生成并上传成功`);
  }

  if (existingCompany) {
    // 更新现有企业的Logo
    const { error: updateError } = await supabase
      .from('admin_companies')
      .update({
        logo_url: logoUploadResult.success ? logoUploadResult.publicUrl : null
      })
      .eq('id', existingCompany.id);

    if (updateError) {
      log(`⚠ 更新企业Logo失败: ${updateError.message}`);
    } else {
      log(`✓ 更新现有企业Logo: ${companyData.chineseCompanyName}`);
    }

    return {
      id: existingCompany.id,
      logoUrl: logoUploadResult.success ? logoUploadResult.publicUrl : null
    };
  } else {
    // 创建新企业记录
    const { data: newCompany, error } = await supabase
      .from('admin_companies')
      .insert({
        name_zh: companyData.chineseCompanyName,
        name_en: companyData.englishCompanyName || improvedTranslation(companyData.chineseCompanyName),
        logo_url: logoUploadResult.success ? logoUploadResult.publicUrl : null,
        country_id: japanCountryId,
        company_type: 'private_company',
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    log(`✓ 创建新企业: ${companyData.chineseCompanyName}`);
    return {
      id: newCompany.id,
      logoUrl: logoUploadResult.success ? logoUploadResult.publicUrl : null
    };
  }
}

// 导入单个技术
async function importSingleTech(index) {
  try {
    // 读取数据文件
    const dataPath = path.join(__dirname, 'data', 'japanese-tech-database.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    if (index >= jsonData.technologies.length) {
      console.log('❌ 索引超出范围');
      return;
    }

    const tech = jsonData.technologies[index];
    console.log(`\n🚀 开始导入第 ${index + 1} 条技术数据:`);
    console.log(`   技术名称: ${tech.technologyName}`);
    console.log(`   企业名称: ${tech.chineseCompanyName}`);
    console.log(`   自定义标签: ${tech.customLabel}`);

    // 检查是否已导入
    const { data: existing } = await supabase
      .from('admin_technologies')
      .select('id')
      .eq('name_zh', tech.technologyName)
      .eq('acquisition_method', 'japan_china_cooperation')
      .single();

    if (existing) {
      console.log('⚠ 该技术已存在，跳过导入');
      return;
    }

    // 获取必需的ID
    const { japanCountryId, categoryId } = await getRequiredIds();

    // 1. 下载技术图片
    let imageUrl = null;
    if (tech.imageUrl) {
      log(`📷 下载技术图片: ${tech.imageUrl}`);
      try {
        const imageBuffer = await downloadFile(tech.imageUrl);
        const imageExt = path.extname(new URL(tech.imageUrl).pathname) || '.jpg';
        const imageFileName = `tech-images/jp-${Date.now()}-${tech.id}${imageExt}`;
        
        const imageUploadResult = await uploadToStorage('images', imageFileName, imageBuffer, `image/${imageExt.slice(1)}`);
        
        if (imageUploadResult.success) {
          imageUrl = imageUploadResult.publicUrl;
          log(`✓ 技术图片上传成功`);
        } else {
          log(`⚠ 技术图片上传失败: ${imageUploadResult.error}`);
        }
      } catch (error) {
        log(`⚠ 技术图片处理失败: ${error.message}`);
      }
    }

    // 2. 下载技术资料PDF
    let attachmentUrl = null;
    if (tech.downloadLink) {
      log(`📄 下载技术资料: ${tech.downloadLink}`);
      try {
        const pdfBuffer = await downloadFile(tech.downloadLink);
        const pdfFileName = `tech-attachments/jp-${Date.now()}-${tech.id}.pdf`;
        
        const pdfUploadResult = await uploadToStorage('images', pdfFileName, pdfBuffer, 'application/pdf');
        
        if (pdfUploadResult.success) {
          attachmentUrl = pdfUploadResult.publicUrl;
          log(`✓ 技术资料上传成功`);
        } else {
          log(`⚠ 技术资料上传失败: ${pdfUploadResult.error}`);
        }
      } catch (error) {
        log(`⚠ 技术资料处理失败: ${error.message}`);
      }
    }

    // 3. 创建或查找企业
    const companyInfo = await createOrFindCompany({
      chineseCompanyName: tech.chineseCompanyName,
      englishCompanyName: tech.englishCompanyName
    }, japanCountryId);

    // 4. 改进翻译
    const nameEn = improvedTranslation(tech.technologyName, true);
    const descriptionEn = improvedTranslation(tech.technologyDescription, false);

    log(`📝 翻译结果:`);
    log(`   中文名称: ${tech.technologyName}`);
    log(`   英文名称: ${nameEn}`);
    log(`   英文描述: ${descriptionEn.slice(0, 100)}...`);

    // 5. 插入技术数据
    const technologyData = {
      name_zh: tech.technologyName,
      name_en: nameEn,
      description_zh: tech.technologyDescription,
      description_en: descriptionEn,
      image_url: imageUrl,
      tech_source: 'self_developed',
      acquisition_method: 'japan_china_cooperation',
      category_id: categoryId,
      custom_label: tech.customLabel,
      attachment_urls: attachmentUrl ? [attachmentUrl] : [],
      company_id: companyInfo?.id,
      company_name_zh: tech.chineseCompanyName,
      company_name_en: tech.englishCompanyName || improvedTranslation(tech.chineseCompanyName),
      company_logo_url: companyInfo?.logoUrl,
      company_country_id: japanCountryId,
      review_status: 'published',
      is_active: true
    };

    const { data: newTech, error } = await supabase
      .from('admin_technologies')
      .insert(technologyData)
      .select()
      .single();

    if (error) throw error;

    console.log(`\n✅ 技术导入成功!`);
    console.log(`   技术ID: ${newTech.id}`);
    console.log(`   技术图片: ${imageUrl ? '✓' : '✗'}`);
    console.log(`   技术资料: ${attachmentUrl ? '✓' : '✗'}`);
    console.log(`   企业Logo: ${companyInfo?.logoUrl ? '✓' : '✗'}`);
    console.log(`\n🔍 请在前端检查该技术数据的显示效果，确认无误后继续下一条`);

  } catch (error) {
    console.error(`❌ 导入失败:`, error);
  }
}

// 主程序
const index = parseInt(process.argv[2]);
if (isNaN(index)) {
  console.log('使用方法: node import-single-tech.js <索引>');
  console.log('例如: node import-single-tech.js 0  (导入第1条数据)');
  process.exit(1);
}

importSingleTech(index);