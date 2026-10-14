/*
 * Cedrat university tender scan — browser-console script.
 *
 * The five platforms render their lists with JavaScript (POST to /sfw_cms/e),
 * so plain HTTP fetchers get empty pages. Open one of the sites below in a
 * normal browser, open DevTools → Console, paste this file and press Enter.
 * It prints matching announcements and copies them to the clipboard as JSON
 * in the same shape as data/notices.json.
 *
 *   Tsinghua  https://sbcgczxxfb.sysc.tsinghua.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ&catalog=A
 *   Tianjin   https://zbb.tju.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ
 *   Harbin    https://cgzx.hit.edu.cn/sfw_cms/e?page=cms.psms.gglist&shopping_type=GKCG&typeDetail=XQ
 *   SJTU      https://pboffice.sjtu.edu.cn/sfw_cms/e?page=cms.psms.gglist&typeDetail=XQ&cate=103249
 *   Beihang   https://zbcg.buaa.edu.cn/cggg/gkzb_bx_jc.htm   (static HTML, title-only)
 *
 * PAGES controls depth: 1 page = 100 newest announcements (Beihang: list pages).
 */
(async () => {
  const PAGES = 2;

  const STRONG = ['压电','快反镜','快速反射镜','快速偏转镜','快速倾斜镜','倾斜镜','摆镜','磁致伸缩','音圈','促动器','致动器','作动器','纳米位移','纳米定位','纳米平台','微位移','主动隔振','主动减振','自适应光学','变形镜','高压放大器','piezo','fsm'];
  const WEAK = ['位移台','精密定位','电动平台','定位平台','振动台','激振器','稳像','光束稳定','指向镜','电容传感器','位移传感器','隔振','减振','伺服稳定','扫描振镜','振镜','偏摆台','六自由度','并联机构','精密运动'];

  // "高压电缆" / "电压电流" contain 压电 — neutralise before matching.
  const norm = s => (s || '').toLowerCase().replace(/[高低中电]压电/g, '#');
  const strip = s => (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const imports = txt => /不(?:接受|允许)进口|进口产品[^。]{0,8}(?:否|不允许|不接受)/.test(txt) ? '不接受'
    : /(?:接受|允许)进口|进口产品[^。]{0,8}是/.test(txt) ? '允许' : '';
  const budgetOf = txt => { const m = txt.match(/预算(?:金额)?[^0-9]{0,12}([0-9][0-9.,]*)\s*(万元|元)/); return m ? m[1] + m[2] : ''; };
  const ymd = s => (s || '').slice(0, 10);

  function match(title, text) {
    const low = norm(title + ' ' + text);
    const strong = STRONG.filter(k => low.includes(k));
    const weak = WEAK.filter(k => low.includes(k));
    if (!strong.length && !weak.length) return null;
    const k0 = strong[0] || weak[0];
    const i = low.indexOf(k0);
    const full = title + ' ' + text;
    return { strong, weak, tier: strong.length ? 'strong' : 'weak', snippet: text ? full.slice(Math.max(0, i - 40), i + 80) : '' };
  }

  async function post(body) {
    const r = await fetch('/sfw_cms/e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
      body: body + '&request_method_=ajax&browser_=notmsie&page=cms.psms.publish.query',
    });
    return r.json();
  }
  const uuid = (document.documentElement.outerHTML.match(/ops_uuid\s*=\s*"([0-9a-f]{32})"/) || [])[1] || '';

  const SITES = {
    'sbcgczxxfb.sysc.tsinghua.edu.cn': {
      school: 'THU',
      body: s => `window_=json&start=${s}&limit=100&filter=&sort=begin_time+desc&type=ZCGS&type=ZCXQ&type=YQXQ&type=BYXQ&type=CSXQ&isEnd=&catalog=&shopType=&keywords=&ops_uuid=${uuid}`,
      map: it => ({ title: it.subject, text: strip(it.contentHtml), published: ymd(it.beginTime), deadline: (it.endTime || '').slice(0, 16), method: it.shopTypeName, no: it.tenderNo,
        url: 'https://sbgysfw.sysc.tsinghua.edu.cn/#/publish/' + it.syncId }),
    },
    'zbb.tju.edu.cn': {
      school: 'TJU',
      body: s => `window_=json&start=${s}&limit=100&filter=&sort=begin_time%20desc&type=CSXQ&type=ZCXQ&type=BYXQ&type=YQXQ&type=ZCGS&shopType=&orgType=&catalog=&keywords=`,
      map: it => ({ title: it.subject, text: strip(it.contentHtml), published: ymd(it.beginTime), deadline: (it.endTime || '').slice(0, 16), method: it.shopTypeName, no: it.tenderNo,
        url: 'https://zbb.tju.edu.cn/provider/#/publish/' + it.syncId }),
    },
    'cgzx.hit.edu.cn': {
      school: 'HIT',
      body: s => `window_=json&start=${s}&limit=100&filter=&sort=edate%20desc&typePublish=ZC&typePublish=YQ&typePublish=CS&typePublish=BY&typePublish=BG&typeDetail=XQ&shoppingType=&type=&isEnd=&categoryId=&notShoppingType=&keywords=`,
      map: it => ({ title: it.subject, text: strip(it.content), published: ymd(it.pdate), deadline: (it.edate || '').slice(0, 16), method: it.shoppingTypeName, no: it.businessNo,
        url: 'https://cgzx.hit.edu.cn/provider/#/publish/' + it.syncId }),
    },
    'pboffice.sjtu.edu.cn': {
      school: 'SJTU',
      body: s => `window_=json&start=${s}&limit=100&filter=&sort=beginTime%20desc&type=ZCXQ&type=YQXQ&type=BYXQ&type=CSXQ&shopType=&catalog=&isEnd=&categoryId=103249&ggType=XQ&keywords=&ops_uuid=${uuid}`,
      map: it => ({ title: it.subject, text: strip(it.contentHtml || it.content), published: ymd(it.beginTime), deadline: (it.endTime || '').slice(0, 16), method: it.shopTypeName, no: it.tenderNo,
        url: it.url || it.fullUrl || ('https://pboffice.sjtu.edu.cn/provider/#/publish/' + it.syncId) }),
    },
  };

  const out = [];
  let scanned = 0, oldest = '';
  const host = location.host;

  if (host === 'zbcg.buaa.edu.cn') {
    for (const [name, label] of [['gkzb_bx_jc', '公开招标/比选/竞磋'], ['kykc', '科研快采'], ['wsjj', '网上竞价']]) {
      const first = await (await fetch(`/cggg/${name}.htm`)).text();
      const max = +((first.match(new RegExp(`cggg/${name}/(\\d+)\\.htm`)) || [])[1] || 0);
      const urls = [`/cggg/${name}.htm`];
      for (let p = max; p > max - (PAGES * 4 - 1) && p > 0; p--) urls.push(`/cggg/${name}/${p}.htm`);
      for (const u of urls) {
        const d = new DOMParser().parseFromString(await (await fetch(u)).text(), 'text/html');
        d.querySelectorAll('a[href*="info/"]').forEach(a => {
          const title = (a.getAttribute('title') || a.textContent).trim();
          if (title.length < 6) return;
          const row = a.closest('tr,li') || a.parentElement;
          const dm = (row.textContent || '').match(/(\d{4})[年-](\d{2})[月-](\d{2})/);
          const published = dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : '';
          scanned++; oldest = published || oldest;
          const m = match(title, '');
          if (!m) return;
          const code = (title.match(/BUAA([A-Z]{2}\d+)/) || [])[1] || '';
          out.push({ _id: 'BUAA-' + (code || published + '-' + title.slice(0, 12)), school: 'BUAA', title, url: new URL(a.getAttribute('href'), location.origin + u).href,
            published, deadline: '', method: label, no: code ? 'BUAA' + code : '', budget: '', imports: '', ...m });
        });
      }
    }
  } else if (SITES[host]) {
    const site = SITES[host];
    for (let s = 0; s < PAGES * 100; s += 100) {
      const j = await post(site.body(s));
      for (const it of j.resultset || []) {
        const r = site.map(it);
        scanned++; oldest = r.published || oldest;
        const m = match(r.title, r.text);
        if (!m) continue;
        out.push({ _id: site.school + '-' + (r.no || r.published + '-' + r.title.slice(0, 12)).replace(/[^A-Za-z0-9_\-.]/g, ''),
          school: site.school, title: r.title, url: r.url, published: r.published, deadline: r.deadline, method: r.method, no: r.no,
          budget: budgetOf(r.text), imports: imports(r.text), ...m });
      }
      if ((j.resultset || []).length < 100) break;
    }
  } else {
    console.warn('Open one of the five procurement sites listed at the top of this script first.');
    return;
  }

  const seen = new Set();
  const rows = out.filter(r => !seen.has(r._id) && seen.add(r._id)).map(r => ({ ...r, status: 'new', note: '', firstSeen: new Date().toISOString().slice(0, 10) }));
  console.log(`Scanned ${scanned} announcements (back to ${oldest}); ${rows.length} matches.`);
  console.table(rows.map(r => ({ id: r._id, tier: r.tier, deadline: r.deadline, imports: r.imports, title: r.title })));
  try { await navigator.clipboard.writeText(JSON.stringify(rows, null, 2)); console.log('Matches copied to clipboard as JSON.'); } catch (e) { console.log(JSON.stringify(rows, null, 2)); }
  return rows;
})();
