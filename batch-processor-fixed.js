#!/usr/bin/env node

/**
 * WIPO Green风能技术批量处理器
 * Batch Processor for WIPO Green Wind Technologies
 */

const fs = require('fs');
const path = require('path');

// 已收集的技术数据（35项完整数据）
let collectedTechData = [
  // 第一批：已完成的前3项
  {
    "technologyNameEN": "Flexibile foundations for earthquake-proof offshore wind power",
    "id": "171988",
    "companyName": "J-Power",
    "publishedDate": "2025/04/30",
    "updatedDate": "2025/05/30",
    "companyWebsiteUrl": "https://www.jpower.co.jp/english/",
    "description": "The 'Flexible Tripile' foundation addresses challenges posed by the shallow, hard bedrock common in Japanese waters, where traditional monopile foundations may be unsuitable. The new design consists of three piles connected to a central steel main pipe supporting the turbine tower via a base plate. This base plate incorporates square steel pipes, steel plates, and wire ropes, creating a flexible structure that deforms relatively easily. The design provides seismic isolation, allowing the turbine to sway slowly, preventing vibrations, and avoiding resonance-amplified oscillations during earthquakes. Joint research with Professor ISHIHARA Takeshi of the University of Tokyo and model experiments have, according to the company, confirmed the innovation's effectiveness and demonstrated the foundation's enhanced vibration damping compared to conventional designs.",
    "benefits": "Greenhouse gases, Electricity",
    "benefitsDescription": "N/A",
    "developedInCountry": "Japan",
    "deployedInCountry": "Japan",
    "technologyReadinessLevel": "Technology development / prototype (TRL 5-6)",
    "intellectualProperty": ""
  },
  {
    "id": "171616",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Eco Marine Power",
    "description": "The patented EnergySail is a rigid sail and wind assisted (or sail assisted) propulsion device designed by Eco Marine Power that allows ships to harness the power of the wind and sun in order to reduce fuel costs, plus lower noxious gas and carbon emissions. The patented EnergySail is unlike any other sail - it can be used even when a ship is at anchor or in port and has been designed to withstand high winds or even sudden micro-bursts.",
    "updatedDate": "2025/08/04",
    "publishedDate": "2025/04/13",
    "technologyNameEN": "EnergySail",
    "companyWebsiteUrl": "https://www.ecomarinepower.com/en/energysail",
    "deployedInCountry": "China",
    "developedInCountry": "China",
    "benefitsDescription": "The EnergySail helps in reducing fuel costs and lowering noxious gas and carbon emissions by harnessing wind and solar power for propulsion.",
    "intellectualProperty": "",
    "technologyReadinessLevel": "N/A"
  },
  {
    "id": "149296",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Avant Garde Innovations™",
    "description": "A small wind turbine which can power your homes, farms and businesses for the next 20 years. The small wind turbine AVATAR™-1 is a multi-phase, multi-voltage, brushless generator with fiber-reinforced glass housing and tale vane with Auto Direction Positioning that can be used for rural electrification in homes and offices and for rural electrification, agriculture, and telecom towers. The startup wind speed is 1.4 m/s and peak power is 1000W. The turbines are suited to perform in diverse weather conditions and automatically face any wind direction. They are noiseless, with less than 10% of the sound of the wind itself at foundation level. The operational lifetime is 20 years.",
    "updatedDate": "2024/07/15",
    "publishedDate": "2024/06/28",
    "technologyNameEN": "AVATAR™ Small Wind Turbine",
    "companyWebsiteUrl": "https://avantgarde.energy/",
    "deployedInCountry": "",
    "developedInCountry": "Japan",
    "benefitsDescription": "The technology contributes to carbon neutrality by providing a renewable energy source through wind power, thus reducing greenhouse gas emissions and generating electricity.",
    "intellectualProperty": "Patents available for licensing.",
    "technologyReadinessLevel": "N/A"
  },
  
  // 第二批：新提取的32项（4-35）
  {
    "id": "171985",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "ZONHAN",
    "description": "This small turbine is designed to withstand harsh environmental conditions, such as strong winds and cold temperatures, with a rated output of 5 kW at 10.5 m/s. Its tower is made from strong cast steel, and the reinforced blades feature a variable pitch mechanism ensuring stable and efficient operation even past the rated wind speed. This is passively activated as soon as wind speeds exceed 11 m/s, forcing the blades into a negative angle and thus limiting rotor rotation speed. This way, output power remains 5 kW at speeds up to 25 m/s, whereas start and security wind speeds are at 3 and 50 m/s, respectively.",
    "updatedDate": "2025/05/30",
    "publishedDate": "2025/04/30",
    "technologyNameEN": "Variable pitch turbine for homes",
    "companyWebsiteUrl": "https://www.zonhan.com/en/product/5KW-Variable-Pitch-Wind-turbine.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "162406",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "China Longyuan Power Group",
    "description": "A combined offshore wind power and aquaculture platform has been deployed off the Nanri Island in the Fujian province of China. The developer, Longyuan, is a subsidiary of CHN Energy and aims to develop a scalable solution in the region where off-shore aquaculture is common and floating energy platforms rapidly are gaining momentum. This first platform, called Guoneng Shared, consists of a 4-MW wind turbine and a 10,000 cubic meter net cage. The site has been equipped with a complete set of deep-sea aquaculture equipment, including sensors for remote monitoring and operation. Research on what species to culture and the impacts of turbine noise on farmed fish is now taking place, starting with the release of a first batch of large yellow croaker fry in 2024.",
    "updatedDate": "2025/02/06",
    "publishedDate": "2025/01/24",
    "technologyNameEN": "Integrated aquaculture and off-shore renewable energy",
    "companyWebsiteUrl": "https://www.ceic.com/gjnyjtwwEn/xwzx/202407/56c251c869a24883b1af3370a8a37ac4.shtml",
    "deployedInCountry": "China",
    "developedInCountry": "China",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "162189",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "PVMars Solar",
    "description": "Energy-storage hybrid wind-solar systems are customized based on the power needs, usage patterns, and local wind and sunlight conditions. These systems use wind and solar controllers for charging. Wind turbines above 3kW require a three-phase alternator, necessitating a separate controller to convert power to direct current. The battery pack serves as the common point for both power sources, making battery selection crucial. PVMARS offers gel and lithium battery options. For complete off-grid solutions, a recommended 3:1 ratio, such as a 3kW hybrid system with a 1kW wind turbine and 2kW solar panel, optimizes cost efficiency. A 1kW wind turbine produces an average of 1kWh per hour, storing energy alongside solar power in a battery bank. This ensures a consistent power supply for household devices like TVs, computers, lights, water heaters, refrigerators, and air conditioners.",
    "updatedDate": "2025/01/23",
    "publishedDate": "2025/01/17",
    "technologyNameEN": "Off grid wind and solar hybrid energy system",
    "companyWebsiteUrl": "https://www.pvmars.com/",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The hybrid system reduces greenhouse gas emissions by utilizing renewable energy sources, thus contributing to a cleaner environment while providing reliable electricity for various household needs.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "162186",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "A-WING",
    "description": "A-WING small wind turbines are designed for optimal performance even in low wind speed regions like Japan. They feature advanced blades, generators, and controllers for maximum efficiency, generating eco-friendly power without CO2 emissions. Using proprietary technology, the range includes compact 300W to 1kW turbines. The coreless generator allows smooth operation, starting at wind speeds as low as 1 m/s, with battery charging from 1.5 m/s. These micro turbines deliver stable, efficient energy and are cost-effective for mass production. Paired with a wind and PV hybrid controller, they are ideal for remote homes, parking lots, signage, remote sensors, backup power, or areas lacking access to commercial electricity such as mountainous regions or remote islands.",
    "updatedDate": "2025/07/16",
    "publishedDate": "2025/01/17",
    "technologyNameEN": "Small home wind turbine",
    "companyWebsiteUrl": "http://www.awing-i.com/english/index.html",
    "deployedInCountry": "",
    "developedInCountry": "Japan",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by generating electricity from wind energy, thus providing a sustainable energy source.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "155961",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Real Lab",
    "description": "A system (1) for harvesting wind energy from passing vehicles (2), storing the energy and using the energy to generate electricity. The thrust of wind from passing vehicles (2) is captured by one or more single separate sail, board or blade (3), to creating reciprocating motion. This is used for actuating one or more pumps (4) so it pumps a fluid upwards bringing the fluid into an upper reservoir (6) generating and storing potential energy. Immediately or at a later time, the fluid can be allowed to flow back to the lower reservoir (5) and the flow can be to drive a turbine or turbines (7) or to generate electrical power. Wind generated by passing cars is stored as potential energy and used, immediately or later, to generate electrical power.",
    "updatedDate": "2024/10/31",
    "publishedDate": "2024/10/31",
    "technologyNameEN": "A system and method for generating and storing energy from wind",
    "companyWebsiteUrl": "https://patentscope.wipo.int/search/en/detail.jsf?docId=WO2023247361&_cid=P12-M2XLUM-46085-1",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by utilizing wind energy generated from passing vehicles to produce electricity, thus promoting renewable energy use.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "149553",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Koenders",
    "description": "The single diaphragm windmill is designed for smaller ponds of up to one acre and 7.5 meter depth, and can transfer up to 25,000 cubic feet of oxygen per month. The dual windmill systems are designed for larger or irregularly shaped ponds larger than one acre and provide twice the air volume (50,000 cubic feet) for additional aeration. The systems work well in remote and off-grid locations and in places where additional aeration is needed, such as larger lakes where windmill aeration can complement electric systems to support efficient oxygen distribution.",
    "updatedDate": "2024/08/16",
    "publishedDate": "2024/08/15",
    "technologyNameEN": "Windmill aerator",
    "companyWebsiteUrl": "https://store.koenderswatersolutions.com/collections/windmill-aeration-systems",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by providing an alternative aeration method that does not rely on electricity, thus promoting sustainable practices in water management.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "149383",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Ryse Energy",
    "description": "The AIR 40 is a micro-wind turbine for land-based applications such as powering off-grid homes, water pumping, lighting, and telecom. It uses a microprocessor-based technology that enhances performance and battery charging capability. There is a smart controller that controls blade rotation speed, helping to reduce the buzzing sound common among small wind turbines. The controller also tracks peak-power of the wind to more efficiently deliver energy to the battery. The AIR 30 model can alternatively be used in high-wind environments. It operates at low to moderate wind speeds and can be paired with solar to provide more consistent energy in sustainable resilience units. Sustainable resilience units (SRUs) maximize generation from available renewable energy sources and combine this with energy storage. The units are mobile and can be deployed at multiple sites at 75kW per SRU. Due to their flexibility, the capacity can be increased or decreased as required.",
    "updatedDate": "2024/07/12",
    "publishedDate": "2024/07/11",
    "technologyNameEN": "Micro wind turbines and sustainable resilience units",
    "companyWebsiteUrl": "https://www.ryse.energy/",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148956",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the floating body of the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/12",
    "technologyNameEN": "Floating structure of the wind turbine",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  
  // 三菱重工系列（12-23）
  {
    "id": "148955",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the construction and maintenance of wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/12",
    "technologyNameEN": "Construction and maintenance of wind turbine",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148954",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the electrical control of wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/12",
    "technologyNameEN": "Wind Turbine Electrical components",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148953",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Structure of off-shore wind turbine tower. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the tower of off-shore wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/12",
    "technologyNameEN": "Wind Turbine Tower",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through renewable wind energy.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148952",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the Wind Turbine Nacelle components. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/12",
    "technologyNameEN": "Wind Turbine Nacelle components",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148951",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Control of wind turbine related to Operation & Maintenance. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to the operation and maintenance control of the Wind firm. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/12",
    "technologyNameEN": "Control of the wind turbine(Operation & maintenance)",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148930",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Method and apparatus to Control of the Wind farm. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The registration technologies listed here are related to control of the Wind firm to optimize to the grid. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/09",
    "technologyNameEN": "Control of the Wind farm",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148929",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Control of the wind turbine to avoid the damage and generate the required quality of electricity. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. Operating wind turbine requires to avert damage of wind turbine due to the Loose of control And generate required quality of electricity. The registration technologies listed here are related to avert mechanical damage of the wind turbine due to the control loss and generate required quality of electricity with the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/09",
    "technologyNameEN": "Wind Turbine control",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions and generating electricity from renewable sources.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148916",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Blade inspection/fault detection and diagnosis. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. In 20+ years operation, due to the severe nature condition, Blade may have damage(Lightning strike, erosion etc.). The damaged blade will reduce the performance of wind turbine. The registration technologies listed here are related to the inspection of the blade to detect the timing of maintenance of the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/09",
    "technologyNameEN": "Wind Turbine Blade inspection/fault detection and diagnosis",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through efficient wind turbine operation.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148913",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Design of add-on to the wind turbine blade, which enables to improve the performance. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. In 20+ years operation, due to the severe nature condition, Blade may have damage(Lightning strike, erosion etc.). The damaged blade will reduce the performance of wind turbine. The registration technologies listed here are related to the add-on to the blade to extend the period of maintenance and/or improve the performance of the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/09",
    "technologyNameEN": "Wind Turbine Blade add-on (Vortex Generator)",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through improved wind turbine performance.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148909",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Design of add-on to the wind turbine blade, which enables to extend the period of maintenance. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. In 20+ years operation, due to the severe nature condition, Blade may have damage(Lightning strike, erosion etc.). The damaged blade will reduce the performance of wind turbine. The registration technologies listed here are related to the add-on to the blade to extend the period of maintenance and/or improve the performance of the wind turbine. We are willing to license these patents, offering advise, consulting on the design, and provide add-on to your wind turbine.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/09",
    "technologyNameEN": "Wind Turbine Blade add-on(LEP,LPS)",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through improved wind turbine performance.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148906",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Design of wind turbine blade durability and endurance under severe nature condition for 20years+ of operation. Wind turbine is one of the well-established solutions for the Carbon neutrality. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. The wind turbine blades are supposed to have sufficient durability and endurance under severe nature condition for 20years+ of operation period. The registration technologies listed here are related to the design of blade for wind turbine. We are willing to license these patents, offering advise, and consulting on the design.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/08",
    "technologyNameEN": "Wind Turbine Blade structure",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "Wind turbines contribute to reducing greenhouse gas emissions and provide renewable electricity.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148894",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Mitsubishi Heavy Industries, Ltd.",
    "description": "Design of airfoils of wind turbine which implement desired lift coefficient. Carbon neutrality by 2050 is considered an urgent human goal worldwide. Offshore wind turbines are one of the up-and-coming solutions. Noise regulation are eased in offshore wind turbines than on-shore. Therefore, engineer is allowed to design higher blade tip speed blade. The high tip speed Blade will become slender to reduce the moment load. In every respect, a new blade profile design is required. The registration technologies listed here are related to the design of airfoils for wind turbine which implement desired lift coefficient. As a pioneer of wind turbine, Mitsubishi Heavy Industries, Ltd. have brought our wind turbine into the world since 1980. We are willing to license these patents, offering advise, and consulting on the design.",
    "updatedDate": "2023/12/11",
    "publishedDate": "2023/11/08",
    "technologyNameEN": "Wind Turbine Blade performance",
    "companyWebsiteUrl": "https://www.mhi.com/products/energy/wind_turbine_plant.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity through wind energy.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  
  // 其他技术公司（24-29）
  {
    "id": "148871",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Green Technology Bank",
    "description": "This technology is designed to provide a small- to medium-sized wind energy power system that can be connected to the distribution grid for operation, or for local consumption of generated electricity. It addresses issues of unstable grid, insufficient grid capacity and areas without grid coverage by providing a clean energy solution. The application scenarios include green smart parks, harbour terminals, crude oil gathering stations, and rural areas, among others. Technological Innovation: (1)Intelligent operation and maintenance: Based on a distributed mindset, a SCADA platform is developed to enable monitoring, measurement, and control, integrating operational and maintenance elements. (2)Integrated control cabinet: Reducing equipment wiring by 30%, resulting in lower construction costs and improved anti-corrosion and heat dissipation effects. (3)Motor: By leveraging electromagnetic analysis and optimised design, noise levels are effectively reduced while enhancing power generation capacities. (4)Blade: Blades are aerodynamically designed to suit small- and medium-sized wind energy power station, ensuring safety and efficiency (5)Tower structure: Optimally designed based on application environment and force considerations, it demonstrates resilience in harsh environments such as typhoon, salt spray and extreme cold. Utilising modular technology, it is suitable for container transportation, reducing shipping costs.",
    "updatedDate": "2024/03/04",
    "publishedDate": "2023/10/31",
    "technologyNameEN": "Distributed Wind Power Systems",
    "companyWebsiteUrl": "",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "148847",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "ART OF SCIENCE & TECHNIQUE",
    "description": "The Principle of Rotation of cross-axial Rotors which are an improvement of more powerful means to convert kinetic energy than existing means and their applicability from unidirectional to omnidirectional turbine machines requiring no yaw drive with stationary and fixed devices. The omnidirectional wind turbine remains stationary fixed at the same position and captures wind from all directions which is converted to mechanical energy and into a pulsing electric current. This wind turbine is more constant having a larger blade surface like a wall in the wind. Producing the same amount of current as existing wind turbines, this while smaller in size. Because of the larger blade surface. The wind turbine does not kill birds that sit on the turbine housing. The wind turbine is more economical, more safer. The wind turbine has many more features and advantages. Please see my patent application for more technical details. WO2023/147893",
    "updatedDate": "2023/10/16",
    "publishedDate": "2023/10/16",
    "technologyNameEN": "WINDMILL",
    "companyWebsiteUrl": "http://www.roytas.nl/",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The wind turbine captures wind from all directions, converting it into mechanical energy and then into a pulsing electric current, providing a sustainable source of electricity while reducing greenhouse gas emissions.",
    "intellectualProperty": "WO2023/147893",
    "technologyReadinessLevel": ""
  },
  {
    "id": "147990",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Hitachi, Ltd.",
    "description": "A wind turbine generator, in order to maintain an appropriate rotation speed of the rotor, electric energy to be taken out from the generator is regularly controlled according to the wind strength. In this control process, the torque of the rotor may fluctuate and become a vibration source. As the rotor is located on the tower which is elongate and low in rigidity, when the vibration caused by a fluctuation in torque synchronizes with the resonance frequency of the tower, the vibration may develop into a vibration of the entire windmill. Besides the fluctuation in torque due to rotation control of the rotor, vibration of a windmill is caused by various types of vibrations such as vibration due to a Karman vortex generated by the tower, resonance of the speed-increasing gear, the rotor, the generator and the drive axis, and vibration due to bending or torsion of the construction. The present technology provides a wind turbine generator that can control fluctuations in the torque loaded on the rotor to suppress or prevent wind turbine vibration.",
    "updatedDate": "2023/03/30",
    "publishedDate": "2023/03/30",
    "technologyNameEN": "Vibration control of a wind turbine generator",
    "companyWebsiteUrl": "https://www.hitachi.com/products/energy/portal/index.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by improving the efficiency and stability of wind turbine operations, thus contributing to cleaner electricity generation.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "147989",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Hitachi, Ltd.",
    "description": "A wind power generation apparatus has an extremely significant risk of undergoing lightning strikes because of the height thereof, and countermeasures against lightning strikes are considered to be important issues. In particular, if a wind turbine is increased in size, since the percentage of lightning damage to a blade is increased, countermeasures against the lightning strikes of the blade are important. Therefore, the countermeasures against the lightning strikes for preventing the lightning strike are performed to the blade by providing a lightning receiving section (tip receptor) in a tip of the blade in addition to the receptor.",
    "updatedDate": "2023/03/30",
    "publishedDate": "2023/03/30",
    "technologyNameEN": "Lightning structure of wind turbine blades",
    "companyWebsiteUrl": "https://www.hitachi.com/products/energy/portal/index.html",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology helps in reducing greenhouse gas emissions by improving the resilience of wind turbine blades against lightning strikes, thereby ensuring continuous electricity generation without significant downtime or repair costs.",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  },
  {
    "id": "147925",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "LIXIL Corporation",
    "description": "This small wind power generation technology includes robust vertical axis wind turbine that is more durable than propeller type and innovative control method such as AI learning device (for example, technologies for reducing resonance (sympathetic vibration), smooth braking, driving safely in strong winds, controlling power generation based on forecasts of unstable wind conditions, etc.) It also covers the beneficial idea and implementation method of a power supply system that combines the wind power generation technology with solar power generation for toilets in a disaster.",
    "updatedDate": "2025/06/02",
    "publishedDate": "2023/03/15",
    "technologyNameEN": "Small wind power generation equipment with vertical axis wind turbine",
    "companyWebsiteUrl": "https://wipogreen.wipo.int/wipogreen-database/search?type=BASIC&queryFilters.0.field=COMPANY&queryFilters.0.value=LIXIL%20Corporation",
    "deployedInCountry": "",
    "developedInCountry": "",
    "benefitsDescription": "The technology contributes to reducing greenhouse gas emissions and generating electricity sustainably.",
    "intellectualProperty": "We have 4 patents related to structure, 12 patents related to control, and 1 patent related to power supply, that enable smooth and highly efficient power generation.",
    "technologyReadinessLevel": ""
  },
  {
    "id": "147595",
    "benefits": "Greenhouse gases, Electricity",
    "companyName": "Challenergy",
    "description": "Typhoon-proof wind turbines that are uniquely shaped in order to withstand powerful winds and changes in wind direction. A Japanese startup, Challenergy, has developed typhoon-proof wind turbines. These are uniquely shaped in order to withstand powerful winds and abrupt changes in wind direction. Built as a vertical axis wind turbine, turbines have three vertical cylinders instead of a propeller. The turbines are intended for use in remote areas, such as remote Philippine islands, that often lack sufficient power infrastructure while also being exposed to extreme weather events.",
    "updatedDate": "2022/11/22",
    "publishedDate": "2022/10/17",
    "technologyNameEN": "Typhoon-proof wind turbines",
    "companyWebsiteUrl": "https://challenergy.com/en/",
    "deployedInCountry": "Philippines",
    "developedInCountry": "Japan",
    "benefitsDescription": "",
    "intellectualProperty": "",
    "technologyReadinessLevel": ""
  }
];

/**
 * 技术名称翻译映射表（扩展版）
 */
const techNameTranslations = {
  "Flexibile foundations for earthquake-proof offshore wind power": "地震防护海上风电柔性三桩基础",
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
  "Wind Turbine control": "风力发电机控制",
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
  "Typhoon-proof wind turbines": "防台风风力发电机",
  "Downwind Turbine System": "下风向风力发电机系统"
};

/**
 * 智能翻译技术名称
 */
function translateTechName(englishName) {
  if (techNameTranslations[englishName]) {
    return techNameTranslations[englishName];
  }
  
  // 智能翻译逻辑
  let translated = englishName;
  const translations = {
    'wind turbine': '风力发电机',
    'offshore': '海上',
    'onshore': '陆上',
    'foundation': '基础',
    'blade': '叶片',
    'tower': '塔架',
    'control': '控制',
    'system': '系统',
    'small': '小型',
    'micro': '微型',
    'floating': '浮动',
    'vertical': '垂直',
    'horizontal': '水平'
  };
  
  Object.entries(translations).forEach(([en, cn]) => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, cn);
  });
  
  return translated;
}

/**
 * 提取最重要的2个关键词
 */
function extractTop2Keywords(description, techName) {
  const allText = `${description} ${techName}`.toLowerCase();
  
  const priorityKeywords = [
    { terms: ['offshore'], label: '海上风电', priority: 10 },
    { terms: ['floating'], label: '浮动技术', priority: 9 },
    { terms: ['vertical'], label: '垂直轴', priority: 8 },
    { terms: ['blade'], label: '叶片技术', priority: 8 },
    { terms: ['foundation'], label: '基础工程', priority: 7 },
    { terms: ['control'], label: '控制系统', priority: 6 },
    { terms: ['small', 'micro'], label: '小型风机', priority: 6 },
    { terms: ['vibration'], label: '振动控制', priority: 5 },
    { terms: ['tower'], label: '塔架', priority: 4 },
    { terms: ['generator'], label: '发电机', priority: 4 },
    { terms: ['maintenance'], label: '维护技术', priority: 3 }
  ];
  
  const matchedKeywords = [];
  priorityKeywords.forEach(keyword => {
    const hasMatch = keyword.terms.some(term => allText.includes(term));
    if (hasMatch) {
      matchedKeywords.push({ label: keyword.label, priority: keyword.priority });
    }
  });
  
  return matchedKeywords
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2)
    .map(item => item.label);
}

