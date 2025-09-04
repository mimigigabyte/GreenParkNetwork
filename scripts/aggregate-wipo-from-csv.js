#!/usr/bin/env node
/**
 * Aggregate per-article JSON files into a combined JSON and CSV
 * Order and IDs are taken from the CSV list (ID,Title header)
 * Usage:
 *   node scripts/aggregate-wipo-from-csv.js data/search-results-2025-09-04.csv
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: node scripts/aggregate-wipo-from-csv.js <csv-path>');
    process.exit(2);
  }
  return { csvPath };
}

function readCsvRows(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    // naive CSV for two columns
    let id = '';
    let title = '';
    if (line.includes(',')) {
      const idx = line.indexOf(',');
      id = line.slice(0, idx).trim();
      title = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
    } else {
      id = line.trim();
    }
    if (id) rows.push({ id, title });
  }
  return rows;
}

function toCsvSafe(v) {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCSV(list) {
  if (!list.length) return '';
  const headers = [
    'technologyNameEN','id','companyName','publishedDate','updatedDate','companyWebsiteUrl','technologyImageUrl','description','benefits','benefitsDescription','developedInCountry','deployedInCountry','technologyReadinessLevel','intellectualProperty','customLabels','technologyNameCN','technologyCategory','subCategory'
  ];
  const lines = [headers.join(',')];
  for (const r of list) {
    const row = headers.map(h => h === 'customLabels' ? toCsvSafe((r[h] || []).join('|')) : toCsvSafe(r[h]));
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

async function main() {
  const { csvPath } = parseArgs();
  const rows = readCsvRows(csvPath);
  const out = [];
  let missing = [];
  for (const { id } of rows) {
    const fp = path.resolve('data', `wipo-article-${id}.json`);
    if (fs.existsSync(fp)) {
      try {
        out.push(JSON.parse(fs.readFileSync(fp, 'utf-8')));
      } catch (e) {
        missing.push({ id, reason: 'parse_error', file: fp });
      }
    } else {
      missing.push({ id, reason: 'not_found', file: fp });
    }
  }

  const dataDir = path.resolve('data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const outJson = path.join(dataDir, 'wipo-articles-aggregated.json');
  fs.writeFileSync(outJson, JSON.stringify(out, null, 2), 'utf-8');
  const outCsv = path.join(dataDir, 'wipo-articles-aggregated.csv');
  fs.writeFileSync(outCsv, toCSV(out), 'utf-8');
  const report = path.join(dataDir, 'wipo-articles-aggregated-report.json');
  fs.writeFileSync(report, JSON.stringify({ generatedAt: new Date().toISOString(), total: rows.length, present: out.length, missing }, null, 2), 'utf-8');
  console.log(`Aggregated ${out.length}/${rows.length} records.`);
  console.log(`JSON: ${outJson}`);
  console.log(`CSV:  ${outCsv}`);
  console.log(`Report: ${report}`);
}

main().catch(e => { console.error(e); process.exit(1); });

