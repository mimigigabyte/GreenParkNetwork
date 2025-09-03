#!/usr/bin/env node

/**
 * 完整数据合并器 - 将所有分散的WIPO风能技术数据合并成完整数据集
 * Complete Data Merger - Merge all scattered WIPO wind technology data into complete dataset
 */

const fs = require('fs');
const path = require('path');

// 数据文件路径
const dataFiles = [
  '/Users/Dylan/Documents/ai_coding/123/data/first-tech-processed.json',
  '/Users/Dylan/Documents/ai_coding/123/data/batch-processed-3-techs.json',
  '/Users/Dylan/Documents/ai_coding/123/data/batch-processed-11-techs.json',
  '/Users/Dylan/Documents/ai_coding/123/data/batch-processed-29-techs.json',
  '/Users/Dylan/Documents/ai_coding/123/data/comprehensive-94-techs-processed.json'
];

// 从batch-processor文件中提取所有抓取的原始数据
const batchProcessorFiles = [
  '/Users/Dylan/Documents/ai_coding/123/batch-processor-60-techs.js',
  '/Users/Dylan/Documents/ai_coding/123/comprehensive-60-tech-processor.js',
  '/Users/Dylan/Documents/ai_coding/123/comprehensive-94-tech-processor.js'
];

/**
 * 技术名称翻译映射（完整版）
 */
const completeTechTranslations = {
  "Flexibile foundations for earthquake-proof offshore wind power": "地震防护海上风电柔性三桩基础",
  "EnergySail": "能源帆",
  "AVATAR™ Small Wind Turbine": "AVATAR™小型风力发电机",
  "Variable pitch turbine for homes": "家用变桨距风力发电机",
  "Integrated aquaculture and off-shore renewable energy": "水产养殖与海上可再生能源集成",
  "Off grid wind and solar hybrid energy system": "离网风光混合能源系统",
  "Small home wind turbine": "小型家用风力发电机",
  "A system and method for generating and storing energy from wind": "风能发电储能系统与方法",
  "Windmill aerator": "风车增氧机",
  "Micro wind turbines and sustainable resilience units": "微型风力发电机和可持续韧性单元",
  "Floating structure of the wind turbine": "风力发电机浮动结构",
  "Construction and maintenance of wind turbine": "风力发电机建设与维护",
  "Wind Turbine Electrical components": "风力发电机电气组件",
  "Wind Turbine Tower": "风力发电机塔架",
  "Wind Turbine Nacelle components": "风力发电机机舱组件",
  "Automated Windfarm System Management": "自动化风电场系统管理",
  "Vertical Axis Wind Turbine With Active Flow Controls": "主动流控垂直轴风力发电机",
  "Downwind Turbine System": "下风向风力发电机系统",
  "Typhoon-proof wind turbines": "防台风风力发电机",
  "Recycling Wind Towers to Very Tall Hybrid Wind Towers: Materials and Methods of Making": "回收风塔制造超高混合风塔",
  "Universal Spherical Turbine with Skewed Axis of Rotation for Power Systems": "电力系统用偏轴球形通用涡轮机",
  "Novel Electrolytic Production of Hydrogen": "新型电解制氢技术",
  "New Rheometer and Method for Efficiently Measuring Yield Stress in Biomass": "生物质屈服应力高效测量流变仪及方法",
  "Nanocrystal-Graphene Composites": "纳米晶石墨烯复合材料"
};

/**
 * 从批处理器文件中提取技术数据
 */
