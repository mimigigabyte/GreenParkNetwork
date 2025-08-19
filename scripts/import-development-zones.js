// 导入国家级经开区数据到Supabase数据库

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
// 使用service role key来绕过RLS
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// CSV数据中的省份到标准省份代码的映射
const provinceMapping = {
  '北京': { code: 'beijing', name_zh: '北京市', name_en: 'Beijing' },
  '上海': { code: 'shanghai', name_zh: '上海市', name_en: 'Shanghai' },
  '天津': { code: 'tianjin', name_zh: '天津市', name_en: 'Tianjin' },
  '重庆': { code: 'chongqing', name_zh: '重庆市', name_en: 'Chongqing' },
  '广东': { code: 'guangdong', name_zh: '广东省', name_en: 'Guangdong Province' },
  '江苏': { code: 'jiangsu', name_zh: '江苏省', name_en: 'Jiangsu Province' },
  '浙江': { code: 'zhejiang', name_zh: '浙江省', name_en: 'Zhejiang Province' },
  '山东': { code: 'shandong', name_zh: '山东省', name_en: 'Shandong Province' },
  '河北': { code: 'hebei', name_zh: '河北省', name_en: 'Hebei Province' },
  '河南': { code: 'henan', name_zh: '河南省', name_en: 'Henan Province' },
  '湖北': { code: 'hubei', name_zh: '湖北省', name_en: 'Hubei Province' },
  '湖南': { code: 'hunan', name_zh: '湖南省', name_en: 'Hunan Province' },
  '四川': { code: 'sichuan', name_zh: '四川省', name_en: 'Sichuan Province' },
  '福建': { code: 'fujian', name_zh: '福建省', name_en: 'Fujian Province' },
  '安徽': { code: 'anhui', name_zh: '安徽省', name_en: 'Anhui Province' },
  '江西': { code: 'jiangxi', name_zh: '江西省', name_en: 'Jiangxi Province' },
  '辽宁': { code: 'liaoning', name_zh: '辽宁省', name_en: 'Liaoning Province' },
  '黑龙江': { code: 'heilongjiang', name_zh: '黑龙江省', name_en: 'Heilongjiang Province' },
  '吉林': { code: 'jilin', name_zh: '吉林省', name_en: 'Jilin Province' },
  '陕西': { code: 'shaanxi', name_zh: '陕西省', name_en: 'Shaanxi Province' },
  '山西': { code: 'shanxi', name_zh: '山西省', name_en: 'Shanxi Province' },
  '云南': { code: 'yunnan', name_zh: '云南省', name_en: 'Yunnan Province' },
  '贵州': { code: 'guizhou', name_zh: '贵州省', name_en: 'Guizhou Province' },
  '甘肃': { code: 'gansu', name_zh: '甘肃省', name_en: 'Gansu Province' },
  '青海': { code: 'qinghai', name_zh: '青海省', name_en: 'Qinghai Province' },
  '广西': { code: 'guangxi', name_zh: '广西壮族自治区', name_en: 'Guangxi Zhuang Autonomous Region' },
  '内蒙古': { code: 'neimenggu', name_zh: '内蒙古自治区', name_en: 'Inner Mongolia Autonomous Region' },
  '新疆': { code: 'xinjiang', name_zh: '新疆维吾尔自治区', name_en: 'Xinjiang Uygur Autonomous Region' },
  '西藏': { code: 'xizang', name_zh: '西藏自治区', name_en: 'Tibet Autonomous Region' },
  '宁夏': { code: 'ningxia', name_zh: '宁夏回族自治区', name_en: 'Ningxia Hui Autonomous Region' },
  '海南': { code: 'hainan', name_zh: '海南省', name_en: 'Hainan Province' },
  '台湾': { code: 'taiwan', name_zh: '台湾省', name_en: 'Taiwan Province' },
  '香港': { code: 'xianggang', name_zh: '香港特别行政区', name_en: 'Hong Kong Special Administrative Region' },
  '澳门': { code: 'aomen', name_zh: '澳门特别行政区', name_en: 'Macao Special Administrative Region' }
}

