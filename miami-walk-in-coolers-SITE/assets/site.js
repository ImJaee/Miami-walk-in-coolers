/* Shared site behavior: mobile menu and homepage quick-start. */
(function () {
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
      window.location.href = '/get-a-quote#' + type;
    });
  }
})();
