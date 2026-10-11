/* Guided quote form: 4 steps, live request summary, Web3Forms submit. */
(function () {
  var form = document.getElementById('quoteForm');
  if (!form) return;

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
      var first = document.getElementById('q-first');
      var last = document.getElementById('q-last');
      var phone = document.getElementById('q-phone');
      var email = document.getElementById('q-email');
      var ok0 = setError('err-first', first.value.trim() ? '' : 'Enter your first name.', first);
      var ok1 = setError('err-last', last.value.trim() ? '' : 'Enter your last name.', last);
      var ok2 = setError('err-phone', phone.value.replace(/\D/g, '').length >= 10 ? '' : 'Enter a phone number with area code.', phone);
      var ok3 = setError('err-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'Enter an email like you@business.com.', email);
      return ok0 && ok1 && ok2 && ok3;
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

  /* ---------- live request summary ---------- */
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
    var place = [document.getElementById('q-ship-city').value.trim(), document.getElementById('q-ship-state').value.trim()].filter(Boolean).join(', ');
    specSet('zip', /^\d{5}$/.test(zip) ? (place ? place + ' ' : '') + zip : '');
    specSet('timeline', current >= 3 || reached >= 3 ? radioValue('Timeline') : '');
  }

  var billing = document.getElementById('q-billing');
  var billingSame = document.getElementById('q-billing-same');
  function syncBilling() {
    billing.disabled = billingSame.checked;
    if (billingSame.checked) billing.value = '';
  }

  form.addEventListener('input', updateSpec);
  form.addEventListener('change', function (e) {
    if (e.target.name === 'What do you need?') { syncVariant(); setError('err-type', ''); }
    if (e.target === unsure) syncUnsure();
    if (e.target.name === 'Items Needed') setError('err-parts', '');
    if (e.target.id === 'q-billing-same') syncBilling();
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

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.success) throw new Error(j.message || 'Request failed');
        finish();
      })
      .catch(function () {
        nextBtn.disabled = false;
        nextBtn.innerHTML = original;
        formError.innerHTML = 'Your request didn’t go through. Please call <a href="tel:+17865921077">(786) 592-1077</a> or email <a href="mailto:info@miamiwalkincoolers.com">info@miamiwalkincoolers.com</a> and we’ll take it from there.';
      });
  }
  function finish() {
    var done = document.getElementById('done');
    var phone = document.getElementById('q-phone').value.trim();
    document.getElementById('done-text').textContent =
      'We’ll call you at ' + phone + ' with a price, usually the same business day (Mon–Fri, 8am–6pm ET). Your draft spec is on its way to the shop.';
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
