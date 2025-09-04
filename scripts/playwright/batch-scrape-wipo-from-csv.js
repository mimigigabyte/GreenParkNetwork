#!/usr/bin/env node
/**
 * Batch scrape WIPO Green articles from a CSV list using the single-page Playwright scraper.
 * CSV format: first row header with columns: ID,Title
 * Starting from row 2, column 1 has the WIPO article ID; column 2 has technologyNameEN.
 *
 * Usage:
 *   node scripts/playwright/batch-scrape-wipo-from-csv.js data/search-results-2025-09-04.csv --limit 3
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function parseArgs() {
  const [, , csvPathArg, ...rest] = process.argv;
  if (!csvPathArg) {
    console.error('Usage: node scripts/playwright/batch-scrape-wipo-from-csv.js <csv-path> [--limit N]');
    process.exit(2);
  }
  let limit = null;
  let offset = 0;
  let force = false;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--limit' && rest[i + 1]) {
      limit = parseInt(rest[i + 1], 10);
      i++;
    } else if (rest[i] === '--offset' && rest[i + 1]) {
      offset = parseInt(rest[i + 1], 10) || 0;
      i++;
    } else if (rest[i] === '--force') {
      force = true;
    }
  }
  return { csvPath: csvPathArg, limit, offset, force };
}

function readCsvRows(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf-8');
  // Normalize newlines and split
  const lines = raw.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
  if (lines.length <= 1) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) { // skip header
    const line = lines[i];
    // Simple CSV split: ID,Title; Title could be quoted
    // Use a light parser to handle simple quotes
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && line[j + 1] === '"') { cur += '"'; j++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    const id = (cells[0] || '').trim();
    const title = (cells[1] || '').trim();
    if (!id || !/^\d+$/.test(id)) continue;
    rows.push({ id, title });
  }
  return rows;
}

async function runScraperOnUrl(url) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [path.resolve('scripts/playwright/scrape-wipo-article.js'), url], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function main() {
  const { csvPath, limit, offset, force } = parseArgs();
  const rows = readCsvRows(csvPath);
  const start = Math.max(0, offset);
  const slice = typeof limit === 'number' ? rows.slice(start, start + limit) : rows.slice(start);
  console.log(`Found ${rows.length} rows. Processing ${slice.length} starting at offset ${start}...`);

  const base = 'https://wipogreen.wipo.int/wipogreen-database/articles/';
  const results = [];
  for (let i = 0; i < slice.length; i++) {
    const { id, title } = slice[i];
    const url = base + id;
    const outJson = path.resolve('data', `wipo-article-${id}.json`);
    if (!force && fs.existsSync(outJson)) {
      console.log(`[${start + i + 1}] Skip existing ${id}`);
      results.push({ id, title, url, code: 0, skipped: true });
      continue;
    }
    console.log(`[${start + i + 1}] Scraping ${url} (${title})`);
    // Run sequentially to be gentle and avoid rate limits
    const r = await runScraperOnUrl(url);
    results.push({ id, title, url, code: r.code, stderr: r.stderr.trim() });
  }

  // Write a small summary file
  const outDir = path.resolve('data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'batch-scrape-summary.json');
  fs.writeFileSync(outPath, JSON.stringify({ ranAt: new Date().toISOString(), items: results }, null, 2), 'utf-8');
  console.log(`Summary written: ${outPath}`);
}

main().catch((e) => {
  console.error('Batch error:', e);
  process.exit(1);
});
