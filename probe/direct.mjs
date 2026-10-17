// Round 6: open explicit candidate URLs (found by DNS / home-page links) with a longer timeout.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
const ROOT = new URL('..', import.meta.url);
const scanSrc = await readFile(new URL('scraper/scan.js', ROOT), 'utf8');
const T = {
  CTGU: ['zb.ctgu.edu.cn'], NWAFU: ['cg.nwafu.edu.cn'], NJNU: ['cgzx.njnu.edu.cn'], NEAU: ['cgb.neau.edu.cn', 'cg.neau.edu.cn'],
  NWNU: ['cg.nwnu.edu.cn'], JXNU: ['zbcgzx.jxnu.edu.cn'], BJFU: ['zbzx.bjfu.edu.cn'], LZU: ['zbb.lzu.edu.cn', 'zcc.lzu.edu.cn'],
  HRBNU: ['gzc.hrbnu.edu.cn'], HEBTU: ['zcgl.hebtu.edu.cn'], CNU: ['gzc.cnu.edu.cn'], SICNU: ['zczx.sicnu.edu.cn'], LNNU: ['cgzb.lnnu.edu.cn'],
  CQNU: ['cscz.cqnu.edu.cn'], NJFU: ['gzc.njfu.edu.cn'], QHU: ['www.qhu.edu.cn/tzgg/'], XUST: ['gzc.xust.edu.cn/zbcg/cggg.htm', 'gzc.xust.edu.cn/zbcg.htm'],
  FJNU: ['cggl.fjnu.edu.cn/sfw_cms/e?page=cms.index'], CAU: ['cg.cau.edu.cn/sfw_cms/e?page=cms.index'], SXU: ['www.sxu.edu.cn', 'zbcg.sxu.edu.cn'],
  NJAU: ['zbb.njau.edu.cn', 'cgzx.njau.edu.cn'], SCAU: ['zbb.scau.edu.cn', 'cgzx.scau.edu.cn'], HUNNU: ['zbb.hunnu.edu.cn', 'cgzx.hunnu.edu.cn'],
  ZZU: ['zbb.zzu.edu.cn', 'cgzx.zzu.edu.cn', 'zbcg.zzu.edu.cn'], YNU: ['zcc.ynu.edu.cn', 'cgzx.ynu.edu.cn'], HENU: ['zbb.henu.edu.cn', 'cgzx.henu.edu.cn', 'zbcg.henu.edu.cn'],
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
