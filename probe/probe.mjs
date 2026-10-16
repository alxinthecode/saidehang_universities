// Probe round 2: run scraper/scan.js on every site in scraper/sites.json and
// record diagnostics for sites that still need their own reader.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const sites = JSON.parse(await readFile(new URL('scraper/sites.json', ROOT), 'utf8'));
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');

const DIAG = [['CQUPT', 'https://zcgl.cqupt.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ']];

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

const HOSTS = {"NJUST": ["zbb.njust.edu.cn", "cgzx.njust.edu.cn", "zbcg.njust.edu.cn", "ztb.njust.edu.cn"], "SCUT": ["cgzx.scut.edu.cn", "ztb.scut.edu.cn", "zbb.scut.edu.cn", "zbcg.scut.edu.cn"], "SDU": ["cgzb.sdu.edu.cn", "zbb.sdu.edu.cn", "cg.sdu.edu.cn", "zbcg.sdu.edu.cn"], "JLU": ["zbcg.jlu.edu.cn", "cgzx.jlu.edu.cn", "zbb.jlu.edu.cn"], "BJUT": ["zbcg.bjut.edu.cn", "cgzx.bjut.edu.cn", "zbb.bjut.edu.cn"], "SHU": ["cgzb.shu.edu.cn", "zbcg.shu.edu.cn", "cgzx.shu.edu.cn"], "ECNU": ["cgzx.ecnu.edu.cn", "zbcg.ecnu.edu.cn", "cgb.ecnu.edu.cn"], "NEU": ["zbcg.neu.edu.cn", "cgzx.neu.edu.cn", "zbb.neu.edu.cn"], "HFUT": ["zbcg.hfut.edu.cn", "cgzx.hfut.edu.cn", "zbb.hfut.edu.cn"], "USTB": ["zbcg.ustb.edu.cn", "cgzx.ustb.edu.cn", "zbb.ustb.edu.cn"], "XIDIAN": ["zbcg.xidian.edu.cn", "cgzx.xidian.edu.cn", "zbb.xidian.edu.cn", "cgb.xidian.edu.cn"], "HRBEU": ["zbcg.hrbeu.edu.cn", "cgzx.hrbeu.edu.cn", "zbb.hrbeu.edu.cn"], "NJTECH": ["ztb.njtech.edu.cn"], "UCAS": ["cgzx.ucas.ac.cn", "zbcg.ucas.ac.cn"]};
out.hosts = [];
for (const [key, list] of Object.entries(HOSTS)) {
  for (const h of list) {
    for (const proto of ['https', 'http']) {
      const page = await ctx.newPage();
      try {
        await page.goto(`${proto}://${h}/`, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(2500);
        const info = await page.evaluate(() => ({ title: document.title, url: location.href,
          sfw: /sfw/.test(location.href + document.documentElement.outerHTML.slice(0, 30000)),
          tech: ((document.body && document.body.innerText || '').match(/技术支持[^\n]{0,24}/) || [''])[0],
          dated: Array.from(document.querySelectorAll('a')).filter(a => /20\d\d[-年./]\d{1,2}/.test((a.closest('li,tr') || a.parentElement || {}).textContent || '')).length }));
        out.hosts.push({ key, h, proto, ...info });
        console.log('HOST', key, h, proto, info.title, info.sfw, info.dated);
        await page.close();
        break;
      } catch (e) { await page.close(); }
    }
  }
}

await browser.close();
await writeFile(new URL('./results.json', import.meta.url), JSON.stringify(out, null, 1));
