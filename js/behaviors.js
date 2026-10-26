/*
  Interaction patterns shared by the pages: action menus, listbox selects, the tag
  filter, focus-trapping layers (drawer, modal, lightbox) and notifications.
*/
(function () {
  'use strict';

  var CCL = window.CCL;
  var ui = CCL.ui;
  var icon = CCL.icon;
  var esc = ui.esc;

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
  var counter = 0;

  function nextId(prefix) {
    counter += 1;
    return prefix + '-' + counter;
  }

  function focusables(root) {
    return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE)).filter(function (el) {
      return !el.hidden && !el.closest('[hidden]') && el.offsetParent !== null;
    });
  }

  /* Calls close when a press lands outside of wrap. Returns a function that removes the listener. */
  function onOutsidePress(wrap, close) {
    function handler(e) { if (!wrap.contains(e.target)) close(); }
    document.addEventListener('mousedown', handler, true);
    return function () { document.removeEventListener('mousedown', handler, true); };
  }

  /* Moves a listbox's active option: sets aria-activedescendant and the visual marker. */
  function setActive(list, options, index) {
    options.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
    if (options[index]) {
      list.setAttribute('aria-activedescendant', options[index].id);
      options[index].scrollIntoView({ block: 'nearest' });
    } else {
      list.removeAttribute('aria-activedescendant');
    }
  }

  /* ---------- Action menu (role="menu") ---------- */
  /*
    The trigger toggles the menu, Up/Down/Home/End move between items, Esc closes it and
    returns focus to the trigger, Tab or a press outside closes it.
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

  /* ---------- Select (single choice listbox) ---------- */
  /*
    opts: { label, options: [text], value, icon, compact, onChange(value) }
    Keys on the open list: Up, Down, Home, End, Enter or Space to choose, Esc to close.
  */
  function select(opts) {
    var id = nextId('select');
    var value = opts.value;
    var wrap = document.createElement('span');
    wrap.className = 'select-wrap';
    wrap.innerHTML =
      '<button type="button" class="select' + (opts.compact ? ' compact' : '') + '" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-menu">' +
      (opts.icon ? icon(opts.icon) : '') + '<span class="select-value"></span>' + icon('ChevDown') + '</button>' +
      '<div class="menu select-menu" id="' + id + '-menu" hidden><div role="listbox" tabindex="-1" aria-label="' + esc(opts.label) + '">' +
      opts.options.map(function (text, i) {
        return '<div class="menu-item" role="option" id="' + id + '-opt-' + i + '" aria-selected="false">' + icon('Check').replace('class="icon"', 'class="icon check"') + esc(text) + '</div>';
      }).join('') + '</div></div>';

    var trigger = wrap.querySelector('button');
    var menuEl = wrap.querySelector('.select-menu');
    var list = wrap.querySelector('[role="listbox"]');
    var valueEl = wrap.querySelector('.select-value');
    var optionEls = Array.prototype.slice.call(list.children);
    var active = 0;
    var stopOutside = null;

    function paint() {
      valueEl.textContent = value;
      trigger.setAttribute('aria-label', opts.label + ': ' + value);
      optionEls.forEach(function (el, i) { el.setAttribute('aria-selected', opts.options[i] === value ? 'true' : 'false'); });
    }

    function isOpen() { return !menuEl.hidden; }

    function close(returnFocus) {
      if (!isOpen()) return;
      menuEl.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('is-open');
      if (stopOutside) { stopOutside(); stopOutside = null; }
      if (returnFocus) trigger.focus();
    }

    function open() {
      menuEl.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      trigger.classList.add('is-open');
      stopOutside = onOutsidePress(wrap, function () { close(false); });
      active = Math.max(0, opts.options.indexOf(value));
      setActive(list, optionEls, active);
      list.focus();
    }

    function choose(i) {
      var changed = opts.options[i] !== value;
      value = opts.options[i];
      paint();
      close(true);
      if (changed && opts.onChange) opts.onChange(value);
    }

    trigger.addEventListener('click', function () { if (isOpen()) close(true); else open(); });
    trigger.addEventListener('keydown', function (e) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isOpen()) { e.preventDefault(); open(); }
    });

    list.addEventListener('keydown', function (e) {
      var last = optionEls.length - 1;
      if (e.key === 'ArrowDown') active = Math.min(last, active + 1);
      else if (e.key === 'ArrowUp') active = Math.max(0, active - 1);
      else if (e.key === 'Home') active = 0;
      else if (e.key === 'End') active = last;
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); return; }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
      else if (e.key === 'Tab') { close(false); return; }
      else return;
      e.preventDefault();
      setActive(list, optionEls, active);
    });

    list.addEventListener('click', function (e) {
      var i = optionEls.indexOf(e.target.closest('.menu-item'));
      if (i > -1) choose(i);
    });

    wrap.addEventListener('focusout', function (e) {
      if (!wrap.contains(e.relatedTarget)) close(false);
    });

    paint();
    return {
      el: wrap,
      getValue: function () { return value; },
      setValue: function (v) { value = v; paint(); }
    };
  }

  /* ---------- Tag filter (multiple choice listbox with checkboxes) ---------- */
  /*
    opts: { tags: [name], selected: [name], onChange([name]) }
    Focus starts on "Search tags" when the list has more than 8 tags, otherwise on the list.
    Toggling keeps the list open; Esc, Tab or a press outside closes it.
  */
  function tagFilter(opts) {
    var id = nextId('tags');
    var tags = opts.tags;
    var selected = (opts.selected || []).slice();
    var hasSearch = tags.length > 8;
    var wrap = document.createElement('span');
    wrap.className = 'select-wrap tag-filter-wrap';
    wrap.innerHTML =
      '<button type="button" class="select tag-filter" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-menu">' +
      icon('Tag') + '<span class="tf-value"></span>' + icon('ChevDown') + '</button>' +
      '<div class="menu tag-filter-menu" id="' + id + '-menu" hidden>' +
      (hasSearch ? '<div class="tf-search"><div class="input-icon">' + icon('Search') +
        '<input class="input" type="search" placeholder="Search tags" aria-label="Search tags" autocomplete="off"></div></div>' : '') +
      '<div class="tf-list" role="listbox" tabindex="0" aria-multiselectable="true" aria-label="Tags">' +
      tags.map(function (name, i) {
        return '<div class="tf-option" role="option" id="' + id + '-opt-' + i + '" aria-selected="false" data-tag="' + esc(name) + '">' +
          '<span class="checkbox-box" aria-hidden="true">' + icon('Check', 12) + '</span><span>' + esc(name) + '</span></div>';
      }).join('') +
      '<div class="tf-empty" hidden>No tags found</div></div>' +
      '<div class="tf-foot" hidden><button type="button" class="btn btn-subtle btn-sm">Clear</button></div></div>';

    var trigger = wrap.querySelector('.select');
    var menuEl = wrap.querySelector('.tag-filter-menu');
    var search = wrap.querySelector('.tf-search input');
    var list = wrap.querySelector('.tf-list');
    var empty = wrap.querySelector('.tf-empty');
    var foot = wrap.querySelector('.tf-foot');
    var valueEl = wrap.querySelector('.tf-value');
    var optionEls = Array.prototype.slice.call(list.querySelectorAll('.tf-option'));
    var active = -1;
    var stopOutside = null;

    function paint() {
      var label = 'Filter by tag';
      if (selected.length) {
        valueEl.className = 'tf-value';
        valueEl.innerHTML = '<span class="tf-first">' + esc(selected[0]) + '</span>' + (selected.length > 1 ? '<span class="tf-more">+' + (selected.length - 1) + '</span>' : '');
        label += ': ' + selected.join(', ');
      } else {
        valueEl.className = 'tf-value muted';
        valueEl.textContent = 'Filter by tag';
      }
      trigger.setAttribute('aria-label', label);
      optionEls.forEach(function (el) { el.setAttribute('aria-selected', selected.indexOf(el.getAttribute('data-tag')) > -1 ? 'true' : 'false'); });
      foot.hidden = !selected.length;
    }

    function visible() { return optionEls.filter(function (el) { return !el.hidden; }); }
    function isOpen() { return !menuEl.hidden; }

    function activate(el) {
      active = el ? optionEls.indexOf(el) : -1;
      setActive(list, optionEls, active);
    }

    function close(returnFocus) {
      if (!isOpen()) return;
      menuEl.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('is-open');
      if (stopOutside) { stopOutside(); stopOutside = null; }
      if (returnFocus) trigger.focus();
    }

    function open() {
      menuEl.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      trigger.classList.add('is-open');
      stopOutside = onOutsidePress(wrap, function () { close(false); });
      if (search) search.focus(); else { activate(visible()[0]); list.focus(); }
    }

    function toggle(el) {
      var name = el.getAttribute('data-tag');
      var at = selected.indexOf(name);
      if (at > -1) selected.splice(at, 1); else selected.push(name);
      paint();
      if (opts.onChange) opts.onChange(selected.slice());
    }

    function filterOptions() {
      var needle = search ? search.value.trim().toLowerCase() : '';
      optionEls.forEach(function (el) { el.hidden = el.getAttribute('data-tag').toLowerCase().indexOf(needle) === -1; });
      empty.hidden = visible().length > 0;
      activate(null);
    }

    trigger.addEventListener('click', function () { if (isOpen()) close(true); else open(); });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && !isOpen()) { e.preventDefault(); open(); }
    });

    list.addEventListener('keydown', function (e) {
      var shown = visible();
      var at = shown.indexOf(optionEls[active]);
      if (e.key === 'ArrowDown') activate(shown[Math.min(shown.length - 1, at + 1)]);
      else if (e.key === 'ArrowUp') {
        if (at <= 0 && search) { activate(null); search.focus(); } else activate(shown[Math.max(0, at - 1)]);
      }
      else if (e.key === 'Home') activate(shown[0]);
      else if (e.key === 'End') activate(shown[shown.length - 1]);
      else if ((e.key === 'Enter' || e.key === ' ') && optionEls[active]) toggle(optionEls[active]);
      else if (e.key === 'Escape') { e.stopPropagation(); close(true); }
      else return;
      e.preventDefault();
    });

    list.addEventListener('click', function (e) {
      var el = e.target.closest('.tf-option');
      if (!el) return;
      activate(el);
      toggle(el);
    });

    if (search) {
      search.addEventListener('input', filterOptions);
      search.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); activate(visible()[0]); list.focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
        else if (e.key === 'Enter') e.preventDefault();
      });
    }

    foot.querySelector('button').addEventListener('click', function () {
      selected = [];
      paint();
      if (opts.onChange) opts.onChange([]);
    });

    wrap.addEventListener('focusout', function (e) {
      if (!wrap.contains(e.relatedTarget)) close(false);
    });

    paint();
    return {
      el: wrap,
      getSelected: function () { return selected.slice(); },
      setSelected: function (list2) { selected = list2.slice(); paint(); }
    };
  }

  /* ---------- Layers: drawer, modal and lightbox ---------- */
  /*
    A layer is an element added to #layers. While one is open the page and every lower
    layer is inert, focus is trapped in the top layer, Esc runs its onEscape, and focus
    returns to the opener when it closes.
  */
  var stack = [];

  function host() {
    var el = document.getElementById('layers');
    if (!el) {
      el = document.createElement('div');
      el.id = 'layers';
      document.body.appendChild(el);
    }
    return el;
  }

  function setInert(el, on) {
    if (!el) return;
    if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
  }

  function syncLayers() {
    stack.forEach(function (layer, i) { setInert(layer.el, i < stack.length - 1); });
    setInert(document.getElementById('app'), stack.length > 0);
    document.documentElement.classList.toggle('no-scroll', stack.length > 0);
    var dock = document.getElementById('toast-dock');
    if (dock) dock.classList.toggle('is-above-drawer', stack.some(function (layer) { return layer.opts.aboveDock; }));
  }

  /* opts: { onEscape(), returnTo: element, aboveDock: true when the layer is the drawer } */
  function openLayer(el, opts) {
    var layer = { el: el, opts: opts || {}, opener: (opts && opts.returnTo) || document.activeElement };
    host().appendChild(el);
    stack.push(layer);
    syncLayers();

    var first = el.querySelector('[data-autofocus]') || focusables(el)[0];
    if (!first) { el.setAttribute('tabindex', '-1'); first = el; }
    first.focus();

    /* close(target): omit target to return focus to the opener, pass null to leave focus alone. */
    layer.close = function (target) {
      var at = stack.indexOf(layer);
      if (at < 0) return;
      stack.splice(at, 1);
      el.remove();
      syncLayers();
      var to = target === undefined ? layer.opener : target;
      if (to && document.contains(to)) to.focus();
    };
    return layer;
  }

  document.addEventListener('keydown', function (e) {
    var top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') {
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (top.opts.onEscape) top.opts.onEscape(); else top.close();
    } else if (e.key === 'Tab') {
      var items = focusables(top.el);
      if (!items.length) { e.preventDefault(); return; }
      var firstEl = items[0];
      var lastEl = items[items.length - 1];
      var current = document.activeElement;
      if (e.shiftKey && (current === firstEl || !top.el.contains(current))) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && (current === lastEl || !top.el.contains(current))) { e.preventDefault(); firstEl.focus(); }
    }
  });

  /*
    Confirmation modal. opts: { title, bodyHtml, cancelLabel, confirmLabel, danger, returnTo,
    onConfirm(close), onCancel() }. Focus starts on the cancel button, never on the destructive one.
    onConfirm must call close(target) to dismiss it.
  */
  function modal(opts) {
    var id = nextId('modal');
    var el = document.createElement('div');
    el.className = 'modal-layer';
    el.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="' + id + '-title">' +
      '<div class="modal-head"><h3 id="' + id + '-title">' + esc(opts.title) + '</h3>' +
      ui.iconButton({ icon: 'X', label: 'Close', attrs: 'data-cancel' }) + '</div>' +
      '<div class="modal-body">' + opts.bodyHtml + '</div>' +
      '<div class="modal-foot">' +
      ui.button({ variant: 'default', label: opts.cancelLabel, attrs: 'data-cancel data-autofocus' }) +
      ui.button({ variant: opts.danger ? 'danger' : 'primary', label: opts.confirmLabel, attrs: 'data-confirm' }) +
      '</div></div>';

    var layer;
    function cancel() {
      layer.close();
      if (opts.onCancel) opts.onCancel();
    }
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.closest('[data-cancel]')) cancel();
      else if (e.target.closest('[data-confirm]')) opts.onConfirm(layer.close);
    });
    layer = openLayer(el, { onEscape: cancel, returnTo: opts.returnTo });
    return layer;
  }

  /* ---------- Notifications ---------- */
  var TOAST_MS = 4000;

  /* opts: { title, message }. Shown bottom right in #toast-dock (aria-live), hidden after 4 seconds. */
  function toast(opts) {
    var dock = document.getElementById('toast-dock');
    if (!dock) return;
    var el = document.createElement('div');
    el.className = 'notification';
    el.innerHTML = '<span class="n-icon">' + icon('Check', 15) + '</span><div><div class="n-title">' + esc(opts.title) + '</div>' +
      (opts.message ? '<div class="n-text">' + esc(opts.message) + '</div>' : '') + '</div>' +
      ui.iconButton({ icon: 'X', label: 'Close notification' });
    var timer = setTimeout(remove, TOAST_MS);
    function remove() {
      clearTimeout(timer);
      el.remove();
    }
    el.querySelector('button').addEventListener('click', remove);
    dock.appendChild(el);
  }

  CCL.behaviors = {
    nextId: nextId,
    focusables: focusables,
    onOutsidePress: onOutsidePress,
    setActive: setActive,
    menu: menu,
    select: select,
    tagFilter: tagFilter,
    openLayer: openLayer,
    modal: modal,
    toast: toast
  };
})();
