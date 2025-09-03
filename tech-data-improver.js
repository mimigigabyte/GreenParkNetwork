#!/usr/bin/env node

/**
 * Technology Data Improver
 * 技术数据改进器
 * 
 * 用于改进现有69个技术数据的字段完整性
 */

const fs = require('fs');
const path = require('path');
const { PageTypeDetector, FieldExtractor, CountryInferrer } = require('./enhanced-wipo-scraper');
const { QualityManager } = require('./data-quality-manager');

/**
 * 技术数据改进器主类
 */
class TechDataImprover {
  constructor() {
    this.currentData = null;
    this.processedCount = 0;
    this.improvedCount = 0;
  }
  
  /**
   * 加载现有数据
   */
  loadExistingData() {
    const dataPath = path.join(__dirname, 'data', 'complete-69-wipo-wind-technologies.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('未找到现有数据文件：complete-69-wipo-wind-technologies.json');
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    this.currentData = JSON.parse(rawData);
    
    console.log(`已加载 ${this.currentData.length} 项技术数据`);
    return this.currentData;
  }
  
  /**
   * 改进单个技术数据
   */
  async improveTechnologyData(techData) {
    console.log(`\n正在改进技术 ${techData.id}: ${techData.technologyNameEN}`);
    
    // 1. 使用国家推理引擎补充缺失的国家信息
    if (!techData.developedInCountry || !techData.deployedInCountry) {
      const inferredCountries = CountryInferrer.inferCountries(
        techData.companyName,
        techData.companyWebsiteUrl,
        techData.description
      );
      
      if (!techData.developedInCountry && inferredCountries.developedInCountry) {
        techData.developedInCountry = inferredCountries.developedInCountry;
        console.log(`  ✓ 推理开发国家: ${inferredCountries.developedInCountry}`);
      }
      
      if (!techData.deployedInCountry && inferredCountries.deployedInCountry) {
        techData.deployedInCountry = inferredCountries.deployedInCountry;
        console.log(`  ✓ 推理部署国家: ${inferredCountries.deployedInCountry}`);
      }
    }
    
    // 2. 改进效益描述
    if (techData.benefitsDescription === 'N/A' || !techData.benefitsDescription) {
      const improvedDesc = this.generateBenefitsDescription(techData);
      if (improvedDesc) {
        techData.benefitsDescription = improvedDesc;
        console.log(`  ✓ 改进效益描述`);
      }
    }
    
    // 3. 补充缺失的网站链接（基于已知模式）
    if (!techData.companyWebsiteUrl) {
      const inferredWebsite = this.inferWebsiteUrl(techData.companyName);
      if (inferredWebsite) {
        techData.companyWebsiteUrl = inferredWebsite;
        console.log(`  ✓ 推理网站链接: ${inferredWebsite}`);
      }
    }
    
    // 4. 增强关键词标签
    if (!techData.customLabels || techData.customLabels.length === 0) {
      const keywords = this.extractEnhancedKeywords(techData);
      if (keywords.length > 0) {
        techData.customLabels = keywords;
        console.log(`  ✓ 提取关键词: ${keywords.join(', ')}`);
      }
    }
    
    // 5. 推理技术成熟度
    if (!techData.technologyReadinessLevel) {
      const trl = this.inferTechnologyReadiness(techData);
      if (trl) {
        techData.technologyReadinessLevel = trl;
        console.log(`  ✓ 推理技术成熟度: ${trl}`);
      }
    }
    
    // 6. 推理知识产权信息
    if (!techData.intellectualProperty) {
      const ip = this.inferIntellectualProperty(techData);
      if (ip) {
        techData.intellectualProperty = ip;
        console.log(`  ✓ 推理知识产权: ${ip}`);
      }
    }
    
    return techData;
  }
  
  /**
   * 生成改进的效益描述
   */
  generateBenefitsDescription(techData) {
    if (!techData.benefits || !techData.description) return null;
    
    const benefits = techData.benefits.toLowerCase();
    const description = techData.description.toLowerCase();
    
    let benefitsDesc = '该技术';
    
    // 基于benefits关键词生成描述
    if (benefits.includes('greenhouse gas')) {
      benefitsDesc += '通过风能发电显著减少温室气体排放，';
    }
    if (benefits.includes('electricity')) {
      benefitsDesc += '提供清洁可靠的可再生电力，';
    }
    
    // 基于技术特征添加具体效益
    if (description.includes('efficiency') || description.includes('performance')) {
      benefitsDesc += '提高能源转换效率，';
    }
    if (description.includes('cost') || description.includes('economic')) {
      benefitsDesc += '降低发电成本，';
    }
    if (description.includes('reliability') || description.includes('stable')) {
      benefitsDesc += '增强系统可靠性，';
    }
    if (description.includes('maintenance')) {
      benefitsDesc += '减少维护需求，';
    }
    
    benefitsDesc += '助力实现碳中和目标。';
    
    return benefitsDesc.length > 20 ? benefitsDesc : null;
  }
  
  /**
   * 推理网站URL
   */
  inferWebsiteUrl(companyName) {
    const knownWebsites = {
      'J-Power': 'https://www.jpower.co.jp/english/',
      'Mitsubishi Heavy Industries, Ltd.': 'https://www.mhi.com/products/energy/wind_turbine_plant.html',
      'Hitachi, Ltd.': 'https://www.hitachi.com/products/energy/wind/index.html',
      'Challenergy': 'https://challenergy.com/en/',
      'A-WING': 'http://www.awing-i.com/english/index.html',
      'Eco Marine Power': 'https://www.ecomarinepower.com/en/energysail',
      'Avant Garde Innovations™': 'https://avantgarde.energy/',
      'ZONHAN': 'https://www.zonhan.com/en/product/5KW-Variable-Pitch-Wind-turbine.html',
      'China Longyuan Power Group': 'https://www.ceic.com/gjnyjtwwEn/xwzx/202407/56c251c869a24883b1af3370a8a37ac4.shtml',
      'PVMars Solar': 'https://www.pvmars.com/',
      'Koenders': 'https://store.koenderswatersolutions.com/collections/windmill-aeration-systems',
      'Ryse Energy': 'https://www.ryse.energy/',
      'Low Carbon Patent Pledge': 'https://lowcarbonpatentpledge.org/',
      'University of Arizona': 'https://inventions.arizona.edu/tech/Vertical_Axis_Wind_Turbine_With_Active_Flow_Controls'
    };
    
    // 精确匹配
    if (knownWebsites[companyName]) {
      return knownWebsites[companyName];
    }
    
    // 模糊匹配
    for (const [company, website] of Object.entries(knownWebsites)) {
      if (companyName.includes(company) || company.includes(companyName)) {
        return website;
      }
    }
    
    return null;
  }
  
  /**
   * 提取增强的关键词
   */
  extractEnhancedKeywords(techData) {
    const text = `${techData.technologyNameEN} ${techData.description}`.toLowerCase();
    const keywords = [];
    
    // 风能技术关键词映射
    const keywordMap = {
      'offshore': '海上风电',
      'onshore': '陆上风电', 
      'floating': '浮动平台',
      'foundation': '基础工程',
      'blade': '风机叶片',
      'tower': '风电塔架',
      'nacelle': '机舱',
      'generator': '发电机',
      'control': '控制系统',
      'maintenance': '维护技术',
      'monitoring': '监控系统',
      'vertical': '垂直轴',
      'horizontal': '水平轴',
      'small': '小型风机',
      'micro': '微型风机',
      'hybrid': '混合系统',
      'typhoon': '抗台风',
      'earthquake': '抗震',
      'efficiency': '效率优化'
    };
    
    for (const [en, cn] of Object.entries(keywordMap)) {
      if (text.includes(en)) {
        keywords.push(cn);
      }
    }
    
    return keywords.slice(0, 5); // 限制为5个关键词
  }
  
  /**
   * 推理技术成熟度
   */
  inferTechnologyReadiness(techData) {
    const description = techData.description.toLowerCase();
    const companyName = techData.companyName.toLowerCase();
    
    // 基于描述内容推理
    if (description.includes('commercial') || description.includes('market')) {
      return 'Commercial deployment (TRL 9)';
    }
    if (description.includes('demonstration') || description.includes('pilot')) {
      return 'Technology demonstration (TRL 7-8)';
    }
    if (description.includes('prototype') || description.includes('testing')) {
      return 'Technology development / prototype (TRL 5-6)';
    }
    if (description.includes('research') || description.includes('development')) {
      return 'Research and development (TRL 3-4)';
    }
    
    // 基于公司类型推理
    if (companyName.includes('university') || companyName.includes('research')) {
      return 'Research and development (TRL 3-4)';
    }
    if (companyName.includes('mitsubishi') || companyName.includes('hitachi') || 
        companyName.includes('j-power')) {
      return 'Technology demonstration (TRL 7-8)';
    }
    
    return null;
  }
  
  /**
   * 推理知识产权信息
   */
  inferIntellectualProperty(techData) {
    const description = techData.description.toLowerCase();
    const companyName = techData.companyName.toLowerCase();
    
    if (description.includes('patent') || description.includes('patented')) {
      return 'Patented technology available for licensing';
    }
    if (companyName.includes('university')) {
      return 'Technology available for licensing from university';
    }
    if (companyName.includes('low carbon patent pledge')) {
      return 'Patents pledged to Low Carbon Patent Pledge (LCPP)';
    }
    if (description.includes('proprietary')) {
      return 'Proprietary technology';
    }
    
    return null;
  }
  
  /**
   * 处理所有技术数据
   */
  async processAllTechnologies() {
    if (!this.currentData) {
      this.loadExistingData();
    }
    
    console.log('\n=== 开始改进技术数据 ===');
    const startTime = Date.now();
    
    // 质量改进前统计
    const beforeStats = this.calculateQualityStats(this.currentData);
    console.log('\n改进前数据质量统计：');
    console.log(`- 平均完整率: ${beforeStats.averageCompleteness}%`);
    console.log(`- developedInCountry缺失: ${beforeStats.missingDevelopedCountry}项`);
    console.log(`- deployedInCountry缺失: ${beforeStats.missingDeployedCountry}项`);
    console.log(`- benefitsDescription为N/A: ${beforeStats.benefitsNA}项`);
    
    // 改进每个技术
    for (let i = 0; i < this.currentData.length; i++) {
      const originalData = JSON.stringify(this.currentData[i]);
      await this.improveTechnologyData(this.currentData[i]);
      
      this.processedCount++;
      
      // 检查是否有改进
      if (JSON.stringify(this.currentData[i]) !== originalData) {
        this.improvedCount++;
      }
      
      // 进度提示
      if ((i + 1) % 10 === 0) {
        console.log(`\n进度: ${i + 1}/${this.currentData.length} (${Math.round(((i + 1) / this.currentData.length) * 100)}%)`);
      }
    }
    
    // 质量改进后统计
    const afterStats = this.calculateQualityStats(this.currentData);
    console.log('\n=== 改进完成 ===');
    console.log(`处理耗时: ${Math.round((Date.now() - startTime) / 1000)}秒`);
    console.log(`处理技术数量: ${this.processedCount}`);
    console.log(`改进技术数量: ${this.improvedCount}`);
    
    console.log('\n改进后数据质量统计：');
    console.log(`- 平均完整率: ${afterStats.averageCompleteness}% (提升 ${afterStats.averageCompleteness - beforeStats.averageCompleteness}%)`);
    console.log(`- developedInCountry缺失: ${afterStats.missingDevelopedCountry}项 (减少 ${beforeStats.missingDevelopedCountry - afterStats.missingDevelopedCountry}项)`);
    console.log(`- deployedInCountry缺失: ${afterStats.missingDeployedCountry}项 (减少 ${beforeStats.missingDeployedCountry - afterStats.missingDeployedCountry}项)`);
    console.log(`- benefitsDescription为N/A: ${afterStats.benefitsNA}项 (减少 ${beforeStats.benefitsNA - afterStats.benefitsNA}项)`);
    
    // 保存改进后的数据
    this.saveImprovedData();
    
    // 生成详细质量报告
    this.generateQualityReport();
    
    return {
      processedCount: this.processedCount,
      improvedCount: this.improvedCount,
      beforeStats,
      afterStats
    };
  }
  
  /**
   * 计算质量统计
   */
  calculateQualityStats(dataArray) {
    let totalCompleteness = 0;
    let missingDevelopedCountry = 0;
    let missingDeployedCountry = 0;
    let benefitsNA = 0;
    
    const fields = ['id', 'technologyNameEN', 'companyName', 'publishedTime', 'updatedTime', 
                   'companyWebsiteUrl', 'description', 'benefits', 'benefitsDescription',
                   'developedInCountry', 'deployedInCountry', 'technologyReadinessLevel', 
                   'intellectualProperty', 'customLabels'];
    
    for (const tech of dataArray) {
      let filledFields = 0;
      
      for (const field of fields) {
        const value = tech[field];
        if (value && value !== '' && value !== 'N/A' && 
            (!Array.isArray(value) || value.length > 0)) {
          filledFields++;
        }
      }
      
      totalCompleteness += (filledFields / fields.length) * 100;
      
      if (!tech.developedInCountry || tech.developedInCountry === '') {
        missingDevelopedCountry++;
      }
      if (!tech.deployedInCountry || tech.deployedInCountry === '') {
        missingDeployedCountry++;
      }
      if (!tech.benefitsDescription || tech.benefitsDescription === 'N/A') {
        benefitsNA++;
      }
    }
    
    return {
      averageCompleteness: Math.round(totalCompleteness / dataArray.length),
      missingDevelopedCountry,
      missingDeployedCountry,
      benefitsNA
    };
  }
  
  /**
   * 保存改进后的数据
   */
  saveImprovedData() {
    const dataDir = path.join(__dirname, 'data');
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
    
    // 保存改进后的JSON数据
    const jsonPath = path.join(dataDir, `improved-69-wipo-wind-technologies.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.currentData, null, 2), 'utf8');
    
    // 保存CSV版本
    const csvPath = path.join(dataDir, `improved-69-wipo-wind-technologies.csv`);
    const csvContent = this.convertToCSV(this.currentData);
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    
    // 创建备份
    const backupPath = path.join(dataDir, `backup-${timestamp}-complete-69-wipo-wind-technologies.json`);
    if (fs.existsSync(path.join(dataDir, 'complete-69-wipo-wind-technologies.json'))) {
      fs.copyFileSync(
        path.join(dataDir, 'complete-69-wipo-wind-technologies.json'),
        backupPath
      );
    }
    
    console.log(`\n✓ 改进后数据已保存到：`);
    console.log(`  - JSON: ${jsonPath}`);
    console.log(`  - CSV: ${csvPath}`);
    console.log(`  - 备份: ${backupPath}`);
  }
  
  /**
   * 生成质量报告
   */
  generateQualityReport() {
    const report = QualityManager.batchProcess(this.currentData);
    
    const reportPath = path.join(__dirname, 'data', 'quality-improvement-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`\n✓ 质量改进报告已生成：${reportPath}`);
  }
  
  /**
   * 转换为CSV格式
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

// 如果直接运行此文件，执行改进流程
if (require.main === module) {
  const improver = new TechDataImprover();
  improver.processAllTechnologies()
    .then(result => {
      console.log('\n🎉 技术数据改进完成！');
      console.log(`✓ 共处理 ${result.processedCount} 项技术`);
      console.log(`✓ 成功改进 ${result.improvedCount} 项技术`);
      console.log(`✓ 数据完整率提升 ${result.afterStats.averageCompleteness - result.beforeStats.averageCompleteness}%`);
    })
    .catch(error => {
      console.error('❌ 改进过程中出现错误：', error.message);
      process.exit(1);
    });
}

module.exports = TechDataImprover;