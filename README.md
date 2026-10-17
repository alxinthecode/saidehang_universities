# Cedrat University Tender Watch · 赛得航高校标讯

Tracks procurement announcements from 104 Chinese university platforms and 6 CAS research institutes and flags the ones that match Cedrat Technologies' product lines (piezo actuators and motors, fast steering mirrors, magnetic actuators, controllers).

汇总 104 所高校和 6 家中科院研究所的采购公告，筛出与 Cedrat（赛得航科技）压电促动器、压电马达、快反镜、磁驱作动器等产品相关的标讯。

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

104 universities, picked for strength in optics, precision instruments, aerospace, mechatronics and microelectronics, plus 6 Chinese Academy of Sciences institutes. The full configuration is in `scraper/sites.json` (institutes carry `"org": "institute"`).

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
| Beijing IT 北理工 | cgzx.bit.edu.cn | 思必得 platform (full text on most) |
| HIT Weihai 哈工大(威海) | zcgl.hitwh.edu.cn | 思必得 platform (full text on most) |
| Jiangnan U 江南大学 | bidding.jiangnan.edu.cn | 思必得 platform (full text on most) |
| Civil Aviation U 中国民航大学 | www.cauc.edu.cn | List pages (titles only) |
| Wenzhou U 温州大学 | zczx.wzu.edu.cn | List pages (titles only) |
| Wuhan UT 武汉理工 | cgyztb.whut.edu.cn | List pages (titles only) |
| Nanchang Hangkong 南昌航空 | zbcg.nchu.edu.cn | List pages (titles only) |
| Hefei UT 合肥工业 | zb.hfut.edu.cn | List pages (titles only) |
| Qingdao U 青岛大学 | cg.qdu.edu.cn | List pages (titles only) |
| Zhejiang Normal 浙江师范 | cgzx.zjnu.edu.cn | List pages (titles only) |
| Shandong UST 山东科大 | www.sdust.edu.cn | List pages (titles only) |
| Jiangsu UST 江苏科大 | zbb.just.edu.cn | List pages (titles only) |
| China U of Mining 中国矿大 | zhbb.cumt.edu.cn | List pages (titles only) |
| ECUST 华东理工 | czzx.ecust.edu.cn | List pages (titles only) |
| Nantong U 南通大学 | ztb.ntu.edu.cn | List pages (titles only) |
| Central China Normal 华中师范 | zb.ccnu.edu.cn | List pages (titles only) |
| Xiangtan U 湘潭大学 | cggl.xtu.edu.cn | List pages (titles only) |
| China U of Geosciences 中国地大(武汉) | cggl.cug.edu.cn | List pages (titles only) |
| North China Electric Power 华北电力 | zb.ncepu.edu.cn | List pages (titles only) |
| North U of China 中北大学 | zbcg.nuc.edu.cn | List pages (titles only) |
| Ocean U of China 中国海洋大学 | zb.ouc.edu.cn | 思必得 platform (full text on most) |
| Beijing Jiaotong 北交大 | gzc.bjtu.edu.cn | List pages (titles only) |
| Harbin U of Sci & Tech 哈理工 | gzc.hrbust.edu.cn | List pages (titles only) |
| Nankai 南开 | nkzbb.nankai.edu.cn | List pages (titles only) |
| Shenyang Aerospace 沈阳航空航天 | zbcgb.sau.edu.cn | List pages (titles only) |
| Shanghai U of Electric Power 上海电力 | xxgk.shiep.edu.cn | List pages (titles only) |
| Southwest Petroleum 西南石油 | cwcggl.swpu.edu.cn | List pages (titles only) |
| Xi'an U of Arch & Tech 西安建大 | jdzcb.xauat.edu.cn | List pages (titles only) |
| Xinjiang U 新疆大学 | zcglc.xju.edu.cn | List pages (titles only) |
| Nanchang U 南昌大学 | cgzx.ncu.edu.cn | List pages (titles only) |
| Anhui UST 安徽理工 | cg.aust.edu.cn | 思必得 platform (full text on most) |
| Shaanxi Normal 陕西师范 | zbb.snnu.edu.cn | 思必得 platform (full text on most) |
| China U of Petroleum (Beijing) 中国石油(北京) | zcb.cup.edu.cn | 思必得 platform (full text on most) |
| Anhui U of Technology 安徽工业 | zcc.ahut.edu.cn | List pages (titles only) |
| Changzhou U 常州大学 | zb.cczu.edu.cn | List pages (titles only) |
| Chengdu U of Info Tech 成都信息工程 | ztb.cuit.edu.cn | List pages (titles only) |
| Henan U of Technology 河南工业 | ztb.haut.edu.cn | List pages (titles only) |
| Hunan UST 湖南科技 | cgzx.hnust.edu.cn | List pages (titles only) |
| Henan Polytechnic 河南理工 | gzc.hpu.edu.cn | List pages (titles only) |
| Huai'an U 淮安大学 | zbb.hau.edu.cn | List pages (titles only) |
| Inner Mongolia UT 内蒙古工业 | zbcg.imut.edu.cn | List pages (titles only) |
| Jiangsu Normal 江苏师范 | ztbb.jsnu.edu.cn | List pages (titles only) |
| Liaoning Technical U 辽宁工程技术 | gzc.lntu.edu.cn | List pages (titles only) |
| Northeast Petroleum 东北石油 | cgxxw.nepu.edu.cn | List pages (titles only) |
| Shanghai Dianji U 上海电机 | zbb.sdju.edu.cn | List pages (titles only) |
| Shanghai Inst. of Technology 上海应用技术 | czb.sit.edu.cn | List pages (titles only) |
| Shantou U 汕头大学 | ztbzx.stu.edu.cn | List pages (titles only) |
| Sichuan U of Sci & Eng 四川轻化工 | jyzx.suse.edu.cn | List pages (titles only) |
| U of Jinan 济南大学 | sygz.ujn.edu.cn | List pages (titles only) |
| Wuyi U 五邑大学 | www.wyu.edu.cn | List pages (titles only) |
| Xi'an U of Technology 西安理工 | www.xaut.edu.cn | List pages (titles only) |
| Xi'an Shiyou U 西安石油 | ztb.xsyu.edu.cn | List pages (titles only) |
| Yangtze U 长江大学 | ztbgl.yangtzeu.edu.cn | List pages (titles only) |
| Yancheng Inst. of Technology 盐城工学院 | zbxx.ycit.edu.cn | List pages (titles only) |
| Yantai U 烟台大学 | zcc.ytu.edu.cn | List pages (titles only) |
| Changchun UT 长春工业 | zbcgfwzx.ccut.edu.cn | List pages (titles only) |
| Guangdong Ocean U 广东海洋 | www.gdou.edu.cn | List pages (titles only) |
| East China Jiaotong 华东交通 | zfcgzbb.ecjtu.edu.cn | List pages (titles only) |
| Jiangxi UST 江西理工 | www.jxust.edu.cn | List pages (titles only) |

