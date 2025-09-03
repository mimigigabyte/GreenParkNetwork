#!/usr/bin/env node

/**
 * Enhanced WIPO Green Wind Technology Scraper
 * 增强版WIPO Green风能技术数据抓取器
 * 
 * 解决字段缺失问题的完整方案：
 * 1. 智能页面类型识别
 * 2. 针对性字段提取
 * 3. 国家信息智能推理
 * 4. 数据质量验证
 */

const fs = require('fs');
const path = require('path');

/**
 * 页面类型识别器
 * 根据页面内容特征识别不同类型的技术页面
 */
class PageTypeDetector {
  /**
   * 检测页面类型
   * @param {string} content - 页面内容（markdown格式）
   * @param {string} techId - 技术ID
   * @returns {string} 页面类型: 'patent', 'upload', 'legacy'
   */
  static detectPageType(content, techId) {
    // 将ID转换为数字便于范围判断
    const id = parseInt(techId);
    
    // 基于ID范围的初步判断
    if (id >= 174866) {
      return 'patent'; // 最新专利导入页面
    }
    if (id >= 148000) {
      return 'upload'; // 用户上传页面
    }
    if (id < 50000) {
      return 'legacy'; // 历史页面
    }
    
    // 基于内容特征的精确识别
    const contentLower = content.toLowerCase();
    
    // 专利页面特征
    if (contentLower.includes('patentscope') || 
        contentLower.includes('patent cooperation treaty') ||
        contentLower.includes('pct') ||
        contentLower.includes('applicant')) {
      return 'patent';
    }
    
    // 上传页面特征
    if (contentLower.includes('uploaded by wipo green admin') ||
        contentLower.includes('uploads') ||
        contentLower.includes('visit website')) {
      return 'upload';
    }
    
    // 历史页面特征（AUTM等来源）
    if (contentLower.includes('autm') ||
        contentLower.includes('technology transfer') ||
        id < 25000) {
      return 'legacy';
    }
    
    // 默认为上传页面
    return 'upload';
  }
  
  /**
   * 获取页面类型的详细信息
   */
  static getPageTypeInfo(pageType) {
    const pageTypes = {
      'patent': {
        name: '专利页面',
        description: '来自WIPO Patentscope数据库的专利技术',
        keyFields: ['applicant', 'patent_status', 'publication_date'],
        challenges: ['国家信息隐蔽', '技术成熟度缺失', '联系方式限制']
      },
      'upload': {
        name: '上传页面',
        description: '用户或管理员直接上传的技术',
        keyFields: ['owner', 'uploaded_by', 'website'],
        challenges: ['字段分布不规律', '部分信息可能缺失']
      },
      'legacy': {
        name: '历史页面',
        description: '早期导入的技术，多来自AUTM等技术转移机构',
        keyFields: ['university', 'tech_id', 'licensing_info'],
        challenges: ['页面结构过时', '信息相对简单']
      }
    };
    
    return pageTypes[pageType] || pageTypes['upload'];
  }
}

/**
 * 智能字段提取器
 * 针对不同页面类型采用不同的提取策略
 */
