#!/usr/bin/env node
/**
 * Playwright scraper for a single WIPO Green technology article page.
 * Usage:
 *   node scripts/playwright/scrape-wipo-article.js [url]
 *
 * Extracts the following fields:
 * 1. technologyNameEN
 * 2. id
 * 3. companyName (Owner)
 * 4. publishedDate (Published)
 * 5. updatedDate (Updated)
 * 6. companyWebsiteUrl (VISIT WEBSITE link)
 * 7. technologyImageUrl (hero image or og:image)
 * 8. description (Description section full text)
 * 9. benefits (comma- or list-style values)
 * 10. benefitsDescription (if present)
 * 11. developedInCountry (Additional Information -> Developed in)
 * 12. deployedInCountry (Additional Information -> Deployed in)
 * 13. technologyReadinessLevel (TRL)
 * 14. intellectualProperty (if present)
 * 15. customLabels (CN keyword tags from description)
 * 16. technologyNameCN (CN translation of name, heuristic)
 * 17. technologyCategory (fixed: 清洁能源技术)
 * 18. subCategory (fixed: 风能技术)
 */

const fs = require('fs');
const path = require('path');

// Lazy import to avoid crashing if Playwright is not installed
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error('Playwright is not installed. Install with:');
  console.error('  npm i -D playwright');
  console.error('Then install browsers:');
  console.error('  npx playwright install');
  process.exit(2);
}

const INPUT_URL = process.argv[2] || 'https://wipogreen.wipo.int/wipogreen-database/articles/176426';

// Simple CN keyword extraction for wind tech
function extractCnKeywords(text = '', max = 2) {
  const map = {
    'offshore': '海上',
    'onshore': '陆上',
    'wind': '风能',
    'turbine': '风机',
    'blade': '叶片',
    'foundation': '基础',
    'float': '浮动',
    'floating': '浮动',
    'subsea': '海底',
    'grid': '电网',
    'power': '电力',
    'energy': '能源',
    'generator': '发电机',
    'maintenance': '维护',
    'control': '控制',
    'vibration': '振动',
    'fault': '故障',
    'inspection': '检测',
    'efficiency': '效率',
    'storm': '风暴',
    'typhoon': '台风',
    'earthquake': '地震',
    'seismic': '抗震'
  };
  const out = [];
  const lower = text.toLowerCase();
  for (const [en, cn] of Object.entries(map)) {
    if (lower.includes(en)) out.push(cn);
  }
  // de-duplicate and limit (default 2 keywords)
  return Array.from(new Set(out)).slice(0, max);
}

// Very rough CN translation for names (heuristic; improve as needed)
function translateNameToCN(name = '') {
  // phrase-level preferred mappings
  const phrase = [
    [/\bwind\s+sensor\b/i, '风速传感器'],
  ];
  let cn = name;
  for (const [re, rep] of phrase) cn = cn.replace(re, rep);

  const dict = [
    [/\bfexibile\b/i, '柔性'],
    [/\bflexible\b/i, '柔性'],
    [/\bfoundation(s)?\b/i, '基础'],
    [/\bearthquake(-|\s)?proof\b/i, '抗震'],
    [/\boffshore\b/i, '海上'],
    [/\bwind power\b/i, '风电'],
    [/\bwind energy\b/i, '风能'],
    [/\bwind\b/i, '风'],
    [/\bsensor(s)?\b/i, '传感器'],
    [/\bturbine(s)?\b/i, '风机'],
  ];
  for (const [re, rep] of dict) cn = cn.replace(re, rep);
  // If unchanged, just return original (user may post-edit)
  return cn === name ? name : cn;
}