| Research institute | Notice board | How it's read |
|---|---|---|
| CAS Aerospace Information Research Inst. 中科院空天院 | www.aircas.ac.cn | List pages (titles only) |
| CAS Changchun Inst. of Optics (CIOMP) 中科院长春光机所 | www.ciomp.cas.cn | List pages (titles only) |
| CAS Shanghai Inst. of Technical Physics 中科院上海技物所 | www.sitp.cas.cn | List pages (titles only) |
| CAS National Astronomical Observatories 中科院国家天文台 | nao.cas.cn | List pages (titles only) |
| CAS Inst. of Acoustics 中科院声学所 | www.ioa.cas.cn | List pages (titles only) |
| CAS Qingdao Inst. of Bioenergy 中科院青岛能源所 | qibebt.cas.cn | List pages (titles only) |

Institutes are read from their general notice boards, where procurement notices (single-source, negotiation, tender) are mixed with other news; the keyword filter picks out the relevant ones. Under CAS rules, institute purchases below about ¥100k are arranged by the research group directly with suppliers and are not published, so only larger purchases appear.

Two generic readers in `scraper/scan.js` handle almost everything:

- **思必得 (sfw_cms) reader**: most sites run this vendor platform, which loads lists by POST from `/sfw_cms/e` (`page=cms.psms.publish.query`). The reader tries the known request variants and keeps the first that returns results.
- **List reader**: plain HTML list pages. It keeps every link that has a date next to it.

