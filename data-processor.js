#!/usr/bin/env node

/**
 * WIPO Green Wind Technology Data Processor
 * 处理和翻译WIPO Green风能技术数据
 */

const fs = require('fs');
const path = require('path');

// 示例原始数据（从FireCrawl提取的数据）
const sampleExtractedData = [
  {
    "id": "171988",
    "technologyNameEN": "Flexible Tripile foundation for earthquake-proof offshore wind power",
    "companyName": "J-Power",
    "publishedDate": "2025/04/30",
    "updatedDate": "2025/05/30",
    "companyWebsiteUrl": "https://www.jpower.co.jp/english/",
    "description": "The \"Flexible Tripile\" foundation addresses challenges posed by the shallow, hard bedrock common in Japanese waters, where traditional monopile foundations may be unsuitable. The new design consists of three piles connected to a central steel main pipe supporting the turbine tower via a base plate. This base plate incorporates square steel pipes, steel plates, and wire ropes, creating a flexible structure that deforms relatively easily. The design provides seismic isolation, allowing the turbine to sway slowly, preventing vibrations, and avoiding resonance-amplified oscillations during earthquakes.",
    "benefits": "Seismic isolation and vibration damping",
    "developedInCountry": "Japan",
    "deployedInCountry": "Japan"
  },
  {
    "id": "162186",
    "technologyNameEN": "Small home wind turbine",
    "companyName": "A-WING",
    "publishedDate": "2025/01/17",
    "updatedDate": "2025/07/16",
    "companyWebsiteUrl": "http://www.awing-i.com/english/index.html",
    "description": "A-WING small wind turbines are designed for optimal performance even in low wind speed regions like Japan. They feature advanced blades, generators, and controllers for maximum efficiency, generating eco-friendly power without CO2 emissions. Using proprietary technology, the range includes compact 300W to 1kW turbines. The coreless generator allows smooth operation, starting at wind speeds as low as 1 m/s, with battery charging from 1.5 m/s.",
    "benefits": "Eco-friendly power generation without CO2 emissions",
    "developedInCountry": "Japan",
    "deployedInCountry": ""
  },
  {
    "id": "148956",
    "technologyNameEN": "Floating structure of the wind turbine",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "publishedDate": "2023/11/12",
    "updatedDate": "2023/12/11",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "description": "Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the floating body of the wind turbine.",
    "benefits": "High power generation efficiency, improved reliability during high wind speeds, reduced risk of collision with the tower",
    "developedInCountry": "Japan",
    "deployedInCountry": "Philippines"
  }
];

/**
 * 中英文翻译映射表
 */
const translationMap = {
  // 技术名称翻译
  "Flexible Tripile foundation for earthquake-proof offshore wind power": "地震防护海上风电柔性三桩基础",
  "Small home wind turbine": "小型家用风力发电机",
  "Floating structure of the wind turbine": "风力发电机浮动结构",
  "Variable pitch turbine for homes": "家用变桨距风力发电机",
  "EnergySail": "能源帆",
  "Integrated aquaculture and off-shore renewable energy": "水产养殖与海上可再生能源集成",
  "Off grid wind and solar hybrid energy system": "离网风光混合能源系统",
  "Micro wind turbines and sustainable resilience units": "微型风力发电机和可持续韧性单元",
  "Windmill aerator": "风车增氧机",
  "Typhoon-proof wind turbines": "防台风风力发电机",
  "Downwind Turbine System": "下风向风力发电机系统",
  
  // 公司名称保持英文
  "J-Power": "J-Power",
  "A-WING": "A-WING", 
  "Mitsubishi Heavy Industries, Ltd.": "三菱重工有限公司",
  "ZONHAN": "ZONHAN",
  "Eco Marine Power": "Eco Marine Power",
  "China Longyuan Power Group": "中国龙源电力集团",
  "PVMars Solar": "PVMars Solar",
  "Hitachi, Ltd.": "日立有限公司",
  "Challenergy": "Challenergy",
  
  // 国家翻译
  "Japan": "日本",
  "China": "中国",
  "Philippines": "菲律宾",
  "United States": "美国",
  "Germany": "德国",
  "United Kingdom": "英国",
  "South Korea": "韩国"
};

/**
 * 关键词提取和分类
 */
