// Round 5 (diagnostic retry): 50 more universities + research institutes.
import { chromium } from 'playwright';
import dns from 'node:dns/promises';
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const UNIS = {
  PKU:'pku.edu.cn',
  NEU:'neu.edu.cn',
  BJTU:'bjtu.edu.cn',
  USTB:'ustb.edu.cn',
  BJUT:'bjut.edu.cn',
  BISTU:'bistu.edu.cn',
  USST:'usst.edu.cn',
  SSPU:'sspu.edu.cn',
  WUST:'wust.edu.cn',
  ZJUT:'zjut.edu.cn',
  ZSTU:'zstu.edu.cn',
  XAUAT:'xauat.edu.cn',
  XUPT:'xupt.edu.cn',
  XATU:'xatu.edu.cn',
  GDUT:'gdut.edu.cn',
  SCUT:'scut.edu.cn',
  YSU:'ysu.edu.cn',
  SYLU:'sylu.edu.cn',
  CUST:'cust.edu.cn',
  NUC:'nuc.edu.cn',
  TJUT:'tjut.edu.cn',
  TGU:'tiangong.edu.cn',
  NJUST:'njust.edu.cn',
  HHU:'hhu.edu.cn',
  YZU:'yzu.edu.cn',
  HQU:'hqu.edu.cn',
  FZU:'fzu.edu.cn',
  NCU:'ncu.edu.cn',
  GUET:'guet.edu.cn',
  GXU:'gxu.edu.cn',
  GZU:'gzu.edu.cn',
  YNU:'ynu.edu.cn',
  SWU:'swu.edu.cn',
  SWPU:'swpu.edu.cn',
  CDUT:'cdut.edu.cn',
  LUT:'lut.edu.cn',
  XJU:'xju.edu.cn',
  SXU:'sxu.edu.cn',
  ZZU:'zzu.edu.cn',
  OUC:'ouc.edu.cn',
  QUST:'qust.edu.cn',
  UPC:'upc.edu.cn',
  JNU:'jnu.edu.cn',
  HRBEU:'hrbeu.edu.cn',
  HRBUST:'hrbust.edu.cn',
  HNU:'hnu.edu.cn',
  NUIST:'nuist.edu.cn',
  NBU:'nbu.edu.cn',
  SAU:'sau.edu.cn',
  NWU:'nwu.edu.cn',
  LZU:'lzu.edu.cn',
  SWUST:'swust.edu.cn',
  XUST:'xust.edu.cn',
  CHD:'chd.edu.cn',
  CQUT:'cqut.edu.cn',
  CQJTU:'cqjtu.edu.cn',
  CSUST:'csust.edu.cn',
  HUBU:'hubu.edu.cn',
  SHIEP:'shiep.edu.cn',
  SHMTU:'shmtu.edu.cn',
  ZJU:'zju.edu.cn',
  NJU:'nju.edu.cn',
  SEU:'seu.edu.cn',
  NANKAI:'nankai.edu.cn',
  CQUPT:'cqupt.edu.cn',
  IOP_CAS_GBA:'sslab.org.cn',
  CAEP:'caep.cn',
  ZJLAB:'zhejianglab.com',
  CIOMP:'ciomp.cas.cn',
  SIOM:'siom.cas.cn',
  IOE:'ioe.cas.cn',
  XIOPM:'opt.cas.cn',
  AIOFM:'aiofm.cas.cn',
  SEMI:'semi.cas.cn',
  IPHY:'iop.cas.cn',
  IPC:'ipc.cas.cn',
  SIA:'sia.cas.cn',
  SITP:'sitp.cas.cn',
  NIAOT:'niaot.cas.cn',
  SIMIT:'sim.cas.cn',
  IOA:'ioa.cas.cn',
  IME:'ime.cas.cn',
  IOM:'imech.cas.cn',
  NIMTE:'nimte.cas.cn',
  SINANO:'sinano.cas.cn',
  SIAT:'siat.cas.cn',
  HFIPS:'hf.cas.cn',
  DICP:'dicp.cas.cn',
  IMR:'imr.cas.cn',
  SARI:'sari.cas.cn',
  SSRF:'sinap.cas.cn',
  NAOC:'nao.cas.cn',
  CSSAR:'nssc.cas.cn',
  CSU_CAS:'csu.cas.cn',
  ISA:'xao.cas.cn',
  IOP_GZ:'giec.cas.cn',
  QIBEBT:'qibebt.cas.cn',
  SIOC_OPT:'shao.cas.cn',
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
const DIAG = [];
for (const [key, dom] of Object.entries(UNIS).filter((_, i) => i % SHARDS === SHARD)) {
  const hosts = new Set();
  await Promise.all(PREFIX.map(async p => { try { await dns.lookup(`${p}.${dom}`); hosts.add(`${p}.${dom}`); } catch {} }));
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
  for (const h of hosts) {
    let page = null;
    for (const proto of ['https', 'http']) { page = await open(`${proto}://${h}/`); if (page) break; }
    if (!page) continue;
    const title = await page.title();
    if (REL.test(title) || /sfw/.test(page.url())) await examine(key, page, out).catch(() => {});
    await page.close();
  }
  await writeFile(FILE, JSON.stringify(out, null, 1));
  await writeFile(new URL(`./diag-${SHARD}.json`, import.meta.url), JSON.stringify(DIAG, null, 1));
}
await browser.close();
await writeFile(FILE, JSON.stringify(out, null, 1));
