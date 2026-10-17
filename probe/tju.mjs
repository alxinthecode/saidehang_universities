// Render the TJU detail pages and save their text.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const URLS = {
  '一维电动平台': 'https://zbb.tju.edu.cn/provider/#/publish/20MV7USQ6HAU8E2M',
  '三维电动平台': 'https://zbb.tju.edu.cn/provider/#/publish/20MVAO7QBLHQ9RR7',
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN', ignoreHTTPSErrors: true });
const out = {};
for (const [k, u] of Object.entries(URLS)) {
  const page = await ctx.newPage();
  const apis = [];
  page.on('response', async r => { if (/json|text/.test(r.headers()['content-type'] || '') && !/\.(js|css)$/.test(r.url())) { try { const t = await r.text(); if (t.length > 300) apis.push({ url: r.url(), t: t.slice(0, 200) }); } catch {} } });
  try {
    await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);
    const frames = await Promise.all(page.frames().map(f => f.evaluate(() => document.body?.innerText || '').catch(() => '')));
    out[k] = { text: frames.join('\n=====\n').slice(0, 20000), apis };
  } catch (e) { out[k] = { err: String(e) }; }
  await page.close();
}
await writeFile(new URL('./tju.json', import.meta.url), JSON.stringify(out, null, 1));
await browser.close();
