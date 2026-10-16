// Round 6: open explicit candidate URLs (found by DNS / home-page links) with a longer timeout.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
const ROOT = new URL('..', import.meta.url);
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const T = {
  BJTU: ['cg.bjtu.edu.cn', 'cggl.bjtu.edu.cn', 'czzx.bjtu.edu.cn', 'gzc.bjtu.edu.cn'], CDUT: ['cg.cdut.edu.cn', 'cgzb.cdut.edu.cn', 'zb.cdut.edu.cn'],
  NEU: ['cgzx.neu.edu.cn'], PKU: ['cg.pku.edu.cn', 'zb.pku.edu.cn'], SCUT: ['zbzx.scut.edu.cn'], HNU: ['cg.hnu.edu.cn'], HQU: ['zb.hqu.edu.cn', 'cggl.hqu.edu.cn'],
  HRBEU: ['cgb.hrbeu.edu.cn', 'cggl.hrbeu.edu.cn'], JNU: ['cgzx.jnu.edu.cn', 'zbcg.jnu.edu.cn', 'zbtb.jnu.edu.cn'], LZU: ['zbb.lzu.edu.cn'],
  NJUST: ['cgzx.njust.edu.cn', 'zb.njust.edu.cn'], QUST: ['czzx.qust.edu.cn'], SAU: ['zbcgb.sau.edu.cn', 'cg.sau.edu.cn'], SHMTU: ['cggl.shmtu.edu.cn'],
  SWU: ['caigou.swu.edu.cn'], YZU: ['cgb.yzu.edu.cn', 'cggl.yzu.edu.cn', 'cgc.yzu.edu.cn'], SEU: ['zbb.seu.edu.cn', 'cgzx.seu.edu.cn'], USST: ['zbb.usst.edu.cn', 'zb.usst.edu.cn'],
  LUT: ['zbzx.lut.edu.cn', 'cggl.lut.edu.cn'], CQJTU: ['zbcgzx.cqjtu.edu.cn'], HUBU: ['ztb.hubu.edu.cn', 'cg.hubu.edu.cn'], SWUST: ['zb.swust.edu.cn'],
  TGU: ['cgglzx.tiangong.edu.cn'], XJU: ['zcglc.xju.edu.cn'], BISTU: ['zcc.bistu.edu.cn'], YSU: ['zcglc.ysu.edu.cn'], GXU: ['cg.gxu.edu.cn'],
  NCU: ['cgzx.ncu.edu.cn', 'cg.ncu.edu.cn'], HRBUST: ['gzc.hrbust.edu.cn'], CHD: ['zbb.chd.edu.cn/site/'], HHU: ['zbb.hhu.edu.cn'], UPC: ['zbb.upc.edu.cn'],
  ZSTU: ['cgzx.zstu.edu.cn'], NUC: ['zbcg.nuc.edu.cn'], NANKAI: ['nkzbb.nankai.edu.cn'], NBU: ['notice-nbu.pms.ucaigou.net'], NWU: ['cgzbxt.nwu.edu.cn/index', 'cgzx.nwu.edu.cn'],
  CQUPT: ['cgpt.cqupt.edu.cn/notices'], SWPU: ['cwcggl.swpu.edu.cn/index.chtml'], XATU: ['cgzb.xatu.edu.cn', 'www.xatu.edu.cn/index/cgzb.htm'],
  XAUAT: ['jdzcb.xauat.edu.cn/cgxx/cggg/hwl.htm'], XUST: ['gzc.xust.edu.cn/zbcg/yxgk.htm', 'www.xust.edu.cn/info/1256/'], SHIEP: ['xxgk.shiep.edu.cn/574/list.htm'],
  GUET: ['zbcg.guet.edu.cn', 'www.guet.edu.cn/6361/list.htm'], USTB: ['cg.ustb.edu.cn', 'zb.ustb.edu.cn'], ZJU: ['cgzx.zju.edu.cn'], NJU: ['zbb.nju.edu.cn'],
  // research institutes: notice / procurement columns
  HFIPS: ['www.hf.cas.cn/zncs/zcc/xmgg/'], CSU_CAS: ['csu.cas.cn/gb/qt/zfcg/'], IOA: ['www.ioa.cas.cn/tzgg/'], IOM: ['www.imech.cas.cn/notice/'],
  SSLAB: ['www.sslab.org.cn/news/notice'], NAOC: ['nao.cas.cn/news/tz/'], NIMTE: ['www.nimte.cas.cn/events/notice/'], QIBEBT: ['qibebt.cas.cn/news/notice/'],
  SEMI: ['semi.cas.cn/xxgk/xxgkcggs/'], SIAT: ['www.siat.cas.cn/jggl/tzgg/'], SINANO: ['sinano.cas.cn/news/tzgg/'], SITP: ['www.sitp.cas.cn/ggtz/'],
  CIOMP: ['www.ciomp.cas.cn/tzgg/', 'www.ciomp.cas.cn/zbxx/'], IOE: ['www.ioe.cas.cn/tzgg/', 'www.ioe.cas.cn/zbcg/'], SIOM: ['www.siom.cas.cn/tzgg/', 'siom.cas.cn'],
  XIOPM: ['www.opt.cas.cn/tzgg/', 'opt.cas.cn'], AIOFM: ['www.aiofm.cas.cn/tzgg/'], SIA: ['www.sia.cas.cn/tzgg/'], IPHY: ['www.iop.cas.cn/tzgg/'],
  SIMIT: ['www.sim.cas.cn/tzgg/'], IOE_CAS: ['www.ioe.ac.cn'], AIRCAS: ['www.aircas.ac.cn/tzgg/'], IHEP: ['www.ihep.cas.cn/tzgg/'], NIAOT: ['www.niaot.cas.cn/tzgg/'],
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ignoreHTTPSErrors: true });
await ctx.addInitScript(() => { window.__CEDRAT_HEADLESS = true; window.__CEDRAT_PAGES = 1; });
const run = (page, cfg) => page.evaluate(([src, c]) => { window.__CEDRAT_SITE = c; return (0, eval)(src); }, [scanSrc, cfg]);
const brief = r => ({ scanned: r.scanned, oldest: r.oldest, n: r.rows.length, newest: (r.sample || []).map(s => s.p + ' ' + s.t.slice(0, 28)) });
const SHARD = Number(process.env.SHARD || 0), SHARDS = Number(process.env.SHARDS || 1);
const FILE = new URL(`./direct-${SHARD}.json`, import.meta.url);
const out = [];
for (const [key, urls] of Object.entries(T).filter((_, i) => i % SHARDS === SHARD)) {
  for (const u0 of urls) {
    const rec = { key, try: u0, ok: false };
    let page = null;
    for (const proto of ['https', 'http']) {
      const p = await ctx.newPage();
      try { await p.goto(`${proto}://${u0}`, { waitUntil: 'domcontentloaded', timeout: 25000 }); await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {}); page = p; break; }
      catch (e) { rec.err = String(e.message || e).split('\n')[0].slice(0, 80); await p.close(); }
    }
    if (!page) { out.push(rec); continue; }
    Object.assign(rec, { ok: true, title: await page.title(), url: page.url() });
    const info = await page.evaluate(() => {
      const html = document.documentElement.outerHTML, seen = new Set();
      return { sfw: /\/sfw[\w]*\//.test(location.href) || /sfw_cms|\/sfw\/e\?/.test(html.slice(0, 40000)),
        navs: Array.from(document.querySelectorAll('a[href]'))
          .filter(a => /采购公告|招标公告|询价|竞价|比选|磋商|采购信息|招标信息|货物|公开招标|采购公示|更多|MORE|more/.test(a.textContent) && a.textContent.trim().length <= 12)
          .map(a => ({ t: a.textContent.trim(), h: a.href })).filter(x => /^https?:/.test(x.h) && !seen.has(x.h) && seen.add(x.h)).slice(0, 10) };
    });
    rec.cands = [];
    if (info.sfw) { try { rec.sfwScan = brief(await run(page, { key, kind: 'sfw' })); } catch (e) { rec.sfwErr = String(e.message || e).slice(0, 80); } }
    for (const u of [rec.url, ...info.navs.map(n => n.h)]) {
      try { const r = await run(page, { key, kind: 'list', lists: [{ url: u }] }); if (r.scanned) rec.cands.push({ u, label: (info.navs.find(n => n.h === u) || {}).t || 'home', ...brief(r) }); } catch {}
    }
    await page.close();
    out.push(rec);
    console.log('URL', key, u0, rec.title?.slice(0, 20), rec.cands.length, !!rec.sfwScan);
    await writeFile(FILE, JSON.stringify(out, null, 1));
  }
}
await browser.close();
await writeFile(FILE, JSON.stringify(out, null, 1));