// CSV数据
const csvData = [
  { sequence: 1, name: '北京经济技术开发区', province: '北京' },
  { sequence: 2, name: '成都经济技术开发区', province: '四川' },
  { sequence: 3, name: '大连经济技术开发区', province: '辽宁' },
  { sequence: 4, name: '东营经济技术开发区', province: '山东' },
  { sequence: 5, name: '广州经济技术开发区', province: '广东' },
  { sequence: 6, name: '上海金桥经济技术开发区', province: '上海' },
  { sequence: 7, name: '杭州经济技术开发区', province: '浙江' },
  { sequence: 8, name: '合肥经济技术开发区', province: '安徽' },
  { sequence: 9, name: '江宁经济技术开发区', province: '江苏' },
  { sequence: 10, name: '昆明经济技术开发区', province: '云南' },
  { sequence: 11, name: '昆山经济技术开发区', province: '江苏' },
  { sequence: 12, name: '廊坊经济技术开发区', province: '河北' },
  { sequence: 13, name: '南昌经济技术开发区', province: '江西' },
  { sequence: 14, name: '南京经济技术开发区', province: '江苏' },
  { sequence: 15, name: '南通经济技术开发区', province: '江苏' },
  { sequence: 16, name: '宁波经济技术开发区', province: '浙江' },
  { sequence: 17, name: '石家庄经济技术开发区', province: '河北' },
  { sequence: 18, name: '青岛经济技术开发区', province: '山东' },
  { sequence: 19, name: '上海漕河泾新兴技术开发区', province: '上海' },
  { sequence: 20, name: '沈阳经济技术开发区', province: '辽宁' },
  { sequence: 21, name: '苏州工业园区', province: '江苏' },
  { sequence: 22, name: '天津经济技术开发区', province: '天津' },
  { sequence: 23, name: '天津西青经济技术开发区', province: '天津' },
  { sequence: 24, name: '武汉经济技术开发区', province: '湖北' },
  { sequence: 25, name: '西宁经济技术开发区', province: '青海' },
  { sequence: 26, name: '烟台经济技术开发区', province: '山东' },
  { sequence: 27, name: '吴中经济技术开发区', province: '江苏' },
  { sequence: 28, name: '长春经济技术开发区', province: '吉林' },
  { sequence: 29, name: '长沙经济技术开发区', province: '湖南' },
  { sequence: 30, name: '镇江经济技术开发区', province: '江苏' },
  { sequence: 31, name: '闵行经济技术开发区', province: '上海' },
  { sequence: 32, name: '遵义经济技术开发区', province: '贵州' },
  { sequence: 33, name: '乌鲁木齐经济技术开发区', province: '新疆' },
  { sequence: 34, name: '阿拉尔经济技术开发区', province: '新疆' },
  { sequence: 35, name: '安庆经济技术开发区', province: '安徽' },
  { sequence: 36, name: '巴彦淖尔经济技术开发区', province: '内蒙古' },
  { sequence: 37, name: '北辰经济技术开发区', province: '天津' },
  { sequence: 38, name: '宾西经济技术开发区', province: '黑龙江' },
  { sequence: 39, name: '滨州经济技术开发区', province: '山东' },
  { sequence: 40, name: '池州经济技术开发区', province: '安徽' },
  { sequence: 41, name: '滁州经济技术开发区', province: '安徽' },
  { sequence: 42, name: '大理经济技术开发区', province: '云南' },
  { sequence: 43, name: '大连长兴岛经济技术开发区', province: '辽宁' },
  { sequence: 44, name: '大庆经济技术开发区', province: '黑龙江' },
  { sequence: 45, name: '大同经济技术开发区', province: '山西' },
  { sequence: 46, name: '德阳经济技术开发区', province: '四川' },
  { sequence: 47, name: '德州经济技术开发区', province: '山东' },
  { sequence: 48, name: '东丽经济技术开发区', province: '天津' },
  { sequence: 49, name: '东侨经济技术开发区', province: '福建' },
  { sequence: 50, name: '东山经济技术开发区', province: '福建' },
  { sequence: 51, name: '鄂州葛店经济技术开发区', province: '湖北' },
  { sequence: 52, name: '福清融侨经济技术开发区', province: '福建' },
  { sequence: 53, name: '福州经济技术开发区', province: '福建' },
  { sequence: 54, name: '富阳经济技术开发区', province: '浙江' },
  { sequence: 55, name: '赣州经济技术开发区', province: '江西' },
  { sequence: 56, name: '格尔木昆仑经济技术开发区', province: '青海' },
  { sequence: 57, name: '广安经济技术开发区', province: '四川' },
  { sequence: 58, name: '广西-东盟经济技术开发区', province: '广西' },
  { sequence: 59, name: '广元经济技术开发区', province: '四川' },
  { sequence: 60, name: '广州南沙经济技术开发区', province: '广东' },
  { sequence: 61, name: '贵阳经济技术开发区', province: '贵州' },
  { sequence: 62, name: '哈尔滨经济技术开发区', province: '黑龙江' },
  { sequence: 63, name: '海安经济技术开发区', province: '江苏' },
  { sequence: 64, name: '海林经济技术开发区', province: '黑龙江' },
  { sequence: 65, name: '海门经济技术开发区', province: '江苏' },
  { sequence: 66, name: '海南洋浦经济开发区', province: '海南' },
  { sequence: 67, name: '邯郸经济技术开发区', province: '河北' },
  { sequence: 68, name: '汉中经济技术开发区', province: '陕西' },
  { sequence: 69, name: '杭州湾上虞经济技术开发区', province: '浙江' },
  { sequence: 70, name: '杭州余杭经济技术开发区', province: '浙江' },
  { sequence: 71, name: '鹤壁经济技术开发区', province: '河南' },
  { sequence: 72, name: '红旗渠经济技术开发区', province: '河南' },
  { sequence: 73, name: '虹桥经济技术开发区', province: '上海' },
  { sequence: 74, name: '哈尔滨利民经济技术开发区', province: '黑龙江' },
  { sequence: 75, name: '呼和浩特经济技术开发区', province: '内蒙古' },
  { sequence: 76, name: '呼伦贝尔经济技术开发区', province: '内蒙古' },
  { sequence: 77, name: '湖州经济技术开发区', province: '浙江' },
  { sequence: 78, name: '淮安经济技术开发区', province: '江苏' },
  { sequence: 79, name: '淮南经济技术开发区', province: '安徽' },
  { sequence: 80, name: '黄石经济技术开发区', province: '湖北' },
  { sequence: 81, name: '惠州大亚湾经济技术开发区', province: '广东' },
  { sequence: 82, name: '吉林经济技术开发区', province: '吉林' },
  { sequence: 83, name: '嘉善经济技术开发区', province: '浙江' },
  { sequence: 84, name: '嘉兴经济技术开发区', province: '浙江' },
  { sequence: 85, name: '胶州经济技术开发区', province: '山东' },
  { sequence: 86, name: '金昌经济技术开发区', province: '甘肃' },
  { sequence: 87, name: '金华经济技术开发区', province: '浙江' },
  { sequence: 88, name: '锦州经济技术开发区', province: '辽宁' },
  { sequence: 89, name: '晋城经济技术开发区', province: '山西' },
  { sequence: 90, name: '晋中经济技术开发区', province: '山西' },
  { sequence: 91, name: '荆州经济技术开发区', province: '湖北' },
  { sequence: 92, name: '井冈山经济技术开发区', province: '江西' },
  { sequence: 93, name: '靖江经济技术开发区', province: '江苏' },
  { sequence: 94, name: '九江经济技术开发区', province: '江西' },
  { sequence: 95, name: '开封经济技术开发区', province: '河南' },
  { sequence: 96, name: '库车经济技术开发区', province: '新疆' },
  { sequence: 97, name: '库尔勒经济技术开发区', province: '新疆' },
  { sequence: 98, name: '奎屯-独山子经济技术开发区', province: '新疆' },
  { sequence: 99, name: '拉萨经济技术开发区', province: '西藏' },
  { sequence: 100, name: '兰州经济技术开发区', province: '甘肃' },
  { sequence: 101, name: '丽水经济技术开发区', province: '浙江' },
  { sequence: 102, name: '连云港经济技术开发区', province: '江苏' },
  { sequence: 103, name: '聊城经济技术开发区', province: '山东' },
  { sequence: 104, name: '临沂经济技术开发区', province: '山东' },
  { sequence: 105, name: '浏阳经济技术开发区', province: '湖南' },
  { sequence: 106, name: '六安经济技术开发区', province: '安徽' },
  { sequence: 107, name: '龙南经济技术开发区', province: '江西' },
  { sequence: 108, name: '龙岩经济技术开发区', province: '福建' },
  { sequence: 109, name: '娄底经济技术开发区', province: '湖南' },
  { sequence: 110, name: '洛阳经济技术开发区', province: '河南' },
  { sequence: 111, name: '漯河经济技术开发区', province: '河南' },
  { sequence: 112, name: '旅顺经济技术开发区', province: '辽宁' },
  { sequence: 113, name: '马鞍山经济技术开发区', province: '安徽' },
  { sequence: 114, name: '蒙自经济技术开发区', province: '云南' },
  { sequence: 115, name: '绵阳经济技术开发区', province: '四川' },
  { sequence: 116, name: '明水经济技术开发区', province: '山东' },
  { sequence: 117, name: '牡丹江经济技术开发区', province: '黑龙江' },
  { sequence: 118, name: '南宁经济技术开发区', province: '广西' },
  { sequence: 119, name: '内江经济技术开发区', province: '四川' },
  { sequence: 120, name: '宁波大榭开发区', province: '浙江' },
  { sequence: 121, name: '宁波杭州湾经济技术开发区', province: '浙江' },
  { sequence: 122, name: '宁波石化经济技术开发区', province: '浙江' },
  { sequence: 123, name: '宁国经济技术开发区', province: '安徽' },
  { sequence: 124, name: '宁乡经济技术开发区', province: '湖南' },
  { sequence: 125, name: '盘锦辽滨沿海经济技术开发区', province: '辽宁' },
  { sequence: 126, name: '平湖经济技术开发区', province: '浙江' },
  { sequence: 127, name: '萍乡经济技术开发区', province: '江西' },
  { sequence: 128, name: '濮阳经济技术开发区', province: '河南' },
  { sequence: 129, name: '钦州港经济技术开发区', province: '广西' },
  { sequence: 130, name: '秦皇岛经济技术开发区', province: '河北' },
  { sequence: 131, name: '衢州经济技术开发区', province: '浙江' },
  { sequence: 132, name: '曲靖经济技术开发区', province: '云南' },
  { sequence: 133, name: '泉州经济技术开发区', province: '福建' },
  { sequence: 134, name: '泉州台商投资区', province: '福建' },
  { sequence: 135, name: '日照经济技术开发区', province: '山东' },
  { sequence: 136, name: '如皋经济技术开发区', province: '江苏' },
  { sequence: 137, name: '瑞金经济技术开发区', province: '江西' },
  { sequence: 138, name: '厦门海沧台商投资区', province: '福建' },
  { sequence: 139, name: '陕西航空经济技术开发区', province: '陕西' },
  { sequence: 140, name: '陕西航天经济技术开发区', province: '陕西' },
  { sequence: 141, name: '上海化学工业经济技术开发区', province: '上海' },
  { sequence: 142, name: '上饶经济技术开发区', province: '江西' },
  { sequence: 143, name: '绍兴柯桥经济技术开发区', province: '浙江' },
  { sequence: 144, name: '绍兴袍江经济技术开发区', province: '浙江' },
  { sequence: 145, name: '沈阳辉山经济技术开发区', province: '辽宁' },
  { sequence: 146, name: '十堰经济技术开发区', province: '湖北' },
  { sequence: 147, name: '石河子经济技术开发区', province: '新疆' },
  { sequence: 148, name: '沭阳经济技术开发区', province: '江苏' },
  { sequence: 149, name: '双鸭山经济技术开发区', province: '黑龙江' },
  { sequence: 150, name: '四平红嘴经济技术开发区', province: '吉林' },
  { sequence: 151, name: '松江经济技术开发区', province: '上海' },
  { sequence: 152, name: '松原经济技术开发区', province: '吉林' },
  { sequence: 153, name: '苏州浒墅关经济技术开发区', province: '江苏' },
  { sequence: 154, name: '遂宁经济技术开发区', province: '四川' },
  { sequence: 155, name: '太仓港经济技术开发区', province: '江苏' },
  { sequence: 156, name: '太原经济技术开发区（山西转型综改示范区太原区域）', province: '山西' },
  { sequence: 157, name: '唐山曹妃甸经济技术开发区', province: '河北' },
  { sequence: 158, name: '天津子牙经济技术开发区', province: '天津' },
  { sequence: 159, name: '天水经济技术开发区', province: '甘肃' },
  { sequence: 160, name: '铁岭经济技术开发区', province: '辽宁' },
  { sequence: 161, name: '桐城经济技术开发区', province: '安徽' },
  { sequence: 162, name: '铜陵经济技术开发区', province: '安徽' },
  { sequence: 163, name: '万州经济技术开发区', province: '重庆' },
  { sequence: 164, name: '望城经济技术开发区', province: '湖南' },
  { sequence: 165, name: '威海经济技术开发区', province: '山东' },
  { sequence: 166, name: '威海临港经济技术开发区', province: '山东' },
  { sequence: 167, name: '潍坊滨海经济技术开发区', province: '山东' },
  { sequence: 168, name: '温州经济技术开发区', province: '浙江' },
  { sequence: 169, name: '乌鲁木齐甘泉堡经济技术开发区', province: '新疆' },
  { sequence: 170, name: '南昌小蓝经济技术开发区', province: '江西' },
  { sequence: 171, name: '芜湖经济技术开发区', province: '安徽' },
  { sequence: 172, name: '吴江经济技术开发区', province: '江苏' },
  { sequence: 173, name: '五家渠经济技术开发区', province: '新疆' },
  { sequence: 174, name: '武汉临空港经济技术开发区', province: '湖北' },
  { sequence: 175, name: '武清经济技术开发区', province: '天津' },
  { sequence: 176, name: '西安经济技术开发区', province: '陕西' },
  { sequence: 177, name: '锡山经济技术开发区', province: '江苏' },
  { sequence: 178, name: '相城经济技术开发区', province: '江苏' },
  { sequence: 179, name: '湘潭经济技术开发区', province: '湖南' },
  { sequence: 180, name: '襄樊经济技术开发区', province: '湖北' },
  { sequence: 181, name: '萧山经济技术开发区', province: '浙江' },
  { sequence: 182, name: '新乡经济技术开发区', province: '河南' },
  { sequence: 183, name: '宿迁经济技术开发区', province: '江苏' },
  { sequence: 184, name: '徐州经济技术开发区', province: '江苏' },
  { sequence: 185, name: '许昌经济技术开发区', province: '河南' },
  { sequence: 186, name: '宣城经济技术开发区', province: '安徽' },
  { sequence: 187, name: '盐城经济技术开发区', province: '江苏' },
  { sequence: 188, name: '扬州经济技术开发区', province: '江苏' },
  { sequence: 189, name: '宜宾临港经济技术开发区', province: '四川' },
  { sequence: 190, name: '宜春经济技术开发区', province: '江西' },
  { sequence: 191, name: '宜兴经济技术开发区', province: '江苏' },
  { sequence: 192, name: '义乌经济技术开发区', province: '浙江' },
  { sequence: 193, name: '银川经济技术开发区', province: '宁夏' },
  { sequence: 194, name: '营口经济技术开发区', province: '辽宁' },
  { sequence: 195, name: '榆林经济技术开发区', province: '陕西' },
  { sequence: 196, name: '岳阳经济技术开发区', province: '湖南' },
  { sequence: 197, name: '增城经济技术开发区', province: '广东' },
  { sequence: 198, name: '湛江经济技术开发区', province: '广东' },
  { sequence: 199, name: '张家港经济技术开发区', province: '江苏' },
  { sequence: 200, name: '张掖经济技术开发区', province: '甘肃' },
  { sequence: 201, name: '漳州台商投资区', province: '福建' },
  { sequence: 202, name: '漳州招商局经济技术开发区', province: '福建' },
  { sequence: 203, name: '长春汽车经济技术开发区', province: '吉林' },
  { sequence: 204, name: '长寿经济技术开发区', province: '重庆' },
  { sequence: 205, name: '长兴经济技术开发区', province: '浙江' },
  { sequence: 206, name: '招远经济技术开发区', province: '山东' },
  { sequence: 207, name: '郑州经济技术开发区', province: '河南' },
  { sequence: 208, name: '中国-马来西亚钦州产业园区', province: '广西' },
  { sequence: 209, name: '重庆经济技术开发区', province: '重庆' },
  { sequence: 210, name: '珠海经济技术开发区', province: '广东' },
  { sequence: 211, name: '准东经济技术开发区', province: '新疆' },
  { sequence: 212, name: '邹平经济技术开发区', province: '山东' },
  { sequence: 213, name: '沧州临港经济技术开发区', province: '河北' },
  { sequence: 214, name: '常德经济技术开发区', province: '湖南' },
  { sequence: 215, name: '常熟经济技术开发区', province: '江苏' },
  { sequence: 216, name: '张家口经济技术开发区', province: '河北' },
  { sequence: 217, name: '无锡惠山经济技术开发区', province: '江苏' },
  { sequence: 218, name: '台州湾经济技术开发区', province: '浙江' },
  { sequence: 219, name: '合肥蜀山经济技术开发区', province: '安徽' },
  { sequence: 220, name: '滕州经济技术开发区', province: '山东' },
  { sequence: 221, name: '枣阳经济技术开发区', province: '湖北' },
  { sequence: 222, name: '汉川经济技术开发区', province: '湖北' },
  { sequence: 223, name: '永州经济技术开发区', province: '湖南' },
  { sequence: 224, name: '邵阳经济技术开发区', province: '湖南' },
  { sequence: 225, name: '揭东经济技术开发区', province: '广东' },
  { sequence: 226, name: '广西北海工业园区', province: '广西' },
  { sequence: 227, name: '成都青白江经济技术开发区', province: '四川' },
  { sequence: 228, name: '雅安经济技术开发区', province: '四川' },
  { sequence: 229, name: '广州花都经济技术开发区', province: '广东' },
  { sequence: 230, name: '贵溪经济技术开发区', province: '江西' },
  { sequence: 231, name: '涪陵经济技术开发区', province: '重庆' },
  { sequence: 232, name: '沈阳金融商贸经济技术开发区', province: '辽宁' }
]

