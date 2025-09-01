const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

/**
 * 日中经协技术数据导入脚本
 * 将 Japanese Technology Database 数据导入到管理员技术数据库
 */

// Supabase 配置
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function logError(message, error = null) {
  log(`ERROR: ${message}${error ? `: ${error.message}` : ''}`, 'ERROR');
  if (error && error.stack) {
    console.error(error.stack);
  }
}

function logSuccess(message) {
  log(`✅ ${message}`, 'SUCCESS');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'WARNING');
}

// 改进的Logo生成函数（使用现代渐变设计）
function generateLogoServer(companyName, size = 256) {
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
    .replace(/(有限公司|股份有限公司|有限责任公司|集团|公司|科技|技术)$/g, '')
    .replace(/\s+/g, '');

  if (cleanName.length >= 4) {
    return cleanName.slice(0, 4).split('');
  }
  
  const remainingChars = companyName.replace(/\s+/g, '').slice(cleanName.length);
  const result = cleanName.split('');
  
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

/**
 * 下载文件函数
 */
async function downloadFile(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const request = client.get(url, { timeout }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        const redirectUrl = response.headers.location;
        log(`重定向到: ${redirectUrl}`);
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

/**
 * 上传文件到Supabase Storage
 */
async function uploadToStorage(bucket, fileName, buffer, contentType) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // 获取公开URL
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

/**
 * 查询日本国家ID
 */
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

/**
 * 查询或创建技术分类
 */
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

/**
 * 改进的翻译函数（来自修复脚本）
 */
function translateToEnglish(chineseText, isName = false) {
  // 完整的专业翻译映射
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
    '电渗析': 'electrodialysis',
    '脱盐': 'desalination',
    '浓缩技术': 'concentration technology',
    '零排放': 'zero discharge',
    '水处理': 'water treatment',
    '清洗频率': 'cleaning frequency',
    '透过水量': 'permeate flow rate',
    
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

/**
 * 创建或查找企业
 */
async function createOrFindCompany(companyData, japanCountryId) {
  try {
    // 先查询企业是否已存在
    const { data: existingCompany } = await supabase
      .from('admin_companies')
      .select('id, logo_url')
      .eq('name_zh', companyData.chineseCompanyName)
      .single();

    if (existingCompany) {
      logSuccess(`企业已存在: ${companyData.chineseCompanyName}`);
      return {
        id: existingCompany.id,
        logoUrl: existingCompany.logo_url
      };
    }

    // 生成企业Logo
    const logoBuffer = generateLogoServer(companyData.chineseCompanyName, 256);
    const timestamp = Date.now();
    // 避免文件名中的中文字符，使用拼音或ID替代
    const safeCompanyName = companyData.chineseCompanyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'company';
    const logoFileName = `company-logos/jp-${timestamp}-${safeCompanyName}.svg`;
    
    const logoUploadResult = await uploadToStorage('images', logoFileName, logoBuffer, 'image/svg+xml');
    
    if (!logoUploadResult.success) {
      logWarning(`企业Logo上传失败: ${logoUploadResult.error}`);
    }

    // 创建企业记录
    const companyInsertData = {
      name_zh: companyData.chineseCompanyName,
      name_en: companyData.englishCompanyName || translateToEnglish(companyData.chineseCompanyName),
      logo_url: logoUploadResult.success ? logoUploadResult.publicUrl : null,
      country_id: japanCountryId,
      company_type: 'private_company',
      is_active: true
    };

    const { data: newCompany, error } = await supabase
      .from('admin_companies')
      .insert(companyInsertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logSuccess(`创建新企业: ${companyData.chineseCompanyName}`);
    return {
      id: newCompany.id,
      logoUrl: logoUploadResult.success ? logoUploadResult.publicUrl : null
    };

  } catch (error) {
    logError('处理企业信息失败', error);
    return null;
  }
}

/**
 * 处理单个技术数据
 */
async function processTechnologyData(techData, japanCountryId, categoryId) {
  log(`开始处理技术: ${techData.technologyName}`);

  try {
    // 1. 下载并上传技术图片
    let imageUrl = null;
    if (techData.imageUrl) {
      log(`下载技术图片: ${techData.imageUrl}`);
      try {
        const imageBuffer = await downloadFile(techData.imageUrl);
        const imageExt = path.extname(new URL(techData.imageUrl).pathname) || '.jpg';
        const imageFileName = `tech-images/jp-${Date.now()}-${techData.id}${imageExt}`;
        
        const imageUploadResult = await uploadToStorage('images', imageFileName, imageBuffer, `image/${imageExt.slice(1)}`);
        
        if (imageUploadResult.success) {
          imageUrl = imageUploadResult.publicUrl;
          logSuccess(`技术图片上传成功: ${imageFileName}`);
        } else {
          logWarning(`技术图片上传失败: ${imageUploadResult.error}`);
        }
      } catch (error) {
        logWarning(`技术图片处理失败: ${error.message}`);
      }
    }

    // 2. 下载并上传技术资料PDF
    let attachmentUrl = null;
    if (techData.downloadLink) {
      log(`下载技术资料: ${techData.downloadLink}`);
      try {
        const pdfBuffer = await downloadFile(techData.downloadLink);
        const pdfFileName = `tech-attachments/jp-${Date.now()}-${techData.id}.pdf`;
        
        // 使用images bucket（因为documents bucket不存在）
        const pdfUploadResult = await uploadToStorage('images', pdfFileName, pdfBuffer, 'application/pdf');
        
        if (pdfUploadResult.success) {
          attachmentUrl = pdfUploadResult.publicUrl;
          logSuccess(`技术资料上传成功: ${pdfFileName}`);
        } else {
          logWarning(`技术资料上传失败: ${pdfUploadResult.error}`);
        }
      } catch (error) {
        logWarning(`技术资料处理失败: ${error.message}`);
      }
    }

    // 3. 创建或查找企业
    const companyInfo = await createOrFindCompany({
      chineseCompanyName: techData.chineseCompanyName,
      englishCompanyName: techData.englishCompanyName
    }, japanCountryId);

    // 4. 翻译技术名称和描述
    const nameEn = translateToEnglish(techData.technologyName, true);
    const descriptionEn = translateToEnglish(techData.technologyDescription, false);

    // 5. 准备技术数据
    const technologyInsertData = {
      name_zh: techData.technologyName,
      name_en: nameEn,
      description_zh: techData.technologyDescription,
      description_en: descriptionEn,
      image_url: imageUrl,
      tech_source: 'self_developed', // 修正为有效的枚举值
      acquisition_method: 'japan_china_cooperation', // 正确的日中经协获取方式
      category_id: categoryId,
      subcategory_id: null,
      custom_label: techData.customLabel,
      attachment_urls: attachmentUrl ? [attachmentUrl] : [],
      company_id: companyInfo?.id,
      company_name_zh: techData.chineseCompanyName,
      company_name_en: techData.englishCompanyName || translateToEnglish(techData.chineseCompanyName),
      company_logo_url: companyInfo?.logoUrl,
      company_country_id: japanCountryId,
      review_status: 'published',
      is_active: true
    };

    // 过滤空值
    const filteredData = Object.fromEntries(
      Object.entries(technologyInsertData).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

    // 6. 插入技术数据
    const { data: newTechnology, error } = await supabase
      .from('admin_technologies')
      .insert(filteredData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logSuccess(`技术数据导入成功: ${techData.technologyName} (ID: ${newTechnology.id})`);
    return {
      success: true,
      technologyId: newTechnology.id,
      data: newTechnology
    };

  } catch (error) {
    logError(`技术数据处理失败: ${techData.technologyName}`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 主程序
 */
async function main() {
  log('🚀 开始日中经协技术数据导入...');

  try {
    // 1. 读取数据文件
    const dataPath = path.join(__dirname, 'data', 'japanese-tech-database.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    log(`📄 读取到 ${jsonData.technologies.length} 条技术数据`);

    // 2. 获取日本国家ID
    const japanCountryId = await getJapanCountryId();
    if (!japanCountryId) {
      throw new Error('无法获取日本国家ID，请检查数据库中是否有日本的记录');
    }
    logSuccess(`日本国家ID: ${japanCountryId}`);

    // 3. 获取或创建技术分类
    const categoryId = await getOrCreateCategory('节能环保技术');
    if (!categoryId) {
      throw new Error('无法获取技术分类ID');
    }
    logSuccess(`技术分类ID: ${categoryId}`);

    // 4. 导入所有技术数据
    log('🚀 开始导入所有技术数据...');
    const totalTechs = jsonData.technologies.length;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < totalTechs; i++) {
      const tech = jsonData.technologies[i];
      log(`\n📋 [${i + 1}/${totalTechs}] 处理技术: ${tech.technologyName}`);
      
      const result = await processTechnologyData(tech, japanCountryId, categoryId);
      
      if (result.success) {
        successCount++;
        logSuccess(`✅ 导入成功!`);
        log(`  技术ID: ${result.technologyId}`);
        log(`  企业: ${result.data.company_name_zh}`);
        log(`  图片: ${result.data.image_url ? '✓' : '✗'}`);
        log(`  资料: ${result.data.attachment_urls?.length > 0 ? '✓' : '✗'}`);
      } else {
        failCount++;
        logError(`❌ 导入失败: ${result.error}`);
      }
      
      // 添加延迟避免API频率限制
      if (i < totalTechs - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 输出导入统计
    log('\n📊 导入统计:');
    logSuccess(`成功: ${successCount}/${totalTechs}`);
    if (failCount > 0) {
      logError(`失败: ${failCount}/${totalTechs}`);
    }

  } catch (error) {
    logError('导入程序执行失败', error);
    process.exit(1);
  }
}

// 运行程序
if (require.main === module) {
  main();
}

module.exports = {
  downloadFile,
  uploadToStorage,
  translateToEnglish,
  processTechnologyData
};