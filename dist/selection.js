export function fresh(){return {schema:3,enemies:[]};}
export function group(id,heroes){return heroes.get(id)?.name.startsWith('元流之子')?'yuanliu':id;}
export function conflict(s,id,heroes){return s.enemies.find(other=>group(other,heroes)===group(id,heroes))||null;}
export function restore(raw,heroes){
 const s=fresh();if(!raw)return s;
 const ids=raw.schema===3?raw.enemies:[];
 if(!Array.isArray(ids))return s;
 for(const id of ids){if(s.enemies.length>=5)break;if(heroes.has(id)&&!conflict(s,id,heroes))s.enemies.push(id);}
 return s;
}
