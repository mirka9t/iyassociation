/* =============================================================
   IYA — NEW UI BEHAVIOUR (added for the multi-page site)
   Deliberately isolated from site.js / mun-countdown.js /
   mun-forms.js, which hold the original, unchanged logic.
   Everything here is feature-detected and no-ops when the
   markup it drives is not on the page.
   ============================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------
     1. LEGACY LINKS
     The old single-page site addressed its sub-pages with
     #/apply and #/team. Those links live in people's chats and
     bookmarks, so they still have to arrive somewhere sensible.
     ----------------------------------------------------------- */
  (function legacyHashRoutes() {
    var map = {
      '#/apply': 'mun/registration/',
      '#/team': 'team/'
    };
    function go() {
      var target = map[location.hash];
      if (!target) return;
      var root = document.documentElement.getAttribute('data-root') || '';
      location.replace(root + target);
    }
    window.addEventListener('hashchange', go);
    go();
  })();

  /* -----------------------------------------------------------
     2. MEGA MENU
     Desktop: hover or click. Mobile: accordion inside the drawer.
     ----------------------------------------------------------- */
  (function megaMenu() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.mega-trigger'));
    if (!triggers.length) return;

    var desktop = window.matchMedia('(min-width: 961px)');
    var hoverTimer;

    function close(trigger) { trigger.setAttribute('aria-expanded', 'false'); }
    function closeAll(except) {
      triggers.forEach(function (t) { if (t !== except) close(t); });
    }
    function open(trigger) {
      closeAll(trigger);
      trigger.setAttribute('aria-expanded', 'true');
    }
    function toggle(trigger) {
      if (trigger.getAttribute('aria-expanded') === 'true') close(trigger);
      else open(trigger);
    }

    triggers.forEach(function (trigger) {
      var panel = trigger.nextElementSibling;
      var holder = trigger.parentNode;

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggle(trigger);
      });

      holder.addEventListener('mouseenter', function () {
        if (!desktop.matches) return;
        window.clearTimeout(hoverTimer);
        open(trigger);
      });
      holder.addEventListener('mouseleave', function () {
        if (!desktop.matches) return;
        hoverTimer = window.setTimeout(function () { close(trigger); }, 160);
      });

      if (panel) {
        panel.addEventListener('click', function (e) { e.stopPropagation(); });
      }
    });

    document.addEventListener('click', function () { closeAll(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAll();
      var openTrigger = document.querySelector('.mega-trigger[aria-expanded="true"]');
      if (openTrigger) openTrigger.focus();
    });
    document.addEventListener('focusin', function (e) {
      triggers.forEach(function (t) {
        if (t.getAttribute('aria-expanded') !== 'true') return;
        if (!t.parentNode.contains(e.target)) close(t);
      });
    });
    desktop.addEventListener('change', function () { closeAll(); });
  })();

  /* -----------------------------------------------------------
     3. FILTERS  —  events, projects, articles, gallery
     Markup contract:
       <div data-filter-group="events"> ...filter buttons... </div>
       <element data-filter-target="events"> items with
         data-category="a b" </element>
     ----------------------------------------------------------- */
  (function filters() {
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-filter-group]'));
    if (!groups.length) return;

    groups.forEach(function (group) {
      var name = group.getAttribute('data-filter-group');
      var target = document.querySelector('[data-filter-target="' + name + '"]');
      if (!target) return;

      var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-filter]'));
      var items = Array.prototype.slice.call(target.querySelectorAll('[data-category]'));
      var counter = group.querySelector('.filter-count');
      var search = group.querySelector('input[type="search"]');
      var empty = document.querySelector('[data-filter-empty="' + name + '"]');
      var current = 'all';

      function apply() {
        var term = search ? search.value.trim().toLowerCase() : '';
        var shown = 0;

        items.forEach(function (item) {
          var cats = (item.getAttribute('data-category') || '').toLowerCase();
          var matchCat = current === 'all' || cats.split(/\s+/).indexOf(current) !== -1;
          var matchTerm = !term || item.textContent.toLowerCase().indexOf(term) !== -1;
          var show = matchCat && matchTerm;

          item.classList.toggle('is-filtered-out', !show);
          if (show) {
            shown++;
            if (!reduceMotion) {
              item.classList.remove('filter-item');
              void item.offsetWidth;
              item.classList.add('filter-item');
            }
          }
        });

        if (counter) {
          counter.textContent = shown + (shown === 1 ? ' entry' : ' entries');
        }
        if (empty) empty.hidden = shown !== 0;
      }

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          current = btn.getAttribute('data-filter') || 'all';
          buttons.forEach(function (b) {
            b.setAttribute('aria-pressed', String(b === btn));
          });
          apply();
        });
      });

      if (search) {
        var debounce;
        search.addEventListener('input', function () {
          window.clearTimeout(debounce);
          debounce = window.setTimeout(apply, 140);
        });
      }

      apply();
    });
  })();

  /* -----------------------------------------------------------
     4. NUMBER COUNTERS  —  <b data-count="120" data-suffix="+">
     ----------------------------------------------------------- */
  (function counters() {
    var nums = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (!nums.length) return;

    function format(value, decimals) {
      return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      var decimals = (el.getAttribute('data-decimals') | 0);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';

      if (reduceMotion) {
        el.textContent = prefix + format(target, decimals) + suffix;
        return;
      }

      var duration = 1250;
      var start = null;
      function frame(now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + format(target * eased, decimals) + suffix;
        if (p < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        obs.unobserve(en.target);
      });
    }, { threshold: .4 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  /* -----------------------------------------------------------
     5. STAGGER  —  children of [data-stagger] reveal in sequence
     ----------------------------------------------------------- */
  (function stagger() {
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      var step = parseInt(group.getAttribute('data-stagger'), 10) || 70;
      Array.prototype.slice.call(group.children).forEach(function (child, i) {
        child.style.setProperty('--d', (i * step) + 'ms');
      });
    });
  })();

  /* -----------------------------------------------------------
     6. GALLERY LIGHTBOX
     ----------------------------------------------------------- */
  (function lightbox() {
    var shots = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    var box = document.getElementById('lightbox');
    if (!shots.length || !box) return;

    var slot = box.querySelector('[data-lightbox-slot]');
    var caption = box.querySelector('figcaption');
    var closeBtn = box.querySelector('.lightbox-close');
    var lastFocus = null;

    function open(shot) {
      var art = shot.querySelector('svg, img');
      if (!art) return;
      lastFocus = shot;
      slot.innerHTML = '';
      slot.appendChild(art.cloneNode(true));
      var cap = shot.querySelector('figcaption');
      caption.textContent = cap ? cap.textContent : '';
      box.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      box.removeAttribute('open');
      slot.innerHTML = '';
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    shots.forEach(function (shot) {
      shot.addEventListener('click', function () { open(shot); });
    });
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.hasAttribute('open')) close();
    });
  })();

  /* -----------------------------------------------------------
     7. TEAM PROFILE DIALOGS
     <button data-person="mm"> opens <dialog id="person-mm">
     Uses its own attribute so it cannot collide with the
     original munModal handler in site.js.
     ----------------------------------------------------------- */
  (function people() {
    var openers = Array.prototype.slice.call(document.querySelectorAll('[data-person]'));
    if (!openers.length) return;

    openers.forEach(function (opener) {
      var dialog = document.getElementById('person-' + opener.getAttribute('data-person'));
      if (!dialog || typeof dialog.showModal !== 'function') return;

      opener.addEventListener('click', function () { dialog.showModal(); });

      dialog.querySelectorAll('[data-person-close]').forEach(function (btn) {
        btn.addEventListener('click', function () { dialog.close(); });
      });
      dialog.addEventListener('click', function (e) {
        var r = dialog.getBoundingClientRect();
        var inside = e.clientX >= r.left && e.clientX <= r.right &&
                     e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) dialog.close();
      });
    });
  })();

  /* -----------------------------------------------------------
     8. GENTLE PARALLAX  —  [data-parallax="0.12"]
     Transform only, so it stays on the compositor.
     ----------------------------------------------------------- */
  (function parallax() {
    if (reduceMotion) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!items.length) return;

    var ticking = false;
    function update() {
      var mid = window.innerHeight / 2;
      items.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        var depth = parseFloat(el.getAttribute('data-parallax')) || .1;
        var offset = (rect.top + rect.height / 2 - mid) * depth;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  })();
})();
