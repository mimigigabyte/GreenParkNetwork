#!/usr/bin/env node
/**
 * Import WIPO aggregated data into Supabase admin_technologies.
 * - Reads data/wipo-articles-aggregated.json
 * - For each item, composes descriptions, uploads image to Supabase Storage
 * - Inserts into admin_technologies with proper category/subcategory IDs
 *
 * Usage:
 *   node scripts/import-wipo-to-supabase.js --limit 3
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 3; // default for safety
  let ids = null;
  let minId = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--ids' && args[i + 1]) { ids = args[i + 1].split(',').map(s => s.trim()).filter(Boolean); i++; }
    else if (args[i] === '--minId' && args[i + 1]) { minId = parseInt(args[i + 1], 10); i++; }
  }
  return { limit, ids, minId };
}

async function loadAggregated() {
  const fp = path.resolve('data/wipo-articles-aggregated.json');
  const raw = fs.readFileSync(fp, 'utf-8');
  return JSON.parse(raw);
}

async function translateToChinese(text) {
  if (!text) return '';
  // Attempt LibreTranslate then MyMemory; fall back to original
  try {
    const endpoint = process.env.LT_ENDPOINT || 'https://libretranslate.com/translate';
    const body = { q: text, source: 'en', target: 'zh', format: 'text' };
    if (process.env.LT_API_KEY) body.api_key = process.env.LT_API_KEY;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const j = await res.json();
      if (j.translatedText) return j.translatedText.trim();
    }
  } catch {}
  try {
    const url = 'https://api.mymemory.translated.net/get?langpair=en|zh&de=user@example.com&q=' + encodeURIComponent(text);
    const res = await fetch(url);
    if (res.ok) {
      const j = await res.json();
      const t = j?.responseData?.translatedText;
      if (t) return t.trim();
    }
  } catch {}
  return text; // fallback
}

async function translateToEnglish(text) {
  if (!text) return '';
  try {
    const endpoint = process.env.LT_ENDPOINT || 'https://libretranslate.com/translate';
    const body = { q: text, source: 'auto', target: 'en', format: 'text' };
    if (process.env.LT_API_KEY) body.api_key = process.env.LT_API_KEY;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { const j = await res.json(); if (j.translatedText) return j.translatedText.trim(); }
  } catch {}
  try {
    const url = 'https://api.mymemory.translated.net/get?langpair=auto|en&de=user@example.com&q=' + encodeURIComponent(text);
    const res = await fetch(url);
    if (res.ok) { const j = await res.json(); const t = j?.responseData?.translatedText; if (t) return t.trim(); }
  } catch {}
  return text;
}

async function ensureCategoryIds(supabase, catNameZh, subNameZh) {
  // Fetch category by Chinese name
  const { data: cats } = await supabase
    .from('admin_categories')
    .select('id, name_zh, name_en')
    .ilike('name_zh', catNameZh);
  const category = (cats || [])[0];
  if (!category) throw new Error(`Category not found: ${catNameZh}`);

  const { data: subs } = await supabase
    .from('admin_subcategories')
    .select('id, name_zh, category_id')
    .eq('category_id', category.id)
    .ilike('name_zh', subNameZh);
  const sub = (subs || [])[0];
  if (!sub) throw new Error(`Subcategory not found under ${catNameZh}: ${subNameZh}`);

  return { category_id: category.id, subcategory_id: sub.id };
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${url}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function uploadImage(supabase, id, url) {
  if (!url) return null;
  try {
    const buf = await downloadBuffer(url);
    const objectPath = `technologies/wipo/${id}.jpg`;
    const { error: upErr } = await supabase.storage
      .from('images')
      .upload(objectPath, buf, { contentType: 'image/jpeg', upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('images').getPublicUrl(objectPath);
    return data.publicUrl;
  } catch (e) {
    console.error('Image upload failed for', id, url, e.message);
    return null;
  }
}

function generateCompanyLogoSVG(name, size = 256) {
  const clean = (name || '').replace(/(有限公司|股份有限公司|有限责任公司|集团|公司|科技|技术)$/g, '').replace(/\s+/g, '');
  let chars = clean.slice(0, 4).split('');
  if (chars.length < 4) {
    const rest = (name || '').replace(/\s+/g, '').slice(clean.length);
    for (const c of rest) {
      if (chars.length >= 4) break; if (!chars.includes(c)) chars.push(c);
    }
    while (chars.length > 0 && chars.length < 4) chars.push(chars[0]);
  }
  const fontSize = Math.floor(size / 3.5);
  const spacing = fontSize * 1.3;
  const cx = size / 2, cy = size / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#00b899" rx="8" ry="8"/>
    <text x="${cx - spacing/2}" y="${cy - spacing/2}" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${chars[0] || ''}</text>
    <text x="${cx + spacing/2}" y="${cy - spacing/2}" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${chars[1] || ''}</text>
    <text x="${cx - spacing/2}" y="${cy + spacing/2}" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${chars[2] || ''}</text>
    <text x="${cx + spacing/2}" y="${cy + spacing/2}" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${chars[3] || ''}</text>
  </svg>`;
}

async function ensureCompanyLogoUrl(supabase, companyName, suggestedUrl) {
  if (suggestedUrl) return suggestedUrl;
  if (!companyName) return null;
  try {
    const svg = generateCompanyLogoSVG(companyName, 256);
    const objectPath = `company-logos/generated-wipo-${Date.now()}-${Math.random().toString(36).slice(2)}.svg`;
    const { error: upErr } = await supabase.storage
      .from('images')
      .upload(objectPath, Buffer.from(svg), { contentType: 'image/svg+xml', upsert: false });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('images').getPublicUrl(objectPath);
    return data.publicUrl;
  } catch (e) {
    console.warn('Company logo generation failed:', e.message);
    return null;
  }
}

function composeEnglishDescription(item) {
  const parts = [];
  const benefitTypes = /NO QUERY SPECIFIED/i.test(item.benefits || '') ? '' : (item.benefits || '');
  parts.push(`Description: ${item.description || ''}`);
  parts.push(`Benefit Types: ${benefitTypes}`);
  parts.push(`Benefit Details: ${item.benefitsDescription || ''}`);
  parts.push(`Deployed In: ${Array.isArray(item.deployedInCountry) ? item.deployedInCountry.join(', ') : (item.deployedInCountry || '')}`);
  parts.push(`Technology Readiness Level: ${item.technologyReadinessLevel || ''}`);
  parts.push(`ID: ${item.id || ''}`);
  return parts.join('\n');
}

// Map common English country names to zh + iso2 for flags
const COUNTRY_MAP = {
  'United Kingdom': { zh: '英国', code: 'gb' },
  'United States': { zh: '美国', code: 'us' },
  'China': { zh: '中国', code: 'cn' },
  'Japan': { zh: '日本', code: 'jp' },
  'Canada': { zh: '加拿大', code: 'ca' },
  'Germany': { zh: '德国', code: 'de' },
  'Netherlands': { zh: '荷兰', code: 'nl' },
  'Denmark': { zh: '丹麦', code: 'dk' },
  'Sweden': { zh: '瑞典', code: 'se' },
  'Kazakhstan': { zh: '哈萨克斯坦', code: 'kz' },
  'Philippines': { zh: '菲律宾', code: 'ph' },
  'India': { zh: '印度', code: 'in' },
  'Global': { zh: '全球', code: 'xx' }
};

async function ensureCountry(supabase, developedInCountry) {
  if (!developedInCountry) return { id: null };
  const name = String(developedInCountry).trim();
  // Try find by zh or en
  let { data: found } = await supabase
    .from('admin_countries')
    .select('id, name_zh, name_en')
    .or(`name_en.ilike.${name},name_zh.ilike.${name}`)
    .limit(1);
  if (found && found.length) return { id: found[0].id };

  // Build insert data
  const map = COUNTRY_MAP[name] || null;
  const name_en = name;
  const name_zh = map?.zh || name; // if unknown, duplicate English (can edit later)
  const code = map?.code || 'xx';
  const logo_url = code !== 'xx' ? `https://flagcdn.com/w160/${code}.png` : null;
  const insert = { name_zh, name_en, code, logo_url, is_active: true, sort_order: 0 };
  const { data, error } = await supabase.from('admin_countries').insert(insert).select('id').single();
  if (error) {
    console.warn('Failed to create country', name, error.message);
    return { id: null };
  }
  return { id: data.id };
}

async function main() {
  const { limit, ids, minId } = parseArgs();
  const list = await loadAggregated();
  let items = [];
  if (ids && ids.length) {
    const set = new Set(ids);
    items = list.filter(x => set.has(String(x.id)));
  } else {
    if (minId) {
      items = list.filter(x => parseInt(x.id, 10) >= minId);
    } else {
      items = list.slice(0, limit);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    console.error('Missing Supabase env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(2);
  }
  const supabase = createClient(supabaseUrl, serviceRole);

  // Resolve category IDs once
  const { category_id, subcategory_id } = await ensureCategoryIds(supabase, '清洁能源技术', '风能技术');

  // ID-specific corrections
  const FIX_OWNER_MINISTRY_IDS = new Set(['7951','8027','8050','8090','8099','8104']);
  for (const raw of items) {
    // clone item to avoid mutating list
    const item = { ...raw };
    if (FIX_OWNER_MINISTRY_IDS.has(String(item.id))) {
      item.companyName = 'Ministry of Economy';
    }
    if (String(item.id) === '10265') {
      // Ensure benefits description content taken from page (as per screenshot)
      item.benefits = item.benefits && !/NO QUERY SPECIFIED/i.test(item.benefits) ? item.benefits : '';
      item.benefitsDescription = 'Advantages:-Faster, more comprehensive profiling of wind wake effects-Documenting the upstream, downstream and modulated flow fields around a wind farm-Lower cost for more information than existing technologies';
    }
    let englishDesc = composeEnglishDescription(item);
    if (/\p{Script=Han}/u.test(englishDesc)) {
      englishDesc = await translateToEnglish(englishDesc);
    }
    // Build Chinese description with specific labels and newline separation
    const zhParts = [];
    const zhDesc = await translateToChinese(item.description || '');
    const zhBenefits = await translateToChinese(item.benefits || '');
    const zhBenefitDetails = await translateToChinese(item.benefitsDescription || '');
    const deployedStr = Array.isArray(item.deployedInCountry) ? item.deployedInCountry.join(', ') : (item.deployedInCountry || '');
    let zhDeployed = await translateToChinese(deployedStr);
    // Normalize Global -> 全球
    if ((item.deployedInCountry && String(item.deployedInCountry).toLowerCase().includes('global')) || /全局/.test(zhDeployed)) {
      zhDeployed = zhDeployed.replace(/全局/g, '全球').replace(/Global/gi, '全球');
    }
    let zhTRL = await translateToChinese(item.technologyReadinessLevel || '');
    // Normalize TRL 9 Scaling up phrase
    if ((item.technologyReadinessLevel || '').toLowerCase().includes('scaling up') && /(trl\s*9)/i.test(item.technologyReadinessLevel || '')) {
      zhTRL = '扩大生产阶段（技术成熟度9级）';
    }
    zhParts.push(`技术描述：${zhDesc}`);
    zhParts.push(`收益类型：${zhBenefits}`);
    zhParts.push(`收益描述：${zhBenefitDetails}`);
    zhParts.push(`应用地区和国家：${zhDeployed}`);
    zhParts.push(`技术成熟度：${zhTRL}`);
    zhParts.push(`ID：${item.id || ''}`);
    const chineseDesc = zhParts.join('\n');

    // Upload image or fallback to subcategory default
    let publicImageUrl = await uploadImage(supabase, item.id, item.technologyImageUrl || '');
    if (!publicImageUrl) {
      const { data: sub } = await supabase.from('admin_subcategories').select('default_tech_image_url').eq('id', subcategory_id).single();
      publicImageUrl = sub?.default_tech_image_url || null;
    }

    // Ensure country
    const { id: country_id } = await ensureCountry(supabase, item.developedInCountry);

    const companyLogoUrl = await ensureCompanyLogoUrl(supabase, item.companyName, null);

    const payload = {
      name_zh: item.technologyNameCN || item.technologyNameEN || '',
      name_en: item.technologyNameEN || '',
      description_en: englishDesc,
      description_zh: chineseDesc,
      image_url: publicImageUrl || null,
      company_logo_url: companyLogoUrl || null,
      website_url: item.companyWebsiteUrl || null,
      tech_source: 'self_developed', // 自主开发
      acquisition_method: 'wipo',
      category_id,
      subcategory_id,
      custom_label: Array.isArray(item.customLabels) ? item.customLabels.slice(0, 2).join('|') : (item.customLabels || ''),
      company_name_zh: item.companyName || '',
      company_name_en: item.companyName || '',
      is_active: true,
      company_country_id: country_id || null,
      review_status: 'published'
    };

    // Upsert by WIPO ID embedded in description: look for existing record containing "ID: <id>"
    const { data: existingList, error: findErr } = await supabase
      .from('admin_technologies')
      .select('id, image_url, review_status')
      .ilike('description_en', `%ID: ${item.id}%`)
      .limit(1);
    if (findErr) {
      console.warn('Lookup error for', item.id, findErr.message);
    }
    const existing = existingList && existingList[0];
    if (existing) {
      // Update key fields; keep existing image if present
      const updateData = {
        name_zh: payload.name_zh,
        name_en: payload.name_en,
        description_en: payload.description_en,
        description_zh: payload.description_zh,
        website_url: payload.website_url,
        company_country_id: payload.company_country_id,
        company_name_zh: payload.company_name_zh,
        company_name_en: payload.company_name_en,
        image_url: existing.image_url || payload.image_url,
        company_logo_url: payload.company_logo_url || null,
        custom_label: payload.custom_label,
        category_id,
        subcategory_id,
      };
      const { error: upErr } = await supabase
        .from('admin_technologies')
        .update(updateData)
        .eq('id', existing.id);
      if (upErr) {
        console.error('Update failed for', item.id, upErr.message);
      } else {
        console.log('Updated existing', item.id, '-', item.technologyNameEN, 'as', existing.id);
      }
    } else {
      const { data, error } = await supabase
        .from('admin_technologies')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('Insert failed for', item.id, error.message);
      } else {
        console.log('Imported', item.id, '-', item.technologyNameEN, 'as', data.id);
      }
    }
  }
}

// Lazy import fetch for Node ESM interop
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

main().catch(err => { console.error(err); process.exit(1); });