function toCsvSafe(value) {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function sanitizeImageUrl(url = '') {
  if (!url) return '';
  // Blank out known placeholder
  if (/assets\/img\/theme-green-banner-logo/i.test(url)) return '';
  return url;
}

function normalizeBenefitsDescription(text = '') {
  if (!text) return '';
  // If already multiline, keep as is
  const bullets = [];
  const re = /[-–—•]\s*([^\n•–—-][^\n]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const item = (m[1] || '').trim();
    if (item) bullets.push(item);
  }
  if (bullets.length) {
    // If the string starts with a non-bullet segment before the first dash, include it
    const firstIdx = text.search(/[-–—•]\s+/);
    if (firstIdx > 0) {
      const head = text.slice(0, firstIdx).trim();
      if (head) bullets.unshift(head);
    }
    return bullets.join('\n');
  }
  // Otherwise split on explicit newline or semicolon
  return text.replace(/\s*;\s*/g, '\n').trim();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
  });
  // Try to appear less like automation
  await context.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    } catch {}
  });
  const page = await context.newPage();

  // Capture JSON API responses to improve reliability
  const apiPayloads = [];
  page.on('response', async (res) => {
    try {
      const ctype = res.headers()['content-type'] || '';
      if (ctype.includes('application/json')) {
        const url = res.url();
        // Limit memory usage
        const txt = await res.text();
        if (txt && txt.length < 2_000_000) {
          apiPayloads.push({ url, body: txt });
        }
      }
    } catch {}
  });

  try {
    await page.goto(INPUT_URL, { waitUntil: 'load', timeout: 60000 });
    // wait for network to settle for SPA content
    try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}

    // Heuristic waits for article content
    const waitSelectors = [
      'text=/^Description$/i',
      'text=/^Benefits$/i',
      'text=/Owner/i',
      'text=/ID\s*\d{3,}/i',
      'main h1',
    ];
    let contentVisible = false;
    for (const sel of waitSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        contentVisible = true;
        break;
      } catch {}
    }
    // Ensure a visible non-generic H1 appears
    try {
      await page.waitForFunction(() => {
        const h1s = Array.from(document.querySelectorAll('main h1, h1'));
        for (const h of h1s) {
          const t = (h.textContent || '').trim();
          if (t && !/^wipo\s*green|wipogreen database$/i.test(t)) return true;
        }
        return false;
      }, { timeout: 8000 });
    } catch {}
    if (!contentVisible) {
      // Retry once after a brief wait
      await page.waitForTimeout(1500);
      try { await page.reload({ waitUntil: 'load', timeout: 30000 }); } catch {}
      try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}
      for (const sel of waitSelectors) {
        try {
          await page.waitForSelector(sel, { timeout: 4000 });
          contentVisible = true;
          break;
        } catch {}
      }
    }

    // Try to accept cookies if a banner appears
    try {
      const btn = await page.getByRole('button', { name: /accept|agree|consent/i }).first();
      if (await btn.isVisible()) await btn.click({ timeout: 3000 });
    } catch {}

    // Click sections to reveal hidden content
    for (const label of ['Description', 'Benefits', 'Additional Information']) {
      try {
        const btn = await page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first();
        if (await btn.isVisible()) await btn.click({ timeout: 3000 });
      } catch {}
      try {
        const link = await page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') }).first();
        if (await link.isVisible()) await link.click({ timeout: 3000 });
      } catch {}
    }
    // Ensure Benefits tab is active before extraction
    try {
      const benefitsBtn = await page.getByRole('button', { name: /^Benefits$/i }).first();
      if (await benefitsBtn.isVisible()) {
        await benefitsBtn.click({ timeout: 3000 });
        await page.waitForTimeout(300);
      }
    } catch {}

    // Ensure Additional Information tab is active for its fields
    try {
      const addBtn = await page.getByRole('button', { name: /^Additional Information$/i }).first();
      if (await addBtn.isVisible()) {
        await addBtn.click({ timeout: 3000 });
        await page.waitForTimeout(300);
      }
    } catch {}

    // Give time for any animations/panels
    await page.waitForTimeout(500);

    // Extract via DOM first
    const domData = await page.evaluate(() => {
      const sel = (q) => document.querySelector(q);
      const all = (q) => Array.from(document.querySelectorAll(q));
      const text = (el) => (el?.textContent || '').trim();
      const attr = (el, n) => el?.getAttribute(n) || '';

      const bodyText = (document.body?.innerText || '').trim();

      // Title – prefer the main visible H1 that's not the generic site title
      function pickTitle() {
        const headers = [
          ...all('main h1, article h1, h1').map(el => text(el)).filter(Boolean),
          ...all('main h2, article h2, h2').map(el => text(el)).filter(Boolean),
        ];
        const good = headers.find(t => !/^wipo\s*green|wipogreen database$/i.test(t));
        if (good) return good;
        const og = attr(sel('meta[property="og:title"]'), 'content');
        if (og && !/^wipo\s*green|wipogreen database$/i.test(og)) return og;
        return document.title || '';
      }
      const title = pickTitle();

      // Try og:image first, fallback to biggest visible image in main/article
      let technologyImageUrl = attr(sel('meta[property="og:image"]'), 'content');
      if (!technologyImageUrl) {
        const imgs = all('main img, article img, img');
        // Pick the first reasonably large image
        const candidate = imgs.find(img => {
          const w = parseInt(attr(img, 'width')) || img.naturalWidth || 0;
          const h = parseInt(attr(img, 'height')) || img.naturalHeight || 0;
          const src = attr(img, 'src') || '';
          return src && (w >= 300 || h >= 200);
        }) || imgs[0];
        technologyImageUrl = attr(candidate, 'src') || '';
      }

      // Helper: find value next to a label
      function findValueByLabel(label) {
        label = label.toLowerCase();
        const candidates = all('dt, strong, b, span, div, th');
        for (const el of candidates) {
          const t = (el.textContent || '').trim().toLowerCase();
          if (!t) continue;
          if (t === label || t.startsWith(label + ':') || t.endsWith(' ' + label) || t.includes(label + ':')) {
            // Try nextElementSibling or within parent
            const sib = el.nextElementSibling;
            const withinParent = el.parentElement && Array.from(el.parentElement.children).find(ch => ch !== el);
            const val = [sib, withinParent].map(e => (e?.textContent || '').trim()).find(Boolean);
            if (val) return val;
          }
        }
        // Fallback: regex from body text
        const m = bodyText.match(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:?\\s*([^\n]+)', 'i'));
        return m ? m[1].trim() : '';
      }

      const idMatch = bodyText.match(/\bID\s*(\d{3,})\b/i);
      const id = idMatch ? idMatch[1] : '';

      const companyName = findValueByLabel('Owner') || findValueByLabel('Applicant') || '';
      const publishedDate = findValueByLabel('Published') || '';
      const updatedDate = findValueByLabel('Updated') || '';

      // Website: anchor with text Visit Website
      let companyWebsiteUrl = '';
      const aEls = all('a');
      for (const a of aEls) {
        const t = (a.textContent || '').trim().toLowerCase();
        if (/(^|\s)visit website(\s|$)/.test(t)) {
          companyWebsiteUrl = a.getAttribute('href') || '';
          break;
        }
      }
      // resolve relative URL if needed
      if (companyWebsiteUrl && !/^https?:/i.test(companyWebsiteUrl)) {
        try { companyWebsiteUrl = new URL(companyWebsiteUrl, location.href).href; } catch {}
      }

      // Section extraction: prefer DOM over text slicing
      function getSectionText(label) {
        label = (label || '').trim().toLowerCase();
        if (!label) return '';

        // 1) aria-controls pattern (accordion)
        for (const btn of all('button[aria-controls], [role="button"][aria-controls]')) {
          const t = (btn.textContent || '').trim().toLowerCase();
          if (t === label) {
            const id = btn.getAttribute('aria-controls');
            if (id) {
              const panel = document.getElementById(id);
              if (panel) {
                const ps = Array.from(panel.querySelectorAll('p, li'))
                  .map(e => (e.textContent || '').trim())
                  .filter(Boolean);
                if (ps.length) return ps.join('\n');
                const plain = (panel.textContent || '').trim();
                if (plain) return plain;
              }
            }
          }
        }

        // 2) Heading followed by content node
        for (const h of all('h1, h2, h3, h4, h5, h6, strong')) {
          const t = (h.textContent || '').trim().toLowerCase();
          if (t === label) {
            let n = h.nextElementSibling;
            const bits = [];
            let steps = 0;
            while (n && steps < 12) {
              const tt = (n.textContent || '').trim();
              if (/^description$|^benefits$|^additional information$/i.test(tt)) break;
              if (tt) bits.push(tt);
              n = n.nextElementSibling;
              steps++;
            }
            if (bits.length) return bits.join('\n');
          }
        }

        // 3) Fallback to body text slicing
        const bt = bodyText;
        const sIdx = bt.toLowerCase().indexOf(label);
        if (sIdx === -1) return '';
        const after = bt.slice(sIdx + label.length);
        // try to stop at next known heading
        const nextLabels = ['benefits', 'additional information', 'owner', 'published', 'updated'];
        let eIdx = after.length;
        for (const nl of nextLabels) {
          const i = after.toLowerCase().indexOf(nl);
          if (i !== -1) { eIdx = Math.min(eIdx, i); }
        }
        return after.slice(0, eIdx).trim();
      }

      const description = getSectionText('Description');

      // Benefits and Benefits Description (prefer DOM panel content)
      function extractBenefitsFromPanel() {
        // Find benefits panel via aria-controls or tabpanel
        let panel = null;
        for (const b of all('button[aria-controls], [role="button"][aria-controls]')) {
          const t = (b.textContent || '').trim().toLowerCase();
          if (t === 'benefits') {
            const id = b.getAttribute('aria-controls');
            if (id) panel = document.getElementById(id);
            break;
          }
        }
        if (!panel) {
          // Try role=tabpanel with aria-labelledby pointing to a benefits tab
          for (const tp of all('[role="tabpanel"]')) {
            const labelId = tp.getAttribute('aria-labelledby') || '';
            if (!labelId) continue;
            const lab = document.getElementById(labelId);
            if (lab && /benefits/i.test((lab.textContent || ''))) { panel = tp; break; }
          }
        }
        if (!panel) return { benefits: '', benefitsDescription: '' };

        // Inside panel, locate label nodes and values
        function valueNextTo(label) {
          label = label.toLowerCase();
          const candidates = Array.from(panel.querySelectorAll('dt, strong, b, span, th, h4, h5'));
          for (const el of candidates) {
            const t = (el.textContent || '').trim().toLowerCase();
            if (t === label) {
              const sib = el.nextElementSibling;
              if (sib) {
                const v = (sib.textContent || '').trim();
                if (v) return v;
              }
              const parent = el.parentElement;
              if (parent) {
                const alt = Array.from(parent.children).find(ch => ch !== el);
                if (alt) {
                  const v2 = (alt.textContent || '').trim();
                  if (v2 && v2.toLowerCase() !== label) return v2;
                }
              }
            }
          }
          return '';
        }

        function bulletsBelow(label) {
          label = label.toLowerCase();
          // Find heading matching label, then collect following list items or dash-prefixed lines
          const heads = Array.from(panel.querySelectorAll('h1,h2,h3,h4,h5,strong,b,dt'));
          for (const h of heads) {
            const t = (h.textContent || '').trim().toLowerCase();
            if (t === label) {
              const items = [];
              // Collect <li>
              const ul = h.parentElement && h.parentElement.querySelector('ul, ol');
              if (ul) {
                for (const li of Array.from(ul.querySelectorAll('li'))) {
                  const v = (li.textContent || '').trim();
                  if (v) items.push(v);
                }
                if (items.length) return items.join('\n');
              }
              // Collect plain paragraphs starting with dash
              let n = h.nextElementSibling;
              let steps = 0;
              while (n && steps < 12) {
                const v = (n.textContent || '').trim();
                if (/^\s*-\s+/.test(v)) items.push(v.replace(/^\s*-\s+/, ''));
                n = n.nextElementSibling;
                steps++;
              }
              if (items.length) return items.join('\n');
            }
          }
          return '';
        }

        // 3) Panel text parsing as robust fallback
        const pText = (panel.innerText || '').trim();
        let benefits = valueNextTo('Benefits');
        if (!benefits) {
          const m = pText.match(/Benefits\s*\n+([^\n]+?)(?:\n+Benefits\s*Description|\n+Additional\s*Information|$)/i);
          if (m) benefits = (m[1] || '').trim();
        }

        let benefitsDescription = bulletsBelow('Benefits Description') || valueNextTo('Benefits Description');
        if (!benefitsDescription) {
          const m2 = pText.match(/Benefits\s*Description\s*\n+([\s\S]*?)(?:\n\s*\n|\n+Additional\s*Information|$)/i);
          if (m2) {
            const raw = (m2[1] || '').trim();
            // Keep only bullet-like lines or short lines
            const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
            benefitsDescription = lines.join('\n');
          }
        }
        if (!benefits || !benefitsDescription) {
          // 4) Whole-document structural fallback around content labels
          function extractByContainer() {
            const nodes = Array.from(document.querySelectorAll('*')).filter(el => {
              const t = (el.textContent || '').trim();
              if (!t || t.toLowerCase() !== 'benefits') return false;
              const tag = (el.tagName || '').toLowerCase();
              if (['button','a'].includes(tag)) return false;
              return true;
            });
            for (const el of nodes) {
              let up = el;
              let hops = 0;
              while (up && hops < 6) {
                const tt = (up.innerText || '').trim();
                if (/benefits\s*description/i.test(tt)) {
                  // Try regex within this container (works even without newlines between label/value)
                  const mA = tt.match(/Benefits\s*([\s\S]*?)(?:Benefits\s*Description|$)/i);
                  const mB = tt.match(/Benefits\s*Description\s*([\s\S]*?)$/i);
                  let outA = mA ? (mA[1] || '').trim() : '';
                  let outB = mB ? (mB[1] || '').trim() : '';
                  // Clean benefitsDescription to bullet lines if present
                  if (outB) {
                    // Prefer dash bullets even if they are on a single line
                    const bullets = [];
                    const re = /[-–—•]\s+([^\n]+)/g; // capture text after common bullet markers
                    let m;
                    while ((m = re.exec(outB)) !== null) {
                      const item = (m[1] || '').trim();
                      if (item) bullets.push(item);
                    }
                    if (bullets.length) {
                      outB = bullets.join('\n');
                    } else {
                      const lines = outB.split('\n').map(s => s.trim()).filter(Boolean);
                      outB = lines.join('\n');
                    }
                  }
                  if (outA || outB) return { benefits: outA, benefitsDescription: outB };
                }
                up = up.parentElement; hops++;
              }
            }
            return { benefits: '', benefitsDescription: '' };
          }
          const viaContainer = extractByContainer();
          if (!benefits) benefits = viaContainer.benefits;
          if (!benefitsDescription) benefitsDescription = viaContainer.benefitsDescription;
        }

        return { benefits, benefitsDescription };
      }

      const { benefits, benefitsDescription } = extractBenefitsFromPanel();

      // Additional Information fields (panel-based)
      function getAdditionalPanel() {
        // via aria-controls
        for (const b of all('button[aria-controls], [role="button"][aria-controls]')) {
          const t = (b.textContent || '').trim().toLowerCase();
          if (t === 'additional information') {
            const id = b.getAttribute('aria-controls');
            if (id) {
              const p = document.getElementById(id);
              if (p) return p;
            }
          }
        }
        // via role=tabpanel and aria-labelledby to Additional Information tab
        for (const tp of all('[role="tabpanel"]')) {
          const labelId = tp.getAttribute('aria-labelledby') || '';
          if (!labelId) continue;
          const lab = document.getElementById(labelId);
          if (lab && /additional information/i.test((lab.textContent || ''))) return tp;
        }
        return null;
      }

      function valueNextToIn(panel, label) {
        if (!panel) return '';
        label = label.toLowerCase();
        // Target grid rows
        const rows = Array.from(panel.querySelectorAll('.p-grid, [class*="p-grid"], .row, tr'));
        for (const row of rows) {
          const cells = Array.from(row.children);
          if (!cells.length) continue;
          const left = (cells[0].textContent || '').trim().toLowerCase();
          if (left === label) {
            // value is in next cell
            const valNode = cells[1] || cells[cells.length - 1];
            const val = (valNode?.textContent || '').trim();
            if (val) return val;
          }
        }
        // Generic scan
        const candidates = Array.from(panel.querySelectorAll('div, dt, th, strong, b, span, h4'));
        for (const el of candidates) {
          const t = (el.textContent || '').trim().toLowerCase();
          if (t === label) {
            const sib = el.nextElementSibling;
            if (sib) {
              const v = (sib.textContent || '').trim();
              if (v) return v;
            }
            const parent = el.parentElement;
            if (parent) {
              const alt = Array.from(parent.children).find(ch => ch !== el);
              if (alt) {
                const v2 = (alt.textContent || '').trim();
                if (v2 && v2.toLowerCase() !== label) return v2;
              }
            }
          }
        }
        return '';
      }

      function extractIntellectualProperty(panel) {
        if (!panel) return '';
        // Try label/value first
        let ip = valueNextToIn(panel, 'INTELLECTUAL PROPERTY') || valueNextToIn(panel, 'Intellectual property');
        if (ip) return ip;
        // Try heading followed by block
        const heads = panel.querySelectorAll('h4, h5, strong, b');
        for (const h of heads) {
          const t = (h.textContent || '').trim();
          if (/^INTELLECTUAL\s+PROPERTY$/i.test(t)) {
            const block = h.parentElement?.nextElementSibling || h.nextElementSibling;
            const txt = (block?.textContent || '').trim();
            if (txt) return txt;
          }
        }
        return '';
      }

      const addPanel = getAdditionalPanel();
      const developedInCountry = valueNextToIn(addPanel, 'Developed in') || '';
      const deployedInCountry = valueNextToIn(addPanel, 'Deployed in') || '';
      const technologyReadinessLevel = valueNextToIn(addPanel, 'Readiness level (TRL)') || valueNextToIn(addPanel, 'Readiness level') || valueNextToIn(addPanel, 'TRL') || '';
      const intellectualProperty = extractIntellectualProperty(addPanel);

      return {
        technologyNameEN: title,
        id,
        companyName,
        publishedDate,
        updatedDate,
        companyWebsiteUrl,
        technologyImageUrl,
        description,
        benefits,
        benefitsDescription,
        developedInCountry,
        deployedInCountry,
        technologyReadinessLevel,
        intellectualProperty,
      };
    });

    // Try to enhance using captured API JSON if some fields are empty
    let enhanced = { ...domData };
    if (!enhanced.description || !enhanced.benefits || !enhanced.technologyNameEN || /wipogreen database|wipo\s*green/i.test(enhanced.technologyNameEN)) {
      for (const { url, body } of apiPayloads) {
        try {
          const data = JSON.parse(body);
          // Heuristic: find an object with matching numeric id or title
          const flat = Array.isArray(data) ? data : [data];
          for (const item of flat) {
            const stack = [item];
            while (stack.length) {
              const obj = stack.pop();
              if (obj && typeof obj === 'object') {
                // id match
                const objId = String(obj.id || obj.articleId || obj.article_id || '');
                if (objId && enhanced.id && objId.endsWith(String(enhanced.id))) {
                  // map common fields if present
                  enhanced.description = enhanced.description || obj.description || obj.longDescription || '';
                  enhanced.benefits = enhanced.benefits || obj.benefits || '';
                  const titleCandidate = obj.title || obj.name || obj.technologyName || '';
                  if (!enhanced.technologyNameEN && typeof titleCandidate === 'string' && titleCandidate.trim()) {
                    enhanced.technologyNameEN = titleCandidate.trim();
                  }
                  // Keep DOM/Panel values preferred; only fill if missing
                  enhanced.technologyReadinessLevel = enhanced.technologyReadinessLevel || obj.trl || obj.readiness || '';
                  enhanced.developedInCountry = enhanced.developedInCountry || obj.developedIn || '';
                  enhanced.deployedInCountry = enhanced.deployedInCountry || obj.deployedIn || '';
                  enhanced.intellectualProperty = enhanced.intellectualProperty || obj.intellectualProperty || '';
                }
                for (const v of Object.values(obj)) {
                  if (v && typeof v === 'object') stack.push(v);
                }
              }
            }
          }
        } catch {}
      }
    }

    // Try high-precision XPath-based extraction for Benefits from outside the page context
    async function extractBenefitsViaXPath(page) {
      let ben = '';
      let benDesc = '';
      try {
        const bNode = page.locator('xpath=(//*[normalize-space(text())="Benefits"])[last()]');
        const hasB = await bNode.first().isVisible({ timeout: 1000 }).catch(() => false);
        if (hasB) {
          const valNode = page.locator('xpath=(//*[normalize-space(text())="Benefits"])[last()]/following-sibling::*[1]');
          const txt = await valNode.first().innerText({ timeout: 1000 }).catch(() => '');
          if (txt) ben = txt.trim();
        }
      } catch {}
      try {
        const dNode = page.locator('xpath=(//*[normalize-space(text())="Benefits Description"])[last()]');
        const hasD = await dNode.first().isVisible({ timeout: 1000 }).catch(() => false);
        if (hasD) {
          const liTexts = await page.locator('xpath=(//*[normalize-space(text())="Benefits Description"])[last()]/following::*[self::ul or self::ol][1]/li').allInnerTexts().catch(() => []);
          if (liTexts && liTexts.length) {
            benDesc = liTexts.map(s => s.trim()).filter(Boolean).join('\n');
          } else {
            const block = await page.locator('xpath=(//*[normalize-space(text())="Benefits Description"])[last()]/following-sibling::*[1]').first().innerText({ timeout: 1000 }).catch(() => '');
            if (block) {
              const lines = block.split('\n').map(s => s.trim()).filter(Boolean);
              if (lines.length) benDesc = lines.join('\n');
            }
          }
        }
      } catch {}
      return { ben, benDesc };
    }

    let viaXPath = { ben: '', benDesc: '' };
    try { viaXPath = await extractBenefitsViaXPath(page); } catch {}
    if (viaXPath.ben) enhanced.benefits = viaXPath.ben;
    if (viaXPath.benDesc) enhanced.benefitsDescription = viaXPath.benDesc;

    const enriched = {
      ...enhanced,
      technologyNameCN: translateNameToCN((enhanced.technologyNameEN || domData.technologyNameEN || '').trim()),
      customLabels: extractCnKeywords((enhanced.description && enhanced.description.slice(0, 1000)) || domData.technologyNameEN, 2),
      technologyCategory: '清洁能源技术',
      subCategory: '风能技术',
      source: 'WIPO Green',
    };

    // Image placeholder handling
    enriched.technologyImageUrl = sanitizeImageUrl(enriched.technologyImageUrl);

    // Final normalization for Benefits Description bullets
    if (enriched.benefitsDescription) {
      enriched.benefitsDescription = normalizeBenefitsDescription(enriched.benefitsDescription);
    }

    // High-quality CN translation via free services (best-effort)
    async function translateNameHighQuality(enText) {
      if (!enText) return '';
      // 1) LibreTranslate (if reachable)
      try {
        const endpoint = process.env.LT_ENDPOINT || 'https://libretranslate.com/translate';
        const body = { q: enText, source: 'en', target: 'zh', format: 'text' };
        if (process.env.LT_API_KEY) body.api_key = process.env.LT_API_KEY;
        const res = await (await import('node-fetch').then(m => m.default))(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          timeout: 12000,
        });
        if (res.ok) {
          const j = await res.json();
          const t = (j.translatedText || '').trim();
          if (t) return t;
        }
      } catch {}
      // 2) MyMemory (no key, rate-limited)
      try {
        const url = 'https://api.mymemory.translated.net/get?langpair=en|zh&de=user@example.com&q=' + encodeURIComponent(enText);
        const res = await (await import('node-fetch').then(m => m.default))(url, { timeout: 12000 });
        if (res.ok) {
          const j = await res.json();
          const t = (j?.responseData?.translatedText || '').trim();
          if (t) return t;
        }
      } catch {}
      // Fallback to heuristic
      return translateNameToCN(enText);
    }

    try {
      const betterCN = await translateNameHighQuality(enriched.technologyNameEN);
      if (betterCN) enriched.technologyNameCN = betterCN;
    } catch {}

    // If benefits still look wrong (empty or numeric array), try to dump nearby DOM for debugging
    const needsDebug = !enriched.benefits || Array.isArray(enriched.benefits);
    if (needsDebug) {
      try {
        const dbg = await page.evaluate(() => {
          function info(el) {
            const t = (el.textContent || '').trim();
            return { tag: el.tagName, text: t.slice(0, 200), html: el.outerHTML.slice(0, 400) };
          }
          const hits = [];
          const nodes = Array.from(document.querySelectorAll('*'));
          for (const el of nodes) {
            const t = (el.textContent || '').trim();
            if (/^benefits( description)?$/i.test(t)) {
              const parent = el.parentElement;
              hits.push({ label: t, self: info(el), parent: parent ? info(parent) : null });
            }
          }
          return hits.slice(0, 20);
        });
        const idOrSlug = enriched.id || new URL(INPUT_URL).pathname.split('/').pop();
        const outDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const dbgPath = path.join(outDir, `debug-benefits-${idOrSlug}.json`);
        fs.writeFileSync(dbgPath, JSON.stringify(dbg, null, 2), 'utf-8');
        console.error(`Debug written: ${dbgPath}`);
      } catch {}
    }

    // Write output to data/
    const idOrSlug = enriched.id || new URL(INPUT_URL).pathname.split('/').pop();
    const outDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `wipo-article-${idOrSlug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(enriched, null, 2), 'utf-8');

    // Also emit a simple CSV next to it for convenience
    const csvHeaders = [
      'technologyNameEN','id','companyName','publishedDate','updatedDate','companyWebsiteUrl','technologyImageUrl','description','benefits','benefitsDescription','developedInCountry','deployedInCountry','technologyReadinessLevel','intellectualProperty','customLabels','technologyNameCN','technologyCategory','subCategory'
    ];
    const csvRow = csvHeaders.map(h => h === 'customLabels' ? toCsvSafe((enriched[h] || []).join('|')) : toCsvSafe(enriched[h] || '')).join(',');
    const csvPath = outPath.replace(/\.json$/, '.csv');
    fs.writeFileSync(csvPath, csvHeaders.join(',') + '\n' + csvRow + '\n', 'utf-8');

    console.error(`Saved: ${outPath}`);
    console.error(`Saved: ${csvPath}`);
    console.log(JSON.stringify(enriched, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Scraper error:', err);
  process.exit(1);
});
