/*
  Interaction patterns shared by the pages: action menus, listbox selects, the
  tag filter, focus-trapping layers and notifications.
*/
(function () {
  'use strict';

  var CCL = window.CCL;

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

  function focusables(root) {
    return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE)).filter(function (el) {
      return !el.hidden && !el.closest('[hidden]') && el.offsetParent !== null;
    });
  }

  /* Closes a popup when a press lands outside of wrap. Returns a function that removes the listener. */
  function onOutsidePress(wrap, close) {
    function handler(e) { if (!wrap.contains(e.target)) close(); }
    document.addEventListener('mousedown', handler, true);
    return function () { document.removeEventListener('mousedown', handler, true); };
  }

  /*
    Action menu (role="menu"): the trigger toggles it, Up/Down/Home/End move between items,
    Esc closes it and returns focus to the trigger, Tab or a press outside closes it.
  */
  function menu(trigger, menuEl, onSelect) {
    var wrap = trigger.parentElement;
    var stopOutside = null;

    function items() { return Array.prototype.slice.call(menuEl.querySelectorAll('[role="menuitem"]')); }
    function isOpen() { return !menuEl.hidden; }

    function close(returnFocus) {
      if (!isOpen()) return;
      menuEl.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (stopOutside) { stopOutside(); stopOutside = null; }
      if (returnFocus) trigger.focus();
    }

    function open() {
      menuEl.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      stopOutside = onOutsidePress(wrap, function () { close(false); });
      var first = items()[0];
      if (first) first.focus();
    }

    trigger.addEventListener('click', function () { if (isOpen()) close(true); else open(); });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && !isOpen()) { e.preventDefault(); open(); }
    });

    menuEl.addEventListener('keydown', function (e) {
      var list = items();
      var at = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); list[(at + 1) % list.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); list[(at - 1 + list.length) % list.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') close(false);
    });

    menuEl.addEventListener('click', function (e) {
      var item = e.target.closest('[role="menuitem"]');
      if (!item) return;
      close(false);
      if (onSelect) onSelect(item);
    });

    return { open: open, close: close, isOpen: isOpen };
  }

  CCL.behaviors = {
    focusables: focusables,
    onOutsidePress: onOutsidePress,
    menu: menu
  };
})();
