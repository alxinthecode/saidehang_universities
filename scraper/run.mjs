// Headless scan of the university and research-institute procurement platforms.
// Runs scraper/scan.js inside each site with Playwright, then merges new
// matches into data/notices.json (keeping status/notes) and updates
// data/meta.json. Used by .github/workflows/scan.yml; also runs locally:
//   npm install && npx playwright install chromium && node scraper/run.mjs
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const PAGES = Number(process.env.SCAN_PAGES || 1); // 1 = newest 100 per platform


const readJson = async (p, fallback) => {
  try { return JSON.parse(await readFile(new URL(p, ROOT), 'utf8')); } catch { return fallback; }
};
const writeJson = (p, v) => writeFile(new URL(p, ROOT), JSON.stringify(v, null, 2) + '\n', 'utf8');

const beijingNow = () => {
  const d = new Date(Date.now() + 8 * 3600e3);
  return d.toISOString().slice(0, 16);
};

const SITES = JSON.parse(await readFile(new URL('scraper/sites.json', ROOT), 'utf8'));
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const notices = await readJson('data/notices.json', []);
const meta = await readJson('data/meta.json', { coverage: {}, extra: [] });
meta.coverage ||= {};

const browser = await chromium.launch();
// Some institute sites use certificates Chromium doesn't trust; we only read public pages, so accept them.
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ignoreHTTPSErrors: true });
await ctx.addInitScript(pages => { window.__CEDRAT_HEADLESS = true; window.__CEDRAT_PAGES = pages; }, PAGES);

// Scan several sites at once (sites are on different servers); one retry per site.
const CONCURRENCY = Number(process.env.SCAN_CONCURRENCY || 6);
async function scanSite(site) {
  site.school = site.key;
  let last;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const page = await ctx.newPage();
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      const res = await page.evaluate(([src, cfg]) => { window.__CEDRAT_SITE = cfg; return (0, eval)(src); }, [scanSrc, site]);
      if (!res || !Array.isArray(res.rows)) throw new Error('scan returned no result (page layout may have changed)');
      console.log(`${site.school}: scanned ${res.scanned}, back to ${res.oldest}, ${res.rows.length} matches`);
      return { school: site.school, ok: true, ...res };
    } catch (e) {
      last = String(e.message || e).split('\n')[0];
    } finally {
      await page.close();
    }
    if (attempt === 1) await new Promise(r => setTimeout(r, 5000));
  }
  console.log(`${site.school}: FAILED — ${last} (after retry)`);
  return { school: site.school, ok: false, error: `${last} (after retry)` };
}
const results = new Array(SITES.length);
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < SITES.length) { const i = next++; results[i] = await scanSite(SITES[i]); }
}));
// 思必得 notices published as PDF have no text in the list. For matched ones that are new or still
// missing an import flag, open the notice page and read the rendered text (imports, budget, snippet).
const IMPORTS = t => /不(?:接受|允许)进口|进口产品[^。]{0,8}(?:否|不允许|不接受)/.test(t) ? '不接受'
  : /(?:接受|允许)进口|进口产品[^。]{0,8}是/.test(t) ? '允许' : '';
const BUDGET = t => { const m = t.match(/预算(?:金额)?[^0-9]{0,12}([0-9][0-9.,]*)\s*(万元|元)/); return m ? m[1].replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') + m[2] : ''; };
const known = new Map(notices.map(n => [n._id, n]));
const needText = results.filter(r => r.ok).flatMap(r => r.rows)
  .filter(row => /\/provider\/#\/publish\//.test(row.url) && !row.snippet && !(known.get(row._id) || {}).imports)
  .slice(0, 30);
for (const row of needText) {
  const page = await ctx.newPage();
  try {
    await page.goto(row.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, '');
    row.imports = IMPORTS(text) || row.imports;
    row.budget = BUDGET(text) || row.budget;
    const i = text.search(/采购需求|项目内容|采购内容/);
    if (i >= 0) row.snippet = text.slice(i, i + 160);
    console.log(`detail ${row._id}: imports=${row.imports || '-'} budget=${row.budget || '-'}`);
  } catch (e) {
    console.log(`detail ${row._id}: ${String(e.message || e).split('\n')[0]}`);
  } finally { await page.close(); }
}
await browser.close();

// Merge: keep everything already in the file; add new ids; refresh deadline/budget/imports
// on existing ones only when the scan has a value and the file doesn't.
const byId = new Map(notices.map(n => [n._id, n]));
const added = [];
for (const r of results.filter(r => r.ok)) {
  for (const row of r.rows) {
    const cur = byId.get(row._id);
    if (!cur) {
      const fresh = { ...row, titleEn: '', noteEn: '' };
      byId.set(row._id, fresh);
      added.push(fresh);
    } else {
      for (const k of ['deadline', 'budget', 'imports', 'snippet']) if (!cur[k] && row[k]) cur[k] = row[k];
      // Re-found rows take the current keyword rules.
      for (const k of ['strong', 'weak', 'tier']) cur[k] = row[k];
    }
  }
}
const merged = [...byId.values()].sort((a, b) => String(b.published).localeCompare(String(a.published)));

meta.lastRun = beijingNow();
meta.lastResults = results.map(r => ({ school: r.school, ok: r.ok, ...(r.ok ? { scanned: r.scanned, matches: r.rows.length } : { error: r.error }) }));
for (const r of results.filter(r => r.ok)) {
  meta.coverage[r.school] = { ...(meta.coverage[r.school] || {}), scanned: r.scanned, oldest: r.oldest };
}

await writeJson('data/notices.json', merged);
await writeJson('data/meta.json', meta);

const failed = results.filter(r => !r.ok);
const summary = [
  `## Tender scan ${meta.lastRun} (Beijing)`,
  '',
  `New matches: **${added.length}**`,
  ...added.map(a => `- [${a.school}] ${a.tier === 'strong' ? '**strong**' : 'weak'} · ${a.title} · deadline ${a.deadline || '—'} · imports ${a.imports || 'not stated'}`),
  '',
  '| University | Result |', '|---|---|',
  ...results.map(r => `| ${r.school} | ${r.ok ? `${r.scanned} scanned, ${r.rows.length} matches` : `failed: ${r.error}`} |`),
].join('\n');
console.log('\n' + summary);
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, summary + '\n', { flag: 'a' });

// Fail the job only if every site failed, so one blocked site doesn't hide the others' results.
if (failed.length === SITES.length) process.exit(1);
