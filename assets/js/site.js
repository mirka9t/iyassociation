/* =============================================================
   IYA — SHARED SITE BEHAVIOUR (loaded on every page)
   Moved verbatim out of the original single-file index.html when
   the site became multi-page. The logic below is unchanged.
   ============================================================= */

/* =============================================================
   1. THEME  —  light / dark, remembered on this device
   ============================================================= */
(function(){
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');

  try{
    var saved = localStorage.getItem('iya-theme');
    if(saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  }catch(e){}

  function currentIsDark(){
    var attr = root.getAttribute('data-theme');
    if(attr) return attr === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  btn.addEventListener('click', function(){
    var next = currentIsDark() ? 'light' : 'dark';
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', next);
    try{ localStorage.setItem('iya-theme', next); }catch(e){}
    window.setTimeout(function(){ root.classList.remove('theme-anim'); }, 450);
  });
})();

/* =============================================================
   2. NAV  —  mobile menu + active link while scrolling
   ============================================================= */
(function(){
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  toggle.addEventListener('click', function(){
    var open = links.getAttribute('data-open') === 'true';
    links.setAttribute('data-open', String(!open));
    toggle.setAttribute('aria-expanded', String(!open));
  });
  links.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      links.setAttribute('data-open', 'false');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  var map = {};
  links.querySelectorAll('a[href^="#"]').forEach(function(a){
    var id = a.getAttribute('href').slice(1);
    if(id && id.indexOf('/') === -1) map[id] = a;
  });
  var sections = Object.keys(map).map(function(id){ return document.getElementById(id); }).filter(Boolean);
  if('IntersectionObserver' in window && sections.length){
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          Object.keys(map).forEach(function(k){ map[k].classList.remove('active'); });
          if(map[en.target.id]) map[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function(s){ spy.observe(s); });
  }
})();

/* =============================================================
   5. REVEAL ON SCROLL
      Anything already on screen stays visible; only content
      further down slides in as you reach it.
   ============================================================= */
(function(){
  var items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || !('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function(entries, obs){
    entries.forEach(function(en){
      if(en.isIntersecting){
        en.target.classList.remove('pending');
        en.target.classList.add('in');
        obs.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

  items.forEach(function(el){
    if(el.getBoundingClientRect().top < window.innerHeight * 0.95) return; // visible now: leave it
    el.classList.add('pending');
    io.observe(el);
  });
})();

/* =============================================================
   6. SCROLL BAR + BACK TO TOP
   ============================================================= */
(function(){
  var bar = document.getElementById('scrollBar');
  var top = document.getElementById('toTop');
  function onScroll(){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = pct + '%';
    top.classList.toggle('show', window.scrollY > 620);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  top.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();

/* =============================================================
   7. INFO POPOVERS + MODAL
   ============================================================= */
(function(){
  function closeAll(except){
    document.querySelectorAll('.info-pop').forEach(function(p){ if(p !== except) p.hidden = true; });
  }
  document.querySelectorAll('.info-holder').forEach(function(holder){
    var btn = holder.querySelector('.info-btn');
    var pop = holder.querySelector('.info-pop');
    if(!btn || !pop) return;
    btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); closeAll(pop); pop.hidden = false; });
    btn.addEventListener('focus', function(){ closeAll(pop); pop.hidden = false; });
    btn.addEventListener('blur', function(){ pop.hidden = true; });
    holder.addEventListener('mouseenter', function(){ closeAll(pop); pop.hidden = false; });
    holder.addEventListener('mouseleave', function(){ pop.hidden = true; });
  });
  document.addEventListener('click', function(){ closeAll(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeAll(); });

  var modal = document.getElementById('munModal');
  if(modal){
    document.querySelectorAll('[data-open-modal="munModal"]').forEach(function(b){
      b.addEventListener('click', function(){ modal.showModal(); });
    });
    modal.querySelectorAll('[data-close-modal]').forEach(function(b){
      b.addEventListener('click', function(){ modal.close(); });
    });
    modal.addEventListener('click', function(e){
      var r = modal.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if(!inside) modal.close();
    });
  }
})();

/* =============================================================
   9. FOUNDER MONOGRAMS  —  drawn here, no external images
   ============================================================= */
(function(){
  document.querySelectorAll('.founder-photo[data-initials]').forEach(function(img){
    var initials = img.getAttribute('data-initials');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 136">' +
      '<circle cx="68" cy="68" r="67" fill="#0d2145"/>' +
      '<circle cx="68" cy="68" r="54" fill="none" stroke="#e7c873" stroke-opacity=".45" stroke-width="1" stroke-dasharray="2 5"/>' +
      '<text x="68" y="83" font-family="Georgia, serif" font-size="42" fill="#f7f9fd" text-anchor="middle">' + initials + '</text>' +
      '</svg>';
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  });
})();
