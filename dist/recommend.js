import {group} from './selection.js';
export function recommendations(s,heroes,relations){
 const opponents=new Set(s.enemies),used=new Set(s.enemies.map(id=>group(id,heroes))),rows=[];
 for(const hero of heroes.values()){
  if(used.has(group(hero.id,heroes)))continue;
  const matches=relations.filter(r=>r.attacker===hero.id&&opponents.has(r.defender));if(!matches.length)continue;
  const risks=relations.filter(r=>r.defender===hero.id&&opponents.has(r.attacker));rows.push({hero,matches,risks});
 }
 // 这里只整理定性关系；同覆盖数不区分强弱，不冒充胜率排序。
 return rows.sort((a,b)=>b.matches.length-a.matches.length);
}
