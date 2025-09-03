#!/usr/bin/env node

/**
 * Missing Technology Processor
 * 缺失技术数据处理器
 * 
 * 用于补充抓取39个缺失的技术数据，并验证其是否为风能技术
 */

const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
const { PageTypeDetector, FieldExtractor, CountryInferrer } = require('./enhanced-wipo-scraper');
const { QualityManager } = require('./data-quality-manager');

/**
 * 缺失技术处理器
 */
class MissingTechProcessor {
  constructor() {
    this.missingIds = [
      // 中等ID范围 (148942-148950)
      '148950', '148949', '148948', '148947', '148946', 
      '148945', '148944', '148943', '148942',
      // 低ID范围
      '147924',
      // 高ID范围 (174866-174894) 
      '174866', '174867', '174868', '174869', '174870',
      '174871', '174872', '174873', '174874', '174875',
      '174876', '174877', '174878', '174879', '174880',
      '174881', '174882', '174883', '174884', '174885',
      '174886', '174887', '174888', '174889', '174890',
      '174891', '174892', '174893', '174894'
    ];
    
    this.processedTechs = [];
    this.windTechs = [];
    this.nonWindTechs = [];
    this.errors = [];
  }
  
  /**
   * 生成抓取指令
   */
  generateBatchScrapeInstructions() {
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < this.missingIds.length; i += batchSize) {
      const batchIds = this.missingIds.slice(i, i + batchSize);
      const batchUrls = batchIds.map(id => 
        `https://wipogreen.wipo.int/wipogreen-database/articles/${id}`
      );
      
      const instruction = {
        batchNumber: Math.floor(i / batchSize) + 1,
        totalBatches: Math.ceil(this.missingIds.length / batchSize),
        techIds: batchIds,
        urls: batchUrls,
        extractCommand: {
          tool: "mcp__firecrawl__firecrawl_extract",
          parameters: {
            urls: batchUrls,
            prompt: "Extract comprehensive technology information from each WIPO Green page. Determine if this is wind energy related technology by analyzing the title, description, and content. Extract: technology name, ID, company name, dates, website, description, benefits, developed/deployed countries, technology readiness level, and IP information.",
            schema: {
              "type": "object",
              "properties": {
                "technologies": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {"type": "string"},
                      "technologyNameEN": {"type": "string"},
                      "isWindEnergyTech": {"type": "boolean"},
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
                      "intellectualProperty": {"type": "string"},
                      "sourceType": {"type": "string"},
                      "applicant": {"type": "string"}
                    }
                  }
                }
              }
            }
          }
        }
      };
      
      batches.push(instruction);
    }
    
    return batches;
  }
  
  /**
   * 处理提取的技术数据
   */
  processTechnologyData(extractedTech) {
    // 基本字段处理
    const processedTech = {
      technologyNameEN: extractedTech.technologyNameEN || '',
      id: extractedTech.id || '',
      companyName: extractedTech.companyName || extractedTech.applicant || '',
      publishedTime: this.standardizeDate(extractedTech.publishedDate),
      updatedTime: this.standardizeDate(extractedTech.updatedDate),
      companyWebsiteUrl: extractedTech.companyWebsiteUrl || '',
      technologyImageUrl: `https://thumbnails.wipogreen.wipo.int/${extractedTech.id}`,
      description: extractedTech.description || '',
      benefits: extractedTech.benefits || '',
      benefitsDescription: extractedTech.benefitsDescription || '',
      developedInCountry: '',
      deployedInCountry: '',
      technologyReadinessLevel: extractedTech.technologyReadinessLevel || '',
      intellectualProperty: extractedTech.intellectualProperty || '',
      customLabels: [],
      technologyNameCN: '',
      technologyCategory: '清洁能源技术',
      subCategory: extractedTech.isWindEnergyTech ? '风能技术' : '其他技术'
    };
    
    // 使用国家推理引擎
    const countries = CountryInferrer.inferCountries(
      processedTech.companyName,
      processedTech.companyWebsiteUrl,
      processedTech.description
    );
    
    processedTech.developedInCountry = countries.developedInCountry || '';
    processedTech.deployedInCountry = countries.deployedInCountry || '';
    
    // 翻译技术名称
    processedTech.technologyNameCN = this.translateTechName(processedTech.technologyNameEN);
    
    // 提取关键词
    processedTech.customLabels = this.extractKeywords(
      processedTech.technologyNameEN,
      processedTech.description,
      extractedTech.isWindEnergyTech
    );
    
    // 判断是否为风能技术
    const isWindTech = this.isWindEnergyTechnology(processedTech, extractedTech.isWindEnergyTech);
    
    return {
      ...processedTech,
      isWindEnergyTech: isWindTech,
      sourceType: extractedTech.sourceType || this.detectSourceType(processedTech.id)
    };
  }
  
  /**
   * 标准化日期格式
   */
  standardizeDate(dateStr) {
    if (!dateStr) return '';
    
    // 统一为 YYYY/MM/DD 格式
    return dateStr.replace(/-/g, '/');
  }
  
  /**
   * 翻译技术名称（简化版）
   */
  translateTechName(englishName) {
    if (!englishName) return '';
    
    // 基本关键词翻译
    const translations = {
      'wind': '风',
      'turbine': '涡轮机',
      'energy': '能源',
      'power': '电力',
      'generator': '发电机',
      'carbon': '碳',
      'capturing': '捕获',
      'dioxide': '二氧化碳',
      'hydrogen': '氢气',
      'blade': '叶片',
      'tower': '塔架',
      'system': '系统',
      'technology': '技术'
    };
    
    let translated = englishName.toLowerCase();
    for (const [en, cn] of Object.entries(translations)) {
      if (translated.includes(en)) {
        // 这是一个简化的翻译，实际应该使用更完整的翻译服务
        return englishName; // 暂时返回英文名
      }
    }
    
    return englishName;
  }
  
  /**
   * 提取关键词
   */
  extractKeywords(techName, description, isWindTech) {
    const text = `${techName} ${description}`.toLowerCase();
    const keywords = [];
    
    if (isWindTech) {
      // 风能技术关键词
      const windKeywords = {
        'offshore': '海上风电',
        'onshore': '陆上风电',
        'floating': '浮动平台',
        'blade': '风机叶片',
        'tower': '风电塔架',
        'generator': '发电机',
        'control': '控制系统',
        'maintenance': '维护技术'
      };
      
      for (const [en, cn] of Object.entries(windKeywords)) {
        if (text.includes(en)) {
          keywords.push(cn);
        }
      }
    } else {
      // 非风能技术关键词
      const generalKeywords = {
        'carbon': '碳捕获',
        'hydrogen': '氢能',
        'solar': '太阳能',
        'biomass': '生物质',
        'battery': '电池',
        'fuel cell': '燃料电池'
      };
      
      for (const [en, cn] of Object.entries(generalKeywords)) {
        if (text.includes(en)) {
          keywords.push(cn);
        }
      }
    }
    
    return keywords.slice(0, 3); // 限制为3个关键词
  }
  
  /**
   * 判断是否为风能技术
   */
  isWindEnergyTechnology(techData, aiClassification) {
    const { technologyNameEN, description } = techData;
    const fullText = `${technologyNameEN} ${description}`.toLowerCase();
    
    // AI分类结果作为主要参考
    if (aiClassification !== undefined) {
      return aiClassification;
    }
    
    // 关键词判断
    const windKeywords = [
      'wind', 'turbine', 'blade', 'rotor', 'nacelle', 
      'tower', 'offshore', 'onshore', 'windfarm'
    ];
    
    const nonWindKeywords = [
      'carbon capture', 'hydrogen', 'solar', 'biomass',
      'fuel cell', 'battery', 'chip', 'processor'
    ];
    
    // 检查风能关键词
    let windScore = 0;
    for (const keyword of windKeywords) {
      if (fullText.includes(keyword)) {
        windScore++;
      }
    }
    
    // 检查非风能关键词
    let nonWindScore = 0;
    for (const keyword of nonWindKeywords) {
      if (fullText.includes(keyword)) {
        nonWindScore++;
      }
    }
    
    // 判断逻辑
    if (nonWindScore > windScore) {
      return false;
    }
    
    return windScore > 0;
  }
  
  /**
   * 检测来源类型
   */
  detectSourceType(techId) {
    const id = parseInt(techId);
    
    if (id >= 174866) {
      return 'Patentscope Imports';
    } else if (id >= 148000) {
      return 'Uploads';
    } else {
      return 'Legacy Data';
    }
  }
  
  /**
   * 生成处理报告
   */
  generateProcessingReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalMissing: this.missingIds.length,
        processed: this.processedTechs.length,
        windTechnologies: this.windTechs.length,
        nonWindTechnologies: this.nonWindTechs.length,
        errors: this.errors.length
      },
      windTechnologies: this.windTechs.map(tech => ({
        id: tech.id,
        name: tech.technologyNameEN,
        company: tech.companyName,
        sourceType: tech.sourceType
      })),
      nonWindTechnologies: this.nonWindTechs.map(tech => ({
        id: tech.id,
        name: tech.technologyNameEN,
        company: tech.companyName,
        category: this.categorizeNonWindTech(tech),
        sourceType: tech.sourceType
      })),
      errors: this.errors,
      recommendations: this.generateRecommendations()
    };
    
    // 保存报告
    const reportPath = path.join(projectRoot, 'data', 'missing-tech-processing-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`\n✓ 处理报告已生成：${reportPath}`);
    
    return report;
  }
  
  /**
   * 对非风能技术进行分类
   */
  categorizeNonWindTech(tech) {
    const text = `${tech.technologyNameEN} ${tech.description}`.toLowerCase();
    
    if (text.includes('carbon') || text.includes('co2')) {
      return '碳捕获技术';
    }
    if (text.includes('hydrogen') || text.includes('h2')) {
      return '氢能技术';
    }
    if (text.includes('solar')) {
      return '太阳能技术';
    }
    if (text.includes('biomass')) {
      return '生物质技术';
    }
    if (text.includes('chip') || text.includes('processor')) {
      return '芯片技术';
    }
    
    return '其他清洁技术';
  }
  
  /**
   * 生成建议
   */
  generateRecommendations() {
    const recommendations = [
      `发现 ${this.windTechs.length} 项风能技术，建议添加到主数据库`,
      `发现 ${this.nonWindTechs.length} 项非风能技术，建议单独分类管理`
    ];
    
    if (this.errors.length > 0) {
      recommendations.push(`有 ${this.errors.length} 项技术处理失败，需要手动检查`);
    }
    
    const patentTechs = this.processedTechs.filter(t => t.sourceType === 'Patentscope Imports').length;
    if (patentTechs > 0) {
      recommendations.push(`${patentTechs} 项来自专利数据库，可能需要特殊的IP处理`);
    }
    
    return recommendations;
  }
  
  /**
   * 保存风能技术数据
   */
  saveWindTechnologies() {
    if (this.windTechs.length === 0) {
      console.log('没有发现新的风能技术');
      return;
    }
    
    const dataDir = path.join(projectRoot, 'data');
    
    // 保存新发现的风能技术
    const windTechPath = path.join(dataDir, 'newly-discovered-wind-technologies.json');
    fs.writeFileSync(windTechPath, JSON.stringify(this.windTechs, null, 2), 'utf8');
    
    // 保存CSV版本
    const csvPath = path.join(dataDir, 'newly-discovered-wind-technologies.csv');
    const csvContent = this.convertToCSV(this.windTechs);
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    
    console.log(`\n✓ 新发现的风能技术数据已保存：`);
    console.log(`  - JSON: ${windTechPath}`);
    console.log(`  - CSV: ${csvPath}`);
    
    // 如果要合并到主数据库
    this.mergeWithMainDatabase();
  }
  
  /**
   * 合并到主数据库
   */
  mergeWithMainDatabase() {
    const mainDataPath = path.join(projectRoot, 'data', 'improved-69-wipo-wind-technologies.json');
    
    if (!fs.existsSync(mainDataPath)) {
      console.log('主数据库文件不存在，无法合并');
      return;
    }
    
    // 读取主数据库
    const mainData = JSON.parse(fs.readFileSync(mainDataPath, 'utf8'));
    
    // 合并数据
    const mergedData = [...mainData, ...this.windTechs];
    
    // 保存合并后的数据
    const mergedPath = path.join(projectRoot, 'data', `complete-${mainData.length + this.windTechs.length}-wipo-wind-technologies.json`);
    fs.writeFileSync(mergedPath, JSON.stringify(mergedData, null, 2), 'utf8');
    
    console.log(`\n✓ 已合并 ${this.windTechs.length} 项新风能技术到主数据库`);
    console.log(`✓ 合并后总计：${mergedData.length} 项风能技术`);
    console.log(`✓ 合并数据已保存：${mergedPath}`);
  }
  
  /**
   * 转换为CSV
   */
  convertToCSV(jsonData) {
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
}

// 如果直接运行此文件，显示抓取指令
if (require.main === module) {
  const processor = new MissingTechProcessor();
  const instructions = processor.generateBatchScrapeInstructions();
  
  console.log('=== 缺失技术抓取指令 ===\n');
  
  instructions.forEach(instruction => {
    console.log(`批次 ${instruction.batchNumber}/${instruction.totalBatches}:`);
    console.log(`待抓取技术ID: ${instruction.techIds.join(', ')}`);
    console.log('FireCrawl抓取指令：');
    console.log(JSON.stringify(instruction.extractCommand, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');
  });
  
  console.log('📋 使用说明：');
  console.log('1. 复制上述FireCrawl指令到Claude Code');
  console.log('2. 执行抓取并获得结果数据');
  console.log('3. 将结果数据保存为JSON文件');
  console.log('4. 运行 processor.processExtractedData(data) 进行处理');
  console.log('\n💡 预期结果：');
  console.log(`- 总计抓取 ${processor.missingIds.length} 项技术`);
  console.log('- 自动识别风能技术 vs 非风能技术');
  console.log('- 生成详细的处理报告和建议');
}

module.exports = MissingTechProcessor;