// 生成经开区代码
function generateDevelopmentZoneCode(name, province) {
  // 移除常见后缀
  let baseName = name
    .replace(/经济技术开发区$/, '')
    .replace(/经济开发区$/, '')
    .replace(/开发区$/, '')
    .replace(/工业园区$/, '')
    .replace(/台商投资区$/, '')
    .replace(/产业园区$/, '')
  
  // 特殊处理一些地名
  const cityMapping = {
    '北京': 'beijing',
    '上海金桥': 'shanghai-jinqiao',
    '上海漕河泾': 'shanghai-caohejing',
    '上海闵行': 'shanghai-minhang',
    '上海虹桥': 'shanghai-hongqiao',
    '上海化学工业': 'shanghai-chemical',
    '上海松江': 'shanghai-songjiang',
    '天津': 'tianjin',
    '天津西青': 'tianjin-xiqing',
    '天津北辰': 'tianjin-beichen',
    '天津东丽': 'tianjin-dongli',
    '天津子牙': 'tianjin-ziya',
    '天津武清': 'tianjin-wuqing',
    '广州': 'guangzhou',
    '广州南沙': 'guangzhou-nansha',
    '广州花都': 'guangzhou-huadu',
    '深圳': 'shenzhen',
    '杭州': 'hangzhou',
    '杭州湾上虞': 'hangzhouwan-shangyu',
    '杭州余杭': 'hangzhou-yuhang',
    '苏州工业园区': 'suzhou-industrial-park',
    '苏州浒墅关': 'suzhou-husuguan'
  }
  
  // 查找映射
  for (const [key, value] of Object.entries(cityMapping)) {
    if (baseName.includes(key) || name.includes(key)) {
      return value
    }
  }
  
  // 默认处理：转换为拼音并加上省份前缀
  const provinceCode = provinceMapping[province]?.code || province.toLowerCase()
  const simpleName = baseName.substring(0, 2) // 取前两个字符
  
  // 简单的拼音映射
  const pinyinMap = {
    '成都': 'chengdu',
    '大连': 'dalian',
    '东营': 'dongying',
    '昆明': 'kunming',
    '昆山': 'kunshan',
    '廊坊': 'langfang',
    '南昌': 'nanchang',
    '南京': 'nanjing',
    '南通': 'nantong',
    '宁波': 'ningbo',
    '石家庄': 'shijiazhuang',
    '青岛': 'qingdao',
    '沈阳': 'shenyang',
    '武汉': 'wuhan',
    '西宁': 'xining',
    '烟台': 'yantai',
    '长春': 'changchun',
    '长沙': 'changsha',
    '镇江': 'zhenjiang',
    '遵义': 'zunyi'
  }
  
  for (const [chinese, pinyin] of Object.entries(pinyinMap)) {
    if (baseName.includes(chinese)) {
      return `${provinceCode}-${pinyin}`
    }
  }
  
  // 最后的默认处理
  return `${provinceCode}-${Math.random().toString(36).substr(2, 8)}`
}

