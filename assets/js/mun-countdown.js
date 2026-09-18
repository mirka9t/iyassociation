/* =============================================================
   IYAMUN — CONFERENCE COUNTDOWN
   Moved verbatim out of the original single-file index.html when
   the site became multi-page. The logic below is unchanged.
   ============================================================= */

/* =============================================================
   4. COUNTDOWN  —  four rings that fill as the clock runs
   ============================================================= */
(function(){
  var TARGET = new Date('2026-09-27T09:00:00+05:00').getTime();
  var R = 52, C = 2 * Math.PI * R;          // ring circumference
  var TOTAL_DAYS = 60;                       // days ring is drawn against 60 days

  var els = {
    days:  { num: document.getElementById('cdDays'),  arc: document.getElementById('arcDays'),  max: TOTAL_DAYS },
    hours: { num: document.getElementById('cdHours'), arc: document.getElementById('arcHours'), max: 24 },
    mins:  { num: document.getElementById('cdMins'),  arc: document.getElementById('arcMins'),  max: 60 },
    secs:  { num: document.getElementById('cdSecs'),  arc: document.getElementById('arcSecs'),  max: 60 }
  };
  var hero = document.getElementById('heroCountdown');
  var srText = document.getElementById('cdText');
  var prev = {};

  Object.keys(els).forEach(function(k){
    var a = els[k].arc;
    if(a){ a.style.strokeDasharray = C.toFixed(2); a.style.strokeDashoffset = C.toFixed(2); }
  });

  function setRing(key, value){
    var e = els[key];
    if(!e || !e.num) return;
    var shown = (key === 'days') ? String(value) : String(value).padStart(2, '0');
    if(prev[key] !== value){
      e.num.textContent = shown;
      e.num.classList.remove('pop');
      void e.num.offsetWidth;               // restart the pop animation
      e.num.classList.add('pop');
      if(e.arc){
        var frac = Math.min(1, value / e.max);
        // when a unit wraps (0 -> 59) skip the tween so it doesn't run backwards
        if(prev[key] !== undefined && value > prev[key]){
          e.arc.classList.add('no-tween');
          window.setTimeout(function(){ e.arc.classList.remove('no-tween'); }, 60);
        }
        e.arc.style.strokeDashoffset = (C * (1 - frac)).toFixed(2);
      }
      prev[key] = value;
    }
  }

  function tick(){
    var diff = TARGET - Date.now();
    if(diff < 0) diff = 0;
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);

    setRing('days', d); setRing('hours', h); setRing('mins', m); setRing('secs', s);
    if(hero) hero.textContent = d;
    if(srText) srText.textContent = diff === 0
      ? 'IYAMUN is happening today.'
      : d + ' days, ' + h + ' hours and ' + m + ' minutes until IYAMUN.';
  }
  tick();
  window.setInterval(tick, 1000);
})();
