/* =============================================================
   IYAMUN — APPLICATION FORM + REVIEWS
   Moved verbatim out of the original single-file index.html when
   the site became multi-page. The logic below is unchanged.
   ============================================================= */

/* Requires #applyForm AND the review markup on the same page,
   exactly as in the original file. Loaded only on the
   registration page for that reason. */

/* =============================================================
   8. COMMITTEE CARDS  —  highlight the chosen one
   ============================================================= */
(function(){
  var grid = document.getElementById('committeeGrid');
  if(!grid) return;
  var radios = grid.querySelectorAll('input[name="committee"]');
  function sync(){
    radios.forEach(function(r){ r.closest('.committee-card').classList.toggle('is-checked', r.checked); });
  }
  radios.forEach(function(r){ r.addEventListener('change', sync); });
  sync();
})();

/* =============================================================
   10. FORMS  —  applications and reviews
   ============================================================= */
(function(){
  var TG_TOKEN = '8789293444:AAGNoAdlziKwyRnSKmwHjZE4RknnP3xsFnI';
  var TG_CHAT  = '8673145264';
  var dbPromise = (window.claude && window.claude.use) ? window.claude.use('db') : Promise.resolve(null);

  function sendToTelegram(text){
    return fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: text, parse_mode: 'HTML', disable_web_page_preview: true })
    }).then(function(res){
      if(!res.ok) throw new Error('tg-' + res.status);
      return res.json();
    });
  }

  function showStatus(el, msg, ok){
    el.textContent = msg;
    el.hidden = false;
    el.className = 'status-line ' + (ok ? 'ok' : 'err');
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ---- application form ---- */
  var applyForm = document.getElementById('applyForm');
  var submitBtn = document.getElementById('submitBtn');
  var formStatus = document.getElementById('formStatus');
  var confirmState = document.getElementById('confirmState');

  applyForm.addEventListener('submit', async function(e){
    e.preventDefault();
    if(!applyForm.checkValidity()){ applyForm.reportValidity(); return; }

    var fd = new FormData(applyForm);
    var interests = Array.from(applyForm.querySelectorAll('input[name="interest"]:checked')).map(function(i){ return i.value; });
    var record = {
      event: 'IYAMUN 2026-09-27',
      firstName: fd.get('firstName') || '',
      surname: fd.get('surname') || '',
      grade: fd.get('grade') || '',
      letterGrade: fd.get('letterGrade') || '',
      email: fd.get('email') || '',
      phone: fd.get('phone') || '',
      committee: fd.get('committee') || '',
      experience: fd.get('experience') || '',
      interests: interests,
      submittedAt: new Date().toISOString(),
      sentToTelegram: false
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    var tgText = [
      '<b>\u{1F3DB} New IYAMUN 2026 Application</b>',
      '',
      '<b>Name:</b> ' + escapeHtml(record.firstName + ' ' + record.surname),
      '<b>Grade:</b> ' + escapeHtml(record.grade) + (record.letterGrade ? ' (' + escapeHtml(record.letterGrade) + ')' : ''),
      '<b>Email:</b> ' + escapeHtml(record.email),
      '<b>Phone:</b> ' + escapeHtml(record.phone || '—'),
      '<b>Committee:</b> ' + escapeHtml(record.committee),
      '<b>Also interested in:</b> ' + escapeHtml(interests.length ? interests.join(', ') : '—'),
      '<b>Experience:</b> ' + escapeHtml(record.experience || 'none'),
      '<b>Submitted:</b> ' + new Date(record.submittedAt).toLocaleString()
    ].join('\n');

    try{
      await sendToTelegram(tgText);
      var db = await dbPromise;
      if(db){ try{ await db.collection('applications').add(record); }catch(e){} }
      applyForm.hidden = true;
      confirmState.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }catch(err){
      showStatus(formStatus, 'Your application could not be delivered just now. Please check your connection and press "Send application" once more — or reach us at i.y.association1@gmail.com.', false);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send application';
    }
  });

  /* ---- reviews ---- */
  var reviewsRow = document.getElementById('reviewsRow');
  var reviewsEmpty = document.getElementById('reviewsEmpty');
  var ratingSummary = document.getElementById('ratingSummary');
  var ratingAvg = document.getElementById('ratingAvg');
  var ratingStars = document.getElementById('ratingStars');
  var ratingCount = document.getElementById('ratingCount');

  function renderReviews(docs){
    reviewsRow.querySelectorAll('.card').forEach(function(c){ c.remove(); });
    if(!docs.length){
      reviewsEmpty.hidden = false;
      ratingSummary.hidden = true;
      return;
    }
    reviewsEmpty.hidden = true;
    var sum = 0;
    docs.forEach(function(d){
      var data = d.data() || {};
      var rating = Math.max(0, Math.min(5, Number(data.rating) || 0));
      sum += rating;
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div class="stars">' + '&#9733;'.repeat(rating) + '&#9734;'.repeat(5 - rating) + '</div>' +
        '<p style="margin-top:14px;"><span class="review-quote" aria-hidden="true">&ldquo;</span>' + escapeHtml(data.text || '') + '</p>' +
        '<div class="review-name">' + escapeHtml(data.name || 'Anonymous') + '</div>' +
        (data.role ? '<div class="review-role">' + escapeHtml(data.role) + '</div>' : '');
      reviewsRow.appendChild(card);
    });
    var avg = sum / docs.length;
    ratingSummary.hidden = false;
    ratingAvg.textContent = avg.toFixed(1);
    var full = Math.round(avg);
    ratingStars.innerHTML = '&#9733;'.repeat(full) + '&#9734;'.repeat(5 - full);
    ratingCount.textContent = docs.length + (docs.length === 1 ? ' review' : ' reviews');
  }

  dbPromise.then(function(db){
    if(!db) return;
    try{
      db.collection('reviews').orderBy('submittedAt', 'desc').limit(24)
        .onSnapshot(function(snap){ renderReviews(snap.docs); }, function(){ /* keep empty state */ });
    }catch(e){}
  });

  var starPick = document.getElementById('starPick');
  var rRating = document.getElementById('rRating');
  starPick.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){
      var val = Number(btn.getAttribute('data-val'));
      rRating.value = val;
      starPick.querySelectorAll('button').forEach(function(b){
        var v = Number(b.getAttribute('data-val'));
        b.classList.toggle('on', v <= val);
        b.setAttribute('aria-checked', String(v === val));
      });
    });
  });

  var reviewForm = document.getElementById('reviewForm');
  var reviewStatus = document.getElementById('reviewStatus');
  reviewForm.addEventListener('submit', async function(e){
    e.preventDefault();
    if(Number(rRating.value) < 1){ showStatus(reviewStatus, 'Please choose a star rating first.', false); return; }
    if(!reviewForm.checkValidity()){ reviewForm.reportValidity(); return; }

    var fd = new FormData(reviewForm);
    var record = {
      name: fd.get('name') || 'Anonymous',
      role: fd.get('role') || '',
      rating: Number(rRating.value),
      text: fd.get('text') || '',
      submittedAt: new Date().toISOString()
    };
    try{
      var db = await dbPromise;
      if(!db) throw new Error('no-db');
      await db.collection('reviews').add(record);
      reviewForm.reset();
      rRating.value = 0;
      starPick.querySelectorAll('button').forEach(function(b){ b.classList.remove('on'); b.setAttribute('aria-checked','false'); });
      showStatus(reviewStatus, 'Thank you — your review is now live on this page.', true);
    }catch(err){
      showStatus(reviewStatus, 'Reviews cannot be posted from this view right now. Please try again from the published page.', false);
    }
  });
})();

