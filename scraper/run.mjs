// Headless scan of the five university procurement platforms.
// Runs scraper/scan.js inside each site with Playwright, then merges new
// matches into data/notices.json (keeping status/notes) and updates
// data/meta.json. Used by .github/workflows/scan.yml; also runs locally:
//   npm install && npx playwright install chromium && node scraper/run.mjs
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const PAGES = Number(process.env.SCAN_PAGES || 1); // 1 = newest 100 per platform

const SITES = [
  { school: 'THU', url: 'https://sbcgczxxfb.sysc.tsinghua.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ&catalog=A' },
  { school: 'TJU', url: 'https://zbb.tju.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ' },
  { school: 'HIT', url: 'https://cgzx.hit.edu.cn/sfw_cms/e?page=cms.psms.gglist&shopping_type=GKCG&typeDetail=XQ' },
  { school: 'SJTU', url: 'https://pboffice.sjtu.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ&cate=103249' },
  { school: 'BUAA', url: 'https://zbcg.buaa.edu.cn/cggg/gkzb_bx_jc.htm' },
];

const readJson = async (p, fallback) => {
  try { return JSON.parse(await readFile(new URL(p, ROOT), 'utf8')); } catch { return fallback; }
};
const writeJson = (p, v) => writeFile(new URL(p, ROOT), JSON.stringify(v, null, 2) + '\n', 'utf8');

const beijingNow = () => {
  const d = new Date(Date.now() + 8 * 3600e3);
  return d.toISOString().slice(0, 16);
};

const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const notices = await readJson('data/notices.json', []);
const meta = await readJson('data/meta.json', { coverage: {}, extra: [] });
meta.coverage ||= {};

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
await ctx.addInitScript(pages => { window.__CEDRAT_HEADLESS = true; window.__CEDRAT_PAGES = pages; }, PAGES);

const results = [];
for (const site of SITES) {
  const page = await ctx.newPage();
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    const res = await page.evaluate(src => (0, eval)(src), scanSrc);
    if (!res || !Array.isArray(res.rows)) throw new Error('scan returned no result (page layout may have changed)');
    results.push({ school: site.school, ok: true, ...res });
    console.log(`${site.school}: scanned ${res.scanned}, back to ${res.oldest}, ${res.rows.length} matches`);
  } catch (e) {
    results.push({ school: site.school, ok: false, error: String(e.message || e).split('\n')[0] });
    console.log(`${site.school}: FAILED — ${String(e.message || e).split('\n')[0]}`);
  } finally {
    await page.close();
  }
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
