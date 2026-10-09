import {fresh,conflict,restore} from './selection.js';
import {recommendations} from './recommend.js';
const $=id=>document.getElementById(id),KEY='honor-counter-v1';
const esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let state,heroes,meta,counterMeta,relations=[],history=[],lane='对抗路',poolLane='全部',query='',noticeTimer,counterError=false,candidateOffset=0;
function notify(text){$('notice').textContent=text;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,2200);}
function save(){try{localStorage.setItem(KEY,JSON.stringify({state,history:history.slice(-60),lane}));$('save-status').textContent='已自动保存 · 本机';}catch{$('save-status').textContent='本机保存失败';}}
function commit(fn){history.push(structuredClone(state));if(history.length>60)history.shift();fn();save();render();}
function normal(s){return String(s||'').toLowerCase().replace(/[\s·()（）_'-]/g,'');}
function clearSearch(){query='';$('search').value='';}
function render(){
 $('enemies').innerHTML=Array.from({length:5},(_,i)=>{const h=heroes.get(state.enemies[i]);return `<button class="slot ${h?'filled':'empty'}" ${h?`data-remove="${h.id}"`: 'data-add="true"'} aria-label="${h?'移除对方英雄'+esc(h.name):'添加对方英雄第 '+(i+1)+' 位'}">${h?`<img src="./${esc(h.portrait.path)}" alt=""><span>${esc(h.shortName)}</span>`:'<span class="plus">＋</span><span>添加</span>'}</button>`;}).join('');
 $('enemy-count').textContent=state.enemies.length+' / 5';$('undo').disabled=!history.length;$('reset').disabled=!state.enemies.length;renderHeroes();renderRecommendations();
}
function heroButton(h){const used=conflict(state,h.id,heroes),exact=state.enemies.includes(h.id);return `<button class="hero ${used?'used':''}" data-hero="${h.id}" aria-label="${esc(h.name)}${exact?'，再次点击移除':used?'，元流已选':''}" aria-disabled="${!!used&&!exact}"><img src="./${esc(h.portrait.path)}" alt="" loading="lazy">${used?'<span class="badge">已选</span>':''}<span class="hero-name">${esc(h.shortName)}</span></button>`;}
function renderHeroes(){
 const rows=[...heroes.values()].filter(h=>poolLane==='全部'||h.lanes.includes(poolLane));
 $('result-count').textContent=rows.length+' 位';let active;
 document.querySelectorAll('[data-pool-lane]').forEach(b=>{const selected=b.dataset.poolLane===poolLane;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;if(selected)active=b;});$('heroes').setAttribute('aria-labelledby',active.id);
 const searchButton=poolLane==='全部'?'<button class="hero search-hero" data-search="true" aria-label="打开英雄搜索"><span class="search-symbol" aria-hidden="true">⌕</span><span class="hero-name">搜索英雄</span></button>':'';
 $('heroes').innerHTML=searchButton+rows.map(heroButton).join('');
}
function renderSearchResults(){const q=normal(query),rows=q?[...heroes.values()].filter(h=>[h.name,h.shortName,h.pinyin,h.initials,...h.aliases].some(x=>normal(x).includes(q))):[];
 $('search-count').textContent=q?'找到 '+rows.length+' 位英雄':'输入中文名、拼音或常用简称';$('search-results').innerHTML=rows.map(heroButton).join('')||(q?'<p class="no-results">没有找到英雄，试试其他名字</p>':'');}
function openSearch(){clearSearch();renderSearchResults();$('search-dialog').showModal();$('search').focus();}
function renderRecommendations(){
 const el=$('recommendations'),rows=recommendations(state,heroes,relations).filter(x=>x.hero.lanes.includes(lane));
 candidateOffset=Math.min(candidateOffset,Math.max(0,Math.floor((rows.length-1)/5)*5));$('counter-count').textContent=rows.length?(candidateOffset+1)+'–'+Math.min(candidateOffset+5,rows.length)+' / '+rows.length+'位':'0位';$('prev-candidates').disabled=candidateOffset===0;$('next-candidates').disabled=candidateOffset+5>=rows.length;document.querySelectorAll('[data-lane]').forEach(b=>{const selected=b.dataset.lane===lane;b.setAttribute('aria-checked',String(selected));b.tabIndex=selected?0:-1;});
 $('ranking-note').textContent=counterError?'克制资料暂未加载':state.enemies.length?'按针对人数从左到右排列，同数不分强弱；暂无胜率':'先选对方英雄，结果即时更新';
 el.innerHTML=rows.slice(candidateOffset,candidateOffset+5).map(({hero:h,matches,risks})=>`<button class="counter-card ${risks.length?'has-risk':''}" data-reason="${h.id}" aria-label="查看${esc(h.name)}的官网攻略，针对${esc(matches.map(x=>heroes.get(x.defender).shortName).join('、'))}${risks.length?'，也有被对方压制的风险':''}"><img src="./${esc(h.portrait.path)}" alt="" loading="lazy"><strong>${esc(h.shortName)}</strong><span>针对${matches.length}人${risks.length?' · 风险':''}</span></button>`).join('')||`<p class="no-results">${counterError?'克制资料暂不可用，请刷新重试':!state.enemies.length?'选一个或多个对方英雄<br>这里立即显示克制候选':'这条分路暂无可核验的克制候选<br>可以换一条分路查看'}</p>`;
}
function choose(id){
 const h=heroes.get(id);if(!h)return false;candidateOffset=0;
 if(state.enemies.includes(id)){commit(()=>state.enemies=state.enemies.filter(x=>x!==id));}
 else if(conflict(state,id,heroes)){notify('元流不同职业只能选一个');return false;}
 else if(state.enemies.length>=5){notify('已选满 5 人，点头像移除后再添加');return false;}
 else commit(()=>state.enemies.push(id));
 clearSearch();$('search').blur();renderHeroes();if($('search-dialog').open)$('search-dialog').close();return true;
}
function about(){
 $('about-content').innerHTML=`<p>搜索并选择一个或多个对方英雄，下面或右侧立即显示克制候选。点已选头像移除；“撤销”恢复上一步，“清空”需要确认。“我玩哪路”单选决定克制候选；下方标签页筛选对方英雄池；“全部”页第一格可打开搜索。英雄池始终显示；对方阵容下面是一排五个克制候选，点候选查看攻略；超过五个可点“下一组”。下方密集英雄池直接选对方，内容随整页滚动。</p><h3>胜率尚未取得</h3><p>尚未取得可核验的国服对位胜率或实测克制收益，当前不显示百分比，也不能声称已按胜率排好名。按官网记录可针对的已选对方人数排列，例如有两条关系的候选排在一条关系的候选前面；同数沿用目录顺序，不区分强弱。这只是资料覆盖数量，不是胜率、克制强度或阵容收益评分。</p><h3>当前克制依据</h3><p>腾讯官网制胜宝典的“压制英雄／被压制英雄”及原始解释。快照 ${esc(counterMeta?.date||'暂无')}，${counterMeta?.relationCount||0} 组定性关系；核对 ID、方向及解释中的英雄名，${counterMeta?.issues.length||0} 条过于笼统或疑似错配的记录暂不采用。点候选可以查看原文与来源。官网攻略可能滞后，抓取日期不等于攻略更新日期。</p><h3>英雄资料与本机保存</h3><p><a href="${esc(meta.sources.catalog)}" target="_blank" rel="noopener">腾讯当前英雄目录</a>：${meta.count} 个条目、${meta.portraits} 个头像。只做国服，支持中文、全拼、首字母、常见简称和分路筛选。</p><p>对方选择及撤销记录保存在本机，刷新继续。无需游戏账号，不上传阵容。</p><small>玩家自制工具，与腾讯无隶属或背书关系。英雄图像归权利人所有。</small>`;$('about-dialog').showModal();
}
function reasons(id){
 const row=recommendations(state,heroes,relations).find(x=>x.hero.id===id);if(!row)return;$('reason-title').textContent=row.hero.shortName+'的官网攻略';
 const section=(match,warning=false)=>`<section class="evidence"><h3>${warning?'需防范':'可针对'} ${esc(heroes.get(warning?match.attacker:match.defender).name)}</h3>${match.evidence.map(e=>`<p>${esc(e.reason)}</p><a href="${esc(e.source)}" target="_blank" rel="noopener">官网资料 · ${esc(heroes.get(e.heroId).name)} · ${esc(e.section)}</a>`).join('')}</section>`;
 $('reason-content').innerHTML=row.matches.map(x=>section(x)).join('')+row.risks.map(x=>section(x,true)).join('')+`<p class="source-note">官网攻略参考 · ${esc(counterMeta?.date)} 抓取。不代表当前版本胜率。</p>`;$('reason-dialog').showModal();
}
$('heroes').addEventListener('click',e=>{if(e.target.closest('[data-search]')){openSearch();return;}const h=e.target.closest('[data-hero]');if(h)choose(h.dataset.hero);});$('search-results').addEventListener('click',e=>{const h=e.target.closest('[data-hero]');if(h)choose(h.dataset.hero);});$('recommendations').addEventListener('click',e=>{const h=e.target.closest('[data-reason]');if(h)reasons(h.dataset.reason);});
$('enemies').addEventListener('click',e=>{const remove=e.target.closest('[data-remove]');if(remove){choose(remove.dataset.remove);return;}if(e.target.closest('[data-add]')){poolLane='全部';renderHeroes();$('pool-tab-0').focus();}});
$('search').addEventListener('input',()=>{query=$('search').value;renderSearchResults();});$('clear-search').addEventListener('click',()=>{clearSearch();renderSearchResults();$('search').focus();});$('close-search').addEventListener('click',()=>$('search-dialog').close());
$('pool-lanes').addEventListener('click',e=>{const b=e.target.closest('[data-pool-lane]');if(b){poolLane=b.dataset.poolLane;renderHeroes();}});document.querySelector('.role-toggle').addEventListener('click',e=>{const b=e.target.closest('[data-lane]');if(b){lane=b.dataset.lane;candidateOffset=0;renderRecommendations();save();}});
function arrowSelection(container,selector){container.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;const buttons=[...container.querySelectorAll(selector)],index=buttons.indexOf(e.target);if(index<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].click();buttons[next].focus();});}
arrowSelection($('pool-lanes'),'[role=tab]');arrowSelection(document.querySelector('.role-toggle'),'[role=radio]');
$('undo').addEventListener('click',()=>{if(!history.length)return;state=restore(history.pop(),heroes);candidateOffset=0;clearSearch();save();render();notify('已撤销');});$('reset').addEventListener('click',()=>$('confirm-dialog').showModal());
$('confirm-dialog').addEventListener('close',()=>{if($('confirm-dialog').returnValue==='confirm'){commit(()=>{state=fresh();candidateOffset=0;poolLane='全部';clearSearch();});notify('已清空，可撤销');}});
$('prev-candidates').addEventListener('click',()=>{candidateOffset=Math.max(0,candidateOffset-5);renderRecommendations();});$('next-candidates').addEventListener('click',()=>{candidateOffset+=5;renderRecommendations();});
$('about').addEventListener('click',about);$('close-about').addEventListener('click',()=>$('about-dialog').close());$('close-reason').addEventListener('click',()=>$('reason-dialog').close());
async function init(){try{
 const response=await fetch('./data/heroes.json');if(!response.ok)throw Error('英雄资料读取失败');const data=await response.json();heroes=new Map(data.heroes.map(h=>[h.id,h]));meta=data.meta;
 try{const r=await fetch('./data/counters.json');if(!r.ok)throw Error('克制资料读取失败');const d=await r.json();counterMeta=d.meta;relations=d.relations.filter(e=>heroes.has(e.attacker)&&heroes.has(e.defender));}catch{counterError=true;}
 let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}lane=['对抗路','打野','中路','发育路','游走'].includes(saved?.lane)?saved.lane:'对抗路';state=restore(saved?.state,heroes);history=saved?.state?.schema===3&&Array.isArray(saved.history)?saved.history.slice(-60):[];save();render();
}catch(e){$('recommendations').innerHTML='<p class="no-results">英雄资料读取失败，请刷新重试</p>';document.querySelectorAll('button,input,select').forEach(b=>b.disabled=true);console.error(e);}}
init();