/* -------------------------------------------------------------
   REVIEWS FALLBACK — additive, exactly as in the original file.
   When the page runs as plain static HTML (no window.claude
   runtime) the database write above always fails, so this block
   takes over: it stores reviews in this browser's own storage and
   still forwards a copy to the same Telegram chat the application
   form uses. If window.claude IS present it does nothing at all.
   ------------------------------------------------------------- */

(function(){
  if(window.claude && window.claude.use) return; // real database is available — leave it alone

  var TG_TOKEN = '8789293444:AAGNoAdlziKwyRnSKmwHjZE4RknnP3xsFnI';
  var TG_CHAT  = '8673145264';
  var STORE_KEY = 'iya-reviews-v1';

  function escapeHtml2(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function loadLocal(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveLocal(list){
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(-50))); }catch(e){}
  }
  function notifyTelegram(rec){
    var text = [
      '<b>⭐ New Review Posted</b>',
      '',
      '<b>Name:</b> ' + escapeHtml2(rec.name),
      rec.role ? '<b>Role:</b> ' + escapeHtml2(rec.role) : null,
      '<b>Rating:</b> ' + '★'.repeat(rec.rating) + '☆'.repeat(5 - rec.rating),
      '<b>Review:</b> ' + escapeHtml2(rec.text)
    ].filter(Boolean).join('\n');
    fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: text, parse_mode: 'HTML' })
    }).catch(function(){ /* best-effort only — never blocks the on-page confirmation */ });
  }

  var reviewsRow = document.getElementById('reviewsRow');
  var reviewsEmpty = document.getElementById('reviewsEmpty');
  var ratingSummary = document.getElementById('ratingSummary');
  var ratingAvg = document.getElementById('ratingAvg');
  var ratingStars = document.getElementById('ratingStars');
  var ratingCount = document.getElementById('ratingCount');
  var reviewForm = document.getElementById('reviewForm');
  var reviewStatus = document.getElementById('reviewStatus');
  var starPick = document.getElementById('starPick');
  var rRating = document.getElementById('rRating');
  if(!reviewForm) return;

  function renderLocal(){
    var docs = loadLocal();
    reviewsRow.querySelectorAll('.card').forEach(function(c){ c.remove(); });
    if(!docs.length){
      reviewsEmpty.hidden = false;
      ratingSummary.hidden = true;
      return;
    }
    reviewsEmpty.hidden = true;
    var sum = 0;
    docs.slice().reverse().forEach(function(data){
      var rating = Math.max(0, Math.min(5, Number(data.rating) || 0));
      sum += rating;
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div class="stars">' + '★'.repeat(rating) + '☆'.repeat(5 - rating) + '</div>' +
        '<p style="margin-top:14px;"><span class="review-quote" aria-hidden="true">&ldquo;</span>' + escapeHtml2(data.text || '') + '</p>' +
        '<div class="review-name">' + escapeHtml2(data.name || 'Anonymous') + '</div>' +
        (data.role ? '<div class="review-role">' + escapeHtml2(data.role) + '</div>' : '');
      reviewsRow.appendChild(card);
    });
    var avg = sum / docs.length;
    ratingSummary.hidden = false;
    ratingAvg.textContent = avg.toFixed(1);
    var full = Math.round(avg);
    ratingStars.innerHTML = '★'.repeat(full) + '☆'.repeat(5 - full);
    ratingCount.textContent = docs.length + (docs.length === 1 ? ' review' : ' reviews');
  }

  function showStatus2(el, msg, ok){
    el.textContent = msg;
    el.hidden = false;
    el.className = 'status-line ' + (ok ? 'ok' : 'err');
  }

  // Capture the submit before the original (database-only) handler can show
  // its "cannot be posted from this view" error, and handle it ourselves.
  reviewForm.addEventListener('submit', function(e){
    e.preventDefault();
    e.stopImmediatePropagation();

    if(Number(rRating.value) < 1){ showStatus2(reviewStatus, 'Please choose a star rating first.', false); return; }
    if(!reviewForm.checkValidity()){ reviewForm.reportValidity(); return; }

    var fd = new FormData(reviewForm);
    var record = {
      name: fd.get('name') || 'Anonymous',
      role: fd.get('role') || '',
      rating: Number(rRating.value),
      text: fd.get('text') || '',
      submittedAt: new Date().toISOString()
    };

    var list = loadLocal();
    list.push(record);
    saveLocal(list);
    notifyTelegram(record);
    renderLocal();

    reviewForm.reset();
    rRating.value = 0;
    starPick.querySelectorAll('button').forEach(function(b){ b.classList.remove('on'); b.setAttribute('aria-checked','false'); });
    showStatus2(reviewStatus, 'Thank you — your review is now shown below on this device.', true);
  }, true); // capture phase: runs before the original bubble-phase handler

  renderLocal();
})();