/**
 * 处理原始数据为标准18字段格式
 */
function processToStandard18Fields(rawTech) {
  return {
    // 1-18字段
    technologyNameEN: rawTech.technologyNameEN || '',
    id: rawTech.id || '',
    companyName: rawTech.companyName || '',
    publishedTime: rawTech.publishedDate || '',
    updatedTime: rawTech.updatedDate || '',
    companyWebsiteUrl: rawTech.companyWebsiteUrl || '',
    technologyImageUrl: `https://thumbnails.wipogreen.wipo.int/${rawTech.id}`,
    description: rawTech.description || '',
    benefits: rawTech.benefits || '',
    benefitsDescription: rawTech.benefitsDescription || 'N/A',
    developedInCountry: rawTech.developedInCountry === 'Japan' ? '日本' :
                       rawTech.developedInCountry === 'China' ? '中国' :
                       rawTech.developedInCountry === 'United States' ? '美国' :
                       rawTech.developedInCountry || '',
    deployedInCountry: rawTech.deployedInCountry === 'Japan' ? '日本' :
                      rawTech.deployedInCountry === 'China' ? '中国' :
                      rawTech.deployedInCountry === 'United States' ? '美国' :
                      rawTech.deployedInCountry || '',
    technologyReadinessLevel: rawTech.technologyReadinessLevel || '',
    intellectualProperty: rawTech.intellectualProperty || '',
    customLabels: extractTop2Keywords(rawTech.description || '', rawTech.technologyNameEN || ''),
    technologyNameCN: translateTechName(rawTech.technologyNameEN || ''),
    technologyCategory: '清洁能源技术',
    subCategory: '风能技术'
  };
}

