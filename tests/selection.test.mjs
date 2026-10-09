import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,conflict,restore} from '../dist/selection.js';
import {recommendations} from '../dist/recommend.js';
const dataset=JSON.parse(readFileSync(new URL('../dist/data/heroes.json',import.meta.url))),heroes=new Map(dataset.heroes.map(h=>[h.id,h]));
const counters=JSON.parse(readFileSync(new URL('../dist/data/counters.json',import.meta.url)));
test('恢复最多五名对方，忽略未知 ID、重复和元流重复职业',()=>{
 const s=restore({schema:3,enemies:['167','167','not-real','583','582','109','112','138','105']},heroes);
 assert.deepEqual(s.enemies,['167','583','109','112','138']);assert.equal(conflict(s,'582',heroes),'583');
});
test('命格与本体仍可独立出现在对方列表',()=>{
 assert.deepEqual(restore({schema:3,enemies:['167','549']},heroes).enemies,['167','549']);
});
test('损坏记录安全恢复为空阵容',()=>{assert.deepEqual(restore({schema:3,enemies:'invalid'},heroes),fresh());});
test('克制方向：孙悟空被芈月/项羽针对，妲己不是猴子的克制候选',()=>{
 const rows=recommendations({enemies:['167']},heroes,counters.relations),ids=rows.map(r=>r.hero.id);
 assert(ids.includes('121'));assert(ids.includes('135'));assert(!ids.includes('109'));assert(!ids.includes('167'));
});
test('多选时只整理明确关系，不生成胜率或将缺失关系当成优势',()=>{
 const subset=[{attacker:'105',defender:'167',evidence:[]},{attacker:'105',defender:'112',evidence:[]},{attacker:'121',defender:'167',evidence:[]},{attacker:'112',defender:'105',evidence:[]}];
 const rows=recommendations({enemies:['167','112']},heroes,subset);
 assert.equal(rows[0].hero.id,'105');assert.equal(rows[0].matches.length,2);assert.equal(rows[0].risks.length,1);assert.equal(rows[0].winRate,undefined);
 assert.deepEqual(recommendations({enemies:[]},heroes,subset),[]);
});
test('资料中的关系均非自指、ID存在、无重复组合、证据可追溯',()=>{
 const seen=new Set();for(const r of counters.relations){assert(heroes.has(r.attacker)&&heroes.has(r.defender));assert.notEqual(r.attacker,r.defender);const key=r.attacker+'-'+r.defender;assert(!seen.has(key));seen.add(key);assert(r.evidence.length>0);for(const e of r.evidence){assert(e.source.startsWith('https://pvp.qq.com/zlkdatasys/zsbd_herolist/'));assert(e.reason.trim());assert(['压制英雄','被压制英雄'].includes(e.section));}}
 assert.equal(seen.size,counters.meta.relationCount);
});
