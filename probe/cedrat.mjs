// Crawl the Cedrat Technologies product catalog (categories + sitemap) into probe/cedrat.json.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://cedrat-technologies.com/categorie-produit/piezo-actuators/', { waitUntil: 'domcontentloaded', timeout: 60000 });
const data = await page.evaluate(async () => {
  const parse = h => new DOMParser().parseFromString(h, 'text/html');
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const CATS = ['piezo-actuators', 'piezo-motors', 'magnetic-actuators', 'piezo-controllers', 'magnetic-controllers', 'sensors'];
  const urls = new Map();
  for (const c of CATS) for (let p = 1; p < 40; p++) {
    const r = await fetch(`/categorie-produit/${c}/` + (p > 1 ? `page/${p}/` : '')); if (!r.ok) break;
    const links = [...new Set(Array.from(parse(await r.text()).querySelectorAll('li.product a[href*="/produit/"]')).map(a => a.href))];
    if (!links.length) break; links.forEach(l => { if (!urls.has(l)) urls.set(l, c); });
  }
  const xml = await (await fetch('/product-sitemap.xml')).text();
  for (const u of new Set(xml.match(/https?:\/\/[^<"]+\/produit\/[^<"\/]+\//g) || [])) if (!urls.has(u)) urls.set(u, 'sitemap');
  const out = [];
  for (const [url, cat] of urls) {
    try {
      const d = parse(await (await fetch(url)).text());
      const specs = {}; d.querySelectorAll('table.shop_attributes tr').forEach(tr => { specs[clean(tr.querySelector('th')?.textContent)] = clean(tr.querySelector('td')?.textContent); });
      const h1 = clean(d.querySelector('h1')?.textContent);
      const heads = Array.from(d.querySelectorAll('h1,h2,h3,h4')).map(h => clean(h.textContent)).filter(Boolean);
      out.push({ url, cat, model: h1, sub: heads.find(x => x !== h1 && !/Description|Additional|Resources|Related/i.test(x)) || '',
        posted: [...new Set(Array.from(d.querySelectorAll('.posted_in a')).map(a => clean(a.textContent)))], specs,
        desc: clean((d.querySelector('#tab-description') || {}).textContent).slice(0, 800),
        datasheet: Array.from(d.querySelectorAll('a[href*="/datasheets/"]')).map(a => a.href)[0] || '' });
    } catch (e) { out.push({ url, cat, error: String(e) }); }
  }
  return out;
});
await browser.close();
await writeFile(new URL('./cedrat.json', import.meta.url), JSON.stringify(data, null, 1));
console.log('products', data.length);