Award, result and contract notices are skipped; only open opportunities are matched.

Tried but not usable from outside China or without a login (October 2026): Zhejiang U, Southeast U, Hunan U, Harbin Engineering, Jinan U, Shanghai Maritime, Nanjing U (login or maintenance page); Peking U, Northeastern U, USTB, South China UT, Nanjing UST, Hohai, Lanzhou UT, Southwest UST, China U of Petroleum (East China) (time out from abroad); Nanjing U of Aeronautics & Astronautics (blocks foreign visitors); Sun Yat-sen (list no longer updated); CQUPT, Ningbo U, Northwest U, Dongguan UT (app-only platforms); China U of Mining (Beijing) (platform returns no list). CAS institutes whose notice board was not found: Shanghai Inst. of Optics and Fine Mechanics, Xi'an Inst. of Optics, Inst. of Optics and Electronics (Chengdu), Anhui Inst. of Optics, Inst. of Semiconductors, Inst. of Physics, Shenyang Inst. of Automation.

## Matching rules

Keywords come from the Cedrat product table (`docs/Cedrat_产品表_Product_Catalog.xlsx`, tab 招标关键词): every catalogue model, its specs, and the names Chinese tenders use for it.

- **Strong**: the tender names a product Cedrat sells. Examples: 快反镜 / 快速反射镜 / 快速控制反射镜 (FSM); 压电促动器 / 压电陶瓷驱动器 / 压电叠堆 (APA, PPA); 压电位移台 / 纳米位移台 / 纳米定位台 (piezo stages); 压电偏摆台 / tip-tilt; 压电快门; 压电电机 / 压电马达; 压电驱动电源 / 压电放大器 / 压电控制器; 电磁作动器 / 惯性作动器 (MICA); 电涡流传感器.
- **Weak**: a lead to check by hand. This covers a bare 压电 (often a whole instrument with a piezo inside, such as an AFM or vibrometer) and system-level terms: 位移台, 纳米定位, 倾斜镜, 摆镜, 指向机构, 促动器, 音圈, 主动隔振 / 主动减振, 自适应光学, 变形镜, 稳像, 光束稳定 and others. The full list is in `scraper/scan.js`.
- Motorized stages (电动平台 / 电动位移台 / 电控位移台) are kept as **weak** leads: not piezo, but bought by the same labs, and a possible domestic-made line.
- **Not counted**: 隔振台 / 光学平台 (passive isolation), 振镜 (galvo scanners), 六自由度 / 并联机构 platforms, plain 位移传感器.
- Tenders that refuse imports are **not** filtered out; the import restriction is shown as a tag. False hits like 高压电缆 / 电压电流 / 稳压电源 are excluded too.
- **Import flag** is read from the announcement text. Cedrat products are imported; under the 2025 domestic-product policy (国办发〔2025〕34号) many tenders refuse imports or give domestic goods a 20% price deduction, so "Imports not accepted" usually means the tender needs a domestic partner or should be skipped.

## Updating the data

1. Open a platform list page in a browser (URLs at the top of `scraper/scan.js`).
2. Paste `scraper/scan.js` into the DevTools console. It prints matches and copies them as JSON.
3. Merge new entries into `data/notices.json` (keep existing `status` and `note` values) and update `data/meta.json`.
