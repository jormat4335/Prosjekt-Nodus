import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root = resolve('dist');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if(req.method!=='GET' && req.method!=='HEAD'){res.writeHead(405);return res.end();}
  if(req.url==='/health'){res.setHeader('Content-Type','application/json');return res.end('{"status":"ok"}');}
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root, '.'+pathname);
    if(file!==root && !file.startsWith(root+sep)){res.writeHead(403);return res.end();}
    let body, type;
    try {body=await readFile(file);type=mime[extname(file)]||'application/octet-stream';}
    catch {if(extname(pathname)){res.writeHead(404);return res.end();}body=await readFile(resolve(root,'index.html'));type=mime['.html'];}
    res.setHeader('Content-Type',type);res.setHeader('Cache-Control',pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-store');
    res.end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(500);res.end('Kunne ikke laste siden.');}
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Nodus Drift: http://localhost:'+(process.env.PORT||3000)));
