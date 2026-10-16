# Cedrat University Tender Watch · 赛得航高校标讯

Tracks procurement announcements from 45 Chinese university platforms and flags the ones that match Cedrat Technologies' product lines (piezo actuators and motors, fast steering mirrors, magnetic actuators, controllers).

汇总 45 所高校采购平台的公告，筛出与 Cedrat（赛得航科技）压电促动器、压电马达、快反镜、磁驱作动器等产品相关的标讯。

## What's here

| Path | Purpose |
|---|---|
| `index.html` | The dashboard. Chinese/English switch (top right, or add `#en` to the URL). |
| `data/notices.json` | Snapshot of matched announcements (title, link, deadline, budget, import flag, matched keywords, notes in Chinese and English). |
| `data/meta.json` | Scan date and how far back each platform was covered. |
| `scraper/sites.json` | The list of universities and how each one is read. Add a university here. |
| `scraper/scan.js` | The scanner that runs inside each site (also works pasted into a browser console). |
| `scraper/run.mjs` | Runs the scanner on every site with a headless browser and merges results into `data/`. |

## Viewing the page

Open `index.html` through any static host (GitHub Pages: Settings → Pages → deploy from `main`, root). It reads `data/notices.json`. Opening the file straight from disk (`file://`) won't load the JSON in most browsers, so use a host or `python3 -m http.server`.

The live version on claude.ai keeps the data in a shared database and lets you set a follow-up status on each tender (New / Watching / Preparing bid / Not a fit). On a static host the status is read-only.

## Platforms covered

45 universities, picked for strength in optics, precision instruments, aerospace, mechatronics and microelectronics. The full configuration is in `scraper/sites.json`.

| University | Platform | How it's read |
|---|---|---|
| Tsinghua 清华 | sbcgczxxfb.sysc.tsinghua.edu.cn | 思必得 platform (full text on most) |
| Beihang 北航 | zbcg.buaa.edu.cn | List pages (titles only) |
| Harbin IT 哈工大 | cgzx.hit.edu.cn | 思必得 platform (full text on most) |
| SJTU 上交 | pboffice.sjtu.edu.cn | 思必得 platform (full text on most) |
| Tianjin U 天大 | zbb.tju.edu.cn | 思必得 platform (full text on most) |
| USTC 中科大 | cggl.ustc.edu.cn | 思必得 platform (full text on most) |
| Chongqing U 重庆大学 | ztbzx.cqu.edu.cn | 思必得 platform (full text on most) |
| Sichuan U 四川大学 | cg.scu.edu.cn | 思必得 platform (full text on most) |
| HIT Shenzhen 哈工大(深圳) | cggl.hitsz.edu.cn | 思必得 platform (full text on most) |
| Westlake U 西湖大学 | procurement.westlake.edu.cn | 思必得 platform (full text on most) |
| BUPT 北邮 | cg.bupt.edu.cn | 思必得 platform (full text on most) |
| Xiamen U 厦门大学 | xdzc.xmu.edu.cn | 思必得 platform (full text on most) |
| Dalian UT 大连理工 | cgbmis.dlut.edu.cn | 思必得 platform (full text on most) |
| Kunming UST 昆明理工 | cgzx.kust.edu.cn | 思必得 platform (full text on most) |
| Dalian Maritime 大连海事 | cgzx.dlmu.edu.cn | 思必得 platform (full text on most) |
| HUST 华中科大 | cgzx.hust.edu.cn | List pages (titles only) |
| Fudan 复旦 | czzx.fudan.edu.cn | List pages (titles only) |
| NWPU 西工大 | zczx.nwpu.edu.cn | List pages (titles only) |
| Tongji 同济 | czb.tongji.edu.cn | List pages (titles only) |
| SUSTech 南科大 | biddingoffice.sustech.edu.cn | List pages (titles only) |
| UESTC 电子科大 | cg.uestc.edu.cn | List pages (titles only) |
| Wuhan U 武汉大学 | zb.whu.edu.cn | List pages (titles only) |
| Xi'an Jiaotong 西安交大 | cgb.xjtu.edu.cn | Own data feed (titles) |
| Shanghai U 上海大学 | bidding.shu.edu.cn | List pages (titles only) |
| Nanjing Tech 南京工业 | ztb.njtech.edu.cn | List pages (titles only) |
| Jilin U 吉林大学 | cgglzx.jlu.edu.cn | 思必得 platform (full text on most) |
| Shandong U 山东大学 | zcgl.sdu.edu.cn | 思必得 platform (full text on most) |
| BUCT 北京化工 | cg.buct.edu.cn | 思必得 platform (full text on most) |
| Shenzhen Tech U 深圳技术大学 | ztb.sztu.edu.cn | 思必得 platform (full text on most) |
| Anhui U 安徽大学 | cgzx.ahu.edu.cn | 思必得 platform (full text on most) |
| Xidian 西电 | cg.xidian.edu.cn | List pages (titles only) |
| UCAS 国科大 | caigou.ucas.ac.cn | List pages (titles only) |
| Soochow U 苏州大学 | zbzx.suda.edu.cn | List pages (titles only) |
| ECNU 华东师大 | cgxx.ecnu.edu.cn | List pages (titles only) |
| ShanghaiTech 上海科技 | www.shanghaitech.edu.cn | List pages (titles only) |
| South China Normal U 华南师大 | cgzx.scnu.edu.cn | List pages (titles only) |
| NJUPT 南京邮电 | zbb.njupt.edu.cn | List pages (titles only) |
| Hangzhou Dianzi U 杭州电子科大 | cgzx.hdu.edu.cn | List pages (titles only) |
| Southwest Jiaotong 西南交大 | bidding.swjtu.edu.cn | List pages (titles only) |
| Central South U 中南大学 | czzx.csu.edu.cn | List pages (titles only) |
| Shenzhen U 深圳大学 | bidding.szu.edu.cn | List pages (titles only) |
| Donghua U 东华大学 | ztb.dhu.edu.cn | List pages (titles only) |
| Hebei UT 河北工大 | zbcg.hebut.edu.cn | List pages (titles only) |
| Jiangsu U 江苏大学 | cgb.ujs.edu.cn | List pages (titles only) |
| Taiyuan UT 太原理工 | cgzb.tyut.edu.cn | List pages (titles only) |

