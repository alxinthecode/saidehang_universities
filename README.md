# Cedrat University Tender Watch · 赛得航高校标讯

Tracks procurement announcements from five Chinese university platforms and flags the ones that match Cedrat Technologies' product lines (piezo actuators and motors, fast steering mirrors, magnetic actuators, controllers).

汇总清华、北航、哈工大、上交、天大五所高校采购平台的公告，筛出与 Cedrat（赛得航科技）压电促动器、压电马达、快反镜、磁驱作动器等产品相关的标讯。

## What's here

| Path | Purpose |
|---|---|
| `index.html` | The dashboard. Chinese/English switch (top right, or add `#en` to the URL). |
| `data/notices.json` | Snapshot of matched announcements (title, link, deadline, budget, import flag, matched keywords, notes in Chinese and English). |
| `data/meta.json` | Scan date and how far back each platform was covered. |
| `scraper/scan.js` | Browser-console script that scans one platform and returns new matches in the same JSON shape. |

## Viewing the page

Open `index.html` through any static host (GitHub Pages: Settings → Pages → deploy from `main`, root). It reads `data/notices.json`. Opening the file straight from disk (`file://`) won't load the JSON in most browsers, so use a host or `python3 -m http.server`.

The live version on claude.ai keeps the data in a shared database and lets you set a follow-up status on each tender (New / Watching / Preparing bid / Not a fit). On a static host the status is read-only.

## Platforms covered

| University | Platform | Content available |
|---|---|---|
| Tsinghua 清华 | sbcgczxxfb.sysc.tsinghua.edu.cn | Full announcement text |
| Beihang 北航 | zbcg.buaa.edu.cn | Titles only (static HTML) |
| Harbin IT 哈工大 | cgzx.hit.edu.cn | Titles only |
| SJTU 上交 | pboffice.sjtu.edu.cn | Full text (ebidding.sjtu.edu.cn list needs login; its notices are mirrored on pboffice) |
| Tianjin U 天大 | zbb.tju.edu.cn | Mostly titles only |

Four of the five run the same vendor platform (思必得 sfw_cms), which loads lists by POST from `/sfw_cms/e`. That is why simple HTTP scrapers see empty pages and the scan runs inside a browser.

Not yet covered: Tianjin's procurement intentions (details sit on the national CCGP intention system, which blocks non-Chinese IPs), SJTU's procurement intentions, and Harbin's pre-tender market research notices.

## Matching rules

- **Strong** terms map directly to Cedrat products: 压电 (piezo), 快反镜 / 快速反射镜 (FSM), 倾斜镜, 摆镜, 磁致伸缩, 音圈, 促动器 / 致动器 / 作动器 (actuator), 纳米位移 / 纳米定位, 微位移, 主动隔振 / 主动减振, 自适应光学, 变形镜, 高压放大器.
- **Weak** terms suggest equipment that may contain piezo or magnetic actuation: 位移台, 精密定位, 电动平台, 振动台, 激振器, 稳像, 光束稳定, 位移传感器, 隔振, 伺服稳定, 振镜, 偏摆台, 六自由度, 并联机构, and others (full list in `scraper/scan.js`).
- 高压电缆 / 电压电流 style false hits are excluded.
- **Import flag** is read from the announcement text. Cedrat products are imported; under the 2025 domestic-product policy (国办发〔2025〕34号) many tenders refuse imports or give domestic goods a 20% price deduction, so "Imports not accepted" usually means the tender needs a domestic partner or should be skipped.

## Updating the data

1. Open a platform list page in a browser (URLs at the top of `scraper/scan.js`).
2. Paste `scraper/scan.js` into the DevTools console. It prints matches and copies them as JSON.
3. Merge new entries into `data/notices.json` (keep existing `status` and `note` values) and update `data/meta.json`.
