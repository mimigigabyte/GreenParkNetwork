import { ProductCategory, TechProduct, MainCategory, SearchStats } from '@/api/tech';

// 主分类和子分类Mock数据
export const mockMainCategories: MainCategory[] = [
  {
    id: 'energy-saving',
    name: '节能环保产业',
    count: 483,
    subCategories: [
      { id: 'efficient-energy', name: '高效节能产业', count: 156 },
      { id: 'advanced-environmental', name: '先进环保产业', count: 142 },
      { id: 'resource-recycling', name: '资源循环利用产业', count: 98 },
      { id: 'green-transport', name: '绿色交通车船和设备制造产业', count: 87 }
    ]
  },
  {
    id: 'clean-production',
    name: '清洁生产产业',
    count: 390,
    subCategories: [
      { id: 'clean-raw-materials', name: '清洁生产原料制造业', count: 134 },
      { id: 'clean-equipment', name: '清洁生产设备制造和设施建设业', count: 167 },
      { id: 'clean-technology-service', name: '清洁生产技术服务业', count: 89 }
    ]
  },
  {
    id: 'clean-energy',
    name: '清洁能源产业',
    count: 804,
    subCategories: [
      { id: 'nuclear-power', name: '核电产业', count: 45 },
      { id: 'wind-energy', name: '风能产业', count: 123 },
      { id: 'solar-energy', name: '太阳能产业', count: 178 },
      { id: 'biomass-energy', name: '生物质能产业', count: 67 },
      { id: 'hydropower', name: '水力发电产业', count: 89 },
      { id: 'smart-grid', name: '智能电网产业', count: 112 },
      { id: 'other-clean-energy', name: '其他清洁能源产业', count: 56 },
      { id: 'traditional-energy-clean', name: '传统能源清洁高效利用产业', count: 134 }
    ]
  },
  {
    id: 'new-energy-vehicle',
    name: '新能源汽车产业',
    count: 404,
    subCategories: [
      { id: 'new-energy-vehicle-manufacturing', name: '新能源汽车整车制造', count: 89 },
      { id: 'new-energy-vehicle-parts', name: '新能源汽车装置、配件制造', count: 145 },
      { id: 'new-energy-vehicle-facilities', name: '新能源汽车相关设施制造', count: 78 },
      { id: 'new-energy-vehicle-service', name: '新能源汽车相关服务', count: 92 }
    ]
  }
];

// 产品分类Mock数据
export const mockCategories: ProductCategory[] = [
  {
    id: 'energy-saving',
    name: '节能环保产业',
    nameEn: 'ENERGY SAVING',
    icon: '💡',
    count: 400,
    color: 'yellow'
  },
  {
    id: 'clean-energy',
    name: '清洁能源产业',
    nameEn: 'CLEAN ENERGY',
    icon: '☀️',
    count: 45000,
    color: 'blue'
  },
  {
    id: 'clean-production',
    name: '清洁生产产业',
    nameEn: 'CLEAN PRODUCTION',
    icon: '🏭',
    count: 90,
    color: 'yellow'
  },
  {
    id: 'new-energy-vehicle',
    name: '新能源汽车产业',
    nameEn: 'NEW ENERGY VEHICLE',
    icon: '🚗',
    count: 20,
    color: 'blue'
  }
];

