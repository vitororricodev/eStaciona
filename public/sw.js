const CACHE='estaciona-static-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  if(new URL(req.url).pathname.startsWith('/_next/static/')){
    event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(req);if(hit)return hit;const res=await fetch(req);if(res.ok)cache.put(req,res.clone());return res;}));
  }
});
