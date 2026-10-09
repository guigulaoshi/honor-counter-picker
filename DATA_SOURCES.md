# 数据来源 / Data sources

抓取日期 / Fetched: **2026-10-09**. 抓取日期不是攻略更新时间 / Fetch time is not the guide's update date.

| 来源 / Source | 用途 / Use |
| --- | --- |
| [腾讯当前英雄目录](https://pvp.qq.com/zlkdatasys/heroskinlist.json) | ID、名字、拼音、头像、职业和分路 / Current roster, portraits, roles and lanes |
| [旧英雄表](https://pvp.qq.com/web201605/js/herolist.json) | 交叉检查 / Cross-check only |
| [制胜宝典 JSON 示例](https://pvp.qq.com/zlkdatasys/zsbd_herolist/167.json) | 逐 ID 分路补全与克制原文 / Per-ID lane fallback and counter explanations |
| [官方世界观目录](https://pvp.qq.com/zlkdatasys/yuzhouzhan/list/heroList.json) | 名字、职业辅助核对 / Additional name and role checks |

133 条包括五个元流职业及心魔六耳，不等于独立角色人数。元流职业选用互斥，心魔六耳和孙悟空独立。已核对头像签名、解码与尺寸；每个头像附原始 URL、字节数及 SHA-256。已纠正旧接口中王维、卢雅那、元流刺客的分路或定位差异。当前目录分路优先；详情 hero_type3/4 不是本英雄职业，parentId 也不直接决定选用互斥。

The 133 entries include five Yuanliu classes and Xinmo Liuer; this is not a count of unique characters. Yuanliu classes conflict with one another; Xinmo Liuer and Sun Wukong are separate. Portrait signatures, decoding and dimensions were checked, with source URLs, sizes and SHA-256 recorded. Current-catalog lanes take precedence over legacy details. Related-hero type fields and parentId are not treated as the current hero's class or automatic selection conflicts.

克制字段方向：inhibit1/2 本英雄压制其他英雄；resist1/2 其他英雄压制本英雄。与[孙悟空详情页](https://pvp.qq.com/web201605/herodetail/167.shtml)的“被压制英雄”芈月、项羽实际核对。原始532条经 ID、名字、方向、自指、解释空缺及疑似第三者错配检查，保留520条证据、合并515组关系。12条未采用记录的原因保留在 counters.json.meta.issues。

Direction was checked against the live Sun Wukong guide: inhibit describes the current hero countering another; resist describes another countering the current hero. Of 532 raw records, 520 evidence records form 515 directional relations after ID/name/direction, self-reference, empty-reason and suspected mismatch checks. Reasons for excluding 12 records remain in counters.json.meta.issues.

**缺失与未验证：** 桑启作为目标暂无核验候选。未逐条人工复核全部攻略在当前版本的机制适用性。没有可核验的国服对位胜率，不显示百分比；覆盖人数不等于克制强度或阵容胜率。手机尺寸使用浏览器验证，真实 Android/iOS、软键盘、微信内置浏览器尚未完整实测。

**Gaps and unverified items:** Sang Qi has no validated incoming counter relation. All guide explanations have not been individually reviewed against the current patch. No verified Chinese-server matchup win rates are available. Coverage counts are not strength or team win rates. Responsive viewports were checked in a browser; physical Android/iOS devices, soft keyboards and WeChat's browser were not fully tested.

搜索简称与首字母为本地检索词，不冒充官方资料。更新器可独立运行并保留来源、日期和缺失信息。运行时仅读取同站点静态资料，不发送阵容，不收集遥测。

Aliases and initials are local search aids, not official data. Independent update scripts retain provenance, dates and gaps. Runtime data is served from the same static site; selections are not uploaded and no telemetry is collected.