const keywordCategories = {
  structure: {
    en: ['foundation', 'tower', 'blade', 'nacelle', 'rotor', 'hub', 'floating', 'tripile', 'monopile'],
    cn: ['基础', '塔架', '叶片', '机舱', '转子', '轮毂', '浮动', '三桩', '单桩']
  },
  technology: {
    en: ['generator', 'gearbox', 'control', 'pitch', 'yaw', 'brake', 'transformer', 'converter'],
    cn: ['发电机', '齿轮箱', '控制', '变桨', '偏航', '制动', '变压器', '变换器']
  },
  application: {
    en: ['offshore', 'onshore', 'home', 'residential', 'commercial', 'utility', 'small', 'micro', 'large'],
    cn: ['海上', '陆上', '家用', '住宅', '商用', '公用事业', '小型', '微型', '大型']
  },
  performance: {
    en: ['efficiency', 'reliability', 'maintenance', 'vibration', 'noise', 'power', 'energy', 'output'],
    cn: ['效率', '可靠性', '维护', '振动', '噪音', '功率', '能源', '输出']
  },
  environmental: {
    en: ['typhoon', 'earthquake', 'seismic', 'wind', 'weather', 'corrosion', 'durability'],
    cn: ['台风', '地震', '地震', '风', '天气', '腐蚀', '耐久性']
  }
};

/**
 * 翻译文本
 */
function translateText(text, isCompanyName = false) {
  if (!text) return '';
  
  // 直接查找翻译映射
  if (translationMap[text]) {
    return translationMap[text];
  }
  
  // 如果是公司名称，通常保持英文
  if (isCompanyName) {
    return text;
  }
  
  // 对于未找到翻译的文本，返回带标记的原文
  return text;
}

/**
 * 从描述中提取关键词并翻译
 */
function extractAndTranslateKeywords(description) {
  if (!description) return [];
  
  const extractedKeywords = new Set();
  const lowerDesc = description.toLowerCase();
  
  // 遍历各类关键词
  Object.values(keywordCategories).forEach(category => {
    category.en.forEach((keyword, index) => {
      if (lowerDesc.includes(keyword)) {
        extractedKeywords.add(category.cn[index]);
      }
    });
  });
  
  return Array.from(extractedKeywords).slice(0, 8); // 限制为8个关键词
}

/**
 * 处理单项技术数据
 */
function processTechnologyData(rawData) {
  const processedData = {
    // 1. 技术英文名称
    technologyNameEN: rawData.technologyNameEN || '',
    
    // 2. ID
    id: rawData.id || '',
    
    // 3. 企业名称
    companyName: rawData.companyName || '',
    
    // 4. Published time
    publishedTime: rawData.publishedDate || '',
    
    // 5. Updated time
    updatedTime: rawData.updatedDate || '',
    
    // 6. 企业网址
    companyWebsiteUrl: rawData.companyWebsiteUrl || '',
    
    // 7. 技术图片 (通常从WIPO数据库获取)
    technologyImageUrl: `https://wipogreen.wipo.int/wipogreen-database/articles/${rawData.id}/image` || '',
    
    // 8. 技术英文描述
    description: rawData.description || '',
    
    // 9. 技术收益
    benefits: rawData.benefits || '',
    
    // 10. 技术收益描述
    benefitsDescription: rawData.benefitsDescription || '',
    
    // 11. 国别（开发国）
    developedInCountry: translateText(rawData.developedInCountry || ''),
    
    // 12. 应用国别
    deployedInCountry: translateText(rawData.deployedInCountry || ''),
    
    // 13. 技术成熟度
    technologyReadinessLevel: rawData.technologyReadinessLevel || '',
    
    // 14. 知识产权
    intellectualProperty: rawData.intellectualProperty || '',
    
    // 15. 自定义标签（关键词）
    customLabels: extractAndTranslateKeywords(rawData.description || ''),
    
    // 16. 技术中文名称
    technologyNameCN: translateText(rawData.technologyNameEN || ''),
    
    // 17. 技术分类
    technologyCategory: '清洁能源技术',
    
    // 18. 子分类
    subCategory: '风能技术',
    
    // 额外信息
    processedAt: new Date().toISOString(),
    source: 'WIPO Green Database',
    originalData: rawData
  };
  
  return processedData;
}

/**
 * 批量处理技术数据
 */