// 技术产品Mock数据
export const mockProducts: TechProduct[] = [
  {
    id: '1',
    companyName: '横河电机(中国)投资有限公司',
    companyNameEn: 'Yokogawa China Investment Co., Ltd',
    companyLogo: 'YOKOGAWA Co-innovating tomorrow',
    companyLogoUrl: '/images/logos/yokogawa-logo.png',
    solutionTitle: '净零排放一站式解决方案VOF',
    solutionImage: '/images/solutions/yokogawa-solution-1.jpg',
    solutionThumbnail: '/images/solutions/yokogawa-thumbnail-1.jpg',
    solutionDescription: '涉及环境、能源、安全、设备四个维度，通过数据监控和分析，为企业提供全方位的净零排放解决方案。该方案整合了先进的传感器技术、实时数据分析平台和智能控制系统，帮助企业实现碳排放的精准监测和有效控制。',
    shortDescription: '涉及环境、能源、安全、设备四个维度，通过数据监控和分析，为企业提供全方位的净零排放解决方案。该方案整合了先进的传感器技术、实时数据分析平台和智能控制系统，帮助企业实现碳排放的精准监测和有效控制。',
    fullDescription: '横河电机的净零排放一站式解决方案VOF（Value of Future）是一个综合性的企业可持续发展平台。该方案涵盖环境、能源、安全、设备四个核心维度，通过先进的数据监控和分析技术，为企业提供全方位的净零排放解决方案。\n\n在环境维度，系统实时监测企业碳排放、废水处理、废气排放等关键指标，建立完整的环保数据管理体系。在能源维度，系统监控水、电、气等关键能源数据，识别能源使用中的问题，提出改进建议，并实现能源消耗预测。在安全维度，系统提供全面的安全监控和预警功能，确保企业运营安全。在设备维度，系统实现设备的智能化管理和维护，提高设备运行效率。\n\n该方案整合了先进的传感器技术、实时数据分析平台和智能控制系统，通过物联网技术实现数据的全面采集和分析。系统采用人工智能算法，能够自动识别异常情况，提供智能化的决策支持。同时，系统还提供可视化的数据展示界面，让企业管理者能够直观地了解企业的环保和能源状况。\n\n通过该解决方案，企业可以实现碳排放的精准监测和有效控制，建立完善的环保管理体系，实现可持续发展目标。该方案已在多个行业成功实施，取得了显著的节能减排效果。',
    category: 'energy-saving',
    subCategory: 'efficient-energy',
    country: '日本',
    province: '北京',
    developmentZone: '北京经济技术开发区',
    hasContact: true,
    updateTime: '2024-12-15T10:30:00Z'
  },
  {
    id: '2',
    companyName: '施耐德电气(中国)有限公司',
    companyNameEn: 'Schneider Electric (China) Co., Ltd',
    companyLogo: 'Schneider Electric',
    companyLogoUrl: '/images/logos/schneider-logo.png',
    solutionTitle: '零碳园区综合解决方案',
    solutionImage: '/images/solutions/schneider-solution-1.jpg',
    solutionThumbnail: '/images/solutions/schneider-thumbnail-1.jpg',
    solutionDescription: '基于EcoStruxure平台的零碳园区解决方案，通过智能配电、楼宇自动化、工业自动化等系统，实现园区的能源优化和碳排放管理。该方案已在多个国家级经开区成功实施，取得了显著的节能减排效果。',
    shortDescription: '基于EcoStruxure平台的零碳园区解决方案，通过智能配电、楼宇自动化、工业自动化等系统，实现园区的能源优化和碳排放管理。该方案已在多个国家级经开区成功实施，取得了显著的节能减排效果。',
    fullDescription: '施耐德电气的零碳园区综合解决方案是基于EcoStruxure平台的创新性园区管理平台。该方案通过整合智能配电、楼宇自动化、工业自动化等多个系统，为园区提供全方位的零碳管理解决方案。\n\n在智能配电方面，系统采用先进的配电技术和设备，实现电力的高效分配和管理。通过智能电表和配电自动化系统，实时监控园区内的电力使用情况，优化电力分配，减少能源浪费。系统还具备故障检测和自动恢复功能，确保园区电力供应的稳定性和可靠性。\n\n在楼宇自动化方面，系统通过智能楼宇管理系统，实现对园区内所有建筑物的自动化控制。包括照明、空调、电梯等设备的智能控制，根据人员密度、天气条件、使用时间等因素自动调节设备运行参数，最大程度降低能源消耗。系统还提供舒适度监控功能，确保园区内的工作和生活环境质量。\n\n在工业自动化方面，系统为园区内的工业企业提供智能化的生产管理解决方案。通过工业物联网技术，实现生产设备的智能化监控和管理，提高生产效率，降低能源消耗。系统还提供生产数据分析和优化建议，帮助企业实现绿色生产。\n\n该方案已在多个国家级经济技术开发区成功实施，包括北京经济技术开发区、上海张江高科技园区等，取得了显著的节能减排效果。通过该方案，园区可以实现碳排放的精准监测和有效控制，建立完善的环保管理体系，实现可持续发展目标。',
    category: 'energy-saving',
    subCategory: 'advanced-environmental',
    country: '法国',
    province: '上海',
    developmentZone: '上海张江高科技园区',
    hasContact: true,
    updateTime: '2024-12-14T15:45:00Z'
  },
  {
    id: '3',
    companyName: '横河电机(中国)投资有限公司',
    companyNameEn: 'Yokogawa China Investment Co., Ltd',
    companyLogo: 'YOKOGAWA Co-innovating tomorrow',
    companyLogoUrl: '/images/logos/yokogawa-logo.png',
    solutionTitle: '智能工厂能源管理系统',
    solutionImage: '/images/solutions/yokogawa-solution-2.jpg',
    solutionThumbnail: '/images/solutions/yokogawa-thumbnail-2.jpg',
    solutionDescription: '集成工业物联网技术的智能工厂能源管理系统，通过实时数据采集、分析和预测，优化生产过程中的能源使用效率。系统支持多种能源类型的统一管理，包括电力、天然气、蒸汽等，为企业提供全面的能源管理解决方案。',
    shortDescription: '集成工业物联网技术的智能工厂能源管理系统，通过实时数据采集、分析和预测，优化生产过程中的能源使用效率。系统支持多种能源类型的统一管理，包括电力、天然气、蒸汽等，为企业提供全面的能源管理解决方案。',
    fullDescription: '横河电机的智能工厂能源管理系统是一个基于工业物联网技术的综合性能源管理平台。该系统通过实时数据采集、分析和预测，为制造企业提供全面的能源管理解决方案，帮助企业实现能源使用的优化和成本控制。\n\n系统采用先进的传感器技术和数据采集设备，实时监控工厂内的各种能源使用情况，包括电力、天然气、蒸汽、压缩空气等。通过高精度的测量设备，系统能够准确记录各种能源的消耗量、使用时间和使用效率，为后续的数据分析提供可靠的基础数据。\n\n在数据分析方面，系统采用先进的大数据分析和人工智能技术，对采集到的能源数据进行深度分析。系统能够识别能源使用中的异常情况，发现能源浪费的环节，并提供针对性的优化建议。同时，系统还具备能源消耗预测功能，能够根据历史数据和当前使用情况，预测未来的能源需求，帮助企业制定合理的能源采购计划。\n\n在能源管理方面，系统支持多种能源类型的统一管理，实现能源使用的全面监控和优化。系统提供可视化的能源管理界面，让企业管理者能够直观地了解各种能源的使用情况和效率。通过智能化的控制算法，系统能够自动调节设备的运行参数，实现能源使用的最优化。\n\n该系统的实施能够显著提高企业的能源使用效率，降低能源成本，减少碳排放，为企业实现可持续发展目标提供有力支持。系统已在多个制造企业成功应用，取得了显著的节能减排效果。',
    category: 'energy-saving',
    subCategory: 'efficient-energy',
    country: '日本',
    province: '北京',
    developmentZone: '北京经济技术开发区',
    hasContact: false,
    updateTime: '2024-12-13T09:20:00Z'
  },
  {
    id: '4',
    companyName: '施耐德电气(中国)有限公司',
    companyNameEn: 'Schneider Electric (China) Co., Ltd',
    companyLogo: 'Schneider Electric',
    companyLogoUrl: '/images/logos/schneider-logo.png',
    solutionTitle: '绿色建筑节能系统',
    solutionImage: '/images/solutions/schneider-solution-2.jpg',
    solutionThumbnail: '/images/solutions/schneider-thumbnail-2.jpg',
    solutionDescription: '针对商业建筑和工业建筑的绿色节能系统，采用先进的楼宇自动化技术，实现照明、空调、电梯等设备的智能控制。系统可根据人员密度、天气条件、使用时间等因素自动调节设备运行参数，最大程度降低能源消耗。',
    shortDescription: '针对商业建筑和工业建筑的绿色节能系统，采用先进的楼宇自动化技术，实现照明、空调、电梯等设备的智能控制。系统可根据人员密度、天气条件、使用时间等因素自动调节设备运行参数，最大程度降低能源消耗。',
    fullDescription: '施耐德电气的绿色建筑节能系统是专门针对商业建筑和工业建筑设计的智能化节能管理平台。该系统采用先进的楼宇自动化技术，通过智能化的设备控制和优化算法，实现建筑能源使用的最优化，最大程度降低能源消耗和运营成本。\n\n在照明控制方面，系统采用智能照明技术，根据自然光照强度、人员活动情况和时间等因素，自动调节照明设备的亮度和开关状态。通过人体感应传感器和光照传感器，系统能够精确控制照明设备的使用，避免不必要的能源浪费。同时，系统还支持场景化照明控制，为不同的使用场景提供合适的照明方案。\n\n在空调控制方面，系统采用智能空调技术，通过温度传感器、湿度传感器和空气质量传感器，实时监控室内环境参数。系统根据人员密度、天气条件、使用时间等因素，自动调节空调设备的运行参数，确保室内环境的舒适性，同时最大程度降低能源消耗。系统还具备新风控制功能，根据室内空气质量自动调节新风量，保证室内空气的新鲜度。\n\n在电梯控制方面，系统采用智能电梯技术，通过客流分析和智能调度算法，优化电梯的运行效率。系统能够根据楼层使用情况和人员分布，智能调度电梯的运行，减少等待时间，提高使用效率，同时降低能源消耗。\n\n系统还提供综合性的能源管理功能，包括能源使用监控、能耗分析、节能效果评估等。通过可视化的管理界面，建筑管理者能够实时了解各种设备的能源使用情况，制定合理的节能策略。系统还提供详细的能耗报告和节能建议，帮助建筑管理者持续优化能源使用效率。\n\n该系统的实施能够显著降低建筑的能源消耗，减少运营成本，同时提高建筑的使用舒适度和智能化水平。系统已在多个商业建筑和工业建筑中成功应用，取得了显著的节能效果。',
    category: 'energy-saving',
    subCategory: 'green-transport',
    country: '法国',
    province: '上海',
    developmentZone: '上海张江高科技园区',
    hasContact: true,
    updateTime: '2024-12-12T14:15:00Z'
  }
];

