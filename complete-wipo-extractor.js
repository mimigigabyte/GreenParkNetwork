#!/usr/bin/env node

/**
 * Complete WIPO Green Wind Technology Extractor
 * 完整的WIPO Green风能技术数据抓取器
 * 
 * 此脚本将：
 * 1. 使用FireCrawl批量抓取所有98项技术详情
 * 2. 自动翻译技术名称到中文
 * 3. 提取关键词标签
 * 4. 生成完整的结构化数据
 */

const fs = require('fs');
const path = require('path');

// 完整的98项技术URL列表
const ALL_TECH_URLS = [
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

// 批次大小 - FireCrawl建议每批次5-10个URL
const BATCH_SIZE = 8;

// 翻译映射表（扩展版）
const TRANSLATION_MAP = {
  "Flexible Tripile foundation for earthquake-proof offshore wind power": "地震防护海上风电柔性三桩基础",
  "Variable pitch turbine for homes": "家用变桨距风力发电机",
  "EnergySail": "能源帆",
  "Integrated aquaculture and off-shore renewable energy": "水产养殖与海上可再生能源集成",
  "Off grid wind and solar hybrid energy system": "离网风光混合能源系统",
  "Small home wind turbine": "小型家用风力发电机",
  "A system and method for generating and storing energy from wind": "风能发电储能系统与方法",
  "Windmill aerator": "风车增氧机",
  "Micro wind turbines and sustainable resilience units": "微型风力发电机和可持续韧性单元",
  "AVATAR™ Small Wind Turbine": "AVATAR™小型风力发电机",
  "Floating structure of the wind turbine": "风力发电机浮动结构",
  "Construction and maintenance of wind turbine": "风力发电机建设与维护",
  "Wind Turbine Electrical components": "风力发电机电气组件",
  "Wind Turbine Tower": "风力发电机塔架",
  "Wind Turbine Nacelle components": "风力发电机机舱组件",
  "Control of the wind turbine(Operation & maintenance)": "风力发电机控制（运行与维护）",
  "Control of the Wind farm": "风电场控制",
  "Wind Turbine Control": "风力发电机控制",
  "Wind Turbine Blade inspection/fault detection and diagnosis": "风力发电机叶片检测/故障检测与诊断",
  "Wind Turbine Blade add-on (Vortex Generator)": "风力发电机叶片附件（涡流发生器）",
  "Wind Turbine Blade add-on(LEP,LPS)": "风力发电机叶片附件（LEP,LPS）",
  "Wind Turbine Blade structure": "风力发电机叶片结构",
  "Wind Turbine Blade performance": "风力发电机叶片性能",
  "Distributed Wind Power Systems": "分布式风电系统",
  "WINDMILL": "风车",
  "Vibration control of a wind turbine generator": "风力发电机振动控制",
  "Lightning structure of wind turbine blades": "风力发电机叶片避雷结构",
  "Small wind power generation equipment with vertical axis wind turbine": "垂直轴风力发电机小型风电设备",
  "Power supply circuit for electromagnetic induction type power generation element": "电磁感应发电元件供电电路",
  "Typhoon-proof wind turbines": "防台风风力发电机",
  "Downwind Turbine System": "下风向风力发电机系统"
};

/**
 * 将URL数组分割为批次
 */
function createBatches(urls, batchSize = BATCH_SIZE) {
  const batches = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * 生成FireCrawl批量提取指令
 */
function generateFireCrawlInstructions() {
  const batches = createBatches(ALL_TECH_URLS, BATCH_SIZE);
  const instructions = [];
  
  batches.forEach((batch, index) => {
    const instruction = {
      batchNumber: index + 1,
      totalBatches: batches.length,
      urls: batch,
      fireCrawlCommand: {
        tool: "mcp__firecrawl__firecrawl_extract",
        parameters: {
          urls: batch,
          prompt: "Extract comprehensive wind energy technology information from each WIPO Green technology page including: technology name, ID number, company/owner name, published date, updated date, company website URL (from VISIT WEBSITE link), full technology description, benefits information, countries where developed and deployed, technology readiness level, and intellectual property information from the Additional Information section.",
          schema: {
            "type": "object",
            "properties": {
              "technologyNameEN": {"type": "string"},
              "id": {"type": "string"},
              "companyName": {"type": "string"},
              "publishedDate": {"type": "string"},
              "updatedDate": {"type": "string"},
              "companyWebsiteUrl": {"type": "string"},
              "description": {"type": "string"},
              "benefits": {"type": "string"},
              "benefitsDescription": {"type": "string"},
              "developedInCountry": {"type": "string"},
              "deployedInCountry": {"type": "string"},
              "technologyReadinessLevel": {"type": "string"},
              "intellectualProperty": {"type": "string"}
            }
          }
        }
      }
    };
    instructions.push(instruction);
  });
  
  return instructions;
}

/**
 * 智能翻译函数
 */
function smartTranslate(text) {
  if (!text) return '';
  
  // 直接映射翻译
  if (TRANSLATION_MAP[text]) {
    return TRANSLATION_MAP[text];
  }
  
  // 基于关键词的智能翻译
  const keywordTranslations = {
    'wind turbine': '风力发电机',
    'offshore': '海上',
    'onshore': '陆上',
    'foundation': '基础',
    'blade': '叶片',
    'tower': '塔架',
    'nacelle': '机舱',
    'generator': '发电机',
    'control': '控制',
    'system': '系统',
    'technology': '技术',
    'power': '发电',
    'energy': '能源',
    'turbine': '风机',
    'floating': '浮动',
    'small': '小型',
    'micro': '微型',
    'home': '家用',
    'hybrid': '混合',
    'solar': '太阳能',
    'vertical': '垂直',
    'horizontal': '水平',
    'maintenance': '维护',
    'inspection': '检测',
    'fault': '故障',
    'detection': '检测',
    'diagnosis': '诊断'
  };
  
  let translatedText = text;
  Object.entries(keywordTranslations).forEach(([en, cn]) => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translatedText = translatedText.replace(regex, cn);
  });
  
  return translatedText !== text ? translatedText : text;
}

/**
 * 增强的关键词提取
 */
function extractEnhancedKeywords(description, techName, benefits) {
  const allText = `${description} ${techName} ${benefits}`.toLowerCase();
  const extractedKeywords = new Set();
  
  // 技术类型关键词
  const techTypes = {
    'offshore': '海上',
    'onshore': '陆上', 
    'floating': '浮动',
    'fixed': '固定',
    'vertical': '垂直',
    'horizontal': '水平',
    'small': '小型',
    'micro': '微型',
    'large': '大型'
  };
  
  // 组件关键词
  const components = {
    'foundation': '基础',
    'tower': '塔架',
    'blade': '叶片',
    'nacelle': '机舱',
    'rotor': '转子',
    'hub': '轮毂',
    'generator': '发电机',
    'gearbox': '齿轮箱',
    'transformer': '变压器'
  };
  
  // 功能关键词
  const functions = {
    'control': '控制',
    'maintenance': '维护',
    'monitoring': '监控',
    'inspection': '检测',
    'optimization': '优化',
    'efficiency': '效率',
    'reliability': '可靠性',
    'safety': '安全'
  };
  
  // 环境关键词
  const environmental = {
    'typhoon': '台风',
    'earthquake': '地震',
    'seismic': '地震',
    'vibration': '振动',
    'noise': '噪音',
    'corrosion': '腐蚀'
  };
  
  [techTypes, components, functions, environmental].forEach(category => {
    Object.entries(category).forEach(([en, cn]) => {
      if (allText.includes(en)) {
        extractedKeywords.add(cn);
      }
    });
  });
  
  return Array.from(extractedKeywords).slice(0, 8);
}

/**
 * 生成完整的数据处理脚本
 */
function generateProcessingScript() {
  return `
// 完整数据处理脚本
// 此脚本将处理从FireCrawl提取的原始数据

function processExtractedData(rawDataArray) {
  const processedData = rawDataArray.map(rawTech => ({
    // 18个必需字段
    technologyNameEN: rawTech.technologyNameEN || '',
    id: rawTech.id || '',
    companyName: rawTech.companyName || '',
    publishedTime: rawTech.publishedDate || '',
    updatedTime: rawTech.updatedDate || '',
    companyWebsiteUrl: rawTech.companyWebsiteUrl || '',
    technologyImageUrl: \`https://wipogreen.wipo.int/wipogreen-database/articles/\${rawTech.id}/image\`,
    description: rawTech.description || '',
    benefits: rawTech.benefits || '',
    benefitsDescription: rawTech.benefitsDescription || '',
    developedInCountry: translateCountry(rawTech.developedInCountry || ''),
    deployedInCountry: translateCountry(rawTech.deployedInCountry || ''),
    technologyReadinessLevel: rawTech.technologyReadinessLevel || '',
    intellectualProperty: rawTech.intellectualProperty || '',
    customLabels: extractEnhancedKeywords(rawTech.description, rawTech.technologyNameEN, rawTech.benefits),
    technologyNameCN: smartTranslate(rawTech.technologyNameEN || ''),
    technologyCategory: '清洁能源技术',
    subCategory: '风能技术'
  }));
  
  return processedData;
}

function translateCountry(country) {
  const countryMap = {
    'Japan': '日本',
    'China': '中国',
    'United States': '美国',
    'Germany': '德国',
    'United Kingdom': '英国',
    'Philippines': '菲律宾',
    'South Korea': '韩国',
    'Netherlands': '荷兰',
    'Denmark': '丹麦',
    'Spain': '西班牙'
  };
  return countryMap[country] || country;
}
`;
}

/**
 * 主函数 - 生成完整的抓取计划
 */
function generateCompleteExtractionPlan() {
  const plan = {
    title: 'WIPO Green风能技术完整抓取计划',
    totalTechnologies: ALL_TECH_URLS.length,
    batchSize: BATCH_SIZE,
    totalBatches: Math.ceil(ALL_TECH_URLS.length / BATCH_SIZE),
    extractionInstructions: generateFireCrawlInstructions(),
    processingScript: generateProcessingScript(),
    requiredFields: [
      '1. 技术英文名称', '2. ID', '3. 企业名称', '4. Published time', '5. Updated time',
      '6. 企业网址', '7. 技术图片', '8. 技术英文描述', '9. 技术收益', '10. 技术收益描述',
      '11. 国别', '12. 应用国别', '13. 技术成熟度', '14. 知识产权', '15. 自定义标签',
      '16. 技术中文名称', '17. 技术分类', '18. 子分类'
    ]
  };
  
  return plan;
}

// 保存提取计划
function savePlan() {
  const plan = generateCompleteExtractionPlan();
  const dataDir = path.join(__dirname, 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const planPath = path.join(dataDir, 'complete-extraction-plan.json');
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');
  
  console.log('=== WIPO Green 风能技术完整抓取计划 ===');
  console.log(`总技术数量: ${plan.totalTechnologies}`);
  console.log(`分批数量: ${plan.totalBatches} 批次`);
  console.log(`每批次大小: ${plan.batchSize} 个URL`);
  console.log(`计划文件已保存: ${planPath}`);
  console.log('\\n=== 执行说明 ===');
  console.log('1. 使用FireCrawl MCP工具按批次执行URL提取');
  console.log('2. 每个批次使用提供的FireCrawl命令');
  console.log('3. 收集所有原始数据后，使用处理脚本进行数据处理');
  console.log('4. 最终生成包含18个字段的完整数据文件');
  
  return planPath;
}

// 导出模块
module.exports = {
  ALL_TECH_URLS,
  BATCH_SIZE,
  TRANSLATION_MAP,
  createBatches,
  generateFireCrawlInstructions,
  smartTranslate,
  extractEnhancedKeywords,
  generateCompleteExtractionPlan,
  generateProcessingScript
};

// 如果直接执行
if (require.main === module) {
  savePlan();
}