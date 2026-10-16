// Round 7: another batch of engineering universities. 50 more universities + research institutes.
import { chromium } from 'playwright';
import dns from 'node:dns/promises';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const UNIS = {
  NCUT:'ncut.edu.cn', CUP:'cup.edu.cn', CUMTB:'cumtb.edu.cn', HEBUST:'hebust.edu.cn', TUST:'tust.edu.cn', DJTU:'djtu.edu.cn', SUT:'sut.edu.cn',
  LNTU:'lntu.edu.cn', CCUT:'ccut.edu.cn', NEEPU:'neepu.edu.cn', NEPU:'nepu.edu.cn', SDUT:'sdut.edu.cn', UJN:'ujn.edu.cn', YTU:'ytu.edu.cn',
  SDJZU:'sdjzu.edu.cn', CCZU:'cczu.edu.cn', NJFU:'njfu.edu.cn', JSNU:'jsnu.edu.cn', YCIT:'ycit.edu.cn', USTS:'usts.edu.cn', HYIT:'hyit.edu.cn',
  CJLU:'cjlu.edu.cn', ZUST:'zust.edu.cn', SUES:'sues.edu.cn', SIT:'sit.edu.cn', SDJU:'sdju.edu.cn', AHUT:'ahut.edu.cn', AUST:'aust.edu.cn',
  XMUT:'xmut.edu.cn', FJNU:'fjnu.edu.cn', JMU:'jmu.edu.cn', JXUST:'jxust.edu.cn', ECJTU:'ecjtu.edu.cn', ECUT:'ecut.edu.cn', HAUT:'haut.edu.cn',
  HPU:'hpu.edu.cn', ZZULI:'zzuli.edu.cn', HAUST:'haust.edu.cn', NCWU:'ncwu.edu.cn', HBUT:'hbut.edu.cn', WTU:'wtu.edu.cn', CTGU:'ctgu.edu.cn',
  YANGTZEU:'yangtzeu.edu.cn', HNUST:'hnust.edu.cn', USC:'usc.edu.cn', HUT:'hut.edu.cn', GZHU:'gzhu.edu.cn', DGUT:'dgut.edu.cn', STU:'stu.edu.cn',
  WYU:'wyu.edu.cn', GLUT:'glut.edu.cn', CUIT:'cuit.edu.cn', XHU:'xhu.edu.cn', SUSE:'suse.edu.cn', SUST:'sust.edu.cn', XAUT:'xaut.edu.cn',
  XSYU:'xsyu.edu.cn', SNNU:'snnu.edu.cn', LZJTU:'lzjtu.edu.cn', TYUST:'tyust.edu.cn', IMUT:'imut.edu.cn', HAINANU:'hainanu.edu.cn', NXU:'nxu.edu.cn',
  CNU:'cnu.edu.cn', TJNU:'tjnu.edu.cn', NUIST:'nuist.edu.cn', ZJUT:'zjut.edu.cn', BJUT:'bjut.edu.cn', YNU:'ynu.edu.cn', GZU:'gzu.edu.cn',
  SZPU:'szpu.edu.cn', GDOU:'gdou.edu.cn', NUAA:'nuaa.edu.cn', HHU:'hhu.edu.cn', CQU2:'cqupt.edu.cn',
};
const PREFIX = ['zbcgzx','ztbb','zbcgc','cgzbc','zbcgw','zcb','zcsbc','sbzx','zcsbc','gzzx','zbcgb','cgb','cwc','ggzy','tzgg','zbgl','zb2','czc','cgbgs','zbb','zbcg','cgzx','ztb','zbzx','cg','cgb','cgzb','zb','bidding','ztbzx','zcc','zcglc','sbc','cgglc','cggl','cgc','zbcgzx','caigou','zbgl','zbxx','cgxx','zbtb','gzc','zcgl','ztbgl','cgw','zbgs','cgglzx','zbc','czzx','zbcgb','cgzbzx','zcsb'];
const REL = /采购|招标|招投标/;

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ignoreHTTPSErrors: true });
await ctx.addInitScript(() => { window.__CEDRAT_HEADLESS = true; window.__CEDRAT_PAGES = 1; });
const run = (page, cfg) => page.evaluate(([src, c]) => { window.__CEDRAT_SITE = c; return (0, eval)(src); }, [scanSrc, cfg]);
const brief = r => ({ scanned: r.scanned, oldest: r.oldest, n: r.rows.length, newest: (r.sample || []).map(s => s.p + ' ' + s.t.slice(0, 28)),
  rows: r.rows.slice(0, 4).map(x => `${x._id} | ${x.tier} | ${x.title.slice(0, 34)}`) });

async function open(url) {
  const page = await ctx.newPage();
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }); await page.waitForTimeout(2500); return page; }
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
const DIAG = [];
for (const [key, dom] of Object.entries(UNIS).filter((_, i) => i % SHARDS === SHARD)) {
  const hosts = new Set();
  let wild = false; try { await dns.lookup(`zq${Math.random().toString(36).slice(2, 8)}.${dom}`); wild = true; } catch {}
  if (!wild) await Promise.all(PREFIX.map(async p => { try { await dns.lookup(`${p}.${dom}`); hosts.add(`${p}.${dom}`); } catch {} }));
  // links from the university home page
  const diag = { key, dom, home: null, links: [], hosts: [] };
  for (const u of [`https://www.${dom}/`, `http://www.${dom}/`, `https://${dom}/`, `http://${dom}/`]) {
    const p = await open(u); if (!p) continue;
    diag.home = u;
    diag.links = await p.evaluate(() => [...new Set(Array.from(document.querySelectorAll('a')).filter(a => /招标|采购|招投标/.test(a.textContent)).map(a => a.textContent.trim().slice(0, 12) + ' ' + a.href))].slice(0, 10));
    const links = await p.evaluate(() => [...new Set(Array.from(document.querySelectorAll('a')).filter(a => /招标|采购|招投标/.test(a.textContent) && a.textContent.trim().length < 16).map(a => a.href))].slice(0, 6));
    await p.close();
    for (const l of links) {
      try {
        const h = new URL(l).host;
        if (!h.endsWith(dom)) continue;
        if (!h.startsWith('www.')) hosts.add(h);
        else { const pg = await open(l); if (pg) { await examine(key, pg, out).catch(() => {}); await pg.close(); } }
      } catch {}
    }
    break;
  }
  diag.hosts = [...hosts]; DIAG.push(diag);
  for (const h of [...hosts].slice(0, 8)) {
    let page = null;
    for (const proto of ['https', 'http']) { page = await open(`${proto}://${h}/`); if (page) break; }
    if (!page) continue;
    const title = await page.title();
    if (REL.test(title) || /sfw/.test(page.url()) || /采购|招标/.test(await page.evaluate(() => document.body?.innerText.slice(0, 3000) || ''))) await examine(key, page, out).catch(() => {});
    await page.close();
  }
  await writeFile(FILE, JSON.stringify(out, null, 1));
  await writeFile(new URL(`./diag-${SHARD}.json`, import.meta.url), JSON.stringify(DIAG, null, 1));
}
await browser.close();
await writeFile(FILE, JSON.stringify(out, null, 1));
