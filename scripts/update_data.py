#!/usr/bin/env python3
"""独立刷新腾讯公开名单、头像和分路，不含语音。"""
import concurrent.futures as futures
import datetime
import hashlib
import json
import pathlib
import re
import time
from urllib.request import Request, urlopen

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist'
CACHE = ROOT / '.cache' / 'sources'
CACHE.mkdir(parents=True, exist_ok=True)
SOURCES = {
    'legacy': 'https://pvp.qq.com/web201605/js/herolist.json',
    'catalog': 'https://pvp.qq.com/zlkdatasys/heroskinlist.json',
    'story': 'https://pvp.qq.com/zlkdatasys/yuzhouzhan/list/heroList.json',
}
TYPES = {'1': '战士', '2': '法师', '3': '坦克', '4': '刺客', '5': '射手', '6': '辅助'}
LANES = ['对抗路', '打野', '中路', '发育路', '游走']
ALIASES = {'孙悟空': ['猴子', '大圣'], '鲁班七号': ['鲁班', '小卤蛋'], '孙尚香': ['香香', '大小姐'], '东皇太一': ['东皇'], '不知火舞': ['火舞'], '娜可露露': ['露露'], '马可波罗': ['马可', '马克'], '公孙离': ['阿离'], '上官婉儿': ['婉儿'], '裴擒虎': ['老虎'], '百里守约': ['守约'], '百里玄策': ['玄策'], '太乙真人': ['太乙'], '伽罗': ['jialuo'], '铠': ['凯', '铠爹'], '钟无艳': ['钟无盐'], '心魔六耳': ['六耳'], '蔡文姬': ['蔡蔡'], '元流之子(刺客)': ['元刺'], '元流之子(法师)': ['元法'], '元流之子(射手)': ['元射'], '元流之子(坦克)': ['元坦'], '元流之子(辅助)': ['元辅']}

def download(url):
    url = 'https:' + url if url.startswith('//') else url
    for n in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://pvp.qq.com/'}), timeout=25) as response:
                return response.read(), response.headers.get('Content-Type', '')
        except Exception:
            if n == 2:
                raise
            time.sleep(.3 * (n + 1))

def source(url, name):
    b, _ = download(url)
    d = json.loads(b.decode('utf-8-sig'))
    (CACHE / (name + '.json')).write_bytes(b)
    return d

def asset(url, folder, ident):
    b, content = download(url)
    if folder == 'portraits':
        if not (b.startswith(b'\xff\xd8') or b.startswith(b'\x89PNG') or b.startswith(b'RIFF')):
            raise ValueError('头像响应不是图片')
        ext = '.png' if b.startswith(b'\x89PNG') else '.webp' if b.startswith(b'RIFF') else '.jpg'
    relative = 'assets/' + folder + '/' + ident + ext
    path = OUT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b)
    return {'path': relative, 'source': url, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}

def main():
    raw = {key: source(url, key) for key, url in SOURCES.items()}
    legacy_rows = raw['legacy'] if isinstance(raw['legacy'], list) else []
    legacy = {str(h['ename']): h for h in legacy_rows}
    rows = raw['catalog']['yxlb20_2489']
    checked = datetime.datetime.now(datetime.timezone.utc).isoformat()
    issues = []
    def hero(row):
        ident, name = row['yxid_a7'], row['yxmclb_9965']
        result = {'id': ident, 'name': name, 'pinyin': row['yxpymc_4614'].replace('_', ''), 'aliases': ALIASES.get(name, []), 'roles': [TYPES[str(row[k])] for k in ['zzy_2397', 'fzy_8576'] if str(row.get(k)) in TYPES], 'lanes': [], 'portrait': None, 'source': 'https://pvp.qq.com/zlkdatasys/zsbd_herolist/' + ident + '.json', 'parentId': row.get('ssbdyx_6269') or None}
        # 元流不同职业是游戏内独立选项；不把它们误归并。
        result['shortName'] = name.replace('元流之子(', '元流·').replace(')', '')
        detail = None
        try:
            detail = source(result['source'], 'detail-' + ident)
            if str(detail.get('ename')) != ident or detail.get('cname') != name:
                raise ValueError('英雄详情 ID/名字不一致')
            # 制胜宝典 road 常有旧“上路/下路”等记录；当前目录分路优先。
            # hero_type3/4 是关联英雄的职业，绝不能当成本英雄职业。
            current_lanes = [lane for lane in LANES if lane in row.get('fllb_2105', '')]
            road = detail.get('road', '').replace('对抗/', '对抗路/').replace('上路', '对抗路').replace('下路', '发育路')
            result['lanes'] = current_lanes or [lane for lane in LANES if lane in road]
            result['laneStatus'] = '官网当前目录' if current_lanes else '官网制胜宝典补全'
        except Exception as e:
            issues.append({'hero': name, 'field': 'detail', 'error': str(e)})
        if not result['lanes']:
            result['lanes'] = [lane for lane in LANES if lane in row.get('fllb_2105', '')]
            result['laneStatus'] = '官网列表，详情缺失'
        old = legacy.get(ident)
        if old:
            oldlanes = [LANES[int(x)-1] for x in old.get('roles','').split('|') if x.isdigit() and 1<=int(x)<=5]
            if set(oldlanes) != set(result['lanes']) or str(old.get('hero_type')) != str((detail or {}).get('hero_type',row['zzy_2397'])):
                issues.append({'hero': name, 'field': 'legacyMismatch', 'oldLanes': oldlanes, 'lanes': result['lanes'], 'oldType': old.get('hero_type'), 'roles': result['roles']})
        try:
            result['portrait'] = asset(row['yxtxlb_8443'], 'portraits', ident)
        except Exception as e:
            issues.append({'hero': name, 'field': 'portrait', 'error': str(e)})
        return result
    with futures.ThreadPoolExecutor(max_workers=8) as pool:
        heroes = list(pool.map(hero, rows))
    initial_map = json.loads((ROOT / 'scripts' / 'search_initials.json').read_text())
    for h in heroes:
        h['initials'] = initial_map.get(h['id'], '')
    meta = {'checkedAt': checked, 'date': checked[:10], 'count': len(heroes), 'portraits': sum(bool(h['portrait']) for h in heroes), 'sources': SOURCES, 'issues': issues, 'missingPortraits': [h['name'] for h in heroes if not h['portrait']], 'missingLanes': [h['name'] for h in heroes if not h['lanes']], 'notes': ['以当前官网 heroskinlist 名单及头像为基准，定位与当前目录分路，缺失分路用同 ID 制胜宝典补全。', '头像检查文件签名。', '元流职业统一选用排重；命格与本体可独立选用，本体关联仅作资料关联。']}
    (OUT/'data'/'heroes.json').write_text(json.dumps({'meta': meta, 'heroes': heroes},ensure_ascii=False,indent=2))
    print(json.dumps({k: meta[k] for k in ['count','portraits','missingPortraits','missingLanes']},ensure_ascii=False))

if __name__ == '__main__':
    main()
