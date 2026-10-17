// Check that the scanner can read 思必得 notice text from inside the site (TJU, SZTU, THU).
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
const scan = await readFile(new URL('../scraper/scan.js', import.meta.url), 'utf8').catch(() => '');
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', ignoreHTTPSErrors: true });
const out = {};
for (const [k, u, id] of [['TJU', 'https://zbb.tju.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ', '20MV7USQ6HAU8E2M']]) {
  const page = await ctx.newPage();
  await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 });
  out[k] = await page.evaluate(async id => {
    try { const r = await fetch(`https://provider.yuncaitong.cn/api/publish/${id}`); const t = await r.text(); return { status: r.status, len: t.length, head: t, hasImport: /不接受进口/.test(t) }; }
    catch (e) { return { err: String(e) }; }
  }, id);
  await page.close();
}
await writeFile(new URL('./tju.json', import.meta.url), JSON.stringify(out, null, 1));
await browser.close();