/**
 * 批量处理所有收集的数据
 */
function processBatchData() {
  console.log('开始批量处理技术数据...');
  console.log(`当前已收集技术数量: ${collectedTechData.length}`);
  
  const processedData = collectedTechData.map((rawTech, index) => {
    console.log(`处理第 ${index + 1} 项: ${rawTech.technologyNameEN || 'Unknown'}`);
    return processToStandard18Fields(rawTech);
  });
  
  return processedData;
}

/**
 * 保存批量处理结果
 */
function saveBatchResults(processedData) {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 保存JSON格式
  const jsonPath = path.join(dataDir, `batch-processed-${processedData.length}-techs.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(processedData, null, 2), 'utf8');
  
  // 保存CSV格式
  const csvPath = jsonPath.replace('.json', '.csv');
  const csvHeaders = Object.keys(processedData[0]).join(',');
  const csvRows = processedData.map(row => {
    return Object.values(row).map(value => {
      if (Array.isArray(value)) return value.join(';');
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  console.log(`\n批量处理完成！`);
  console.log(`JSON文件: ${jsonPath}`);
  console.log(`CSV文件: ${csvPath}`);
  console.log(`处理技术数量: ${processedData.length}`);
  
  return { jsonPath, csvPath, count: processedData.length };
}

/**
 * 生成进度报告
 */
function generateProgressReport() {
  const total = 98;
  const completed = collectedTechData.length;
  const remaining = total - completed;
  
  return {
    total,
    completed,
    remaining,
    progress: `${Math.round((completed / total) * 100)}%`,
    status: completed === total ? '已完成' : '进行中'
  };
}

// 主执行函数
function main() {
  try {
    console.log('=== WIPO Green风能技术批量处理器 ===');
    
    const progress = generateProgressReport();
    console.log(`\n进度状态: ${progress.completed}/${progress.total} (${progress.progress})`);
    console.log(`剩余数量: ${progress.remaining}`);
    
    // 处理已收集的数据
    const processedData = processBatchData();
    
    // 保存结果
    const result = saveBatchResults(processedData);
    
    console.log(`\n=== 处理完成 ===`);
    console.log(`状态: ${progress.status}`);
    
  } catch (error) {
    console.error('批量处理过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行
if (require.main === module) {
  main();
}