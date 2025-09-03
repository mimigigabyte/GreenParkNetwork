#!/usr/bin/env node

/**
 * Data Quality Manager
 * 数据验证和质量保障机制
 * 
 * 功能：
 * 1. 数据完整性验证
 * 2. 字段一致性检查
 * 3. 异常数据检测和修复
 * 4. 质量评分和报告
 */

const fs = require('fs');
const path = require('path');

/**
 * 数据验证器
 */
class DataValidator {
  /**
   * 验证基本字段完整性
   */
  static validateBasicFields(techData) {
    const errors = [];
    const warnings = [];
    
    // 必需字段检查
    const requiredFields = [
      'id', 'technologyNameEN', 'companyName', 
      'publishedTime', 'description'
    ];
    
    for (const field of requiredFields) {
      if (!techData[field] || techData[field].trim() === '') {
        errors.push(`缺少必需字段: ${field}`);
      }
    }
    
    // 重要字段检查
    const importantFields = [
      'companyWebsiteUrl', 'benefits', 'developedInCountry'
    ];
    
    for (const field of importantFields) {
      if (!techData[field] || techData[field].trim() === '') {
        warnings.push(`重要字段缺失: ${field}`);
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * 验证字段格式
   */
  static validateFieldFormats(techData) {
    const errors = [];
    
    // ID格式验证
    if (techData.id && !/^\d+$/.test(techData.id)) {
      errors.push('ID格式错误：应为纯数字');
    }
    
    // 日期格式验证
    const dateFields = ['publishedTime', 'updatedTime'];
    for (const field of dateFields) {
      if (techData[field] && !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(techData[field])) {
        errors.push(`${field}格式错误：应为YYYY/MM/DD`);
      }
    }
    
    // URL格式验证
    if (techData.companyWebsiteUrl && 
        !techData.companyWebsiteUrl.startsWith('http')) {
      errors.push('公司网站URL格式错误：应以http开头');
    }
    
    return errors;
  }
  
  /**
   * 验证数据一致性
   */
  static validateConsistency(techData) {
    const warnings = [];
    
    // 国家信息一致性检查
    if (techData.companyWebsiteUrl && techData.developedInCountry) {
      const websiteCountry = this.inferCountryFromWebsite(techData.companyWebsiteUrl);
      if (websiteCountry && websiteCountry !== techData.developedInCountry) {
        warnings.push(`网站域名(${websiteCountry})与开发国家(${techData.developedInCountry})不一致`);
      }
    }
    
    // 公司名称与描述一致性
    if (techData.companyName && techData.description) {
      const companyInDesc = techData.description.toLowerCase()
                                 .includes(techData.companyName.toLowerCase());
      if (!companyInDesc && techData.companyName !== 'Technology Provider') {
        warnings.push('技术描述中未提及公司名称');
      }
    }
    
    return warnings;
  }
  
  /**
   * 从网站推断国家（辅助函数）
   */
  static inferCountryFromWebsite(url) {
    const domainMap = {
      '.jp': '日本',
      '.cn': '中国',
      '.edu': '美国',
      '.uk': '英国'
    };
    
    for (const [domain, country] of Object.entries(domainMap)) {
      if (url.includes(domain)) {
        return country;
      }
    }
    return null;
  }
}

/**
 * 数据修复器
 */
class DataRepairer {
  /**
   * 修复缺失的图片URL
   */
  static repairImageUrl(techData) {
    if (!techData.technologyImageUrl && techData.id) {
      techData.technologyImageUrl = `https://thumbnails.wipogreen.wipo.int/${techData.id}`;
      return true;
    }
    return false;
  }
  
  /**
   * 修复和标准化日期格式
   */
  static repairDateFormats(techData) {
    let repaired = false;
    const dateFields = ['publishedTime', 'updatedTime'];
    
    for (const field of dateFields) {
      if (techData[field]) {
        // 标准化日期格式 YYYY/MM/DD
        let date = techData[field].trim();
        if (date.includes('-')) {
          date = date.replace(/-/g, '/');
          techData[field] = date;
          repaired = true;
        }
      }
    }
    
    return repaired;
  }
  
  /**
   * 修复网站URL格式
   */
  static repairWebsiteUrl(techData) {
    if (techData.companyWebsiteUrl && !techData.companyWebsiteUrl.startsWith('http')) {
      if (techData.companyWebsiteUrl.startsWith('www.')) {
        techData.companyWebsiteUrl = 'https://' + techData.companyWebsiteUrl;
      } else if (!techData.companyWebsiteUrl.includes('://')) {
        techData.companyWebsiteUrl = 'https://' + techData.companyWebsiteUrl;
      }
      return true;
    }
    return false;
  }
  
  /**
   * 自动修复所有可修复的问题
   */
  static autoRepair(techData) {
    const repairs = [];
    
    if (this.repairImageUrl(techData)) {
      repairs.push('修复技术图片URL');
    }
    
    if (this.repairDateFormats(techData)) {
      repairs.push('标准化日期格式');
    }
    
    if (this.repairWebsiteUrl(techData)) {
      repairs.push('修复网站URL格式');
    }
    
    return repairs;
  }
}

/**
 * 数据增强器
 */
class DataEnhancer {
  /**
   * 增强关键词标签
   */
  static enhanceKeywords(techData) {
    if (!techData.customLabels || techData.customLabels.length === 0) {
      const keywords = this.extractKeywordsFromText(
        techData.technologyNameEN + ' ' + techData.description
      );
      techData.customLabels = keywords;
      return true;
    }
    return false;
  }
  
  /**
   * 从文本提取关键词
   */
  static extractKeywordsFromText(text) {
    if (!text) return [];
    
    const windEnergyKeywords = {
      'offshore': '海上风电',
      'onshore': '陆上风电',
      'wind turbine': '风力发电机',
      'blade': '风机叶片',
      'tower': '风电塔架',
      'nacelle': '机舱',
      'generator': '发电机',
      'foundation': '基础工程',
      'maintenance': '维护',
      'control': '控制系统',
      'monitoring': '监控',
      'efficiency': '效率优化',
      'floating': '漂浮式',
      'vertical': '垂直轴',
      'small': '小型风机',
      'hybrid': '混合系统'
    };
    
    const keywords = [];
    const textLower = text.toLowerCase();
    
    for (const [en, cn] of Object.entries(windEnergyKeywords)) {
      if (textLower.includes(en)) {
        keywords.push(cn);
      }
    }
    
    return keywords.slice(0, 5); // 限制为5个关键词
  }
  
  /**
   * 增强效益描述
   */
  static enhanceBenefitsDescription(techData) {
    if ((!techData.benefitsDescription || techData.benefitsDescription === 'N/A') 
        && techData.benefits && techData.description) {
      
      // 基于benefits和description生成更详细的效益描述
      const benefits = techData.benefits.toLowerCase();
      let enhancedDesc = '';
      
      if (benefits.includes('greenhouse gas')) {
        enhancedDesc += '该技术通过风能发电减少温室气体排放，';
      }
      if (benefits.includes('electricity')) {
        enhancedDesc += '提供清洁的可再生电力，';
      }
      if (benefits.includes('efficiency')) {
        enhancedDesc += '提高能源转换效率，';
      }
      
      enhancedDesc += '符合碳中和目标。';
      
      if (enhancedDesc.length > 10) {
        techData.benefitsDescription = enhancedDesc;
        return true;
      }
    }
    return false;
  }
}

/**
 * 质量评估器
 */
class QualityAssessor {
  /**
   * 计算数据质量分数
   */
  static calculateQualityScore(techData) {
    let score = 0;
    let maxScore = 0;
    
    // 必需字段检查 (40分)
    const requiredFields = [
      'id', 'technologyNameEN', 'companyName', 
      'publishedTime', 'description'
    ];
    
    maxScore += 40;
    const filledRequired = requiredFields.filter(field => 
      techData[field] && techData[field].trim() !== ''
    ).length;
    score += (filledRequired / requiredFields.length) * 40;
    
    // 重要字段检查 (30分)
    const importantFields = [
      'companyWebsiteUrl', 'benefits', 'developedInCountry',
      'deployedInCountry', 'technologyReadinessLevel'
    ];
    
    maxScore += 30;
    const filledImportant = importantFields.filter(field => 
      techData[field] && techData[field].trim() !== ''
    ).length;
    score += (filledImportant / importantFields.length) * 30;
    
    // 增强字段检查 (20分)
    const enhancedFields = [
      'customLabels', 'benefitsDescription', 'intellectualProperty'
    ];
    
    maxScore += 20;
    let enhancedScore = 0;
    if (techData.customLabels && techData.customLabels.length > 0) {
      enhancedScore += 7;
    }
    if (techData.benefitsDescription && techData.benefitsDescription !== 'N/A') {
      enhancedScore += 7;
    }
    if (techData.intellectualProperty && techData.intellectualProperty.trim() !== '') {
      enhancedScore += 6;
    }
    score += enhancedScore;
    
    // 数据一致性检查 (10分)
    maxScore += 10;
    const consistencyWarnings = DataValidator.validateConsistency(techData);
    score += Math.max(0, 10 - consistencyWarnings.length * 2);
    
    return {
      score: Math.round(score),
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      level: this.getQualityLevel(score / maxScore)
    };
  }
  
  /**
   * 获取质量等级
   */
  static getQualityLevel(ratio) {
    if (ratio >= 0.9) return '优秀';
    if (ratio >= 0.8) return '良好';
    if (ratio >= 0.7) return '合格';
    if (ratio >= 0.6) return '一般';
    return '待改善';
  }
  
  /**
   * 生成详细的质量报告
   */
  static generateQualityReport(techData) {
    const basicValidation = DataValidator.validateBasicFields(techData);
    const formatValidation = DataValidator.validateFieldFormats(techData);
    const consistencyWarnings = DataValidator.validateConsistency(techData);
    const qualityScore = this.calculateQualityScore(techData);
    
    return {
      id: techData.id,
      technologyName: techData.technologyNameEN,
      qualityScore,
      validation: {
        errors: [...basicValidation.errors, ...formatValidation],
        warnings: [...basicValidation.warnings, ...consistencyWarnings]
      },
      fieldCompleteness: this.analyzeFieldCompleteness(techData),
      suggestions: this.generateImprovementSuggestions(techData)
    };
  }
  
  /**
   * 分析字段完整性
   */
  static analyzeFieldCompleteness(techData) {
    const allFields = [
      'id', 'technologyNameEN', 'technologyNameCN', 'companyName',
      'publishedTime', 'updatedTime', 'companyWebsiteUrl', 'technologyImageUrl',
      'description', 'benefits', 'benefitsDescription', 'developedInCountry',
      'deployedInCountry', 'technologyReadinessLevel', 'intellectualProperty',
      'customLabels', 'technologyCategory', 'subCategory'
    ];
    
    const filledFields = allFields.filter(field => {
      const value = techData[field];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && value.toString().trim() !== '' && value !== 'N/A';
    });
    
    return {
      total: allFields.length,
      filled: filledFields.length,
      percentage: Math.round((filledFields.length / allFields.length) * 100),
      missingFields: allFields.filter(field => !filledFields.includes(field))
    };
  }
  
  /**
   * 生成改进建议
   */
  static generateImprovementSuggestions(techData) {
    const suggestions = [];
    
    if (!techData.developedInCountry) {
      suggestions.push('通过公司名称或网站域名推断开发国家');
    }
    
    if (!techData.companyWebsiteUrl) {
      suggestions.push('补充公司官方网站链接');
    }
    
    if (!techData.benefitsDescription || techData.benefitsDescription === 'N/A') {
      suggestions.push('丰富技术效益描述');
    }
    
    if (!techData.customLabels || techData.customLabels.length === 0) {
      suggestions.push('从技术描述中提取关键词标签');
    }
    
    return suggestions;
  }
}

/**
 * 主要的质量管理器
 */
class QualityManager {
  /**
   * 处理单个技术数据
   */
  static processTechnology(techData) {
    // 1. 自动修复
    const repairs = DataRepairer.autoRepair(techData);
    
    // 2. 数据增强
    const enhancements = [];
    if (DataEnhancer.enhanceKeywords(techData)) {
      enhancements.push('增强关键词标签');
    }
    if (DataEnhancer.enhanceBenefitsDescription(techData)) {
      enhancements.push('增强效益描述');
    }
    
    // 3. 质量评估
    const qualityReport = QualityAssessor.generateQualityReport(techData);
    
    return {
      techData,
      repairs,
      enhancements,
      qualityReport
    };
  }
  
  /**
   * 批量处理技术数据
   */
  static batchProcess(techDataArray) {
    const results = {
      processed: [],
      summary: {
        total: techDataArray.length,
        repaired: 0,
        enhanced: 0,
        averageQuality: 0,
        qualityDistribution: {
          '优秀': 0,
          '良好': 0,
          '合格': 0,
          '一般': 0,
          '待改善': 0
        }
      }
    };
    
    let totalQualityScore = 0;
    
    for (const techData of techDataArray) {
      const result = this.processTechnology(techData);
      results.processed.push(result);
      
      if (result.repairs.length > 0) {
        results.summary.repaired++;
      }
      if (result.enhancements.length > 0) {
        results.summary.enhanced++;
      }
      
      totalQualityScore += result.qualityReport.qualityScore.percentage;
      results.summary.qualityDistribution[result.qualityReport.qualityScore.level]++;
    }
    
    results.summary.averageQuality = Math.round(totalQualityScore / techDataArray.length);
    
    return results;
  }
}

module.exports = {
  DataValidator,
  DataRepairer,
  DataEnhancer,
  QualityAssessor,
  QualityManager
};

console.log('Data Quality Manager - 数据质量管理器已就绪');
console.log('功能：验证、修复、增强、评估数据质量');
