#!/usr/bin/env node
/**
 * Backfill English names for countries, provinces, and development zones.
 *
 * Usage:
 *   DRY_RUN=true node scripts/backfill-location-translations.js
 *   DRY_RUN=false node scripts/backfill-location-translations.js
 *   node scripts/backfill-location-translations.js --table countries --dry-run
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const args = process.argv.slice(2)
const arg = (name, def = undefined) => {
  const idx = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`))
  if (idx === -1) return def
  const val = args[idx]
  if (val.includes('=')) return val.split('=')[1]
  return args[idx + 1] ?? true
}

const DRY_RUN = (process.env.DRY_RUN || arg('dry-run', 'true')).toString() !== 'false' && arg('execute') !== 'true' ? true : false
const TABLE_FILTER = arg('table', 'all') // all | countries | provinces | zones

const isChinese = (s = '') => /[\u4e00-\u9fff]/.test(s)

// Country translations (common set)
const countryTranslations = {
  '中国': 'China',
  '日本': 'Japan',
  '美国': 'United States',
  '英国': 'United Kingdom',
  '德国': 'Germany',
  '法国': 'France',
  '韩国': 'South Korea',
  '朝鲜': 'North Korea',
  '印度': 'India',
  '加拿大': 'Canada',
  '澳大利亚': 'Australia',
  '意大利': 'Italy',
  '西班牙': 'Spain',
  '荷兰': 'Netherlands',
  '瑞典': 'Sweden',
  '丹麦': 'Denmark',
  '挪威': 'Norway',
  '芬兰': 'Finland',
  '瑞士': 'Switzerland',
  '俄罗斯': 'Russia',
  '新加坡': 'Singapore',
  '马来西亚': 'Malaysia',
  '泰国': 'Thailand',
  '菲律宾': 'Philippines',
  '印度尼西亚': 'Indonesia'
}

// Province translations
const provinceTranslations = {
  '北京': 'Beijing',
  '天津': 'Tianjin',
  '上海': 'Shanghai',
  '重庆': 'Chongqing',
  '河北': 'Hebei',
  '山西': 'Shanxi',
  '辽宁': 'Liaoning',
  '吉林': 'Jilin',
  '黑龙江': 'Heilongjiang',
  '江苏': 'Jiangsu',
  '浙江': 'Zhejiang',
  '安徽': 'Anhui',
  '福建': 'Fujian',
  '江西': 'Jiangxi',
  '山东': 'Shandong',
  '河南': 'Henan',
  '湖北': 'Hubei',
  '湖南': 'Hunan',
  '广东': 'Guangdong',
  '海南': 'Hainan',
  '四川': 'Sichuan',
  '贵州': 'Guizhou',
  '云南': 'Yunnan',
  '陕西': 'Shaanxi',
  '甘肃': 'Gansu',
  '青海': 'Qinghai',
  '台湾': 'Taiwan',
  '内蒙古': 'Inner Mongolia',
  '广西': 'Guangxi',
  '西藏': 'Tibet',
  '宁夏': 'Ningxia',
  '新疆': 'Xinjiang',
  '香港': 'Hong Kong',
  '澳门': 'Macao'
}

// City/area translations for prefixes
const cityAreaTranslations = {
  '北京': 'Beijing','天津': 'Tianjin','上海': 'Shanghai','重庆': 'Chongqing',
  '广州': 'Guangzhou','深圳': 'Shenzhen','杭州': 'Hangzhou','南京': 'Nanjing','苏州': 'Suzhou','无锡': 'Wuxi',
  '宁波': 'Ningbo','青岛': 'Qingdao','大连': 'Dalian','武汉': 'Wuhan','成都': 'Chengdu','西安': "Xi'an",
  '沈阳': 'Shenyang','长春': 'Changchun','哈尔滨': 'Harbin','郑州': 'Zhengzhou','济南': 'Jinan','合肥': 'Hefei',
  '福州': 'Fuzhou','厦门': 'Xiamen','南昌': 'Nanchang','长沙': 'Changsha','南宁': 'Nanning','昆明': 'Kunming',
  '海口': 'Haikou','兰州': 'Lanzhou','西宁': 'Xining','银川': 'Yinchuan','乌鲁木齐': 'Urumqi','呼和浩特': 'Hohhot',
  '石家庄': 'Shijiazhuang','唐山': 'Tangshan','保定': 'Baoding','廊坊': 'Langfang','东营': 'Dongying','南通': 'Nantong',
  '昆山': 'Kunshan','江宁': 'Jiangning','金华': 'Jinhua','嘉兴': 'Jiaxing','绍兴': 'Shaoxing','常州': 'Changzhou',
  '徐州': 'Xuzhou','泰州': 'Taizhou','温州': 'Wenzhou','扬州': 'Yangzhou','盐城': 'Yancheng','威海': 'Weihai',
  '烟台': 'Yantai','潍坊': 'Weifang','洛阳': 'Luoyang','太原': 'Taiyuan','呼伦贝尔': 'Hulunbuir'
}
const areaTranslations = { '金桥': 'Jinqiao', '张江': 'Zhangjiang', '漕河泾': 'Caohejing' }
function translateCityAreaPrefix(prefix) {
  if (areaTranslations[prefix]) return areaTranslations[prefix]
  for (const zh in cityAreaTranslations) {
    if (prefix.startsWith(zh)) {
      const enCity = cityAreaTranslations[zh]
      const rest = prefix.slice(zh.length)
      if (!rest) return enCity
      const restEn = areaTranslations[rest] || rest
      return `${enCity} ${restEn}`.trim()
    }
  }
  if (cityAreaTranslations[prefix]) return cityAreaTranslations[prefix]
  return prefix
}
const translateDevelopmentZoneName = (nameZh, nameEn = '') => {
  if (nameEn && !isChinese(nameEn)) return nameEn
  const suffixMap = [
    [/经济技术开发区$/, 'Economic and Technological Development Zone'],
    [/经济开发区$/, 'Economic Development Zone'],
    [/高新技术开发区$/, 'High-Tech Development Zone'],
    [/工业园区$/, 'Industrial Park'],
    [/科技园$/, 'Science Park'],
    [/新区$/, 'New Area'],
    [/开发区$/, 'Development Zone'],
    [/自贸区$/, 'Free Trade Zone'],
    [/保税区$/, 'Bonded Zone']
  ]
  for (const [re, en] of suffixMap) {
    const m = nameZh.match(re)
    if (m) {
      const prefix = nameZh.replace(re, '')
      const prefixEn = translateCityAreaPrefix(prefix)
      return `${prefixEn} ${en}`.trim()
    }
  }
  return nameEn || nameZh
}

const translateCountry = (nameZh, nameEn = '') => {
  if (nameEn && !isChinese(nameEn)) return nameEn
  return countryTranslations[nameZh] || nameEn || nameZh
}

const translateProvince = (nameZh, nameEn = '') => {
  if (nameEn && !isChinese(nameEn)) return nameEn
  return provinceTranslations[nameZh] || nameEn || nameZh
}

async function backfillCountries(supabase) {
  console.log('\n=== Countries ===')
  const { data, error } = await supabase
    .from('admin_countries')
    .select('id, code, name_zh, name_en')
    .order('sort_order', { ascending: true })
  if (error) throw error

  const updates = []
  for (const row of data || []) {
    const need = !row.name_en || isChinese(row.name_en)
    if (!need) continue
    const newEn = translateCountry(row.name_zh, row.name_en || '')
    if (newEn !== row.name_en) {
      updates.push({ id: row.id, name_en: newEn, code: row.code, name_zh: row.name_zh, prev: row.name_en })
    }
  }

  console.log(`To update: ${updates.length}`)
  if (DRY_RUN) {
    updates.slice(0, 20).forEach(u => console.log('DRY-RUN country', u.code, '=>', u.name_en))
    return { updated: 0, planned: updates.length }
  }

  let updated = 0
  for (const u of updates) {
    const { error: upErr } = await supabase
      .from('admin_countries')
      .update({ name_en: u.name_en })
      .eq('id', u.id)
    if (upErr) {
      console.warn('Update country failed', u.code, upErr.message)
    } else {
      updated++
    }
  }
  console.log('Updated countries:', updated)
  return { updated, planned: updates.length }
}

async function backfillProvinces(supabase) {
  console.log('\n=== Provinces ===')
  const { data, error } = await supabase
    .from('admin_provinces')
    .select('id, code, name_zh, name_en')
    .order('sort_order', { ascending: true })
  if (error) throw error

  const updates = []
  for (const row of data || []) {
    const need = !row.name_en || isChinese(row.name_en)
    if (!need) continue
    const newEn = translateProvince(row.name_zh, row.name_en || '')
    if (newEn !== row.name_en) {
      updates.push({ id: row.id, name_en: newEn, code: row.code, name_zh: row.name_zh, prev: row.name_en })
    }
  }

  console.log(`To update: ${updates.length}`)
  if (DRY_RUN) {
    updates.slice(0, 20).forEach(u => console.log('DRY-RUN province', u.code, '=>', u.name_en))
    return { updated: 0, planned: updates.length }
  }

  let updated = 0
  for (const u of updates) {
    const { error: upErr } = await supabase
      .from('admin_provinces')
      .update({ name_en: u.name_en })
      .eq('id', u.id)
    if (upErr) {
      console.warn('Update province failed', u.code, upErr.message)
    } else {
      updated++
    }
  }
  console.log('Updated provinces:', updated)
  return { updated, planned: updates.length }
}

async function backfillDevelopmentZones(supabase) {
  console.log('\n=== Development Zones ===')
  const { data, error } = await supabase
    .from('admin_development_zones')
    .select('id, code, name_zh, name_en')
    .order('sort_order', { ascending: true })
  if (error) throw error

  const updates = []
  for (const row of data || []) {
    const need = !row.name_en || isChinese(row.name_en)
    if (!need) continue
    const newEn = translateDevelopmentZoneName(row.name_zh, row.name_en || '')
    if (newEn !== row.name_en) {
      updates.push({ id: row.id, name_en: newEn, code: row.code, name_zh: row.name_zh, prev: row.name_en })
    }
  }

  console.log(`To update: ${updates.length}`)
  if (DRY_RUN) {
    updates.slice(0, 20).forEach(u => console.log('DRY-RUN zone', u.code, '=>', u.name_en))
    return { updated: 0, planned: updates.length }
  }

  let updated = 0
  for (const u of updates) {
    const { error: upErr } = await supabase
      .from('admin_development_zones')
      .update({ name_en: u.name_en })
      .eq('id', u.id)
    if (upErr) {
      console.warn('Update zone failed', u.code, upErr.message)
    } else {
      updated++
    }
  }
  console.log('Updated zones:', updated)
  return { updated, planned: updates.length }
}

async function main() {
  console.log('Backfill starting...', { DRY_RUN, TABLE_FILTER })
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  let totals = { planned: 0, updated: 0 }

  if (TABLE_FILTER === 'all' || TABLE_FILTER === 'countries') {
    const r = await backfillCountries(supabase)
    totals.planned += r.planned; totals.updated += r.updated
  }
  if (TABLE_FILTER === 'all' || TABLE_FILTER === 'provinces') {
    const r = await backfillProvinces(supabase)
    totals.planned += r.planned; totals.updated += r.updated
  }
  if (TABLE_FILTER === 'all' || TABLE_FILTER === 'zones') {
    const r = await backfillDevelopmentZones(supabase)
    totals.planned += r.planned; totals.updated += r.updated
  }

  console.log('\nBackfill finished.', { DRY_RUN, totals })
}

main().catch(err => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
