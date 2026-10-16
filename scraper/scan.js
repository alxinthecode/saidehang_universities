/*
 * Cedrat university tender scan — runs inside a university procurement site.
 *
 * Two generic readers cover almost every site:
 *   sfw  — the 思必得 (sfw_cms) platform used by Tsinghua, Tianjin, Harbin,
 *          SJTU, USTC, Chongqing, Sichuan, Xiamen… Lists load by POST to
 *          /<prefix>/e with page=cms.psms.publish.query and come back as JSON.
 *   list — plain HTML list pages (Beihang, Fudan, HUST, Tongji…). Reads each
 *          link that has a date next to it.
 * A few sites have their own small reader (see CUSTOM below).
 *
 * scraper/run.mjs sets window.__CEDRAT_SITE to one entry of scraper/sites.json
 * before running this file. Pasted into a browser console without that, it
 * guesses: sfw reader on 思必得 sites, list reader on the current page.
 */
(async () => {
  const SITE = window.__CEDRAT_SITE || {};
  const PAGES = window.__CEDRAT_PAGES || SITE.pages || 1;
  const HEADLESS = !!window.__CEDRAT_HEADLESS;

  const STRONG = ['压电','快反镜','快速反射镜','快速偏转镜','快速倾斜镜','倾斜镜','摆镜','磁致伸缩','音圈','促动器','致动器','作动器','纳米位移','纳米定位','纳米平台','微位移','主动隔振','主动减振','自适应光学','变形镜','高压放大器','piezo','fsm'];
  const WEAK = ['位移台','精密定位','电动平台','定位平台','振动台','激振器','稳像','光束稳定','指向镜','电容传感器','位移传感器','隔振','减振','伺服稳定','扫描振镜','振镜','偏摆台','六自由度','并联机构','精密运动'];
  // Award/result/contract notices are not opportunities.
  const RESULT = /(中标|成交|结果|废标|流标|终止|合同|验收)(公告|公示)|中标候选人|结果公示|采购意向/;

  // "高压电缆" / "电压电流" / "槽压电化学" contain 压电 — neutralise before matching.
  const norm = s => (s || '').toLowerCase().replace(/[高低中电槽]压电/g, '#');
  const strip = s => (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const imports = txt => /不(?:接受|允许)进口|进口产品[^。]{0,8}(?:否|不允许|不接受)/.test(txt) ? '不接受'
    : /(?:接受|允许)进口|进口产品[^。]{0,8}是/.test(txt) ? '允许' : '';
  const budgetOf = txt => { const m = txt.match(/预算(?:金额)?[^0-9]{0,12}([0-9][0-9.,]*)\s*(万元|元)/); return m ? m[1] + m[2] : ''; };
  const DATE = /(20\d{2})\s*[-年./]+\s*(\d{1,2})\s*[-月./]+\s*(\d{1,2})/;
  const toYmd = s => { const m = String(s || '').match(DATE); return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : ''; };
  const cleanTitle = s => (s || '').replace(/^[\s·•▪■●\-]+/, '').replace(/\s+/g, ' ').trim();
  const idPart = s => String(s || '').replace(/[^A-Za-z0-9_\-.]/g, '');

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

  async function getText(url, init) {
    const r = await fetch(url, { credentials: 'include', ...init });
    const buf = await r.arrayBuffer();
    let cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1];
    let txt = new TextDecoder(cs || 'utf-8').decode(buf);
    if (!cs) {
      const m = txt.slice(0, 4000).match(/charset=["']?([\w-]+)/i);
      if (m && !/utf-?8/i.test(m[1])) { try { txt = new TextDecoder(m[1]).decode(buf); } catch {} }
    }
    return txt;
  }

  // ---------- sfw reader ----------
  const SFW_TEMPLATES = [
    'sort=begin_time%20desc&type=ZCGS&type=ZCXQ&type=YQXQ&type=BYXQ&type=CSXQ&isEnd=&catalog=&shopType=&keywords=',
    'sort=beginTime%20desc&type=ZCXQ&type=YQXQ&type=BYXQ&type=CSXQ&isEnd=&catalog=&shopType=&keywords=',
    'sort=edate%20desc&typePublish=ZC&typePublish=YQ&typePublish=CS&typePublish=BY&typePublish=BG&typeDetail=XQ&shoppingType=&type=&isEnd=&categoryId=&notShoppingType=&keywords=',
    'sort=pdate%20desc&type=&shopType=&catalog=&isEnd=&orgType=&categoryId=&notShopType=&keywords=',
  ];

  async function readSfw() {
    const prefix = SITE.prefix || (location.pathname.match(/^\/(sfw[\w]*)\//) || [])[1] || 'sfw_cms';
    const endpoint = `/${prefix}/e`;
    const listHtml = await getText(`/${prefix}/e?page=cms.psms.gglist&typeDetail=XQ`).catch(() => '');
    const html = listHtml + document.documentElement.outerHTML;
    const found = (html.match(/ops_uuid\s*=\s*"([0-9a-f]{32})"/) || [])[1] || '';
    // Many 思必得 sites set this shared default uuid from a script file instead of the page.
    const uuids = [...new Set([found, '40cc3e0132e6a41c724a0e2612b1577f', ''])];
    let uuid = found;
    let detail = SITE.detail || (html.match(/appPath\s*=\s*["'](http[^"']+)/) || [])[1]
      || (html.match(/window\.open\(\s*["']([^"']*publish\/)["']\s*\+\s*publish_id/) || [])[1] || '/provider/#/publish/';
    if (detail.startsWith('/')) detail = location.origin + detail;

    const post = async (tpl, start, limit) => {
      let body = `window_=json&start=${start}&limit=${limit}&filter=&${tpl}`;
      if (uuid && !/ops_uuid=/.test(body)) body += `&ops_uuid=${uuid}`;
      body += '&request_method_=ajax&browser_=notmsie&page=cms.psms.publish.query';
      const txt = await getText(endpoint, {
        method: 'POST', body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
      });
      return JSON.parse(txt);
    };

    let tpl = null, first = null;
    search: for (const u of uuids) {
      for (const t of SITE.body ? [SITE.body] : SFW_TEMPLATES) {
        uuid = u;
        try { const j = await post(t, 0, 100); if ((j.resultset || []).length && j.resultset[0].subject) { tpl = t; first = j; break search; } } catch {}
      }
    }
    if (!first) throw new Error('no 思必得 list query returned results');

    const items = [...(first.resultset || [])];
    for (let p = 1; p < PAGES && items.length >= p * 100; p++) items.push(...((await post(tpl, p * 100, 100)).resultset || []));

    return items.map(it => {
      const text = strip(it.contentHtml || it.content || '');
      return {
        title: it.subject || '', text,
        published: toYmd(it.beginTime || it.pdate || it.creTime),
        deadline: String(it.endTime || it.edate || '').slice(0, 16),
        method: it.shopTypeName || it.shoppingTypeName || '',
        no: it.tenderNo || it.businessNo || '',
        url: it.url || it.fullUrl || (it.syncId ? detail + it.syncId : location.origin + endpoint + '?page=cms.psms.gglist&typeDetail=XQ'),
      };
    });
  }

  // ---------- list reader ----------
  function rowsFrom(doc, baseUrl, label, linkPattern) {
    const pat = linkPattern ? new RegExp(linkPattern) : null;
    const out = [], seen = new Set();
    doc.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || /^(javascript|#|mailto)/i.test(href)) return;
      const title = cleanTitle(a.getAttribute('title') || a.textContent);
      if (title.length < 8) return;
      let row = a.closest('li,tr,dd');
      if (!row || row.textContent.length > 400) row = a.parentElement;
      const near = (row ? row.textContent : '') + ' ' + (a.nextElementSibling ? a.nextElementSibling.textContent : '');
      // Some lists (Tongji) print the date as separate day / year / month blocks.
      const dym = near.match(/(?:^|\D)(\d{1,2})\s+(20\d{2})\s+(\d{1,2})(?:\D|$)/);
      const published = toYmd(near) || (dym ? toYmd(`${dym[2]}-${dym[3]}-${dym[1]}`) : '');
      if (!published && !(pat && pat.test(href))) return;
      let url; try { url = new URL(href, baseUrl).href; } catch { return; }
      if (seen.has(url)) return;
      seen.add(url);
      out.push({ title, text: '', published, deadline: '', method: label || '', no: '', url });
    });
    return out;
  }

  async function readLists() {
    const lists = SITE.lists && SITE.lists.length ? SITE.lists : [{ url: location.href }];
    const all = [];
    for (const l of lists) {
      const cfg = typeof l === 'string' ? { url: l } : l;
      const u = new URL(cfg.url, location.origin).href;
      const doc = u === location.href ? document : new DOMParser().parseFromString(await getText(u), 'text/html');
      all.push(...rowsFrom(doc, u, cfg.label, cfg.linkPattern || SITE.linkPattern));
    }
    return all;
  }

  // ---------- custom readers ----------
  const CUSTOM = {
    // Xi'an Jiaotong: cgb.xjtu.edu.cn serves each column as JSON.
    async xjtu() {
      const out = [];
      for (const col of SITE.columns || []) {
        const body = new URLSearchParams({ bkid: col.bkid, lmid: col.lmid, _rows: '100' });
        const j = JSON.parse(await getText('/site/findNeiRongSummaryByLmId', { method: 'POST', body,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' } }));
        const lists = (j.wzLmList || []).flatMap(l => l.nrList || l.neiRongList || l.dataList || []);
        const items = lists.length ? lists : JSON.stringify(j).match(/\{[^{}]*"NRID"[^{}]*\}/g)?.map(x => JSON.parse(x)) || [];
        for (const it of items) {
          if (!it.BT || !it.NRID) continue;
          out.push({ id: it.NRID.slice(-12), title: it.BT, text: it.JJ && it.JJ !== it.BT ? it.JJ : '', published: toYmd(`${it.FBSJ || ''}-${it.FBRQ || '01'}`),
            deadline: '', method: col.label || '', no: '', url: `${location.origin}/site/caseInfo?nrid=${it.NRID}&jdid=${it.LMID || col.lmid}` });
        }
      }
      return out;
    },
  };

  // ---------- run ----------
  const kind = SITE.kind || (/^\/sfw[\w]*\//.test(location.pathname) ? 'sfw' : 'list');
  const school = SITE.key || location.host;
  const raw = kind === 'sfw' ? await readSfw() : CUSTOM[kind] ? await CUSTOM[kind]() : await readLists();

  let scanned = 0, oldest = '';
  const out = [], seen = new Set();
  for (const r of raw) {
    scanned++;
    if (r.published && (!oldest || r.published < oldest)) oldest = r.published;
    if (RESULT.test(r.title)) continue;
    const m = match(r.title, r.text);
    if (!m) continue;
    let id;
    const code = SITE.idFrom ? (r.title.match(new RegExp(SITE.idFrom)) || [])[1] : '';
    if (code) id = `${school}-${code}`;
    else if (r.id) id = `${school}-${idPart(r.id)}`;
    else if (r.no) id = `${school}-${idPart(r.no) || idPart(r.published + '-' + r.title.slice(0, 12))}`;
    else if (kind === 'sfw') id = `${school}-${idPart(r.published + '-' + r.title.slice(0, 12))}`;
    else id = `${school}-${idPart(new URL(r.url).pathname + new URL(r.url).search).slice(-40)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ _id: id, school, title: r.title, url: r.url, published: r.published, deadline: r.deadline, method: r.method,
      no: r.no, budget: budgetOf(r.text), imports: imports(r.text), ...m,
      status: 'new', note: '', firstSeen: new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10) });
  }

  if (HEADLESS) return { host: location.host, scanned, oldest, rows: out,
    sample: raw.slice(0, 3).map(r => ({ t: r.title.slice(0, 50), p: r.published, u: r.url.slice(0, 120) })) };
  console.log(`Scanned ${scanned} announcements (back to ${oldest}); ${out.length} matches.`);
  console.table(out.map(r => ({ id: r._id, tier: r.tier, deadline: r.deadline, imports: r.imports, title: r.title })));
  try { await navigator.clipboard.writeText(JSON.stringify(out, null, 2)); console.log('Matches copied to clipboard as JSON.'); } catch { console.log(JSON.stringify(out, null, 2)); }
  return out;
})();