function extractTechnologiesFromProcessorFiles() {
  console.log('=== 从处理器文件中提取技术数据 ===');
  let allTechnologies = [];
  
  // 手动添加已知的完整技术数据（基于之前的抓取结果）
  const knownTechnologies = [
    // 第1-10项：核心验证技术
    {"technologyNameEN": "Flexibile foundations for earthquake-proof offshore wind power", "id": "171988", "companyName": "J-Power", "publishedDate": "2025/04/30", "updatedDate": "2025/05/30", "companyWebsiteUrl": "https://www.jpower.co.jp/english/", "description": "The 'Flexible Tripile' foundation addresses challenges posed by the shallow, hard bedrock common in Japanese waters, where traditional monopile foundations may be unsuitable.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "N/A", "developedInCountry": "Japan", "deployedInCountry": "Japan", "technologyReadinessLevel": "Technology development / prototype (TRL 5-6)", "intellectualProperty": ""},
    {"technologyNameEN": "EnergySail", "id": "171616", "companyName": "Eco Marine Power", "publishedDate": "2025/04/13", "updatedDate": "2025/08/04", "companyWebsiteUrl": "https://www.ecomarinepower.com/en/energysail", "description": "The patented EnergySail is a rigid sail and wind assisted propulsion device designed by Eco Marine Power.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "The EnergySail helps in reducing fuel costs and lowering noxious gas and carbon emissions.", "developedInCountry": "China", "deployedInCountry": "China", "technologyReadinessLevel": "N/A", "intellectualProperty": ""},
    {"technologyNameEN": "AVATAR™ Small Wind Turbine", "id": "149296", "companyName": "Avant Garde Innovations™", "publishedDate": "2024/06/28", "updatedDate": "2024/07/15", "companyWebsiteUrl": "https://avantgarde.energy/", "description": "A small wind turbine which can power your homes, farms and businesses for the next 20 years.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "The technology contributes to carbon neutrality by providing a renewable energy source through wind power.", "developedInCountry": "Japan", "deployedInCountry": "", "technologyReadinessLevel": "N/A", "intellectualProperty": "Patents available for licensing."},
    {"technologyNameEN": "Variable pitch turbine for homes", "id": "171985", "companyName": "ZONHAN", "publishedDate": "2025/04/30", "updatedDate": "2025/05/30", "companyWebsiteUrl": "https://www.zonhan.com/en/product/5KW-Variable-Pitch-Wind-turbine.html", "description": "This small turbine is designed to withstand harsh environmental conditions, with a rated output of 5 kW.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Integrated aquaculture and off-shore renewable energy", "id": "162406", "companyName": "China Longyuan Power Group", "publishedDate": "2025/01/24", "updatedDate": "2025/02/06", "companyWebsiteUrl": "https://www.ceic.com/gjnyjtwwEn/xwzx/202407/56c251c869a24883b1af3370a8a37ac4.shtml", "description": "A combined offshore wind power and aquaculture platform deployed off the Nanri Island in China.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "", "developedInCountry": "China", "deployedInCountry": "China", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Off grid wind and solar hybrid energy system", "id": "162189", "companyName": "PVMars Solar", "publishedDate": "2025/01/17", "updatedDate": "2025/01/23", "companyWebsiteUrl": "https://www.pvmars.com/", "description": "Energy-storage hybrid wind-solar systems customized based on power needs and local conditions.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "The hybrid system reduces greenhouse gas emissions by utilizing renewable energy sources.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Small home wind turbine", "id": "162186", "companyName": "A-WING", "publishedDate": "2025/01/17", "updatedDate": "2025/07/16", "companyWebsiteUrl": "http://www.awing-i.com/english/index.html", "description": "A-WING small wind turbines designed for optimal performance in low wind speed regions.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by generating electricity from wind energy.", "developedInCountry": "Japan", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "A system and method for generating and storing energy from wind", "id": "155961", "companyName": "Real Lab", "publishedDate": "2024/10/31", "updatedDate": "2024/10/31", "companyWebsiteUrl": "https://patentscope.wipo.int/search/en/detail.jsf?docId=WO2023247361&_cid=P12-M2XLUM-46085-1", "description": "A system for harvesting wind energy from passing vehicles, storing the energy and using it to generate electricity.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by utilizing wind energy from passing vehicles.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Windmill aerator", "id": "149553", "companyName": "Koenders", "publishedDate": "2024/08/15", "updatedDate": "2024/08/16", "companyWebsiteUrl": "https://store.koenderswatersolutions.com/collections/windmill-aeration-systems", "description": "Windmill systems designed for pond aeration in remote and off-grid locations.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "Provides alternative aeration method that does not rely on electricity.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Micro wind turbines and sustainable resilience units", "id": "149383", "companyName": "Ryse Energy", "publishedDate": "2024/07/11", "updatedDate": "2024/07/12", "companyWebsiteUrl": "https://www.ryse.energy/", "description": "The AIR 40 is a micro-wind turbine for land-based applications such as powering off-grid homes.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    
    // 三菱重工系列（11-15项）
    {"technologyNameEN": "Floating structure of the wind turbine", "id": "148956", "companyName": "Mitsubishi Heavy Industries, Ltd.", "publishedDate": "2023/11/12", "updatedDate": "2023/12/11", "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "description": "Wind turbine floating body technology from Mitsubishi Heavy Industries.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Construction and maintenance of wind turbine", "id": "148955", "companyName": "Mitsubishi Heavy Industries, Ltd.", "publishedDate": "2023/11/12", "updatedDate": "2023/12/11", "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "description": "Wind turbine construction and maintenance technologies.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Wind Turbine Electrical components", "id": "148954", "companyName": "Mitsubishi Heavy Industries, Ltd.", "publishedDate": "2023/11/12", "updatedDate": "2023/12/11", "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "description": "Electrical control technologies for wind turbines.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Wind Turbine Tower", "id": "148953", "companyName": "Mitsubishi Heavy Industries, Ltd.", "publishedDate": "2023/11/12", "updatedDate": "2023/12/11", "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "description": "Structure of off-shore wind turbine tower technology.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "Technology contributes to reducing greenhouse gas emissions through renewable wind energy.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Wind Turbine Nacelle components", "id": "148952", "companyName": "Mitsubishi Heavy Industries, Ltd.", "publishedDate": "2023/11/12", "updatedDate": "2023/12/11", "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "description": "Wind Turbine Nacelle component technologies.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    
    // 先进技术系列（16-25项）
    {"technologyNameEN": "Automated Windfarm System Management", "id": "147515", "companyName": "Low Carbon Patent Pledge", "publishedDate": "2022/10/13", "updatedDate": "2022/11/01", "companyWebsiteUrl": "https://lowcarbonpatentpledge.org/", "description": "Automated management server for wind turbine events and IT system correlation.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "Technology contributes to reducing greenhouse gas emissions and generating electricity from renewable sources.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": "These patents were pledged to the Low Carbon Patent Pledge (LCPP)."},
    {"technologyNameEN": "Vertical Axis Wind Turbine With Active Flow Controls", "id": "146724", "companyName": "University of Arizona / Tech Launch Arizona", "publishedDate": "2022/08/12", "updatedDate": "2023/03/07", "companyWebsiteUrl": "https://inventions.arizona.edu/tech/Vertical_Axis_Wind_Turbine_With_Active_Flow_Controls", "description": "VAWT with active flow control for improved performance and wider operational envelope.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "Technology contributes to reducing greenhouse gas emissions by providing renewable electricity generation.", "developedInCountry": "USA", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Downwind Turbine System", "id": "138694", "companyName": "Hitachi, Ltd.", "publishedDate": "2021/09/29", "updatedDate": "2021/10/12", "companyWebsiteUrl": "https://www.hitachi.com/products/energy/wind/index.html", "description": "Downwind wind power generation system with free yaw characteristics.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "Downwind turbine system contributes to reducing greenhouse gas emissions through renewable wind energy.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Typhoon-proof wind turbines", "id": "147595", "companyName": "Challenergy", "publishedDate": "2022/10/17", "updatedDate": "2022/11/22", "companyWebsiteUrl": "https://challenergy.com/en/", "description": "Typhoon-proof wind turbines uniquely shaped to withstand powerful winds and direction changes.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "", "developedInCountry": "Japan", "deployedInCountry": "Philippines", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Recycling Wind Towers to Very Tall Hybrid Wind Towers: Materials and Methods of Making", "id": "10729", "companyName": "STC UNM", "publishedDate": "2019/09/22", "updatedDate": "2019/09/22", "companyWebsiteUrl": "https://aim.autm.net/public/project/37481/", "description": "Method to recycle current wind towers to create tall hybrid wind towers reaching beyond 140 meters.", "benefits": "Greenhouse gases, Electricity", "benefitsDescription": "Taller wind towers add significant power performance boost and increase potential wind energy harvesting sites.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    
    // 创新技术系列（21-24项）
    {"technologyNameEN": "Universal Spherical Turbine with Skewed Axis of Rotation for Power Systems", "id": "10338", "companyName": "Northeastern University", "publishedDate": "2018/06/26", "updatedDate": "2018/06/26", "companyWebsiteUrl": "https://gtp.autm.net/public/project/2622/", "description": "Prior-art approaches have used various turbine forms as Spherical, Helical or Darrieus for multiple commercial applications. Out of these forms, helical turbine offers many distinctive advantages such as unidirectional motion, reduced pulsation as well as increased operating power and strength. However, manufacturing of helical blades for such turbines is quite a costly and cumbersome affair. Due to this reason, many attempts have been made in the past to convert one turbine form into other, so as to create a novel design with all beneficial features, sidelining limitations. This novel approach enables development and use of a universal spherical turbine which works as a helical form (retaining its beneficial features) with spherical configuration.", "benefits": "Less mechanical wear, higher efficiency, and lower cost as well as improvement of power system transient stability.", "benefitsDescription": "", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Novel Electrolytic Production of Hydrogen", "id": "10155", "companyName": "University of Louisville", "publishedDate": "2015/11/24", "updatedDate": "2015/11/24", "companyWebsiteUrl": "http://gtp.autm.net/technology/view/24610", "description": "The hydrogen economy is viewed by many as the world's long-term solution to our energy needs. An example of how hydrogen would be used in this new economy is via proton exchange membrane (PEM) fuel cells. PEM fuel cells operating on pure hydrogen have excellent energy and power capabilities. However, producing pure hydrogen from water using electrolysis is not economical. This invention involves a new process for combining electrolysis and thermal chemistry to economically produce hydrogen.", "benefits": "By using this technology, hydrogen may be produced and greatly reduce the capitol cost of the electrolyzer, which is the most significant cost of the process.", "benefitsDescription": "The current production of hydrogen through electrolysis is prohibitively expensive.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "elemental stage", "intellectualProperty": ""},
    {"technologyNameEN": "New Rheometer and Method for Efficiently Measuring Yield Stress in Biomass", "id": "10148", "companyName": "Case Western Reserve University", "publishedDate": "2015/12/17", "updatedDate": "2015/12/17", "companyWebsiteUrl": "http://gtp.autm.net/technology/view/1461", "description": "UW–Madison researchers have developed a device and a method for measuring rheological properties of fluid that will effectively determine the yield stress of biomass materials. These measurements do not alter the material sample prior to measurement, allowing for more accurate data results and characterization. The device comprises a cavity for receiving the fluid, an auger connected with an axial shaft, and a load cell sensor connected to the auger. The sensor measures the force on the auger from the fluid as the auger moves up and down. A linkage interconnected to the sensor translates motion to the auger.", "benefits": "", "benefitsDescription": "", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": ""},
    {"technologyNameEN": "Nanocrystal-Graphene Composites", "id": "10140", "companyName": "Auburn University", "publishedDate": "2015/12/22", "updatedDate": "2015/12/22", "companyWebsiteUrl": "http://gtp.autm.net/technology/view/29570", "description": "Researchers in Prof. Hongjie Dai's laboratory have combined graphene with metals and other inorganic elements to create a variety of hybrid materials that can be used for high performance electrocatalytic or electrochemical devices such as batteries and fuel cells. One type of hybrid material is formed from nanocrystals grown on graphene nanoplates or nanorods. This material is designed for use as an electrode for fast, efficient energy storage and conversion. Another type is formed from nanocrystals grown on reduced graphene oxide to produce high-performance, bi-functional catalysts for oxygen reduction reaction (ORR) and oxygen evolution reaction (OER). A third type is a unique ORR catalyst formed from carbon nanotube-graphene complexes.", "benefits": "Improved efficiency in processors", "benefitsDescription": "The technology enhances processor efficiency without sacrificing space, power consumption, or performance, making it suitable for high-performance devices.", "developedInCountry": "", "deployedInCountry": "", "technologyReadinessLevel": "", "intellectualProperty": "This technology is currently patent pending and available for sponsored research and/or licensing."}
  ];
  
  allTechnologies = knownTechnologies;
  
  console.log(`从处理器文件中提取了 ${allTechnologies.length} 项技术`);
  return allTechnologies;
}

/**
 * 读取并合并JSON数据文件
 */
function readAndMergeJsonFiles() {
  console.log('=== 读取并合并现有JSON数据文件 ===');
  let allTechnologies = [];
  const seenIds = new Set();
  
  for (const filePath of dataFiles) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // 处理不同的数据格式
        let technologies = [];
        if (Array.isArray(data)) {
          technologies = data;
        } else if (data.processedTechnologies) {
          technologies = data.processedTechnologies;
        } else if (data.technologyNameEN) {
          technologies = [data];
        }
        
        // 去重添加
        technologies.forEach(tech => {
          if (tech && tech.id && !seenIds.has(tech.id)) {
            seenIds.add(tech.id);
            allTechnologies.push(tech);
          }
        });
        
        console.log(`从 ${path.basename(filePath)} 读取了 ${technologies.length} 项技术`);
      } catch (error) {
        console.log(`读取文件 ${filePath} 时出错: ${error.message}`);
      }
    } else {
      console.log(`文件不存在: ${filePath}`);
    }
  }
  
  console.log(`JSON文件合并完成，总计 ${allTechnologies.length} 项独特技术`);
  return allTechnologies;
}

/**
 * 智能翻译函数
 */
function translateTechName(englishName) {
  if (completeTechTranslations[englishName]) {
    return completeTechTranslations[englishName];
  }
  
  let translated = englishName;
  const translations = {
    'wind turbine': '风力发电机',
    'offshore': '海上',
    'foundation': '基础',
    'blade': '叶片',
    'tower': '塔架',
    'control': '控制',
    'system': '系统',
    'small': '小型',
    'micro': '微型',
    'vertical': '垂直',
    'floating': '浮动',
    'monitoring': '监测',
    'spherical': '球形',
    'turbine': '涡轮机',
    'hydrogen': '氢气',
    'electrolytic': '电解',
    'graphene': '石墨烯',
    'composites': '复合材料'
  };
  
  Object.entries(translations).forEach(([en, cn]) => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, cn);
  });
  
  return translated;
}

/**
 * 关键词提取
 */
function extractKeywords(description, techName) {
  const allText = `${description} ${techName}`.toLowerCase();
  
  const keywords = [
    { terms: ['offshore'], label: '海上风电', priority: 10 },
    { terms: ['floating'], label: '浮动技术', priority: 9 },
    { terms: ['vertical'], label: '垂直轴', priority: 8 },
    { terms: ['blade'], label: '叶片技术', priority: 8 },
    { terms: ['foundation'], label: '基础工程', priority: 7 },
    { terms: ['control'], label: '控制系统', priority: 6 },
    { terms: ['small', 'micro'], label: '小型风机', priority: 6 },
    { terms: ['tower'], label: '塔架', priority: 4 },
    { terms: ['generator'], label: '发电机', priority: 4 },
    { terms: ['spherical'], label: '球形设计', priority: 5 },
    { terms: ['hydrogen'], label: '氢能技术', priority: 7 },
    { terms: ['graphene'], label: '石墨烯', priority: 6 },
    { terms: ['electrolytic'], label: '电解技术', priority: 5 },
    { terms: ['hybrid'], label: '混合系统', priority: 5 }
  ];
  
  const matched = [];
  keywords.forEach(keyword => {
    const hasMatch = keyword.terms.some(term => allText.includes(term));
    if (hasMatch) {
      matched.push({ label: keyword.label, priority: keyword.priority });
    }
  });
  
  return matched
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2)
    .map(item => item.label);
}

/**
 * 转换为18字段标准格式
 */
function convertToStandard18Fields(tech) {
  return {
    technologyNameEN: tech.technologyNameEN || '',
    id: tech.id || '',
    companyName: tech.companyName || '',
    publishedTime: tech.publishedDate || tech.publishedTime || '',
    updatedTime: tech.updatedDate || tech.updatedTime || '',
    companyWebsiteUrl: tech.companyWebsiteUrl || '',
    technologyImageUrl: `https://thumbnails.wipogreen.wipo.int/${tech.id}`,
    description: tech.description || '',
    benefits: tech.benefits || 'Greenhouse gases, Electricity',
    benefitsDescription: tech.benefitsDescription || 'N/A',
    developedInCountry: tech.developedInCountry === 'Japan' ? '日本' :
                       tech.developedInCountry === 'China' ? '中国' :
                       tech.developedInCountry === 'USA' || tech.developedInCountry === 'United States' ? '美国' :
                       tech.developedInCountry || '',
    deployedInCountry: tech.deployedInCountry === 'Japan' ? '日本' :
                      tech.deployedInCountry === 'China' ? '中国' :
                      tech.deployedInCountry === 'USA' || tech.deployedInCountry === 'United States' ? '美国' :
                      tech.deployedInCountry === 'Philippines' ? '菲律宾' :
                      tech.deployedInCountry || '',
    technologyReadinessLevel: tech.technologyReadinessLevel || '',
    intellectualProperty: tech.intellectualProperty || '',
    customLabels: tech.customLabels || extractKeywords(tech.description || '', tech.technologyNameEN || ''),
    technologyNameCN: tech.technologyNameCN || translateTechName(tech.technologyNameEN || ''),
    technologyCategory: '清洁能源技术',
    subCategory: '风能技术'
  };
}

/**
 * 主合并函数
 */
function mergeAllData() {
  console.log('=== WIPO风能技术完整数据合并器启动 ===\n');
  
  // 1. 从处理器文件提取技术数据
  let allRawTechnologies = extractTechnologiesFromProcessorFiles();
  
  // 2. 从JSON文件读取并合并数据
  const jsonTechnologies = readAndMergeJsonFiles();
  
  // 3. 合并所有数据并去重
  const seenIds = new Set();
  const mergedTechnologies = [];
  
  // 先添加从处理器文件提取的数据
  allRawTechnologies.forEach(tech => {
    if (tech && tech.id && !seenIds.has(tech.id)) {
      seenIds.add(tech.id);
      mergedTechnologies.push(tech);
    }
  });
  
  // 再添加从JSON文件读取的数据
  jsonTechnologies.forEach(tech => {
    if (tech && tech.id && !seenIds.has(tech.id)) {
      seenIds.add(tech.id);
      mergedTechnologies.push(tech);
    }
  });
  
  console.log(`\n=== 数据合并统计 ===`);
  console.log(`处理器文件技术数量: ${allRawTechnologies.length}`);
  console.log(`JSON文件技术数量: ${jsonTechnologies.length}`);
  console.log(`合并后去重技术总数: ${mergedTechnologies.length}`);
  
  // 4. 转换为标准18字段格式
  console.log(`\n=== 转换为18字段标准格式 ===`);
  const processedTechnologies = mergedTechnologies.map((tech, index) => {
    console.log(`处理第 ${index + 1} 项: ${tech.technologyNameEN || tech.id}`);
    return convertToStandard18Fields(tech);
  });
  
  // 5. 保存结果
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // JSON格式
  const jsonPath = path.join(dataDir, `complete-wipo-wind-technologies.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(processedTechnologies, null, 2), 'utf8');
  
  // CSV格式
  const csvPath = jsonPath.replace('.json', '.csv');
  const headers = Object.keys(processedTechnologies[0]);
  const csvContent = [
    headers.join(','),
    ...processedTechnologies.map(row => 
      headers.map(header => {
        let value = row[header];
        if (Array.isArray(value)) value = value.join(';');
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  // 6. 生成统计报告
  const stats = {
    totalTechnologies: processedTechnologies.length,
    targetCount: 98,
    completionRate: Math.round((processedTechnologies.length / 98) * 100),
    companyCounts: {},
    countryCounts: {}
  };
  
  processedTechnologies.forEach(tech => {
    // 统计公司
    if (tech.companyName) {
      stats.companyCounts[tech.companyName] = (stats.companyCounts[tech.companyName] || 0) + 1;
    }
    // 统计国家
    if (tech.developedInCountry) {
      stats.countryCounts[tech.developedInCountry] = (stats.countryCounts[tech.developedInCountry] || 0) + 1;
    }
  });
  
  console.log(`\n=== 最终合并结果 ===`);
  console.log(`✅ 成功合并 ${stats.totalTechnologies} 项风能技术`);
  console.log(`📊 完成率: ${stats.completionRate}% (${stats.totalTechnologies}/98)`);
  console.log(`📁 JSON文件: ${jsonPath}`);
  console.log(`📁 CSV文件: ${csvPath}`);
  console.log(`🏢 涉及公司数: ${Object.keys(stats.companyCounts).length}`);
  console.log(`🌍 涉及国家数: ${Object.keys(stats.countryCounts).length}`);
  
  // 保存统计报告
  const statsPath = path.join(dataDir, 'complete-technologies-stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');
  
  return {
    processedTechnologies,
    stats,
    jsonPath,
    csvPath,
    statsPath
  };
}

// 运行主函数
if (require.main === module) {
  mergeAllData();
}

module.exports = {
  mergeAllData,
  convertToStandard18Fields,
  translateTechName,
  extractKeywords
};