#!/usr/bin/env node

/**
 * WIPO Green Wind Technology Batch Scraper
 * 批量抓取WIPO Green数据库中的风能技术数据
 */

const fs = require('fs');
const path = require('path');

// 所有98项技术的URL列表
const allTechUrls = [
  "https://wipogreen.wipo.int/wipogreen-database/articles/171988",
  "https://wipogreen.wipo.int/wipogreen-database/articles/171985", 
  "https://wipogreen.wipo.int/wipogreen-database/articles/171616",
  "https://wipogreen.wipo.int/wipogreen-database/articles/162406",
  "https://wipogreen.wipo.int/wipogreen-database/articles/162189",
  "https://wipogreen.wipo.int/wipogreen-database/articles/162186",
  "https://wipogreen.wipo.int/wipogreen-database/articles/155961",
  "https://wipogreen.wipo.int/wipogreen-database/articles/149553",
  "https://wipogreen.wipo.int/wipogreen-database/articles/149383",
  "https://wipogreen.wipo.int/wipogreen-database/articles/149296",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148956",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148955",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148954",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148953",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148952",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148951",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148930",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148929",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148916",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148913",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148909",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148906",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148894",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148871",
  "https://wipogreen.wipo.int/wipogreen-database/articles/148847",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147990",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147989",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147925",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147787",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147752",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147751",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147699",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147698",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147697",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147595",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147515",
  "https://wipogreen.wipo.int/wipogreen-database/articles/147451",
  "https://wipogreen.wipo.int/wipogreen-database/articles/146724",
  "https://wipogreen.wipo.int/wipogreen-database/articles/146530",
  "https://wipogreen.wipo.int/wipogreen-database/articles/146464",
  "https://wipogreen.wipo.int/wipogreen-database/articles/146463",
  "https://wipogreen.wipo.int/wipogreen-database/articles/146411",
  "https://wipogreen.wipo.int/wipogreen-database/articles/138890",
  "https://wipogreen.wipo.int/wipogreen-database/articles/138694",
  "https://wipogreen.wipo.int/wipogreen-database/articles/24098",
  "https://wipogreen.wipo.int/wipogreen-database/articles/23656",
  "https://wipogreen.wipo.int/wipogreen-database/articles/23655",
  "https://wipogreen.wipo.int/wipogreen-database/articles/20574",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10731",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10730",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10729",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10728",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10727",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10697",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10548",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10539",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10537",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10535",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10507",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10500",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10492",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10480",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10479",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10391",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10370",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10353",
  "https://wipogreen.wipo.int/wipogreen-database/articles/9241",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10338",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10145",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10161",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10083",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8564",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8548",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8547",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8542",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8541",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8500",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8499",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8353",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8324",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8234",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10109",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8104",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8099",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8090",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8050",
  "https://wipogreen.wipo.int/wipogreen-database/articles/8027",
  "https://wipogreen.wipo.int/wipogreen-database/articles/7951",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10068",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10265",
  "https://wipogreen.wipo.int/wipogreen-database/articles/10051",
  "https://wipogreen.wipo.int/wipogreen-database/articles/7810",
  "https://wipogreen.wipo.int/wipogreen-database/articles/7593",
  "https://wipogreen.wipo.int/wipogreen-database/articles/7537",
  "https://wipogreen.wipo.int/wipogreen-database/articles/7536",
  "https://wipogreen.wipo.int/wipogreen-database/articles/7491",
  "https://wipogreen.wipo.int/wipogreen-database/articles/7515",
  "https://wipogreen.wipo.int/wipogreen-database/articles/7446"
];

/**
 * 将URL数组分割为批次
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 翻译文本到中文
 */
function translateToChinese(text) {
  // 这里将使用AI翻译服务
  // 暂时返回占位符
  return `[待翻译: ${text}]`;
}

/**
 * 从技术描述中提取关键词
 */
function extractKeywords(description) {
  // 使用AI提取关键词并翻译为中文
  const keywords = [];
  
  // 基于常见风能技术关键词的简单提取
  const windEnergyKeywords = {
    'offshore': '海上',
    'turbine': '风机',
    'wind': '风能',
    'blade': '叶片',
    'generator': '发电机',
    'tower': '塔架',
    'foundation': '基础',
    'rotor': '转子',
    'gearbox': '齿轮箱',
    'control': '控制',
    'maintenance': '维护',
    'floating': '浮动',
    'vertical': '垂直',
    'horizontal': '水平',
    'efficiency': '效率',
    'power': '功率',
    'energy': '能源',
    'renewable': '可再生',
    'sustainable': '可持续',
    'green': '绿色'
  };
  
  Object.entries(windEnergyKeywords).forEach(([en, cn]) => {
    if (description.toLowerCase().includes(en)) {
      keywords.push(cn);
    }
  });
  
  return keywords.slice(0, 5); // 限制为前5个关键词
}

/**
 * 处理和增强技术数据
 */
function processAndEnhanceTechnologyData(rawData) {
  return {
    // 基本信息
    technologyNameEN: rawData.technologyNameEN || '',
    technologyNameCN: translateToChinese(rawData.technologyNameEN || ''),
    id: rawData.id || '',
    companyName: rawData.companyName || '',
    publishedDate: rawData.publishedDate || '',
    updatedDate: rawData.updatedDate || '',
    companyWebsiteUrl: rawData.companyWebsiteUrl || '',
    technologyImageUrl: rawData.technologyImageUrl || '',
    
    // 技术详情
    description: rawData.description || '',
    benefits: rawData.benefits || '',
    benefitsDescription: rawData.benefitsDescription || '',
    
    // 地理信息
    developedInCountry: rawData.developedInCountry || '',
    deployedInCountry: rawData.deployedInCountry || '',
    
    // 技术成熟度和知识产权
    technologyReadinessLevel: rawData.technologyReadinessLevel || '',
    intellectualProperty: rawData.intellectualProperty || '',
    
    // 增强字段
    customLabels: extractKeywords(rawData.description || ''),
    technologyCategory: '清洁能源技术',
    subCategory: '风能技术',
    
    // 处理时间戳
    processedAt: new Date().toISOString(),
    source: 'WIPO Green Database'
  };
}

/**
 * 保存数据到文件
 */
function saveDataToFile(data, filename) {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`数据已保存到: ${filePath}`);
  
  // 同时生成CSV文件
  if (Array.isArray(data) && data.length > 0) {
    const csvPath = filePath.replace('.json', '.csv');
    const csv = convertToCSV(data);
    fs.writeFileSync(csvPath, csv, 'utf8');
    console.log(`CSV文件已保存到: ${csvPath}`);
  }
}

/**
 * 转换为CSV格式
 */
function convertToCSV(jsonData) {
  if (!jsonData || jsonData.length === 0) return '';
  
  const headers = Object.keys(jsonData[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = jsonData.map(row => {
    return headers.map(header => {
      let value = row[header] || '';
      if (Array.isArray(value)) {
        value = value.join(';');
      }
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// 导出函数供外部使用
module.exports = {
  allTechUrls,
  chunkArray,
  processAndEnhanceTechnologyData,
  saveDataToFile,
  convertToCSV,
  extractKeywords,
  translateToChinese
};

console.log('WIPO Green Wind Technology Batch Scraper准备就绪');
console.log(`待处理技术数量: ${allTechUrls.length}`);
console.log('建议批次大小: 10个URL per batch');