#!/usr/bin/env node
/**
 * Backfill/fix Chinese descriptions (description_zh) for technologies.
 * - Detects rows where description_zh is missing or mostly English
 * - Parses description_en into sections and translates content pieces
 * - Composes Chinese with required labels and normalizations
 *
 * Usage:
 *   node scripts/fix-cn-descriptions.js              # process all that need fix
 *   node scripts/fix-cn-descriptions.js --ids 7951,8027   # process specific ids
 */

const { createClient } = require('@supabase/supabase-js');

function parseArgs() {
  const args = process.argv.slice(2);
  let ids = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ids' && args[i + 1]) { ids = args[i + 1].split(',').map(s => s.trim()); i++; }
  }
  return { ids };
}

// Lightweight translators (LibreTranslate -> MyMemory -> fallback)
async function translateToChinese(text) {
  if (!text) return '';
  try {
    const endpoint = process.env.LT_ENDPOINT || 'https://libretranslate.com/translate';
    const body = { q: text, source: 'en', target: 'zh', format: 'text' };
    if (process.env.LT_API_KEY) body.api_key = process.env.LT_API_KEY;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { const j = await res.json(); if (j.translatedText) return j.translatedText.trim(); }
  } catch {}
  try {
    const url = 'https://api.mymemory.translated.net/get?langpair=en|zh&de=user@example.com&q=' + encodeURIComponent(text);
    const res = await fetch(url);
    if (res.ok) { const j = await res.json(); const t = j?.responseData?.translatedText; if (t) return t.trim(); }
  } catch {}
  return text;
}

function needsFix(zh) {
  if (!zh) return true;
  const hasChinese = /[\u4e00-\u9fff]/.test(zh);
  if (!hasChinese) return true;
  // If it's already in required label form, assume fine
  if (/^技术描述：/m.test(zh)) return false;
  // If English-only labels present, fix
  if (/Description:|Benefit\s+Types:|Benefit\s+Details:|Deployed\s+In:|Technology\s+Readiness\s+Level:|ID:/m.test(zh)) return true;
  return false;
}

function parseEnglishSections(descEn) {
  const lines = (descEn || '').split(/\r?\n/);
  const map = { description: '', types: '', details: '', deployed: '', trl: '', id: '' };
  for (const line of lines) {
    const m = line.match(/^\s*(Description|Benefit\s+Types|Benefit\s+Details|Deployed\s+In|Technology\s+Readiness\s+Level|ID)\s*:\s*(.*)$/i);
    if (m) {
      const key = m[1].toLowerCase().replace(/\s+/g, ' ');
      const val = m[2] || '';
      if (key === 'description') map.description = val;
      else if (key === 'benefit types') map.types = val;
      else if (key === 'benefit details') map.details = val;
      else if (key === 'deployed in') map.deployed = val;
      else if (key === 'technology readiness level') map.trl = val;
      else if (key === 'id') map.id = val;
    }
  }
  return map;
}

async function buildChineseFromEnglish(descEn, deployedIn, trl) {
  const s = parseEnglishSections(descEn);
  // Prefer explicit fields if supplied
  if (!s.deployed && deployedIn) s.deployed = Array.isArray(deployedIn) ? deployedIn.join(', ') : deployedIn;
  if (!s.trl && trl) s.trl = trl;
  // Translate each part
  const zhDesc = await translateToChinese(s.description || '');
  let zhTypes = await translateToChinese(s.types || '');
  let zhDetails = await translateToChinese(s.details || '');
  let zhDeployed = await translateToChinese(s.deployed || '');
  let zhTrl = await translateToChinese(s.trl || '');
  // Normalizations
  if (/全局/.test(zhDeployed) || /Global/i.test(s.deployed || '')) zhDeployed = zhDeployed.replace(/全局/g, '全球').replace(/Global/gi, '全球');
  if ((s.trl || '').toLowerCase().includes('scaling up') && /(trl\s*9)/i.test(s.trl || '')) zhTrl = '扩大生产阶段（技术成熟度9级）';
  const zhParts = [
    `技术描述：${zhDesc}`,
    `收益类型：${zhTypes}`,
    `收益描述：${zhDetails}`,
    `应用地区和国家：${zhDeployed}`,
    `技术成熟度：${zhTrl}`,
    `ID：${(s.id || '').trim()}`,
  ];
  return zhParts.join('\n');
}

async function main() {
  const { ids } = parseArgs();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    console.error('Missing Supabase env vars.');
    process.exit(2);
  }
  const supabase = createClient(supabaseUrl, serviceRole);

  // Fetch candidate rows
  let query = supabase.from('admin_technologies').select('id, description_en, description_zh, company_country_id');
  if (ids && ids.length) {
    query = query.in('id', ids);
  }
  const { data, error } = await query;
  if (error) throw error;

  let fixed = 0;
  for (const row of data || []) {
    if (!needsFix(row.description_zh)) continue;
    const zh = await buildChineseFromEnglish(row.description_en || '', null, null);
    const { error: upErr } = await supabase.from('admin_technologies').update({ description_zh: zh }).eq('id', row.id);
    if (upErr) { console.error('Update failed for', row.id, upErr.message); continue; }
    fixed++;
    // politeness delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`Fixed Chinese descriptions for ${fixed} records.`);
}

// node-fetch ESM shim
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

main().catch(err => { console.error(err); process.exit(1); });

