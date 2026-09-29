/* Shared behavior for the redesign preview: mobile menu, tweaks panel, homepage quick-start. */
(function () {
  var root = document.documentElement;
  var TWEAKS_KEY = 'mwc-preview-tweaks';

  function readTweaks() {
    try { return JSON.parse(localStorage.getItem(TWEAKS_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveTweaks(t) {
    try { localStorage.setItem(TWEAKS_KEY, JSON.stringify(t)); } catch (e) { /* storage unavailable */ }
  }
  function applyTweaks(t) {
    root.setAttribute('data-cta', t.cta === 'green' ? 'green' : 'signal');
    root.setAttribute('data-prices', t.prices === 'on' ? 'on' : 'off');
  }
  var tweaks = readTweaks();
  applyTweaks(tweaks);

  /* ----- Mobile menu ----- */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      menuBtn.querySelector('.menu-label').textContent = open ? 'Menu' : 'Close';
      mobileNav.hidden = open;
    });
  }

  /* ----- Tweaks panel (preview only) ----- */
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'tweaks-toggle';
  toggle.textContent = 'Tweaks';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'tweaks');

  var panel = document.createElement('section');
  panel.className = 'tweaks';
  panel.id = 'tweaks';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Design tweaks');
  panel.innerHTML =
    '<h2>Tweaks</h2>' +
    '<fieldset><legend>Quote button color</legend><div class="seg">' +
      '<label><input type="radio" name="tw-cta" value="signal" id="tw-cta-signal"><span>Signal orange</span></label>' +
      '<label><input type="radio" name="tw-cta" value="green" id="tw-cta-green"><span>Palm green</span></label>' +
    '</div></fieldset>' +
    '<fieldset><legend>Starting prices on products</legend><div class="seg">' +
      '<label><input type="radio" name="tw-prices" value="off" id="tw-prices-off"><span>Hidden</span></label>' +
      '<label><input type="radio" name="tw-prices" value="on" id="tw-prices-on"><span>Shown</span></label>' +
    '</div></fieldset>' +
    '<p>These are the two open client decisions from the plan. Choices are remembered in this browser only.</p>';

  document.body.appendChild(panel);
  document.body.appendChild(toggle);

  panel.querySelector('#tw-cta-' + (tweaks.cta === 'green' ? 'green' : 'signal')).checked = true;
  panel.querySelector('#tw-prices-' + (tweaks.prices === 'on' ? 'on' : 'off')).checked = true;

  toggle.addEventListener('click', function () {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    toggle.textContent = panel.hidden ? 'Tweaks' : 'Close tweaks';
  });
  panel.addEventListener('change', function (e) {
    if (e.target.name === 'tw-cta') tweaks.cta = e.target.value;
    if (e.target.name === 'tw-prices') tweaks.prices = e.target.value;
    applyTweaks(tweaks);
    saveTweaks(tweaks);
  });

  /* ----- Homepage quick-start: type + ZIP, handed to the quote page ----- */
  var quick = document.getElementById('quick-quote');
  if (quick) {
    quick.addEventListener('submit', function (e) {
      e.preventDefault();
      var type = quick.elements['quick-type'].value;
      var zip = quick.elements['quick-zip'].value.trim();
      var err = document.getElementById('quick-zip-error');
      if (zip && !/^\d{5}$/.test(zip)) {
        err.textContent = 'Enter a 5-digit ZIP code, or leave it blank.';
        quick.elements['quick-zip'].setAttribute('aria-invalid', 'true');
        quick.elements['quick-zip'].focus();
        return;
      }
      try { sessionStorage.setItem('mwc-quick-zip', zip); } catch (e2) { /* ignore */ }
      window.location.href = 'quote.html#' + type;
    });
  }
})();
