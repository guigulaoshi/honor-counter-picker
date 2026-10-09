# 王者荣耀 · 克制选人 / Honor Counter Picker

面向王者荣耀国服的手机选人参考工具。选对方的 1–5 名英雄，再选自己玩的分路，即时查看官网攻略中的克制候选。玩家自制，与腾讯无隶属或背书关系。

A mobile-first helper for the Chinese server of Honor of Kings. Select 1–5 opponents and your lane to browse qualitative counter suggestions from Tencent's public hero guides. This is an unofficial fan tool.

[在线体验 / Play on GitHub Pages](https://guigulaoshi.github.io/honor-counter-picker/)

## 用法 / How to use

- 上方“我玩哪路”单选决定候选；下方分路标签只筛选对方英雄池。
- “全部”页第一格打开搜索，支持中文名、拼音、首字母和常见简称。
- 点已选头像移除；可撤销。清空需确认。刷新后本机继续，不需要账号。
- 点克制候选查看原始解释和来源；超过五名可翻组。

Choose your own lane using the upper toggle buttons. Lower tabs filter the opponent hero pool. Search is the first tile under “全部” (All). Click selected portraits to remove them; undo and confirmed reset are available. Selections are saved only in your browser. Click a suggestion to inspect its source and explanation.

## 数据与限制 / Data and limitations

133 个国服可选条目、515 组有方向的官网定性关系，抓取于 2026-10-09。**没有可靠的国服对位胜率**：仅按可针对的已选对方人数排列，同数不区分强弱；未知关系不当成优势。官网攻略可能滞后。桑启作为目标暂无通过核对的候选。

The snapshot contains 133 selectable entries and 515 directional qualitative relations, fetched on 2026-10-09. **No verified matchup win rates are available.** Suggestions are ordered by the number of selected opponents covered; ties do not imply relative strength. Missing relations remain unknown. Official guides may lag behind the current game version. No validated suggestions currently cover Sang Qi as a target.

详见 [数据来源 / Data sources](DATA_SOURCES.md)。UI 默认简体中文，内容仅适用于国服；不包含国际服数据、语音、计时器或游戏账号接入。

The UI is Simplified Chinese for Chinese-server players. No international-server statistics, audio, forced timer or game-account integration.

## 本地运行 / Run locally

Node.js 18+，无需安装第三方依赖 / no third-party packages required:

```sh
npm start
```

Open http://127.0.0.1:5173/. `dist/` is the complete static site and can be hosted under a subdirectory.

```sh
npm test
npm run data:update
npm run data:counters
```

更新器使用 Python 3 标准库，原始快照在 `.cache/`，不随网站发布。新英雄简称和首字母需人工维护。

The update scripts use Python 3's standard library. Raw snapshots stay in `.cache/` and are not published. Search aliases and initials require maintenance for new heroes.

## 许可 / License

本项目原有程序代码采用 MIT；英雄头像、名称及官网攻略等第三方游戏内容不在 MIT 授权范围内，仍归相应权利人所有。请阅读 [第三方声明 / Third-party notices](THIRD_PARTY_NOTICES.md)。

Original program code is licensed under MIT. Third-party portraits, names and guide text are excluded from that license and remain the property of their respective rights holders. See the third-party notices.