Two generic readers in `scraper/scan.js` handle almost everything:

- **思必得 (sfw_cms) reader**: most sites run this vendor platform, which loads lists by POST from `/sfw_cms/e` (`page=cms.psms.publish.query`). The reader tries the known request variants and keeps the first that returns results.
- **List reader**: plain HTML list pages. It keeps every link that has a date next to it.

Award, result and contract notices are skipped; only open opportunities are matched.

Tried but not usable from outside China or without a login: Zhejiang U and Guilin UET (login), Nanjing U of Aeronautics & Astronautics (blocks foreign visitors), BIT, Nanjing U, Southeast U, Nankai, Wuhan UT (unreachable from abroad), Sun Yat-sen (list no longer updated), CQUPT, HFUT, USTB, Ocean U of China (no public list found), Xi'an UT, BISTU, Xi'an Tech U (asset-office news only). Spare candidates that work but were not added: Nanchang Hangkong, Jiangnan, Qingdao, Central China Normal, North China Electric Power, Northeastern U.

## Matching rules

- **Strong** terms map directly to Cedrat products: 压电 (piezo), 快反镜 / 快速反射镜 (FSM), 倾斜镜, 摆镜, 磁致伸缩, 音圈, 促动器 / 致动器 / 作动器 (actuator), 纳米位移 / 纳米定位, 微位移, 主动隔振 / 主动减振, 自适应光学, 变形镜, 高压放大器.
- **Weak** terms suggest equipment that may contain piezo or magnetic actuation: 位移台, 精密定位, 电动平台, 振动台, 激振器, 稳像, 光束稳定, 位移传感器, 隔振, 伺服稳定, 振镜, 偏摆台, 六自由度, 并联机构, and others (full list in `scraper/scan.js`).
- 高压电缆 / 电压电流 style false hits are excluded.
- **Import flag** is read from the announcement text. Cedrat products are imported; under the 2025 domestic-product policy (国办发〔2025〕34号) many tenders refuse imports or give domestic goods a 20% price deduction, so "Imports not accepted" usually means the tender needs a domestic partner or should be skipped.

## Updating the data

1. Open a platform list page in a browser (URLs at the top of `scraper/scan.js`).
2. Paste `scraper/scan.js` into the DevTools console. It prints matches and copies them as JSON.
3. Merge new entries into `data/notices.json` (keep existing `status` and `note` values) and update `data/meta.json`.
