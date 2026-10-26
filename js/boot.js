/*
  Runs in <head>, before first paint: applies the stored theme and role to <html>.
  - data-theme is set only when the user chose a theme with the toggle (key ccl-theme);
    without it the OS preference applies.
  - data-role is "dev" or "viewer" (key ccl-role, default viewer).
*/
(function () {
  'use strict';

  var root = document.documentElement;

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  var theme = read('ccl-theme');
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);

  root.setAttribute('data-role', read('ccl-role') === 'dev' ? 'dev' : 'viewer');
})();
