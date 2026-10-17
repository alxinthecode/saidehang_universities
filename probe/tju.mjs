// Fetch full text of TJU notices about 电动平台 (for a fit check against Cedrat products).
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', ignoreHTTPSErrors: true });
const page = await ctx.newPage();
await page.goto('https://zbb.tju.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
const out = await page.evaluate(async () => {
  const html = document.documentElement.outerHTML;
  const uuid = (html.match(/ops_uuid['"]?\s*[:=]\s*['"]([0-9a-f]{32})/) || [])[1] || '40cc3e0132e6a41c724a0e2612b1577f';
  const res = [];
  for (const kw of ['电动平台', '电控位移台']) {
    const body = `sort=begin_time%20desc&type=CSXQ&type=ZCXQ&type=BYXQ&type=YQXQ&type=ZCGS&shopType=&orgType=&catalog=&keywords=${encodeURIComponent(kw)}&page=cms.psms.publish.query&window_=json&ops_uuid=${uuid}&request_method_=ajax&browser_=notmsie&start=0&limit=20`;
    const r = await fetch('/sfw_cms/e', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, credentials: 'include' });
    const j = await r.json().catch(() => null);
    res.push({ kw, n: j?.resultset?.length, rows: (j?.resultset || []).map(x => ({ subject: x.subject, begin: x.beginTime, end: x.endTime, budget: x.budget || x.amount, text: (x.contentHtml || x.content || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ') })) });
  }
  return res;
});
await writeFile(new URL('./tju.json', import.meta.url), JSON.stringify(out, null, 1));
await browser.close();
