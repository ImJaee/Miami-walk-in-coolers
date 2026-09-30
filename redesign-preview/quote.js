/* Guided quote form: 4 steps, live draft spec + floor plan, Web3Forms submit. */
(function () {
  var form = document.getElementById('quoteForm');
  if (!form) return;

  var PLACEHOLDER_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';
  var WALK_INS = ['cooler', 'freezer', 'combo', 'beer-cave'];
  var steps = form.querySelectorAll('.step');
  var progress = form.querySelectorAll('.progress li');
  var backBtn = document.getElementById('q-back');
  var nextBtn = document.getElementById('q-next');
  var formError = document.getElementById('form-error');
  var walkinBox = form.querySelector('.step-walkin');
  var partsBox = form.querySelector('.step-parts');
  var unsure = document.getElementById('q-unsure');
  var dimInputs = [document.getElementById('q-len'), document.getElementById('q-wid'), document.getElementById('q-hgt')];
  var current = 1;
  var reached = 1;

  /* ---------- helpers ---------- */
  function $(sel) { return form.querySelector(sel); }
  function typeInput() { return $('input[name="What do you need?"]:checked'); }
  function typeKey() { var t = typeInput(); return t ? t.getAttribute('data-key') : ''; }
  function isWalkin() { return WALK_INS.indexOf(typeKey()) !== -1; }
  function num(el) {
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) ? v : NaN;
  }
  function feet(v) {
    var inches = Math.round(v * 12);
    return Math.floor(inches / 12) + '′-' + (inches % 12) + '″';
  }
  function setError(id, msg, field) {
    document.getElementById(id).textContent = msg || '';
    if (field) {
      if (msg) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }
    return !msg;
  }
  function radioValue(name) {
    var r = $('input[name="' + name + '"]:checked');
    return r && !r.disabled ? r.value : '';
  }

  /* ---------- step 2 variant: walk-in vs parts/equipment ---------- */
  function syncVariant() {
    var walkin = isWalkin() || !typeKey();
    walkinBox.hidden = !walkin;
    partsBox.hidden = walkin;
    walkinBox.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = !walkin; });
    partsBox.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = walkin; });
    var key = typeKey();
    partsBox.querySelectorAll('.chips[data-for]').forEach(function (g) {
      var on = !walkin && g.getAttribute('data-for') === key;
      g.hidden = !on;
      g.querySelectorAll('input').forEach(function (el) { el.disabled = !on; });
    });
    var opening = document.getElementById('q-opening');
    opening.closest('.field').hidden = key !== 'door';
    opening.disabled = key !== 'door';
    if (walkin) syncUnsure();
    document.getElementById('step2-title').textContent = walkin ? 'Size & setup' : 'Which items?';
    document.getElementById('spec-title').textContent = walkin ? 'Your walk-in' : 'Your request';
    document.getElementById('plan').hidden = !walkin;
    progress[1].querySelector('.p-label').textContent = walkin ? 'Size' : 'Details';
  }
  function syncUnsure() {
    dimInputs.forEach(function (el) {
      el.disabled = unsure.checked;
      if (unsure.checked) el.removeAttribute('aria-invalid');
    });
    if (unsure.checked) setError('err-dims', '');
  }

  /* ---------- validation per step ---------- */
  function validate(step) {
    if (step === 1) {
      return setError('err-type', typeInput() ? '' : 'Pick what you’re building to continue.');
    }
    if (step === 2) {
      if (!isWalkin()) {
        var any = partsBox.querySelector('input[name="Items Needed"]:checked:not(:disabled)') || document.getElementById('q-part-details').value.trim();
        return setError('err-parts', any ? '' : 'Pick at least one item, or tell us more in the details box.');
      }
      if (unsure.checked) return true;
      var L = num(dimInputs[0]), W = num(dimInputs[1]), H = num(dimInputs[2]);
      var msg = '';
      dimInputs.forEach(function (el) { el.removeAttribute('aria-invalid'); });
      if (isNaN(L) || L < 4 || L > 100) { msg = 'Enter a length between 4 and 100 ft, or tick “not sure”.'; dimInputs[0].setAttribute('aria-invalid', 'true'); }
      else if (isNaN(W) || W < 4 || W > 100) { msg = 'Enter a width between 4 and 100 ft, or tick “not sure”.'; dimInputs[1].setAttribute('aria-invalid', 'true'); }
      else if (dimInputs[2].value.trim() && (isNaN(H) || H < 6 || H > 20)) { msg = 'Height should be between 6 and 20 ft. Leave it blank if you don’t know.'; dimInputs[2].setAttribute('aria-invalid', 'true'); }
      return setError('err-dims', msg);
    }
    if (step === 3) {
      var zip = document.getElementById('q-zip');
      return setError('err-zip', /^\d{5}$/.test(zip.value.trim()) ? '' : 'Enter the 5-digit ZIP where it will be delivered.', zip);
    }
    if (step === 4) {
      var name = document.getElementById('q-name');
      var phone = document.getElementById('q-phone');
      var email = document.getElementById('q-email');
      var ok1 = setError('err-name', name.value.trim() ? '' : 'Enter your name.', name);
      var ok2 = setError('err-phone', phone.value.replace(/\D/g, '').length >= 10 ? '' : 'Enter a phone number with area code.', phone);
      var ok3 = setError('err-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'Enter an email like you@business.com.', email);
      return ok1 && ok2 && ok3;
    }
    return true;
  }
  function focusFirstInvalid(step) {
    var el = steps[step - 1].querySelector('[aria-invalid="true"]') ||
             (step === 1 ? steps[0].querySelector('input[type="radio"]') : null) ||
             (step === 2 && !isWalkin() ? partsBox.querySelector('input:not(:disabled)') : null);
    if (el) el.focus();
  }

  /* ---------- navigation ---------- */
  function showStep(n, focus) {
    current = n;
    reached = Math.max(reached, n);
    steps.forEach(function (s, i) { s.hidden = i !== n - 1; });
    progress.forEach(function (li, i) {
      var idx = i + 1;
      li.classList.toggle('done', idx < n);
      if (idx === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.querySelector('button').disabled = idx > reached || idx === n;
    });
    backBtn.hidden = n === 1;
    nextBtn.innerHTML = n === 4 ? 'Send my quote request <span class="arrow" aria-hidden="true">→</span>' : 'Next <span class="arrow" aria-hidden="true">→</span>';
    formError.textContent = '';
    if (focus) {
      var top = form.getBoundingClientRect().top + window.pageYOffset - 96;
      if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'smooth' });
      steps[n - 1].querySelector('legend').focus({ preventScroll: true });
    }
  }

  backBtn.addEventListener('click', function () { if (current > 1) showStep(current - 1, true); });
  form.querySelectorAll('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () {
      var n = +b.getAttribute('data-goto');
      if (n < current) { showStep(n, true); return; }
      for (var s = current; s < n; s++) {
        if (!validate(s)) { showStep(s, true); focusFirstInvalid(s); return; }
      }
      showStep(n, true);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(current)) { focusFirstInvalid(current); return; }
    if (current < 4) { showStep(current + 1, true); return; }
    send();
  });

  /* ---------- live spec + floor plan ---------- */
  var plan = document.getElementById('plan');
  function specSet(key, text) {
    var dd = document.querySelector('[data-spec="' + key + '"]');
    dd.textContent = text || '—';
    dd.classList.toggle('empty', !text);
  }
  function specText() {
    var lines = [];
    document.querySelectorAll('#spec-list dt').forEach(function (dt) {
      var dd = dt.nextElementSibling;
      if (!dd.classList.contains('empty')) lines.push(dt.textContent + ': ' + dd.textContent);
    });
    return lines.join('\n');
  }

  function updateSpec() {
    var t = typeInput();
    specSet('type', t ? t.value : '');
    specSet('temp', t ? t.getAttribute('data-temp') : '');
    var walkin = isWalkin();
    var L = num(dimInputs[0]), W = num(dimInputs[1]), H = num(dimInputs[2]);
    var hasLW = walkin && !unsure.checked && L >= 4 && W >= 4 && L <= 100 && W <= 100;
    if (walkin && unsure.checked) specSet('size', 'Help me measure');
    else if (hasLW) specSet('size', feet(L) + ' × ' + feet(W) + (H >= 6 && H <= 20 ? ' × ' + feet(H) : ''));
    else specSet('size', '');
    specSet('area', hasLW ? Math.round(L * W) + ' sq ft' : '');
    if (walkin) {
      specSet('setup', [radioValue('Location'), radioValue('Floor') === 'Not sure' ? '' : radioValue('Floor'), radioValue('Refrigeration') === 'Include a system' ? 'With refrigeration' : ''].filter(Boolean).join(' · '));
    } else {
      var parts = [];
      partsBox.querySelectorAll('input[name="Items Needed"]:checked:not(:disabled)').forEach(function (c) { parts.push(c.value); });
      specSet('setup', parts.join(', '));
    }
    var zip = document.getElementById('q-zip').value.trim();
    specSet('zip', /^\d{5}$/.test(zip) ? zip : '');
    specSet('timeline', current >= 3 || reached >= 3 ? radioValue('Timeline') : '');
    drawPlan(hasLW ? L : 0, hasLW ? W : 0);
  }

  function drawPlan(L, W) {
    var VW = 320, VH = 220;
    var ink = '#93a7b8', frost = '#5ce1e6', text = '#dbe6ee', bg = '#0a1724';
    var key = typeKey();
    var svg = '<svg viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="' +
      (L ? 'Floor plan, ' + Math.round(L * W) + ' square feet' : 'Floor plan placeholder') + '" font-family="IBM Plex Mono, monospace">';
    if (!L) {
      var msg = key && WALK_INS.indexOf(key) === -1 ? 'Floor plan is for walk-ins' : 'Enter a size to draw the floor plan';
      svg += '<rect x="50" y="45" width="220" height="125" fill="none" stroke="' + ink + '" stroke-opacity=".5" stroke-dasharray="5 5"/>' +
             '<text x="160" y="112" text-anchor="middle" font-size="10" letter-spacing="1" fill="' + ink + '">' + msg.toUpperCase() + '</text></svg>';
      plan.innerHTML = svg;
      return;
    }
    var padL = 46, padT = 38, availW = 250, availH = 132;
    var s = Math.min(availW / L, availH / W);
    var rw = L * s, rh = W * s;
    var x = padL + (availW - rw) / 2, y = padT + (availH - rh) / 2;
    // 1-ft grid when it reads clearly
    if (s >= 7) {
      for (var gx = 1; gx < L; gx++) svg += '<line x1="' + (x + gx * s) + '" y1="' + y + '" x2="' + (x + gx * s) + '" y2="' + (y + rh) + '" stroke="' + ink + '" stroke-opacity=".12"/>';
      for (var gy = 1; gy < W; gy++) svg += '<line x1="' + x + '" y1="' + (y + gy * s) + '" x2="' + (x + rw) + '" y2="' + (y + gy * s) + '" stroke="' + ink + '" stroke-opacity=".12"/>';
    }
    svg += '<rect x="' + x + '" y="' + y + '" width="' + rw + '" height="' + rh + '" fill="' + frost + '" fill-opacity=".06" stroke="' + frost + '" stroke-width="2.5"/>';

    // entry door on the front wall, swinging out
    var dw = Math.min(3 * s, rw * 0.3, 30);
    var dx = x + rw - dw - Math.min(s, 10), dy = y + rh;
    svg += '<line x1="' + dx + '" y1="' + dy + '" x2="' + (dx + dw) + '" y2="' + dy + '" stroke="' + bg + '" stroke-width="4"/>' +
           '<line x1="' + (dx + dw) + '" y1="' + dy + '" x2="' + (dx + dw) + '" y2="' + (dy + dw) + '" stroke="' + text + '" stroke-width="1.5"/>' +
           '<path d="M' + dx + ' ' + dy + ' A' + dw + ' ' + dw + ' 0 0 0 ' + (dx + dw) + ' ' + (dy + dw) + '" fill="none" stroke="' + text + '" stroke-opacity=".6" stroke-dasharray="3 3"/>';

    if (key === 'combo') {
      var px = x + rw / 2;
      svg += '<line x1="' + px + '" y1="' + y + '" x2="' + px + '" y2="' + (y + rh) + '" stroke="' + frost + '" stroke-width="2"/>' +
             '<text x="' + (x + rw / 4) + '" y="' + (y + 14) + '" text-anchor="middle" font-size="8" letter-spacing="1" fill="' + text + '">COOLER</text>' +
             '<text x="' + (x + rw * 0.75) + '" y="' + (y + 14) + '" text-anchor="middle" font-size="8" letter-spacing="1" fill="' + text + '">FREEZER</text>';
    }
    if (key === 'beer-cave') {
      var gEnd = dx - Math.min(s, 8), seg = Math.max(2.5 * s, 12), gxPos = x + 4;
      while (gxPos + seg <= gEnd) {
        svg += '<rect x="' + gxPos + '" y="' + (dy - 3) + '" width="' + (seg - 3) + '" height="6" fill="' + frost + '"/>';
        gxPos += seg;
      }
      if (gxPos > x + 4) svg += '<text x="' + ((x + gxPos) / 2) + '" y="' + (dy + 16) + '" text-anchor="middle" font-size="7.5" letter-spacing="1" fill="' + frost + '">GLASS DOORS</text>';
    }

    // dimension lines
    var ty = y - 16, lx = x - 16;
    svg += '<g stroke="' + ink + '" stroke-width="1.2">' +
           '<line x1="' + x + '" y1="' + ty + '" x2="' + (x + rw) + '" y2="' + ty + '"/>' +
           '<line x1="' + x + '" y1="' + (ty - 5) + '" x2="' + x + '" y2="' + (ty + 5) + '"/>' +
           '<line x1="' + (x + rw) + '" y1="' + (ty - 5) + '" x2="' + (x + rw) + '" y2="' + (ty + 5) + '"/>' +
           '<line x1="' + lx + '" y1="' + y + '" x2="' + lx + '" y2="' + (y + rh) + '"/>' +
           '<line x1="' + (lx - 5) + '" y1="' + y + '" x2="' + (lx + 5) + '" y2="' + y + '"/>' +
           '<line x1="' + (lx - 5) + '" y1="' + (y + rh) + '" x2="' + (lx + 5) + '" y2="' + (y + rh) + '"/></g>';
    var lLabel = feet(L), wLabel = feet(W);
    svg += '<rect x="' + (x + rw / 2 - 26) + '" y="' + (ty - 7) + '" width="52" height="14" fill="' + bg + '"/>' +
           '<text x="' + (x + rw / 2) + '" y="' + (ty + 3.5) + '" text-anchor="middle" font-size="10" font-weight="600" fill="' + text + '">' + lLabel + '</text>' +
           '<g transform="translate(' + lx + ' ' + (y + rh / 2) + ') rotate(-90)">' +
           '<rect x="-26" y="-7" width="52" height="14" fill="' + bg + '"/>' +
           '<text x="0" y="3.5" text-anchor="middle" font-size="10" font-weight="600" fill="' + text + '">' + wLabel + '</text></g>';
    if (rw > 90 && rh > 44 && key !== 'combo') {
      svg += '<text x="' + (x + rw / 2) + '" y="' + (y + rh / 2 + 4) + '" text-anchor="middle" font-size="11" letter-spacing="1.5" font-weight="600" fill="' + frost + '">' + Math.round(L * W) + ' SQ FT</text>';
    }
    svg += '<text x="' + (VW - 8) + '" y="' + (VH - 8) + '" text-anchor="end" font-size="7" letter-spacing="1" fill="' + ink + '">INTERIOR · NOT TO SCALE FOR BUILD</text></svg>';
    plan.innerHTML = svg;
  }

  form.addEventListener('input', updateSpec);
  form.addEventListener('change', function (e) {
    if (e.target.name === 'What do you need?') { syncVariant(); setError('err-type', ''); }
    if (e.target === unsure) syncUnsure();
    if (e.target.name === 'Items Needed') setError('err-parts', '');
    updateSpec();
  });

  /* ---------- send ---------- */
  function send() {
    var data = new FormData(form);
    data.append('Draft Spec', specText());
    var original = nextBtn.innerHTML;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Sending…';
    formError.textContent = '';

    if (data.get('access_key') === PLACEHOLDER_KEY) {
      window.setTimeout(function () { finish(true); }, 500);
      return;
    }
    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.success) throw new Error(j.message || 'Request failed');
        finish(false);
      })
      .catch(function () {
        nextBtn.disabled = false;
        nextBtn.innerHTML = original;
        formError.innerHTML = 'Your request didn’t go through. Please call <a href="tel:+17865921077">(786) 592-1077</a> or email <a href="mailto:miamiwalkincoolers@gmail.com">miamiwalkincoolers@gmail.com</a> and we’ll take it from there.';
      });
  }
  function finish(preview) {
    var done = document.getElementById('done');
    var phone = document.getElementById('q-phone').value.trim();
    document.getElementById('done-text').textContent =
      'We’ll call you at ' + phone + ' with a price, usually the same business day (Mon–Fri, 8am–6pm ET). Your draft spec is on its way to the shop.';
    document.getElementById('done-preview').hidden = !preview;
    form.hidden = true;
    done.hidden = false;
    var top = done.getBoundingClientRect().top + window.pageYOffset - 96;
    window.scrollTo({ top: top, behavior: 'smooth' });
    done.focus({ preventScroll: true });
  }

  /* ---------- start: deep link (#cooler) and ZIP from the homepage ---------- */
  try {
    var z = sessionStorage.getItem('mwc-quick-zip');
    if (z) document.getElementById('q-zip').value = z;
  } catch (e) { /* storage unavailable */ }

  var hash = (window.location.hash || '').replace('#', '');
  var preset = hash && form.querySelector('input[name="What do you need?"][data-key="' + hash.replace(/[^a-z-]/g, '') + '"]');
  syncVariant();
  if (preset) {
    preset.checked = true;
    syncVariant();
    showStep(2, false);
  } else {
    showStep(1, false);
  }
  updateSpec();
})();
