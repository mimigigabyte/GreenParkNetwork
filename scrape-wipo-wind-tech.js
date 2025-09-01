#!/usr/bin/env node

/**
 * WIPO Green Wind Energy Technology Scraper
 * 抓取WIPO Green数据库中的98项风能技术详细信息
 */

const fs = require('fs');
const path = require('path');

// 技术列表数据 - 从之前的API调用结果获得
const technologiesList = [
  {
    "name": "Flexibile foundations for earthquake-proof offshore wind power",
    "id": "171988",
    "owner": "J-Power",
    "publishedDate": "2025/04/30",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/171988?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "Variable pitch turbine for homes",
    "id": "171985",
    "owner": "ZONHAN",
    "publishedDate": "2025/04/30",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/171985?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "EnergySail",
    "id": "171616",
    "owner": "Eco Marine Power",
    "publishedDate": "2025/04/13",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/171616?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  }
  // ... 这里会包含完整的98项技术列表
];

// 完整的98项技术数据
const fullTechnologiesList = [
  {
    "name": "Flexibile foundations for earthquake-proof offshore wind power",
    "id": "171988",
    "owner": "J-Power",
    "publishedDate": "2025/04/30",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/171988?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "Variable pitch turbine for homes",
    "id": "171985",
    "owner": "ZONHAN",
    "publishedDate": "2025/04/30",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/171985?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "EnergySail",
    "id": "171616",
    "owner": "Eco Marine Power",
    "publishedDate": "2025/04/13",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/171616?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "Integrated aquaculture and off-shore renewable energy",
    "id": "162406",
    "owner": "China Longyuan Power Group",
    "publishedDate": "2025/01/24",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/162406?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "Off grid wind and solar hybrid energy system",
    "id": "162189",
    "owner": "PVMars Solar",
    "publishedDate": "2025/01/17",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/162189?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "Small home wind turbine",
    "id": "162186",
    "owner": "A-WING",
    "publishedDate": "2025/01/17",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/162186?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "A system and method for generating and storing energy from wind",
    "id": "155961",
    "owner": "Real Lab",
    "publishedDate": "2024/10/31",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/155961?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "Windmill aerator",
    "id": "149553",
    "owner": "Koenders",
    "publishedDate": "2024/08/15",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/149553?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "Micro wind turbines and sustainable resilience units",
    "id": "149383",
    "owner": "Ryse Energy",
    "publishedDate": "2024/07/11",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/149383?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  },
  {
    "name": "AVATAR™ Small Wind Turbine",
    "id": "149296",
    "owner": "Avant Garde Innovations™",
    "publishedDate": "2024/06/28",
    "detailLink": "https://wipogreen.wipo.int/wipogreen-database/articles/149296?query=&type=BASIC&queryFilters.0.field=TECH_FIELD_ID&queryFilters.0.value=54&queryFilters.1.field=TYPE&queryFilters.1.value=TECHNOLOGY&queryFilters.2.field=SOURCE&queryFilters.2.value=1&queryFilters.3.field=SOURCE&queryFilters.3.value=2&pagination.size=100&pagination.page=0&sort.0.field=CREATED_AT&sort.0.direction=DESC"
  }
  // ... 这里将包含所有98项技术的完整数据
];

/**
 * 使用 FireCrawl 抓取技术详情
 * 这个函数将被 FireCrawl MCP 工具调用
 */
async function scrapeTechnologyDetails() {
  console.log('开始抓取WIPO Green风能技术详情...');
  console.log(`总共需要抓取 ${fullTechnologiesList.length} 项技术`);
  
  // 这里将用于调用FireCrawl MCP工具
  // 由于这是一个计划脚本，实际的MCP工具调用将在Claude Code中执行
  
  return {
    message: "此脚本将通过Claude Code的FireCrawl MCP工具执行实际抓取",
    technologiesCount: fullTechnologiesList.length,
    requiredFields: [
      "技术英文名称", "ID", "企业名称", "Published time", "Updated time", 
      "企业网址", "技术图片", "技术英文描述", "技术收益", "技术收益描述",
      "国别", "应用国别", "技术成熟度", "知识产权", "自定义标签",
      "技术中文名称", "技术分类", "子分类"
    ]
  };
}

/**
 * 翻译和处理数据
 */
function translateAndProcessData(technologyData) {
  // 这个函数将处理翻译和关键词提取
  return {
    ...technologyData,
    technologyNameChinese: "", // 将被翻译填充
    customLabels: [], // 将被关键词提取填充
    technologyCategory: "清洁能源技术",
    subCategory: "风能技术"
  };
}

/**
 * 保存数据到文件
 */
function saveDataToFile(data, filename) {
  const filePath = path.join(__dirname, 'data', filename);
  
  // 确保 data 目录存在
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  
  // 保存JSON格式
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`数据已保存到: ${filePath}`);
  
  // 同时保存CSV格式
  const csvPath = filePath.replace('.json', '.csv');
  const csv = convertToCSV(data);
  fs.writeFileSync(csvPath, csv, 'utf8');
  console.log(`CSV数据已保存到: ${csvPath}`);
}

/**
 * 将JSON数据转换为CSV格式
 */
function convertToCSV(jsonData) {
  if (!jsonData || jsonData.length === 0) return '';
  
  const headers = Object.keys(jsonData[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = jsonData.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// 主执行函数
async function main() {
  try {
    console.log('=== WIPO Green 风能技术数据抓取工具 ===');
    console.log('准备抓取98项风能技术的详细信息...\n');
    
    const result = await scrapeTechnologyDetails();
    console.log(result);
    
    // 创建输出目录
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 保存技术列表供参考
    saveDataToFile(fullTechnologiesList, 'wipo-wind-tech-list.json');
    
    console.log('\n脚本准备完成！');
    console.log('请使用Claude Code的FireCrawl MCP工具执行实际的数据抓取。');
    
  } catch (error) {
    console.error('执行过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  scrapeTechnologyDetails,
  translateAndProcessData,
  saveDataToFile,
  convertToCSV,
  fullTechnologiesList
};