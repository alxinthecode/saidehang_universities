// Open Hong Kong university tender pages; save rendered text and tender-related links.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const U = {
  HKU: ['https://www.feo.hku.hk/finance/suppliers/tendernotice.html', 'https://www.feo.hku.hk/finance/open-tender'],
  POLYU: ['https://tendering.polyu.edu.hk/en/index.aspx', 'https://tendering.polyu.edu.hk/Guest/en/Login/new.aspx', 'https://www.polyu.edu.hk/fo/Suppliers/Tender-Notice'],
  HKBU: ['https://fohome.hkbu.edu.hk/for-suppliers/information/tender-notice.html'],
  CUHK: ['https://www.fno.cuhk.edu.hk/', 'https://www.cuhk.edu.hk/bus/cupro/', 'https://www.fno.cuhk.edu.hk/public/tender-notices'],
  HKUST: ['https://fo.hkust.edu.hk/', 'https://fo.hkust.edu.hk/tender-notices'],
  CITYU: ['https://www.cityu.edu.hk/fo/', 'https://www.cityu.edu.hk/fo/tender-notices'],
  LINGU: ['https://www.ln.edu.hk/fo/'],
  EDUHK: ['https://www.eduhk.hk/tender_notice/index.php'],
  HKMU: ['https://hkmu.edu.hk/fo/supplier/tender-notice'],
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'en-US', ignoreHTTPSErrors: true });
const out = {};
for (const [k, urls] of Object.entries(U)) {
  out[k] = [];
  for (const u of urls) {
    const page = await ctx.newPage();
    try {
      await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const r = await page.evaluate(() => ({
        url: location.href, title: document.title,
        text: document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 2500),
        links: [...new Set([...document.querySelectorAll('a[href]')].filter(a => /tender|quotation|procure|purchas|supplier/i.test(a.textContent + a.href)).map(a => a.textContent.trim().slice(0, 50) + ' => ' + a.href))].slice(0, 25),
      }));
      out[k].push({ try: u, ...r });
    } catch (e) { out[k].push({ try: u, err: String(e).slice(0, 120) }); }
    await page.close();
  }
  await writeFile(new URL('./hk.json', import.meta.url), JSON.stringify(out, null, 1));
}
await browser.close();
