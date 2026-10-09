import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server = http.createServer(async(req,res)=>{
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if (path !== root && !path.startsWith(root+sep)) {res.writeHead(403).end();return;}
    const target = (await stat(path)).isDirectory() ? resolve(path,'index.html') : path;
    const body = await readFile(target);
    res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('未找到文件');}
});
server.listen(Number(process.env.PORT || 5173),'127.0.0.1',()=>console.log('克制选人预览：http://127.0.0.1:'+server.address().port));
