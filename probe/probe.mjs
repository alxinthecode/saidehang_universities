// One-off probe: open each candidate procurement site and record how its
// announcement list loads. Results go to probe/results.json.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const CANDIDATES = [
  ['ZJU', 'https://cgywxt.zju.edu.cn/'],
  ['USTC', 'https://cggl.ustc.edu.cn/sfw_cms/e?page=cms.index'],
  ['HUST', 'http://cgzx.hust.edu.cn/'],
  ['XJTU', 'https://info.xjtu.edu.cn/'],
  ['XJTU2', 'https://cgb.xjtu.edu.cn/'],
  ['NUAA', 'https://zbb.nuaa.edu.cn/'],
  ['NWPU', 'https://zczx.nwpu.edu.cn/'],
  ['BIT', 'http://zczx.bit.edu.cn/sfw_cms/e?page=cms.index'],
  ['NJU', 'https://zbb.nju.edu.cn/'],
  ['SEU', 'https://zbb.seu.edu.cn/'],
  ['FUDAN', 'https://czzx.fudan.edu.cn/'],
  ['DUT', 'http://cgbmis.dlut.edu.cn/sfw_cms/e?page=cms.index'],
  ['CQU', 'https://ztbzx.cqu.edu.cn/sfw_cms/e?page=cms.index'],
  ['SCU', 'https://cg.scu.edu.cn/sfw_cms/e?page=cms.index'],
  ['NKU', 'https://zbb.nankai.edu.cn/sfw_cms/e?page=cms.index'],
  ['HITSZ', 'https://cggl.hitsz.edu.cn/sfw_cms/e?page=cms.index'],
  ['UCAS', 'https://zbb.ucas.ac.cn/'],
  ['WESTLAKE', 'https://procurement.westlake.edu.cn/sfw_cms/e?page=cms.index'],
  ['UESTC', 'https://cg.uestc.edu.cn/'],
  ['TONGJI', 'https://czb.tongji.edu.cn/sggl/cgw/index.jsp'],
  ['WHU', 'https://zb.whu.edu.cn/'],
  ['SUSTECH', 'https://biddingoffice.sustech.edu.cn/'],
  ['BUPT', 'https://cg.bupt.edu.cn/sfw/e?page=cms.index'],
  ['PKU', 'https://zwb.pku.edu.cn/zbtb/zbgg/index1.htm'],
];

const DATE = /(20\d{2})[-年./](\d{1,2})[-月./](\d{1,2})/;

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ignoreHTTPSErrors: true });
const results = [];

async function snapshot(page) {
  return page.evaluate(DATE_SRC => {
    const DATE = new RegExp(DATE_SRC);
    const body = document.body ? document.body.innerText : '';
    const html = document.documentElement.outerHTML;
    const anchors = Array.from(document.querySelectorAll('a'));
    const nav = anchors.filter(a => /公告|采购|招标|更多|MORE|信息|结果|意向/.test(a.innerText) && a.innerText.trim().length <= 14)
      .slice(0, 60).map(a => ({ t: a.innerText.trim(), h: a.getAttribute('href') || '', oc: (a.getAttribute('onclick') || '').slice(0, 160) }));
    const dated = anchors.map(a => {
      const t = (a.getAttribute('title') || a.innerText || '').trim();
      const row = a.closest('li,tr,dd,div') || a.parentElement;
      const m = (row && row.innerText || '').match(DATE);
      return t.length >= 8 && m ? { t: t.slice(0, 70), h: a.getAttribute('href') || '', oc: (a.getAttribute('onclick') || '').slice(0, 160), d: m[0] } : null;
    }).filter(Boolean).slice(0, 15);
    return {
      title: document.title, url: location.href,
      tech: (body.match(/技术支持[^\n]{0,30}/) || [''])[0],
      sfw: /sfw_cms|\/sfw\/|sfw_cms2/.test(location.href + html.slice(0, 20000)),
      uuid: (html.match(/ops_uuid\s*=\s*"([0-9a-f]{32})"/) || [])[1] || '',
      appPath: (html.match(/appPath\s*=\s*["']([^"']+)/) || [])[1] || '',
      showDetail: typeof window.showDetail === 'function' ? String(window.showDetail).slice(0, 300)
        : typeof window.showDetailPublish === 'function' ? String(window.showDetailPublish).slice(0, 300) : '',
      nav, dated, textHead: body.slice(0, 600),
    };
  }, DATE.source);
}

for (const [key, url] of CANDIDATES) {
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', r => {
    const t = r.resourceType();
    if ((t === 'xhr' || t === 'fetch') && !/\.(js|css|png|jpg|gif|svg|woff)/.test(r.url())) {
      reqs.push({ m: r.method(), u: r.url().slice(0, 300), b: (r.postData() || '').slice(0, 1500) });
    }
  });
  const jsonSamples = [];
  page.on('response', async r => {
    try {
      const ct = r.headers()['content-type'] || '';
      if (/json/.test(ct) && jsonSamples.length < 6) {
        const txt = await r.text();
        jsonSamples.push({ u: r.url().slice(0, 200), len: txt.length, head: txt.slice(0, 900) });
      }
    } catch {}
  });
  const out = { key, url };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    out.home = await snapshot(page);
    if (out.home.sfw) {
      const base = new URL(page.url());
      const prefix = base.pathname.split('/')[1] || 'sfw_cms';
      const listUrl = `${base.origin}/${prefix}/e?page=cms.psms.gglist&typeDetail=XQ`;
      await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => (out.listErr = String(e).slice(0, 200)));
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      out.list = await snapshot(page);
      const two = page.locator('a', { hasText: /^\s*2\s*$/ }).first();
      if (await two.count()) { await two.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(3000); }
    }
  } catch (e) {
    out.error = String(e.message || e).split('\n')[0].slice(0, 300);
  }
  out.reqs = reqs.slice(0, 25);
  out.json = jsonSamples;
  results.push(out);
  console.log(key, out.error ? 'ERROR ' + out.error : `${out.home?.title} | sfw=${out.home?.sfw} | dated=${out.home?.dated?.length} | reqs=${reqs.length}`);
  await page.close();
}
await browser.close();
await writeFile(new URL('./results.json', import.meta.url), JSON.stringify(results, null, 1));
