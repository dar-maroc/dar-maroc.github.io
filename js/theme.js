/* ============================================================
   DAR MAROC - THÈME SOMBRE / CLAIR (theme.js)
   Bascule via <html data-theme="light|dark">, mémorisé dans
   localStorage ('darmaroc-theme'). Défaut : sombre.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'darmaroc-theme';

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    var sun = document.querySelectorAll('.theme-toggle .fa-sun, .dark-mode-toggle .fa-sun');
    var moon = document.querySelectorAll('.theme-toggle .fa-moon, .dark-mode-toggle .fa-moon');
    if (theme === 'light') {
      sun.forEach(function (i) { i.classList.add('fas'); i.classList.remove('far'); });
      moon.forEach(function (i) { i.classList.add('far'); i.classList.remove('fas'); });
    } else {
      moon.forEach(function (i) { i.classList.add('fas'); i.classList.remove('far'); });
      sun.forEach(function (i) { i.classList.add('far'); i.classList.remove('fas'); });
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F7F5F0' : '#0F0F0F');
  }

  function getSaved() {
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }
  function save(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  var saved = getSaved();
  if (saved === 'light') applyTheme('light');
  else if (saved === 'dark') applyTheme('dark');
  else applyTheme('dark');

  function toggle() {
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    applyTheme(isLight ? 'dark' : 'light');
    save(isLight ? 'dark' : 'light');

    var btn = document.querySelector('.theme-toggle, .dark-mode-toggle');
    if (btn && window.innerWidth <= 992) {
      btn.style.transition = 'transform 0.4s cubic-bezier(.4,0,.2,1)';
      btn.style.transform = 'rotate(360deg) scale(1.3)';
      setTimeout(function () { btn.style.transform = ''; }, 420);

      var ripple = document.createElement('div');
      ripple.className = 'theme-ripple';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); });
    }
  }

  function bind() {
    var btns = document.querySelectorAll('.theme-toggle, .dark-mode-toggle');
    btns.forEach(function (btn) { btn.addEventListener('click', toggle); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
