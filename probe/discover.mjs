// Round 3: full discovery pipeline for another batch of universities.
import { chromium } from 'playwright';
import dns from 'node:dns/promises';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const UNIS = {
  UCAS: 'ucas.ac.cn', NJUPT: 'njupt.edu.cn', NUIST: 'nuist.edu.cn', HEBUT: 'hebut.edu.cn', NCEPU: 'ncepu.edu.cn',
  BUCT: 'buct.edu.cn', DHU: 'dhu.edu.cn', USST: 'usst.edu.cn', NBU: 'nbu.edu.cn', NCHU: 'nchu.edu.cn', SAU: 'sau.edu.cn',
  CAUC: 'cauc.edu.cn', JIANGNAN: 'jiangnan.edu.cn', FZU: 'fzu.edu.cn', NCU: 'ncu.edu.cn', ZZU: 'zzu.edu.cn', NWU: 'nwu.edu.cn',
  LZU: 'lzu.edu.cn', AHU: 'ahu.edu.cn', JNU: 'jnu.edu.cn', SCNU: 'scnu.edu.cn', SZTU: 'sztu.edu.cn', HRBUST: 'hrbust.edu.cn',
  SWUST: 'swust.edu.cn', XUST: 'xust.edu.cn', CHD: 'chd.edu.cn', QDU: 'qdu.edu.cn', SDUST: 'sdust.edu.cn', CCNU: 'ccnu.edu.cn',
  CUG: 'cug.edu.cn', NJUST: 'njust.edu.cn', SCUT: 'scut.edu.cn', HRBEU: 'hrbeu.edu.cn', HNU: 'hnu.edu.cn', CUST: 'cust.edu.cn',
};
const PREFIX = ['zbb','zbcg','cgzx','ztb','zbzx','cg','cgb','cgzb','zb','bidding','ztbzx','zcc','zcglc','sbc','cgglc','cggl','cgc','zbcgzx','caigou','zbgl','zbxx','cgxx','zbtb','gzc','zcgl','ztbgl','cgw','zbgs','cgglzx','zbc','czzx','zbcgb','cgzbzx','zcsb'];
const REL = /采购|招标|招投标/;

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ignoreHTTPSErrors: true });
await ctx.addInitScript(() => { window.__CEDRAT_HEADLESS = true; window.__CEDRAT_PAGES = 1; });
const run = (page, cfg) => page.evaluate(([src, c]) => { window.__CEDRAT_SITE = c; return (0, eval)(src); }, [scanSrc, cfg]);
const brief = r => ({ scanned: r.scanned, oldest: r.oldest, n: r.rows.length, newest: (r.sample || []).map(s => s.p + ' ' + s.t.slice(0, 28)),
  rows: r.rows.slice(0, 4).map(x => `${x._id} | ${x.tier} | ${x.title.slice(0, 34)}`) });

async function open(url) {
  const page = await ctx.newPage();
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }); await page.waitForTimeout(1500); return page; }
  catch { await page.close(); return null; }
}
async function examine(key, page, out) {
  const info = await page.evaluate(() => {
    const html = document.documentElement.outerHTML, seen = new Set();
    return { title: document.title, url: location.href,
      sfw: /\/sfw[\w]*\//.test(location.href) || /sfw_cms|\/sfw\/e\?/.test(html.slice(0, 40000)),
      navs: Array.from(document.querySelectorAll('a[href]'))
        .filter(a => /采购公告|招标公告|询价|竞价|比选|磋商|采购信息|招标信息|货物|公开招标|更多|MORE|more/.test(a.textContent) && a.textContent.trim().length <= 12)
        .map(a => ({ t: a.textContent.trim(), h: a.href })).filter(x => /^https?:/.test(x.h) && !seen.has(x.h) && seen.add(x.h)).slice(0, 8) };
  });
  const e = { key, ...info, cands: [] };
  if (info.sfw) { try { e.sfwScan = brief(await run(page, { key, kind: 'sfw' })); } catch (err) { e.sfwErr = String(err.message || err).slice(0, 100); } }
  for (const u of [info.url, ...info.navs.map(n => n.h)]) {
    try { const r = await run(page, { key, kind: 'list', lists: [{ url: u }] }); if (r.scanned) e.cands.push({ u, label: (info.navs.find(n => n.h === u) || {}).t || 'home', ...brief(r) }); } catch {}
  }
  out.push(e);
  console.log('SITE', key, info.title.slice(0, 30), info.sfw, e.cands.length);
}

const SHARD = Number(process.env.SHARD || 0), SHARDS = Number(process.env.SHARDS || 1);
const FILE = new URL(`./discover-${SHARD}.json`, import.meta.url);
const out = [];
for (const [key, dom] of Object.entries(UNIS).filter((_, i) => i % SHARDS === SHARD)) {
  const hosts = new Set();
  await Promise.all(PREFIX.map(async p => { try { await dns.lookup(`${p}.${dom}`); hosts.add(`${p}.${dom}`); } catch {} }));
  // links from the university home page
  for (const u of [`https://www.${dom}/`, `http://www.${dom}/`]) {
    const p = await open(u); if (!p) continue;
    const links = await p.evaluate(() => Array.from(document.querySelectorAll('a')).filter(a => /招标|采购|招投标/.test(a.textContent)).map(a => a.href).slice(0, 8));
    await p.close();
    for (const l of links) { try { const h = new URL(l).host; if (h.endsWith(dom) && !h.startsWith('www.')) hosts.add(h); } catch {} }
    break;
  }
  for (const h of hosts) {
    let page = null;
    for (const proto of ['https', 'http']) { page = await open(`${proto}://${h}/`); if (page) break; }
    if (!page) continue;
    const title = await page.title();
    if (REL.test(title) || /sfw/.test(page.url())) await examine(key, page, out).catch(() => {});
    await page.close();
  }
  await writeFile(FILE, JSON.stringify(out, null, 1));
}
await browser.close();
await writeFile(FILE, JSON.stringify(out, null, 1));
