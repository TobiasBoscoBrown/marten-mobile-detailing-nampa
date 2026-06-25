(function(){
  "use strict";
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Mobile menu ----------
  var mb=document.getElementById('menu-btn'), mm=document.getElementById('mobile-menu');
  if(mb&&mm){
    mb.addEventListener('click',function(){
      var open=mm.classList.toggle('hidden')===false;
      mb.setAttribute('aria-expanded', open?'true':'false');
    });
    mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){mm.classList.add('hidden');mb.setAttribute('aria-expanded','false');});});
  }

  // ---------- Open / Closed badge (Mon-Sat 7-21, Sun closed) ----------
  (function(){
    var el=document.getElementById('oc-badge'); if(!el) return;
    function render(){
      var now=new Date(), day=now.getDay(), h=now.getHours()+now.getMinutes()/60;
      var open = day!==0 && h>=7 && h<21;
      var dot=el.querySelector('span:first-child'), txt=el.querySelector('span:last-child');
      if(open){ el.style.borderColor='rgba(35,227,212,.4)'; dot.style.background='#23e3d4'; txt.textContent='Open now'; txt.style.color='#9ff3ec'; }
      else { el.style.borderColor=''; dot.style.background='#6b7787'; var n='Closed'; if(day===0)n='Closed Sun'; txt.textContent=n; txt.style.color=''; }
    }
    render(); setInterval(render,60000);
  })();

  // ---------- Count up (bulletproof) ----------
  (function(){
    var els=[].slice.call(document.querySelectorAll('.count'));
    if(!els.length) return;
    function run(el){
      var to=parseFloat(el.getAttribute('data-to'))||0, dec=parseInt(el.getAttribute('data-dec')||'0',10);
      if(reduce){ el.textContent=to.toFixed(dec); return; }
      var start=null, dur=1100;
      function step(ts){ if(!start)start=ts; var p=Math.min((ts-start)/dur,1); el.textContent=(to*(0.2+0.8*p)).toFixed(dec); if(p<1){requestAnimationFrame(step);} else {el.textContent=to.toFixed(dec);} }
      requestAnimationFrame(step);
      setTimeout(function(){el.textContent=to.toFixed(dec);},1400);
    }
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){run(e.target);io.unobserve(e.target);}});},{threshold:.4});
      els.forEach(function(e){io.observe(e);});
    } else { els.forEach(run); }
  })();

  // ---------- Gallery lightbox ----------
  (function(){
    var imgs=[].slice.call(document.querySelectorAll('.gimg'));
    if(!imgs.length) return;
    var data=imgs.map(function(b){return {src:b.getAttribute('data-src'),cap:b.getAttribute('data-cap')};});
    var idx=0, lastFocus=null;
    var lb=document.createElement('div'); lb.className='lb'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true'); lb.setAttribute('aria-label','Photo viewer');
    lb.innerHTML='<button class="lbx" aria-label="Close" style="position:absolute;top:18px;right:18px;width:44px;height:44px;border-radius:8px;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.15);font-size:22px;line-height:1">&times;</button>'
      +'<button class="lbp" aria-label="Previous" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.15);font-size:24px">&#8249;</button>'
      +'<figure style="margin:0;max-width:92vw;max-height:88vh;text-align:center"><img class="lbi" alt="" style="max-width:92vw;max-height:78vh;border-radius:6px;object-fit:contain"><figcaption class="lbc" style="color:#aab4c0;font-size:13px;margin-top:12px"></figcaption></figure>'
      +'<button class="lbn" aria-label="Next" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.15);font-size:24px">&#8250;</button>';
    document.body.appendChild(lb);
    var img=lb.querySelector('.lbi'), cap=lb.querySelector('.lbc');
    function show(i){ idx=(i+data.length)%data.length; img.src=data[idx].src; img.alt=data[idx].cap; cap.textContent=data[idx].cap; }
    function open(i){ lastFocus=document.activeElement; show(i); lb.classList.add('open'); lb.querySelector('.lbx').focus(); }
    function close(){ lb.classList.remove('open'); if(lastFocus)lastFocus.focus(); }
    imgs.forEach(function(b,i){ b.addEventListener('click',function(){open(i);}); });
    lb.querySelector('.lbx').addEventListener('click',close);
    lb.querySelector('.lbp').addEventListener('click',function(){show(idx-1);});
    lb.querySelector('.lbn').addEventListener('click',function(){show(idx+1);});
    lb.addEventListener('click',function(e){if(e.target===lb)close();});
    document.addEventListener('keydown',function(e){ if(!lb.classList.contains('open'))return; if(e.key==='Escape')close(); else if(e.key==='ArrowLeft')show(idx-1); else if(e.key==='ArrowRight')show(idx+1); });
    // swipe
    var sx=0; lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
    lb.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>40){ show(idx+(dx<0?1:-1)); }});
  })();

  // ---------- SIGNATURE FEATURE: Canvas ambient hero ----------
  (function(){
    var c=document.getElementById('hero-canvas'); if(!c) return;
    var ctx=c.getContext('2d'); if(!ctx) return;
    var parent=c.parentElement, dpr=Math.min(window.devicePixelRatio||1,2);
    var W=0,H=0,parts=[],mouse={x:-999,y:-999,active:false}, raf=null;
    var AQUA='35,227,212';
    function size(){
      var r=parent.getBoundingClientRect(); W=r.width; H=r.height;
      c.width=Math.max(1,W*dpr); c.height=Math.max(1,H*dpr); c.style.width=W+'px'; c.style.height=H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      var target=Math.round(Math.min(70, Math.max(26, W/16)));
      parts=[];
      for(var i=0;i<target;i++){ parts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.8+.6}); }
    }
    function bg(){
      var g=ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,'#0a0c10'); g.addColorStop(.55,'#0c1118'); g.addColorStop(1,'#0a0d12');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      var rg=ctx.createRadialGradient(W*0.78,H*0.12,0,W*0.78,H*0.12,Math.max(W,H)*0.7);
      rg.addColorStop(0,'rgba('+AQUA+',0.10)'); rg.addColorStop(1,'rgba('+AQUA+',0)');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    }
    function frame(){
      bg();
      for(var i=0;i<parts.length;i++){
        var p=parts[i];
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        if(mouse.active){ var dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.sqrt(dx*dx+dy*dy); if(d<140&&d>0){ p.x+=dx/d*0.6; p.y+=dy/d*0.6; } }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fillStyle='rgba('+AQUA+',0.55)'; ctx.fill();
      }
      for(var a=0;a<parts.length;a++){ for(var b=a+1;b<parts.length;b++){
        var q=parts[a],w=parts[b],ddx=q.x-w.x,ddy=q.y-w.y,dd=Math.sqrt(ddx*ddx+ddy*ddy);
        if(dd<118){ ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(w.x,w.y); ctx.strokeStyle='rgba('+AQUA+','+(0.16*(1-dd/118)).toFixed(3)+')'; ctx.lineWidth=1; ctx.stroke(); }
      }}
      if(mouse.active){ for(var k=0;k<parts.length;k++){ var pp=parts[k],mdx=pp.x-mouse.x,mdy=pp.y-mouse.y,md=Math.sqrt(mdx*mdx+mdy*mdy); if(md<150){ ctx.beginPath(); ctx.moveTo(pp.x,pp.y); ctx.lineTo(mouse.x,mouse.y); ctx.strokeStyle='rgba('+AQUA+','+(0.22*(1-md/150)).toFixed(3)+')'; ctx.lineWidth=1; ctx.stroke(); } } }
      raf=requestAnimationFrame(frame);
    }
    function staticPaint(){ bg(); for(var i=0;i<parts.length;i++){ var p=parts[i]; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fillStyle='rgba('+AQUA+',0.5)'; ctx.fill(); } }
    try {
      size(); 
      if(reduce){ staticPaint(); }
      else {
        raf=requestAnimationFrame(frame);
        parent.addEventListener('mousemove',function(e){var r=parent.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; mouse.active=true;});
        parent.addEventListener('mouseleave',function(){mouse.active=false; mouse.x=-999; mouse.y=-999;});
      }
      var rt; window.addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(function(){ size(); if(reduce)staticPaint(); },180); });
    } catch(e){ /* graceful: hero keeps its CSS gradient background */ }
  })();
})();
