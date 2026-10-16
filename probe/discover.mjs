// Discover procurement sites for candidate universities from GitHub's servers.
import { chromium } from 'playwright';
import dns from 'node:dns/promises';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const UNIS = {
  XIDIAN: 'xidian.edu.cn', HRBEU: 'hrbeu.edu.cn', NJUST: 'njust.edu.cn', SCUT: 'scut.edu.cn', USTB: 'ustb.edu.cn',
  CUST: 'cust.edu.cn', JLU: 'jlu.edu.cn', SDU: 'sdu.edu.cn', NEU: 'neu.edu.cn', HNU: 'hnu.edu.cn', CSU: 'csu.edu.cn',
  BJTU: 'bjtu.edu.cn', HFUT: 'hfut.edu.cn', SWJTU: 'swjtu.edu.cn', BJUT: 'bjut.edu.cn', SHANGHAITECH: 'shanghaitech.edu.cn',
  SZU: 'szu.edu.cn', WHUT: 'whut.edu.cn', SUDA: 'suda.edu.cn', CJLU: 'cjlu.edu.cn', GUET: 'guet.edu.cn', HDU: 'hdu.edu.cn',
  OUC: 'ouc.edu.cn', GDUT: 'gdut.edu.cn', YSU: 'ysu.edu.cn', NUC: 'nuc.edu.cn', XATU: 'xatu.edu.cn', ZJUT: 'zjut.edu.cn',
  ECUST: 'ecust.edu.cn', BISTU: 'bistu.edu.cn', XAUT: 'xaut.edu.cn', TYUT: 'tyut.edu.cn', UJS: 'ujs.edu.cn', ECNU: 'ecnu.edu.cn',
};
const PREFIX = ['zbb','zbcg','cgzx','ztb','zbzx','cg','cgb','cgzb','zb','bidding','ztbzx','zcc','zcglc','sbc','cgglc','cggl','cgc','zbcgzx','caigou','zbgl','zbxx','cgxx','zbtb','gzc','zcgl','ztbgl','cgw','zbgs','cgglzx','zcc2'];

const out = { hosts: [], homes: [], scans: [] };
const resolved = [];
await Promise.all(Object.entries(UNIS).flatMap(([key, dom]) => PREFIX.map(async p => {
  const h = `${p}.${dom}`;
  try { await dns.lookup(h); resolved.push([key, h]); } catch {}
})));
console.log('resolved', resolved.length);

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ignoreHTTPSErrors: true });
await ctx.addInitScript(() => { window.__CEDRAT_HEADLESS = true; window.__CEDRAT_PAGES = 1; });

async function look(url) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const html = document.documentElement.outerHTML;
      const anchors = Array.from(document.querySelectorAll('a'));
      return {
        title: document.title, url: location.href,
        sfw: /\/sfw[\w]*\//.test(location.href) || /sfw_cms|\/sfw\/e\?/.test(html.slice(0, 40000)),
        dated: anchors.filter(a => /20\d\d\s*[-年./]+\s*\d{1,2}/.test(((a.closest('li,tr') || a.parentElement || {}).textContent) || '')).length,
        nav: anchors.filter(a => /采购公告|招标公告|采购信息|招标信息|招标采购|公告/.test(a.textContent) && a.textContent.trim().length < 14)
          .slice(0, 15).map(a => a.textContent.trim() + '->' + (a.href || '')),
      };
    });
    return { page, info };
  } catch (e) { await page.close(); return null; }
}

for (const [key, h] of resolved) {
  let r = null;
  for (const proto of ['https', 'http']) { r = await look(`${proto}://${h}/`); if (r) break; }
  if (!r) continue;
  const { page, info } = r;
  const relevant = /采购|招标|招投标|资产|设备/.test(info.title) || info.sfw;
  out.hosts.push({ key, h, ...info, relevant });
  console.log('HOST', key, h, info.title.slice(0, 30), info.sfw, info.dated);
  if (relevant) {
    try {
      const res = await page.evaluate(src => (0, eval)(src), scanSrc);
      out.scans.push({ key, h, url: info.url, scanned: res.scanned, oldest: res.oldest, n: res.rows.length,
        rows: res.rows.slice(0, 5).map(x => `${x._id} | ${x.tier} | ${x.title.slice(0, 36)}`), sample: res.sample });
      console.log('  SCAN', res.scanned, res.oldest, res.rows.length);
    } catch (e) { out.scans.push({ key, h, url: info.url, error: String(e.message || e).slice(0, 160) }); }
  }
  await page.close();
}

for (const [key, dom] of Object.entries(UNIS)) {
  for (const u of [`https://www.${dom}/`, `http://www.${dom}/`]) {
    const page = await ctx.newPage();
    try {
      await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1500);
      const links = await page.evaluate(() => Array.from(document.querySelectorAll('a'))
        .filter(a => /招标|采购|招投标/.test(a.textContent)).slice(0, 12).map(a => a.textContent.trim().slice(0, 20) + '->' + a.href));
      out.homes.push({ key, u, links });
      await page.close();
      break;
    } catch { await page.close(); }
  }
}
await browser.close();
await writeFile(new URL('./discover.json', import.meta.url), JSON.stringify(out, null, 1));
