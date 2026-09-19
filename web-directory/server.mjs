import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,extname,sep} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const types={'.json':'application/json','.wasm':'application/wasm','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)||pathname.split('/').some(p=>p.startsWith('.'))||(!types[extname(file)]&&!/^\/(?:dist\/)?vendor\/cutout\/data\/[a-f0-9]{64}$/.test(pathname))){res.writeHead(404);res.end();return;}
    const content=await readFile(file);
    const workerPolicy=/\/vendor\/cutout\/worker\.mjs$/.test(pathname)?{'Content-Security-Policy':"default-src 'none'; script-src 'self' blob: 'unsafe-eval'; connect-src 'self' blob:; worker-src 'self' blob:;"}:{};
    res.writeHead(200,{...workerPolicy,'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':/\/vendor\/cutout\/data\/[a-f0-9]{64}$/.test(pathname)?'public, max-age=31536000, immutable':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(process.env.PORT===undefined?4173:Number(process.env.PORT),'127.0.0.1',async()=>{const url='http://127.0.0.1:'+server.address().port;await writeFile(root+'/.local-url',url);console.log(url);});
// Local review server only. Stop with Ctrl+C; it never receives profile or photo uploads.