async function importData() {
  try {
    console.log('🚀 开始导入国家级经开区数据...')
    
    // 0. 首先确保中国在countries表中存在
    console.log('🇨🇳 检查和创建中国国家记录...')
    const { data: chinaCountry } = await supabase
      .from('admin_countries')
      .select('id')
      .eq('code', 'china')
      .single()
    
    let chinaCountryId
    if (!chinaCountry) {
      console.log('创建中国国家记录...')
      const { data: newChina, error: chinaError } = await supabase
        .from('admin_countries')
        .insert({
          name_zh: '中国',
          name_en: 'China',
          code: 'china',
          sort_order: 1,
          is_active: true
        })
        .select('id')
        .single()
      
      if (chinaError) {
        console.error('创建中国国家记录失败:', chinaError)
        return
      }
      chinaCountryId = newChina.id
    } else {
      chinaCountryId = chinaCountry.id
    }
    
    console.log(`✅ 中国国家记录ID: ${chinaCountryId}`)
    
    // 1. 首先确保所有省份都存在
    console.log('📍 检查和创建省份数据...')
    const provincesToCreate = new Set()
    
    csvData.forEach(item => {
      if (provinceMapping[item.province]) {
        provincesToCreate.add(item.province)
      }
    })
    
    for (const provinceName of provincesToCreate) {
      const provinceInfo = provinceMapping[provinceName]
      
      // 检查省份是否已存在
      const { data: existingProvince } = await supabase
        .from('admin_provinces')
        .select('id')
        .eq('code', provinceInfo.code)
        .single()
      
      if (!existingProvince) {
        console.log(`创建省份: ${provinceInfo.name_zh}`)
        const { error } = await supabase
          .from('admin_provinces')
          .insert({
            country_id: chinaCountryId,
            name_zh: provinceInfo.name_zh,
            name_en: provinceInfo.name_en,
            code: provinceInfo.code,
            sort_order: 0,
            is_active: true
          })
        
        if (error) {
          console.error(`创建省份失败: ${provinceInfo.name_zh}`, error)
        }
      }
    }
    
    // 2. 获取所有省份ID映射
    console.log('🔍 获取省份ID映射...')
    const { data: provinces } = await supabase
      .from('admin_provinces')
      .select('id, code')
    
    const provinceIdMap = {}
    provinces.forEach(province => {
      provinceIdMap[province.code] = province.id
    })
    
    // 3. 导入经开区数据
    console.log('🏗️ 开始导入经开区数据...')
    let successCount = 0
    let errorCount = 0
    
    for (const item of csvData) {
      const provinceInfo = provinceMapping[item.province]
      if (!provinceInfo) {
        console.warn(`未找到省份映射: ${item.province}`)
        errorCount++
        continue
      }
      
      const provinceId = provinceIdMap[provinceInfo.code]
      if (!provinceId) {
        console.warn(`未找到省份ID: ${provinceInfo.code}`)
        errorCount++
        continue
      }
      
      const developmentZoneCode = generateDevelopmentZoneCode(item.name, item.province)
      
      // 检查经开区是否已存在
      const { data: existingZone } = await supabase
        .from('admin_development_zones')
        .select('id')
        .eq('code', developmentZoneCode)
        .single()
      
      if (existingZone) {
        console.log(`经开区已存在，跳过: ${item.name}`)
        continue
      }
      
      // 创建经开区
      const { error } = await supabase
        .from('admin_development_zones')
        .insert({
          province_id: provinceId,
          name_zh: item.name,
          name_en: item.name, // 暂时使用中文名称，后续可以添加英文翻译
          code: developmentZoneCode,
          sort_order: item.sequence,
          is_active: true
        })
      
      if (error) {
        console.error(`创建经开区失败: ${item.name}`, error)
        errorCount++
      } else {
        console.log(`✅ 创建成功: ${item.name} (${developmentZoneCode})`)
        successCount++
      }
    }
    
    console.log(`\n🎉 导入完成!`)
    console.log(`✅ 成功: ${successCount} 个经开区`)
    console.log(`❌ 失败: ${errorCount} 个经开区`)
    console.log(`📊 总计: ${csvData.length} 个经开区`)
    
  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error)
  }
}

// 执行导入
importData()