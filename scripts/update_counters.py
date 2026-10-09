#!/usr/bin/env python3
"""刷新官网攻略关系，独立于头像/音频更新，不推测胜率。"""
import concurrent.futures as futures
import datetime
import html
import json
import pathlib
import re
import sys
from update_data import source
ROOT=pathlib.Path(__file__).resolve().parents[1]
PAIRS=[('inhibit1','in_tip1',False),('inhibit2','in_tip2',False),('resist1','re_tip1',True),('resist2','re_tip2',True)]

def clean(value):
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',str(value or '')))).strip()

def names(h):
    return [h['name'],h['shortName'],h['name'].replace('(', '-').replace(')', ''),*h['aliases']]

def build(heroes, details, checked_at):
    by={h['id']:h for h in heroes}; grouped={}; issues=[]
    for h in heroes:
        ident=h['id'];d=details.get(ident)
        url=f'https://pvp.qq.com/zlkdatasys/zsbd_herolist/{ident}.json'
        if not d or str(d.get('ename'))!=ident or d.get('cname')!=h['name']:
            issues.append({'hero':h['name'],'reason':'详情缺失或 ID/名字错配'});continue
        for field,tip,reverse in PAIRS:
            other=str(d.get(field,''));text=clean(d.get(tip))
            if not other and not text:continue
            if other not in by or ident==other or not text:
                issues.append({'hero':h['name'],'field':field,'reason':'无效 ID、自指或缺少解释'});continue
            # 泛化文案无法独立对照到此组合，暂不作为已核验候选。
            if not any(n and n in text for n in names(h)+names(by[other])):
                issues.append({'hero':h['name'],'field':field,'other':by[other]['name'],'reason':'解释未出现组合中的英雄名，暂不采用','text':text});continue
            # 出现组合外的英雄名且不含对方名时，隔离疑似复制错配。
            foreign=[x['name'] for x in heroes if len(x['name'])>1 and x['id'] not in [ident,other] and x['name'] in text]
            if foreign and not any(n and n in text for n in names(by[other])):
                issues.append({'hero':h['name'],'field':field,'reason':'解释疑似指向其他英雄','text':text});continue
            attacker,defender=(other,ident) if reverse else (ident,other)
            pair=grouped.setdefault((attacker,defender),{'attacker':attacker,'defender':defender,'evidence':[]})
            pair['evidence'].append({'source':url,'page':f'https://pvp.qq.com/web201605/herodetail/{ident}.shtml','heroId':ident,'field':field,'section':'被压制英雄' if reverse else '压制英雄','reason':text,'sourceChangeDate':d.get('changetime') or None})
    relations=list(grouped.values());missing=[h['name'] for h in heroes if not any(e['defender']==h['id'] for e in relations)]
    return {'meta':{'checkedAt':checked_at,'date':checked_at[:10],'source':'https://pvp.qq.com/zlkdatasys/zsbd_herolist/<id>.json','relationCount':len(relations),'evidenceCount':sum(len(r['evidence']) for r in relations),'issues':issues,'missingDefenders':missing,'scope':'腾讯官网攻略中的定性关系，抓取日期不等于攻略最后更新日期；不是当前版本胜率或完整对局评估。','checks':['ID与英雄名对应','关系方向核对','无自指和未知英雄','解释中的英雄名交叉检查','重复证据合并，不按证据数加权']},'relations':relations}

def main():
    data=json.loads((ROOT/'dist/data/heroes.json').read_text());heroes=data['heroes'];offline='--cached' in sys.argv
    def get(h):
        ident=h['id']
        try:
            d=json.loads((ROOT/f'.cache/sources/detail-{ident}.json').read_text()) if offline else source(h['source'],'detail-'+ident)
            return ident,d
        except Exception:return ident,None
    with futures.ThreadPoolExecutor(max_workers=8) as pool:details=dict(pool.map(get,heroes))
    checked=data['meta']['checkedAt'] if offline else datetime.datetime.now(datetime.timezone.utc).isoformat()
    result=build(heroes,details,checked)
    path=ROOT/'dist/data/counters.json';temp=path.with_suffix('.tmp');temp.write_text(json.dumps(result,ensure_ascii=False,indent=2));temp.replace(path)
    print(json.dumps({k:result['meta'][k] for k in ['date','relationCount','evidenceCount','missingDefenders','issues']},ensure_ascii=False))
if __name__=='__main__':main()