// 搜索结果统计信息Mock数据
export const mockSearchStats: SearchStats = {
  companyCount: 39,
  technologyCount: 400,
  totalResults: 400
};

// 筛选选项Mock数据
export const mockFilterOptions = {
  countries: [
    { value: 'all', label: '全部' },
    { value: 'china', label: '中国' },
    { value: 'japan', label: '日本' },
    { value: 'france', label: '法国' },
    { value: 'germany', label: '德国' },
    { value: 'usa', label: '美国' }
  ],
  provinces: [
    { value: 'all', label: '全部' },
    { value: 'beijing', label: '北京' },
    { value: 'shanghai', label: '上海' },
    { value: 'guangdong', label: '广东' },
    { value: 'jiangsu', label: '江苏' },
    { value: 'zhejiang', label: '浙江' }
  ],
  developmentZones: [
    { value: 'all', label: '全部' },
    { value: 'beijing-economic', label: '北京经济技术开发区' },
    { value: 'zhangjiang', label: '上海张江高科技园区' },
    { value: 'shenzhen-high-tech', label: '深圳高新技术产业开发区' },
    { value: 'suzhou-industrial', label: '苏州工业园区' },
    { value: 'hangzhou-high-tech', label: '杭州高新技术产业开发区' }
  ]
};

// 模拟API响应
export const createMockResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data: success ? data : undefined,
  message: success ? '请求成功' : '请求失败',
  error: success ? undefined : '模拟错误'
}); 