function batchProcessTechnologies(rawDataArray) {
  if (!Array.isArray(rawDataArray)) {
    console.error('输入数据必须是数组格式');
    return [];
  }
  
  console.log(`开始处理 ${rawDataArray.length} 项技术数据...`);
  
  const processedData = rawDataArray.map((rawTech, index) => {
    console.log(`处理第 ${index + 1} 项: ${rawTech.technologyNameEN || 'Unknown'}`);
    return processTechnologyData(rawTech);
  });
  
  console.log(`数据处理完成，共处理 ${processedData.length} 项技术`);
  return processedData;
}

/**
 * 保存处理后的数据
 */
function saveProcessedData(processedData, filename = 'wipo-wind-technologies-processed.json') {
  const dataDir = path.join(__dirname, 'data');
  
  // 确保目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 保存JSON文件
  const jsonPath = path.join(dataDir, filename);
  fs.writeFileSync(jsonPath, JSON.stringify(processedData, null, 2), 'utf8');
  console.log(`JSON数据已保存到: ${jsonPath}`);
  
  // 保存CSV文件
  const csvPath = jsonPath.replace('.json', '.csv');
  const csvContent = convertToCSV(processedData);
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`CSV数据已保存到: ${csvPath}`);
  
  // 生成摘要报告
  generateSummaryReport(processedData);
  
  return { jsonPath, csvPath };
}

/**
 * 转换为CSV格式
 */
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = [
    'id', 'technologyNameEN', 'technologyNameCN', 'companyName', 
    'publishedTime', 'updatedTime', 'companyWebsiteUrl', 'technologyImageUrl',
    'description', 'benefits', 'benefitsDescription', 'developedInCountry',
    'deployedInCountry', 'technologyReadinessLevel', 'intellectualProperty',
    'customLabels', 'technologyCategory', 'subCategory'
  ];
  
  const csvRows = data.map(row => {
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
  
  return [headers.join(','), ...csvRows].join('\n');
}

/**
 * 生成摘要报告
 */
function generateSummaryReport(processedData) {
  const report = {
    totalTechnologies: processedData.length,
    companiesCount: new Set(processedData.map(t => t.companyName)).size,
    countriesCount: new Set(processedData.map(t => t.developedInCountry).filter(c => c)).size,
    processingDate: new Date().toISOString(),
    topCompanies: getTopCompanies(processedData),
    topCountries: getTopCountries(processedData),
    keywordFrequency: getKeywordFrequency(processedData)
  };
  
  const reportPath = path.join(__dirname, 'data', 'processing-summary-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`摘要报告已生成: ${reportPath}`);
}

function getTopCompanies(data) {
  const companies = {};
  data.forEach(tech => {
    if (tech.companyName) {
      companies[tech.companyName] = (companies[tech.companyName] || 0) + 1;
    }
  });
  return Object.entries(companies)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([company, count]) => ({ company, count }));
}

function getTopCountries(data) {
  const countries = {};
  data.forEach(tech => {
    if (tech.developedInCountry) {
      countries[tech.developedInCountry] = (countries[tech.developedInCountry] || 0) + 1;
    }
  });
  return Object.entries(countries)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));
}

function getKeywordFrequency(data) {
  const keywords = {};
  data.forEach(tech => {
    if (tech.customLabels && Array.isArray(tech.customLabels)) {
      tech.customLabels.forEach(keyword => {
        keywords[keyword] = (keywords[keyword] || 0) + 1;
      });
    }
  });
  return Object.entries(keywords)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
}

// 主执行函数
function main() {
  console.log('=== WIPO Green 风能技术数据处理器 ===');
  
  // 处理示例数据
  const processedSampleData = batchProcessTechnologies(sampleExtractedData);
  
  // 保存处理后的数据
  const filePaths = saveProcessedData(processedSampleData, 'wipo-wind-sample-processed.json');
  
  console.log('\n=== 处理完成 ===');
  console.log(`处理了 ${processedSampleData.length} 项技术`);
  console.log(`JSON文件: ${filePaths.jsonPath}`);
  console.log(`CSV文件: ${filePaths.csvPath}`);
}

// 导出模块
module.exports = {
  processTechnologyData,
  batchProcessTechnologies,
  saveProcessedData,
  translateText,
  extractAndTranslateKeywords,
  convertToCSV,
  sampleExtractedData,
  translationMap,
  keywordCategories
};

// 如果直接运行
if (require.main === module) {
  main();
}