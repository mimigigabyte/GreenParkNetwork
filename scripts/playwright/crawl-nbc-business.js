#!/usr/bin/env node
/**
 * Playwright crawler for NBC News Business
 * - Visits https://www.nbcnews.com/business
 * - Collects up to N article URLs from the listing page
 * - Opens each article and extracts title, published date, author, and main text
 * - Prints JSON to stdout and optionally writes to data/nbc-business-playwright.json
 */

const fs = require('fs');
const path = require('path');

async function main() {
  // Lazy import to avoid crashing if Playwright is not yet installed
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('Playwright is not installed. Install with:');
    console.error('  npm i -D playwright');
    console.error('Then run:');
    console.error('  npx playwright install');
    process.exit(2);
  }

  const LISTING_URL = 'https://www.nbcnews.com/business';
  const MAX_ARTICLES = parseInt(process.env.MAX_ARTICLES || '20', 10);
  const WRITE_FILE = process.env.WRITE_FILE !== 'false';
  const outPath = path.resolve(process.cwd(), 'data/nbc-business-playwright.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = { source: LISTING_URL, crawledAt: new Date().toISOString(), articles: [] };
  try {
    await page.goto(LISTING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Attempt to reveal more content by scrolling
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
    }

    // Collect article links on listing page
    const links = await page.$$eval('a[href^="https://www.nbcnews.com/business/"]', as => {
      const hrefs = Array.from(new Set(
        as.map(a => (a.getAttribute('href') || '').trim())
          .filter(h => h.startsWith('https://www.nbcnews.com/business/') && !h.includes('#'))
      ));
      return hrefs.slice(0, 100);
    });

    const topLinks = links.slice(0, MAX_ARTICLES);

    for (const url of topLinks) {
      const art = await context.newPage();
      try {
        await art.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // Some pages lazy-load content; wait briefly
        await art.waitForTimeout(500);

        // Extract fields from DOM/meta
        const data = await art.evaluate(() => {
          const sel = (q) => document.querySelector(q);
          const text = (el) => (el?.textContent || '').trim();
          const attr = (el, name) => el?.getAttribute(name) || '';

          const title = text(sel('h1')) || attr(sel('meta[property="og:title"]'), 'content') || document.title;
          const published = attr(sel('time[datetime]'), 'datetime') || attr(sel('meta[property="article:published_time"]'), 'content');
          const author = text(sel('[itemprop="author"] [itemprop="name"]')) || attr(sel('meta[name="author"]'), 'content');

          // Collect article text from common containers
          const candidates = [
            'article',
            '[class*="articleContent"]',
            '[class*="ArticleContent"]',
            '.article-body',
          ];
          let content = '';
          for (const c of candidates) {
            const el = sel(c);
            if (el) {
              content = Array.from(el.querySelectorAll('p'))
                .map(p => (p.textContent || '').trim())
                .filter(Boolean)
                .join('\n\n');
              if (content) break;
            }
          }

          // Collect a few canonical links from the article
          const links = Array.from(document.querySelectorAll('article a[href]'))
            .map(a => a.getAttribute('href') || '')
            .filter(h => h.startsWith('http'))
            .slice(0, 20);

          return { title, published, author, content, links };
        });

        results.articles.push({ url, ...data });
      } catch (err) {
        results.articles.push({ url, error: String(err) });
      } finally {
        await art.close();
      }
    }

  } finally {
    await browser.close();
  }

  if (WRITE_FILE) {
    try {
      const dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
      console.error(`Saved ${results.articles.length} articles to ${outPath}`);
    } catch (e) {
      console.error('Failed to write output file:', e);
    }
  }

  // Always print to stdout for piping
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Crawler error:', err);
  process.exit(1);
});

