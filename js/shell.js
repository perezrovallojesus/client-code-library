/*
  Top bar behaviour, shared by every page: icons, theme toggle, role switch, user menu.
*/
(function () {
  'use strict';

  var CCL = window.CCL;
  var root = document.documentElement;

  CCL.hydrateIcons();

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable: the choice lasts for this page only */ }
  }

  /* ---------- Theme ---------- */
  var toggle = document.getElementById('theme-toggle');
  var dark = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.getAttribute('data-theme') || (dark.matches ? 'dark' : 'light');
  }

  function labelToggle() {
    toggle.setAttribute('aria-label', 'Switch to ' + (currentTheme() === 'dark' ? 'light' : 'dark') + ' theme');
  }

  toggle.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store('ccl-theme', next);
    labelToggle();
  });
  if (dark.addEventListener) dark.addEventListener('change', labelToggle);
  labelToggle();

  /* ---------- Role ---------- */
  var devLogin = document.getElementById('dev-login');
  var userBtn = document.getElementById('user-btn');
  var logout = document.getElementById('logout');

  function setRole(role) {
    root.setAttribute('data-role', role);
    store('ccl-role', role);
    document.dispatchEvent(new CustomEvent('ccl:rolechange', { detail: { role: role } }));
  }

  devLogin.addEventListener('click', function () {
    setRole('dev');
    userBtn.focus();
  });

  /* ---------- User menu ---------- */
  var user = CCL.data.currentUser;
  var initials = CCL.data.users[user].initials;
  Array.prototype.forEach.call(document.querySelectorAll('[data-user-name]'), function (el) { el.textContent = user; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-user-initials]'), function (el) { el.textContent = initials; });

  CCL.behaviors.menu(userBtn, document.getElementById('user-popup'), function (item) {
    if (item === logout) {
      setRole('viewer');
      devLogin.focus();
    }
  });
})();
