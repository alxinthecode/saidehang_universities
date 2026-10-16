// Round 2: find the announcement list page on each candidate site and test the readers on it.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const SFW = [
  ['JLU', 'https://cgglzx.jlu.edu.cn/', null], ['SDU', 'https://zcgl.sdu.edu.cn/', null],
  ['ECNU', 'https://cgxx.ecnu.edu.cn/', null], ['HFUT', 'https://zb.hfut.edu.cn/sfw/e?page=cms.index', 'sfw'],
  ['HFUT2', 'https://zb.hfut.edu.cn/', null],
];
const LIST = {
  XIDIAN: 'https://cg.xidian.edu.cn/', HDU: 'https://cgzx.hdu.edu.cn/', SZU: 'https://bidding.szu.edu.cn/',
  SWJTU: 'https://bidding.swjtu.edu.cn/', NEU: 'https://zcc.neu.edu.cn/', TYUT: 'https://cgzb.tyut.edu.cn/',
  UJS: 'https://cgb.ujs.edu.cn/', XAUT: 'https://zcc.xaut.edu.cn/', BISTU: 'https://zcc.bistu.edu.cn/',
  WHUT: 'https://gzc.whut.edu.cn/', SUDA: 'https://zbzx.suda.edu.cn/', CSU: 'http://czzx.csu.edu.cn/csustatic/index.html',
  SHANGHAITECH: 'https://www.shanghaitech.edu.cn/1428/list1.htm', GUET: 'https://www.guet.edu.cn/6361/list.htm',
  XATU: 'https://www.xatu.edu.cn/index/cgzb.htm', ECNU_L: 'https://cgxx.ecnu.edu.cn/',
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ignoreHTTPSErrors: true });
await ctx.addInitScript(() => { window.__CEDRAT_HEADLESS = true; window.__CEDRAT_PAGES = 1; });
const out = { sfw: [], list: [] };
const run = (page, cfg) => page.evaluate(([src, c]) => { window.__CEDRAT_SITE = c; return (0, eval)(src); }, [scanSrc, cfg]);
const brief = r => ({ scanned: r.scanned, oldest: r.oldest, n: r.rows.length, newest: (r.sample || []).map(s => s.p + ' ' + s.t.slice(0, 28)),
  rows: r.rows.slice(0, 4).map(x => `${x._id} | ${x.tier} | ${x.title.slice(0, 34)}`) });

for (const [key, url, prefix] of SFW) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const r = await run(page, { key, kind: 'sfw', ...(prefix ? { prefix } : {}) });
    out.sfw.push({ key, url: page.url(), ...brief(r) }); console.log('SFW', key, r.scanned, r.rows.length);
  } catch (e) { out.sfw.push({ key, url, error: String(e.message || e).slice(0, 200) }); console.log('SFW', key, 'ERR'); }
  await page.close();
}

for (const [key, url] of Object.entries(LIST)) {
  const page = await ctx.newPage();
  const entry = { key, url, cands: [] };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    entry.final = page.url();
    entry.title = await page.title();
    const navs = await page.evaluate(() => {
      const seen = new Set();
      return Array.from(document.querySelectorAll('a[href]'))
        .filter(a => /采购公告|招标公告|询价|竞价|比选|磋商|采购信息|招标信息|货物|公开招标|更多|MORE|more/.test(a.textContent) && a.textContent.trim().length <= 12)
        .map(a => ({ t: a.textContent.trim(), h: a.href }))
        .filter(x => /^https?:/.test(x.h) && !seen.has(x.h) && seen.add(x.h)).slice(0, 14);
    });
    entry.navs = navs;
    for (const u of [entry.final, ...navs.map(n => n.h)]) {
      try {
        const r = await run(page, { key, kind: 'list', lists: [{ url: u }] });
        entry.cands.push({ u, label: (navs.find(n => n.h === u) || {}).t || 'home', ...brief(r) });
      } catch (e) { entry.cands.push({ u, error: String(e.message || e).slice(0, 120) }); }
    }
  } catch (e) { entry.error = String(e.message || e).slice(0, 200); }
  out.list.push(entry); console.log('LIST', key, entry.cands.length);
  await page.close();
}
await browser.close();
await writeFile(new URL('./discover.json', import.meta.url), JSON.stringify(out, null, 1));