class FieldExtractor {
  /**
   * 提取基本信息字段
   */
  static extractBasicFields(content) {
    const basicFields = {};
    
    // ID提取
    const idMatch = content.match(/ID\s*(\d+)/i);
    if (idMatch) {
      basicFields.id = idMatch[1];
    }
    
    // 技术名称提取（标题）
    const titleMatch = content.match(/^#{1,2}\s*(.+)$/m);
    if (titleMatch) {
      basicFields.technologyNameEN = titleMatch[1].trim();
    }
    
    // 公司/所有者名称
    const ownerMatch = content.match(/Owner\s*\[(.+?)\]/i) ||
                       content.match(/Applicant\s*\[(.+?)\]/i);
    if (ownerMatch) {
      basicFields.companyName = ownerMatch[1];
    }
    
    // 发布和更新时间
    const publishedMatch = content.match(/Published\s*(\d{4}\/\d{1,2}\/\d{1,2})/i);
    const updatedMatch = content.match(/Updated\s*(\d{4}\/\d{1,2}\/\d{1,2})/i);
    
    if (publishedMatch) {
      basicFields.publishedTime = publishedMatch[1];
    }
    if (updatedMatch) {
      basicFields.updatedTime = updatedMatch[1];
    }
    
    return basicFields;
  }
  
  /**
   * 提取描述和效益信息
   */
  static extractDescriptionFields(content) {
    const fields = {};
    
    // 技术描述（通常在Description或Details部分）
    const descSections = content.split(/(?:^|\n)(?:- Description|Description|Details)/i);
    if (descSections.length > 1) {
      // 获取Description部分的内容，直到下一个section
      let description = descSections[1].split(/(?:\n- |\n[A-Z][a-z]+:)/)[0].trim();
      fields.description = description;
    }
    
    // 效益信息
    const benefitSections = content.split(/(?:^|\n)(?:- Benefits|Benefits)/i);
    if (benefitSections.length > 1) {
      let benefits = benefitSections[1].split(/(?:\n- |\n[A-Z][a-z]+:)/)[0].trim();
      fields.benefits = benefits;
    }
    
    return fields;
  }
  
  /**
   * 提取网站和联系信息
   */
  static extractContactFields(content) {
    const fields = {};
    
    // 网站链接提取
    const websiteMatch = content.match(/\[Visit Website\]\(([^)]+)\)/i) ||
                         content.match(/Website[:\s]+([^\s\n]+)/i);
    if (websiteMatch) {
      fields.companyWebsiteUrl = websiteMatch[1];
    }
    
    // 邮箱联系（如果有）
    const emailMatch = content.match(/Email\s+Owner/i);
    if (emailMatch) {
      fields.hasEmailContact = true;
    }
    
    return fields;
  }
  
  /**
   * 专利页面专用提取器
   */
  static extractPatentFields(content) {
    const fields = {};
    
    // 申请人信息（通常包含国家信息）
    const applicantMatch = content.match(/Applicant\s*\[(.+?)\]/i);
    if (applicantMatch) {
      fields.companyName = applicantMatch[1];
    }
    
    // 专利状态指导
    if (content.includes('Patent status guidance')) {
      fields.hasPatentStatusInfo = true;
    }
    
    // 专利链接
    const patentLinkMatch = content.match(/patentscope\.wipo\.int[^)]+/i);
    if (patentLinkMatch) {
      fields.patentLink = `https://${patentLinkMatch[0]}`;
    }
    
    return fields;
  }
  
  /**
   * 上传页面专用提取器
   */
  static extractUploadFields(content) {
    const fields = {};
    
    // 上传者信息
    const uploaderMatch = content.match(/Uploaded by\s*(.+)/i);
    if (uploaderMatch) {
      fields.uploadedBy = uploaderMatch[1].trim();
    }
    
    // 来源类型
    const sourceMatch = content.match(/Source\s*(.+)/i);
    if (sourceMatch) {
      fields.source = sourceMatch[1].trim();
    }
    
    return fields;
  }
  
  /**
   * 历史页面专用提取器
   */
  static extractLegacyFields(content) {
    const fields = {};
    
    // 大学或机构信息
    const universityMatch = content.match(/(University|College|Institute)[^,\n]+/gi);
    if (universityMatch) {
      fields.institution = universityMatch[0];
    }
    
    // AUTM链接
    if (content.includes('autm.net') || content.includes('gtp.autm.net')) {
      fields.source = 'AUTM';
    }
    
    return fields;
  }
  
  /**
   * 主提取函数
   */
  static extractAllFields(content, pageType) {
    // 提取基本字段
    let allFields = this.extractBasicFields(content);
    
    // 合并描述字段
    Object.assign(allFields, this.extractDescriptionFields(content));
    
    // 合并联系字段
    Object.assign(allFields, this.extractContactFields(content));
    
    // 根据页面类型提取特定字段
    switch (pageType) {
      case 'patent':
        Object.assign(allFields, this.extractPatentFields(content));
        break;
      case 'upload':
        Object.assign(allFields, this.extractUploadFields(content));
        break;
      case 'legacy':
        Object.assign(allFields, this.extractLegacyFields(content));
        break;
    }
    
    return allFields;
  }
}

/**
 * 国家信息推理引擎
 */
