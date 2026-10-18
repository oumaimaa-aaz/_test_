/* SOLUTECH VMIS - behaviour of the page (loaded at the end of index.html) */

/* Tells the CSS that JavaScript is running (used for the scroll-in animation of the "Nos équipements" title) */
document.documentElement.classList.add('js');
/* 1) "Nos équipements" title fades in when you scroll to it */
(function(){
  const h=document.querySelector('.equip h2');
  function check(){if(h.getBoundingClientRect().top<innerHeight*.8){h.classList.add('in');removeEventListener('scroll',check)}}
  addEventListener('scroll',check,{passive:true});check();
})();
/* 2) Mobile menu: the burger button opens/closes the menu, a click on a link closes it */
const burger=document.getElementById('burger'),nav=document.getElementById('nav');
burger.addEventListener('click',()=>{const o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o)});
nav.addEventListener('click',e=>{if(e.target.tagName==='A'){nav.classList.remove('open');burger.setAttribute('aria-expanded',false)}});

/* 3) Drill of the process section
   - Desktop: the drill is "position:sticky" in the CSS (stays on screen while the steps scroll, then stops on the orange line)
   - Mobile: this code moves the drill down along the line while you scroll */
(function(){
  const sec=document.getElementById('track'),tool=document.getElementById('tool'),orange=document.getElementById('pline-o');
  let tick=false;
  function update(){
    tick=false;
    const r=sec.getBoundingClientRect(),h=tool.offsetHeight;
    /* the drill reaches the orange line when the end of the track is at 90% of the screen height: the whole drill is visible, then the page keeps scrolling */
    const p=Math.min(1,Math.max(0,(innerHeight*.4-r.top)/Math.max(1,r.height-innerHeight*.5)));
    let y;
    if(matchMedia('(min-width:821px)').matches){
      /* desktop: the drill is position:sticky (CSS) - it stays on screen while the steps scroll, then stops on the orange line */
      tool.style.transform='';return;
    }else{
      const gap=orange.offsetHeight+parseFloat(getComputedStyle(orange).bottom);
      y=p*(r.height-h-gap+4);
    }
    tool.style.transform='translateY('+y+'px)';
  }
  function req(){if(!tick){tick=true;requestAnimationFrame(update)}}
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);update();
})();

/* 4) Header: follows the scroll (goes up with the page when you scroll down, comes back when you scroll up)
      + the menu link of the section you are in turns orange */
(function(){
  const header=document.querySelector('header'),links=[...document.querySelectorAll('nav a')];
  const secs=links.map(a=>document.querySelector(a.getAttribute('href')));
  let last=scrollY,off=0,t=false,snap;
  /* the header follows the scroll: it moves up with the page when you scroll down and comes back down when you scroll up */
  function place(){header.style.transform=off?'translateY('+(-off)+'px)':''}
  function update(){
    t=false;
    const y=scrollY,open=nav.classList.contains('open'),dy=y-last,H=header.offsetHeight;
    last=y;
    header.style.transition='none';
    if(y<=0||open)off=0;
    else off=Math.min(H,Math.max(0,off+dy));
    place();
    /* when the scroll stops half way, finish the movement smoothly */
    clearTimeout(snap);
    snap=setTimeout(()=>{header.style.transition='transform .2s ease-out';off=off>H/2?H:0;place()},140);
    // active only while the page is inside that section (nothing active in between)
    links.forEach((a,i)=>{
      const r=secs[i].getBoundingClientRect();
      const off=header.offsetHeight+4;a.classList.toggle('active',r.top<=off&&r.bottom>off);
    });
  }
  addEventListener('scroll',()=>{if(!t){t=true;requestAnimationFrame(update)}},{passive:true});update();
})();

/* 5) FAQ: only one question open at a time */
document.querySelectorAll('.faq details').forEach(d=>d.addEventListener('toggle',()=>{
  if(d.open)document.querySelectorAll('.faq details').forEach(o=>{if(o!==d)o.open=false});
}));

/* 6) Contact form: sends the quote request to a Google Apps Script web app (free, runs in YOUR Google account).
   The web app URL (SCRIPT_URL) is set in js/config.js.
   The address that receives the requests is set inside the script (Code.gs), not here. */
const MAX_FILE_MB=5;
const fileToB64=file=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=()=>rej(r.error);r.readAsDataURL(file)});
document.getElementById('form').addEventListener('submit',async e=>{
  e.preventDefault();
  const f=e.target,msg=document.getElementById('msg'),btn=f.querySelector('button[type=submit]');
  const say=(t,ok)=>{msg.textContent=t;msg.style.color=ok?'#1e7e34':''};
  if(!f.nom.value.trim()||!/^\S+@\S+\.\S+$/.test(f.email.value)){say('Veuillez renseigner votre nom et un email valide.');return}
  if(!f.desc.value.trim()){say('Veuillez décrire brièvement votre besoin.');return}
  const file=f.attachment.files[0];
  if(file&&file.size>MAX_FILE_MB*1024*1024){say('Le document dépasse '+MAX_FILE_MB+' Mo. Merci d\'en joindre un plus léger.');return}
  if(SCRIPT_URL.indexOf('COLLER_ICI')===0){say('Envoi non configuré : renseignez SCRIPT_URL dans le code.');return}
  const label=btn.textContent;
  let reason='';
  btn.disabled=true;btn.textContent='Envoi en cours…';say('');
  try{
    const payload={nom:f.nom.value,ent:f.ent.value,email:f.email.value,tel:f.tel.value,pays:f.pays.value,besoin:f.besoin.value,desc:f.desc.value,_honey:f.elements._honey.value};
    if(file)payload.file={name:file.name,data:await fileToB64(file)};
    const r=await fetch(SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const j=await r.json().catch(()=>({}));
    if(!j.success){reason=j.message||'';throw new Error(reason||('HTTP '+r.status))}
    say('Merci, votre demande a bien été envoyée. Nous vous répondons rapidement.',true);
    f.reset();
  }catch(err){
    console.error('Envoi du devis échoué :',err);
    say(reason||'L\'envoi a échoué. Réessayez dans un instant.');
  }finally{
    btn.disabled=false;btn.textContent=label;
  }
});
