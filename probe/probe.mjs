// Probe round 2: run scraper/scan.js on every site in scraper/sites.json and
// record diagnostics for sites that still need their own reader.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const sites = JSON.parse(await readFile(new URL('scraper/sites.json', ROOT), 'utf8'));
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');

const DIAG = [['SHU', 'https://czb.shu.edu.cn/'], ['NJTECH', 'https://ztb.njtech.edu.cn/']];

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ignoreHTTPSErrors: true });
await ctx.addInitScript(() => { window.__CEDRAT_HEADLESS = true; window.__CEDRAT_PAGES = 1; });
const out = { scans: [], diag: [] };

for (const site of sites) {
  const page = await ctx.newPage();
  const t0 = Date.now();
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const res = await page.evaluate(([src, cfg]) => { window.__CEDRAT_SITE = cfg; return (0, eval)(src); }, [scanSrc, site]);
    out.scans.push({ key: site.key, ok: true, secs: (Date.now() - t0) / 1000, scanned: res.scanned, oldest: res.oldest, n: res.rows.length,
      rows: res.rows.map(r => `${r._id} | ${r.tier} | ${r.deadline} | ${r.title.slice(0, 40)}`), sample: res.sample });
    console.log(site.key, 'OK', res.scanned, res.oldest, res.rows.length);
  } catch (e) {
    out.scans.push({ key: site.key, ok: false, error: String(e.message || e).split('\n')[0].slice(0, 300) });
    console.log(site.key, 'FAIL', String(e.message || e).split('\n')[0].slice(0, 200));
  }
  await page.close();
}

for (const [key, url] of DIAG) {
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', r => { const t = r.resourceType(); if (t === 'xhr' || t === 'fetch') reqs.push({ m: r.method(), u: r.url().slice(0, 300), b: (r.postData() || '').slice(0, 800) }); });
  const json = [];
  page.on('response', async r => { try { if (/json|javascript|text\/plain/.test(r.headers()['content-type'] || '') && ['xhr', 'fetch'].includes(r.request().resourceType()) && json.length < 8) { const t = await r.text(); json.push({ u: r.url().slice(0, 200), head: t.slice(0, 2500) }); } } catch {} });
  const d = { key, url };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(6000);
    d.page = await page.evaluate(() => ({
      title: document.title, url: location.href, text: document.body ? document.body.innerText.slice(0, 2500) : '',
      links: Array.from(document.querySelectorAll('a')).slice(0, 120).map(a => (a.innerText || '').trim().slice(0, 30) + ' -> ' + (a.getAttribute('href') || '').slice(0, 100) + ' ' + (a.getAttribute('onclick') || '').slice(0, 100)),
    }));
  } catch (e) { d.error = String(e.message || e).split('\n')[0].slice(0, 300); }
  d.reqs = reqs.slice(0, 30);
  d.json = json;
  out.diag.push(d);
  console.log('DIAG', key, d.error || d.page?.title);
  await page.close();
}

await browser.close();
await writeFile(new URL('./results.json', import.meta.url), JSON.stringify(out, null, 1));