class CountryInferrer {
  /**
   * 公司名称到国家的映射表
   */
  static getCompanyCountryMap() {
    return {
      // 日本公司
      'J-Power': '日本',
      'Mitsubishi Heavy Industries': '日本',
      'Hitachi': '日本',
      'Challenergy': '日本',
      'A-WING': '日本',
      'LIXIL Corporation': '日本',
      
      // 中国公司
      'China Longyuan Power Group': '中国',
      'Eco Marine Power': '中国',
      'ZONHAN': '中国',
      
      // 美国公司/机构
      'Auburn University': '美国',
      'University of Arizona': '美国',
      'Case Western Reserve University': '美国',
      'University of Louisville': '美国',
      'Northeastern University': '美国',
      'STC UNM': '美国',
      
      // 其他国家
      'Koenders': '加拿大',
      'Ryse Energy': '英国',
      'PVMars Solar': '印度'
    };
  }
  
  /**
   * 网站域名到国家的映射
   */
  static getDomainCountryMap() {
    return {
      '.jp': '日本',
      '.co.jp': '日本',
      '.cn': '中国',
      '.com.cn': '中国',
      '.edu': '美国',
      '.gov': '美国',
      '.uk': '英国',
      '.co.uk': '英国',
      '.de': '德国',
      '.nl': '荷兰',
      '.dk': '丹麦',
      '.ca': '加拿大'
    };
  }
  
  /**
   * 从公司名称推断国家
   */
  static inferFromCompanyName(companyName) {
    if (!companyName) return null;
    
    const companyMap = this.getCompanyCountryMap();
    
    // 精确匹配
    for (const [company, country] of Object.entries(companyMap)) {
      if (companyName.includes(company)) {
        return country;
      }
    }
    
    // 关键词匹配
    const companyLower = companyName.toLowerCase();
    if (companyLower.includes('japan') || companyLower.includes('japanese')) {
      return '日本';
    }
    if (companyLower.includes('china') || companyLower.includes('chinese')) {
      return '中国';
    }
    if (companyLower.includes('america') || companyLower.includes('usa') || companyLower.includes('us ')) {
      return '美国';
    }
    
    return null;
  }
  
  /**
   * 从网站域名推断国家
   */
  static inferFromWebsite(websiteUrl) {
    if (!websiteUrl) return null;
    
    const domainMap = this.getDomainCountryMap();
    
    for (const [domain, country] of Object.entries(domainMap)) {
      if (websiteUrl.includes(domain)) {
        return country;
      }
    }
    
    return null;
  }
  
  /**
   * 从技术描述推断部署国家
   */
  static inferFromDescription(description) {
    if (!description) return null;
    
    const descLower = description.toLowerCase();
    
    // 地名匹配
    const locationKeywords = {
      'japan': '日本',
      'japanese': '日本',
      'tokyo': '日本',
      'china': '中国',
      'chinese': '中国',
      'beijing': '中国',
      'shanghai': '中国',
      'fujian': '中国',
      'nanri island': '中国',
      'philippines': '菲律宾',
      'united states': '美国',
      'america': '美国',
      'arizona': '美国',
      'louisville': '美国'
    };
    
    for (const [keyword, country] of Object.entries(locationKeywords)) {
      if (descLower.includes(keyword)) {
        return country;
      }
    }
    
    return null;
  }
  
  /**
   * 综合推理国家信息
   */
  static inferCountries(companyName, websiteUrl, description) {
    const companyCountry = this.inferFromCompanyName(companyName);
    const websiteCountry = this.inferFromWebsite(websiteUrl);
    const descriptionCountry = this.inferFromDescription(description);
    
    // 开发国家优先级：公司国家 > 网站国家
    const developedInCountry = companyCountry || websiteCountry;
    
    // 部署国家优先级：描述推断 > 开发国家
    const deployedInCountry = descriptionCountry || developedInCountry;
    
    return {
      developedInCountry,
      deployedInCountry
    };
  }
}

// 导出主要类和函数
module.exports = {
  PageTypeDetector,
  FieldExtractor,
  CountryInferrer
};

console.log('Enhanced WIPO Scraper - 页面类型识别器已就绪');
console.log('支持页面类型：专利页面(Patent)、上传页面(Upload)、历史页面(Legacy)');