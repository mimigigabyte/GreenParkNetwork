#!/usr/bin/env node

/**
 * 快速更新批量数据脚本
 * Quick update script for batch data
 */

const fs = require('fs');
const path = require('path');

// 新提取的技术数据（批次12-35）
const newTechData = [
  // 批次 12-19 (Mitsubishi Heavy Industries)
  {
    "id": "148955", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the construction and maintenance of wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/12", "technologyNameEN": "Construction and maintenance of wind turbine",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148954", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the electrical control of wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/12", "technologyNameEN": "Wind Turbine Electrical components",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148953", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Structure of off-shore wind turbine tower. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the tower of off-shore wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/12", "technologyNameEN": "Wind Turbine Tower",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through renewable wind energy.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148952", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the Wind Turbine Nacelle components. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/12", "technologyNameEN": "Wind Turbine Nacelle components",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148951", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Control of wind turbine related to Operation & Maintenance. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the operation and maintenance control of the Wind firm. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/12", "technologyNameEN": "Control of the wind turbine(Operation & maintenance)",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148930", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Method and apparatus to Control of the Wind farm. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to control of the Wind firm to optimize to the grid. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/09", "technologyNameEN": "Control of the Wind farm",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148929", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Control of the wind turbine to avoid the damage and generate the required quality of electricity. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. Operating wind turbine requires to avert damage of wind turbine due to the Loose of control And generate required quality of electricity. The registration technologies listed here are related to avert mechanical damage of the wind turbine due to the control loss and generate required quality of electricity with the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/09", "technologyNameEN": "Wind Turbine control",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions and generating electricity from renewable sources.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148916", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Blade inspection/fault detection and diagnosis. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. In 20+ years operation, due to the severe nature condition, Blade may have damage(Lightning strike, erosion etc.). The damaged blade will reduce the performance of wind turbine. The registration technologies listed here are related to the inspection of the blade to detect the timing of maintenance of the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/09", "technologyNameEN": "Wind Turbine Blade inspection/fault detection and diagnosis",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through efficient wind turbine operation.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },

  // 批次 20-27 (更多公司)
  {
    "id": "148913", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Design of add-on to the wind turbine blade, which enables to improve the performance. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. In 20+ years operation, due to the severe nature condition, Blade may have damage(Lightning strike, erosion etc.). The damaged blade will reduce the performance of wind turbine. The registration technologies listed here are related to the add-on to the blade to extend the period of maintenance and/or improve the performance of the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/09", "technologyNameEN": "Wind Turbine Blade add-on (Vortex Generator)",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through improved wind turbine performance.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148909", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Design of add-on to the wind turbine blade, which enables to extend the period of maintenance. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. In 20+ years operation, due to the severe nature condition, Blade may have damage(Lightning strike, erosion etc.). The damaged blade will reduce the performance of wind turbine. The registration technologies listed here are related to the add-on to the blade to extend the period of maintenance and/or improve the performance of the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/09", "technologyNameEN": "Wind Turbine Blade add-on(LEP,LPS)",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through improved wind turbine performance.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148906", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Design of wind turbine blade durability and endurance under severe nature condition for 20years+ of operation. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The wind turbine blades are supposed to have sufficient durability and endurance under severe nature condition for 20years+ of operation period. The registration technologies listed here are related to the design of blade for wind turbine. We are willing to license these patents, offering advise, and consulting on the design.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/08", "technologyNameEN": "Wind Turbine Blade structure",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "Wind turbines contribute to reducing greenhouse gas emissions and provide renewable electricity.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148894", "benefits": "Greenhouse gases, Electricity", "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Design of airfoils of wind turbine which implement desired lift coefficient. Carbon neutrality by 2050 is considered an urgent human goal worldwide. Offshore wind turbines are one of the up-and-coming solutions. Noise regulation are eased in offshore wind turbines than on-shore. Therefore, engineer is allowed to design higher blade tip speed blade. The high tip speed Blade will become slender to reduce the moment load. In every respect, a new blade profile design is required. The registration technologies listed here are related to the design of airfoils for wind turbine which implement desired lift coefficient. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. We are willing to license these patents, offering advise, and consulting on the design.",
    "updatedDate": "2023/12/11", "publishedDate": "2023/11/08", "technologyNameEN": "Wind Turbine Blade performance",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through wind energy.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148871", "benefits": "Greenhouse gases, Electricity", "companyName": "Green Technology Bank",
    "description": "This technology is designed to provide a small- to medium-sized wind energy power system that can be connected to the distribution grid for operation, or for local consumption of generated electricity. It addresses issues of unstable grid, insufficient grid capacity and areas without grid coverage by providing a clean energy solution. The application scenarios include green smart parks, harbour terminals, crude oil gathering stations, and rural areas, among others. Technological Innovation: (1)Intelligent operation and maintenance: Based on a distributed mindset, a SCADA platform is developed to enable monitoring, measurement, and control, integrating operational and maintenance elements. (2)Integrated control cabinet: Reducing equipment wiring by 30%, resulting in lower construction costs and improved anti-corrosion and heat dissipation effects. (3)Motor: By leveraging electromagnetic analysis and optimised design, noise levels are effectively reduced while enhancing power generation capacities. (4)Blade: Blades are aerodynamically designed to suit small- and medium-sized wind energy power station, ensuring safety and efficiency (5)Tower structure: Optimally designed based on application environment and force considerations, it demonstrates resilience in harsh environments such as typhoon, salt spray and extreme cold. Utilising modular technology, it is suitable for container transportation, reducing shipping costs.",
    "updatedDate": "2024/03/04", "publishedDate": "2023/10/31", "technologyNameEN": "Distributed Wind Power Systems",
    "companyWebsiteUrl": "", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "148847", "benefits": "Greenhouse gases, Electricity", "companyName": "ART OF SCIENCE & TECHNIQUE",
    "description": "The Principle of Rotation of cross-axial Rotors which are an improvement of more powerful means to convert kinetic energy than existing means and their applicability from unidirectional to omnidirectional turbine machines requiring no yaw drive with stationary and fixed devices. The omnidirectional wind turbine remains stationary fixed at the same position and captures wind from all directions which is converted to mechanical energy and into a pulsing electric current. This wind turbine is more constant having a larger blade surface like a wall in the wind. Producing the same amount of current as existing wind turbines, this while smaller in size. Because of the larger blade surface. The wind turbine does not kill birds that sit on the turbine housing. The wind turbine is more economical, more safer. The wind turbine has many more features and advantages. Please see my patent application for more technical details. WO2023/147893",
    "updatedDate": "2023/10/16", "publishedDate": "2023/10/16", "technologyNameEN": "WINDMILL",
    "companyWebsiteUrl": "http://www.roytas.nl/", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The wind turbine captures wind from all directions, converting it into mechanical energy and then into a pulsing electric current, providing a sustainable source of electricity while reducing greenhouse gas emissions.", "intellectualProperty": "WO2023/147893", "technologyReadinessLevel": ""
  },
  {
    "id": "147990", "benefits": "Greenhouse gases, Electricity", "companyName": "Hitachi, Ltd.",
    "description": "A wind turbine generator, in order to maintain an appropriate rotation speed of the rotor, electric energy to be taken out from the generator is regularly controlled according to the wind strength. In this control process, the torque of the rotor may fluctuate and become a vibration source. As the rotor is located on the tower which is elongate and low in rigidity, when the vibration caused by a fluctuation in torque synchronizes with the resonance frequency of the tower, the vibration may develop into a vibration of the entire windmill. Besides the fluctuation in torque due to rotation control of the rotor, vibration of a windmill is caused by various types of vibrations such as vibration due to a Karman vortex generated by the tower, resonance of the speed-increasing gear, the rotor, the generator and the drive axis, and vibration due to bending or torsion of the construction. The present technology provides a wind turbine generator that can control fluctuations in the torque loaded on the rotor to suppress or prevent wind turbine vibration.",
    "updatedDate": "2023/03/30", "publishedDate": "2023/03/30", "technologyNameEN": "Vibration control of a wind turbine generator",
    "companyWebsiteUrl": "https://www.hitachi.com/products/energy/portal/index.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by improving the efficiency and stability of wind turbine operations, thus contributing to cleaner electricity generation.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },
  {
    "id": "147989", "benefits": "Greenhouse gases, Electricity", "companyName": "Hitachi, Ltd.",
    "description": "A wind power generation apparatus has an extremely significant risk of undergoing lightning strikes because of the height thereof, and countermeasures against lightning strikes are considered to be important issues. In particular, if a wind turbine is increased in size, since the percentage of lightning damage to a blade is increased, countermeasures against the lightning strikes of the blade are important. Therefore, the countermeasures against the lightning strikes for preventing the lightning strike are performed to the blade by providing a lightning receiving section (tip receptor) in a tip of the blade in addition to the receptor.",
    "updatedDate": "2023/03/30", "publishedDate": "2023/03/30", "technologyNameEN": "Lightning structure of wind turbine blades",
    "companyWebsiteUrl": "https://www.hitachi.com/products/energy/portal/index.html", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by improving the resilience of wind turbine blades against lightning strikes, thereby ensuring continuous electricity generation without significant downtime or repair costs.", "intellectualProperty": "", "technologyReadinessLevel": ""
  },

  // 批次 28-35 (多样化公司)
  {
    "id": "147925", "benefits": "Greenhouse gases, Electricity", "companyName": "LIXIL Corporation",
    "description": "This small wind power generation technology includes robust vertical axis wind turbine that is more durable than propeller type and innovative control method such as AI learning device (for example, technologies for reducing resonance (sympathetic vibration), smooth braking, driving safely in strong winds, controlling power generation based on forecasts of unstable wind conditions, etc.) It also covers the beneficial idea and implementation method of a power supply system that combines the wind power generation technology with solar power generation for toilets in a disaster.",
    "updatedDate": "2025/06/02", "publishedDate": "2023/03/15", "technologyNameEN": "Small wind power generation equipment with vertical axis wind turbine",
    "companyWebsiteUrl": "https://wipogreen.wipo.int/wipogreen-database/search?type=BASIC&queryFilters.0.field=COMPANY&queryFilters.0.value=LIXIL%20Corporation", "deployedInCountry": "", "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity sustainably.", "intellectualProperty": "We have 4 patents related to structure, 12 patents related to control, and 1 patent related to power supply, that enable smooth and highly efficient power generation.", "technologyReadinessLevel": ""
  },
  {
    "id": "147595", "benefits": "Greenhouse gases, Electricity", "companyName": "Challenergy",
    "description": "Typhoon-proof wind turbines that are uniquely shaped in order to withstand powerful winds and changes in wind direction. A Japanese startup, Challenergy, has developed typhoon-proof wind turbines. These are uniquely shaped in order to withstand powerful winds and abrupt changes in wind direction. Built as a vertical axis wind turbine, turbines have three vertical cylinders instead of a propeller. The turbines are intended for use in remote areas, such as remote Philippine islands, that often lack sufficient power infrastructure while also being exposed to extreme weather events.",
    "updatedDate": "2022/11/22", "publishedDate": "2022/10/17", "technologyNameEN": "Typhoon-proof wind turbines",
    "companyWebsiteUrl": "https://challenergy.com/en/", "deployedInCountry": "Philippines", "developedInCountry": "Japan",
    "benefitsDescription": "", "intellectualProperty": "", "technologyReadinessLevel": ""
  }
];

// 更新batch-processor.js文件
function updateBatchProcessor() {
  const batchProcessorPath = path.join(__dirname, 'batch-processor.js');
  
  // 读取现有内容
  let content = fs.readFileSync(batchProcessorPath, 'utf8');
  
  // 找到collectedTechData数组的结束位置
  const insertPosition = content.lastIndexOf('];');
  
  // 为每个新技术准备插入内容
  let insertContent = '';
  newTechData.forEach(tech => {
    insertContent += `,
  
  {
    "id": "${tech.id}",
    "benefits": "${tech.benefits}",
    "companyName": "${tech.companyName}",
    "description": "${tech.description.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
    "updatedDate": "${tech.updatedDate}",
    "publishedDate": "${tech.publishedDate}",
    "technologyNameEN": "${tech.technologyNameEN}",
    "companyWebsiteUrl": "${tech.companyWebsiteUrl}",
    "deployedInCountry": "${tech.deployedInCountry}",
    "developedInCountry": "${tech.developedInCountry}",
    "benefitsDescription": "${tech.benefitsDescription.replace(/"/g, '\\"')}",
    "intellectualProperty": "${tech.intellectualProperty.replace(/"/g, '\\"')}",
    "technologyReadinessLevel": "${tech.technologyReadinessLevel}"
  }`;
  });
  
  // 插入新内容
  const newContent = content.slice(0, insertPosition) + insertContent + content.slice(insertPosition);
  
  // 写回文件
  fs.writeFileSync(batchProcessorPath, newContent, 'utf8');
  
  console.log(`已更新 ${newTechData.length} 项新技术数据到 batch-processor.js`);
  console.log(`当前总数: ${35} 项技术`);
}

if (require.main === module) {
  updateBatchProcessor();
}
