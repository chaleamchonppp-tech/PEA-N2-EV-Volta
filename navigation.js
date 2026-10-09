document.querySelector('#nav-repairs').addEventListener('click',()=>document.querySelector('#repair-all')?.click());
const navLinks=[...document.querySelectorAll('.nav-links a')];
const sectionObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)navLinks.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}},{rootMargin:'-5% 0px -65% 0px',threshold:0});
navLinks.forEach(a=>{const target=document.querySelector(a.hash);if(target)sectionObserver.observe(target);});

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
navLinks.forEach(link=>link.addEventListener('click',event=>{
 const target=document.querySelector(link.hash);if(!target)return;
 event.preventDefault();
 target.scrollIntoView({behavior:reduceMotion.matches?'instant':'smooth',block:'start'});
 history.replaceState(null,'',link.hash);
 navLinks.forEach(a=>a.classList.toggle('active',a===link));
 target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
}));
