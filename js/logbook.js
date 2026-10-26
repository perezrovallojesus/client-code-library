/*
  Logbook page: accordion of entries with search, tag filter (AND), sort and Expand all,
  plus the flows that open the editor drawer, the delete modal and the image lightbox.
*/
(function () {
  'use strict';

  var CCL = window.CCL;
  var ui = CCL.ui;
  var icon = CCL.icon;
  var data = CCL.data;
  var B = CCL.behaviors;
  var esc = ui.esc;

  var params = new URLSearchParams(window.location.search);
  var name = params.get('lb') || '';
  var logbook = data.findLogbook(name);
  var page = document.getElementById('logbook-page');

  if (!logbook) {
    document.title = 'Logbook not found · Client Code Library';
    page.innerHTML = '<section class="content-card" aria-labelledby="logbook-title"><h2 class="sr-only" id="logbook-title">Logbook not found</h2>' +
      ui.emptyState({
        icon: 'Folder',
        title: 'Logbook not found',
        text: 'Check the address or go back to the Library.',
        actions: [ui.button({ variant: 'primary', label: 'Go to Library', href: 'index.html' })]
      }) + '</section>';
    return;
  }

  document.title = name + ' · Client Code Library';

  var SORTS = ['Last updated', 'Title A to Z'];
  var term = '';
  var selectedTags = [];
  var sortKey = SORTS[0];
  var openIds = {};

  function $(id) { return document.getElementById(id); }
  var entriesEl = $('entries');
  var toolbar = $('toolbar');
  var searchInput = $('entry-search');
  var expandAll = $('expand-all');
  var newEntry = $('new-entry');
  var live = $('live-status');

  /* ---------- Data helpers ---------- */
  function sortEntries(list, key) {
    return list.slice().sort(function (a, b) {
      if (key === 'Title A to Z') return a.title.localeCompare(b.title);
      if (a.updated.date !== b.updated.date) return a.updated.date < b.updated.date ? 1 : -1;
      return a.title.localeCompare(b.title);
    });
  }

  function visibleEntries() {
    var needle = term.toLowerCase();
    var list = data.entriesOf(name).filter(function (e) {
      var matchesTerm = !needle || (e.title + ' ' + e.notes).toLowerCase().indexOf(needle) > -1;
      var matchesTags = selectedTags.every(function (t) { return e.tags.indexOf(t) > -1; });
      return matchesTerm && matchesTags;
    });
    return sortEntries(list, sortKey);
  }

  /* ---------- Entry markup ---------- */
  function entryBody(entry) {
    var html = '<div class="section"><h3 class="section-title">Implementation</h3>' +
      '<a class="impl-link" href="' + esc(entry.link) + '" target="_blank" rel="noopener">' + icon('Link') +
      '<span>' + esc(entry.link.replace(/^https?:\/\//, '')) + '</span>' + icon('External') + '<span class="sr-only">(opens in a new tab)</span></a></div>';
    if (entry.notes) {
      html += '<div class="section"><h3 class="section-title">Registration notes</h3>' +
        entry.notes.split(/\n{2,}/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>';
    }
    if (entry.process) {
      html += '<div class="section"><h3 class="section-title">Process details</h3>' + ui.sanitizeHtml(entry.process) + '</div>';
    }
    if (entry.code) {
      html += '<div class="section"><h3 class="section-title">Code</h3><div class="code">' +
        '<div class="code-head"><span class="code-lang">' + esc(entry.code.language) + '</span>' +
        '<button type="button" class="copy-btn" data-copy aria-live="polite">' + icon('Copy', 14) + '<span>Copy code</span></button></div>' +
        '<pre class="code-body" tabindex="0" role="region" aria-label="' + esc(entry.code.language) + ' code"><code>' + ui.highlightCode(entry.code.text, entry.code.language) + '</code></pre></div></div>';
    }
    if (entry.images.length) {
      html += '<div class="section"><h3 class="section-title">Images</h3><div class="thumbs">' +
        entry.images.map(function (img, i) {
          return '<button type="button" class="thumb" data-image="' + i + '" aria-label="Open image ' + esc(img) + '">' + ui.shot(i) +
            '<span class="zoom">' + icon('Zoom', 13) + '</span></button>';
        }).join('') + '</div></div>';
    }
    html += '<div class="entry-foot"><span>Created ' + ui.formatDate(entry.created.date) + ' by ' + esc(entry.created.by) + '</span>' +
      '<span>Updated ' + ui.formatDate(entry.updated.date) + ' by ' + esc(entry.updated.by) + '</span></div>';
    return html;
  }

  function entryHtml(entry) {
    var open = !!openIds[entry.id];
    var bodyId = 'entry-' + entry.id + '-body';
    return '<div class="entry' + (open ? ' open' : '') + '" data-id="' + esc(entry.id) + '">' +
      '<div class="entry-head">' +
      '<button type="button" class="entry-toggle" aria-expanded="' + open + '" aria-controls="' + esc(bodyId) + '">' +
      icon('ChevRight', 18).replace('class="icon"', 'class="icon entry-chev"') +
      '<span class="entry-main"><span class="entry-title">' + esc(entry.title) + '</span><span class="tags">' + ui.tagList(entry.tags) + '</span></span>' +
      '<span class="entry-meta"><span>' + ui.formatDate(entry.updated.date) + '</span>' + ui.avatar(entry.updated.by, true) + '</span></button>' +
      '<div class="entry-actions action-icons dev-only">' +
      ui.iconButton({ icon: 'Pencil', label: 'Edit entry: ' + entry.title, attrs: 'data-edit' }) +
      ui.iconButton({ icon: 'Trash', label: 'Delete entry: ' + entry.title, tone: 'danger', attrs: 'data-delete' }) +
      '</div></div>' +
      '<div class="entry-body" id="' + esc(bodyId) + '"' + (open ? '' : ' hidden') + '>' + entryBody(entry) + '</div></div>';
  }

  /* ---------- Empty states ---------- */
  function emptyLogbook() {
    return '<div class="header-divider"></div>' +
      '<div class="dev-only">' + ui.emptyState({
        icon: 'Notes',
        title: 'No entries yet',
        text: 'Log the first custom development for ' + name + ': what it does, where it runs and the code.',
        actions: [ui.button({ variant: 'primary', icon: 'Plus', label: 'New entry', attrs: 'data-action="new-entry"' })]
      }) + '</div>' +
      '<div class="viewer-only">' + ui.emptyState({
        icon: 'Notes',
        title: 'No entries yet',
        text: "Developers haven't logged any custom work for " + name + '.'
      }) + '</div>';
  }

  function emptyFiltered() {
    var quoted = '"' + esc(term) + '"';
    var tagsActive = selectedTags.length > 0;
    if (term && !tagsActive) {
      return ui.emptyState({
        icon: 'Search',
        title: 'No entries in ' + esc(name) + ' match ' + quoted,
        text: 'It may have been built for another client. Search every logbook to find it.',
        actions: [
          ui.button({ variant: 'default', label: 'Clear search', attrs: 'data-action="clear-search"' }),
          ui.button({ variant: 'light', icon: 'Search', label: 'Search all logbooks for "' + term + '"', href: 'search.html?q=' + encodeURIComponent(term) })
        ]
      });
    }
    if (term) {
      return ui.emptyState({
        icon: 'Search',
        title: 'No entries in ' + esc(name) + ' match ' + quoted + ' with these tags',
        text: 'Remove a tag or try a shorter term.',
        actions: [
          ui.button({ variant: 'default', label: 'Clear filters', attrs: 'data-action="clear-filters"' }),
          ui.button({ variant: 'default', label: 'Clear search', attrs: 'data-action="clear-search"' })
        ]
      });
    }
    return ui.emptyState({
      icon: 'Search',
      title: 'No entries in ' + esc(name) + ' match these tags',
      text: 'Remove a tag to see more entries.',
      actions: [ui.button({ variant: 'default', label: 'Clear filters', attrs: 'data-action="clear-filters"' })]
    });
  }

  /* ---------- Rendering ---------- */
  function renderHeader() {
    var s = data.summary(name);
    $('meta-count').textContent = ui.plural(s.count, 'entry', 'entries');
    var updated = $('meta-updated');
    updated.hidden = !s.updated;
    updated.querySelector('span').textContent = s.updated ? 'Updated ' + ui.formatDate(s.updated) + ' by ' + s.by : '';
    toolbar.hidden = s.count === 0;
  }

  function entryEls() { return Array.prototype.slice.call(entriesEl.querySelectorAll('.entry')); }

  function syncExpandAll() {
    var els = entryEls();
    var allOpen = els.length > 0 && els.every(function (el) { return el.classList.contains('open'); });
    expandAll.hidden = els.length === 0;
    expandAll.innerHTML = icon('Selector') + (allOpen ? 'Collapse all' : 'Expand all');
    expandAll.setAttribute('data-state', allOpen ? 'open' : 'closed');
  }

  function renderEntries(announce) {
    var list = visibleEntries();
    if (!data.entriesOf(name).length) entriesEl.innerHTML = emptyLogbook();
    else if (!list.length) entriesEl.innerHTML = emptyFiltered();
    else entriesEl.innerHTML = '<div class="entries">' + list.map(entryHtml).join('') + '</div>';
    syncExpandAll();
    if (announce) live.textContent = ui.plural(list.length, 'entry', 'entries') + ' shown';
  }

  function renderAll() {
    renderHeader();
    renderEntries(false);
  }

  function setOpen(el, open) {
    var id = el.getAttribute('data-id');
    el.classList.toggle('open', open);
    el.querySelector('.entry-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    el.querySelector('.entry-body').hidden = !open;
    if (open) openIds[id] = true; else delete openIds[id];
  }

  function toggleOf(id) {
    return entriesEl.querySelector('.entry[data-id="' + id.replace(/"/g, '\\"') + '"] .entry-toggle');
  }

  /* ---------- Toolbar ---------- */
  $('crumb').textContent = name;
  $('logbook-title').textContent = name;
  searchInput.placeholder = 'Search entries in ' + name;
  searchInput.setAttribute('aria-label', 'Search entries in ' + name);

  var tagFilter = B.tagFilter({
    tags: data.tags.map(function (t) { return t.name; }),
    selected: [],
    onChange: function (selected) {
      selectedTags = selected;
      renderEntries(true);
    }
  });
  $('tag-filter-slot').replaceWith(tagFilter.el);

  var sortSelect = B.select({
    label: 'Sort entries',
    icon: 'Sort',
    options: SORTS,
    value: sortKey,
    onChange: function (value) {
      sortKey = value;
      renderEntries(true);
    }
  });
  $('sort-slot').replaceWith(sortSelect.el);

  searchInput.addEventListener('input', function () {
    term = searchInput.value.trim();
    renderEntries(true);
  });
  $('entry-search-form').addEventListener('submit', function (e) { e.preventDefault(); });

  expandAll.addEventListener('click', function () {
    var open = expandAll.getAttribute('data-state') !== 'open';
    entryEls().forEach(function (el) { setOpen(el, open); });
    syncExpandAll();
  });

  /* Logbook options: the items render in the design but have no action in this skeleton. */
  B.menu($('options-btn'), $('options-menu'));

  /* ---------- Editor ---------- */
  function onSaved(entry, isNew) {
    if (isNew) openIds[entry.id] = true;
    renderAll();
    return {
      focus: toggleOf(entry.id) || newEntry,
      notice: {
        title: 'Entry saved',
        message: entry.title + (isNew ? ' was added to ' : ' was updated in ') + name + '.'
      }
    };
  }

  function openEditor(entry, opener) {
    CCL.editor.open({ logbook: name, entry: entry, returnTo: opener, onSave: onSaved });
  }

  newEntry.addEventListener('click', function () { openEditor(null, newEntry); });

  /* ---------- Delete ---------- */
  function confirmDelete(entry, opener) {
    B.modal({
      title: 'Delete this entry?',
      bodyHtml: '<p><strong class="modal-subject">' + esc(entry.title) + '</strong> will be removed from ' + esc(name) + ", with its code and images. This can't be undone.</p>",
      cancelLabel: 'Cancel',
      confirmLabel: 'Delete entry',
      danger: true,
      returnTo: opener,
      onConfirm: function (close) {
        var list = visibleEntries();
        var at = list.indexOf(entry);
        var neighbour = list[at + 1] || list[at - 1];
        data.removeEntry(entry.id);
        delete openIds[entry.id];
        renderAll();
        close((neighbour && toggleOf(neighbour.id)) || newEntry);
        B.toast({ title: 'Entry deleted.' });
      }
    });
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(entry, start, opener) {
    var last = entry.images.length - 1;
    var index = start;
    var el = document.createElement('div');
    el.className = 'lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Image viewer');
    el.innerHTML =
      '<div class="lb-top"><div><div class="lb-entry">' + esc(entry.title) + '</div><div class="lb-count" aria-live="polite"></div></div>' +
      '<button type="button" class="lb-btn" data-close aria-label="Close" data-autofocus>' + icon('X', 20) + '</button></div>' +
      '<div class="lb-stage">' +
      '<button type="button" class="lb-btn" data-prev aria-label="Previous image">' + icon('ChevLeft', 20) + '</button><span class="lb-nav-slot" data-prev-slot aria-hidden="true"></span>' +
      '<div class="lb-img" role="img"></div>' +
      '<button type="button" class="lb-btn" data-next aria-label="Next image">' + icon('ChevRight', 20) + '</button><span class="lb-nav-slot" data-next-slot aria-hidden="true"></span></div>' +
      '<div class="lb-caption"></div>' +
      '<div class="lb-strip">' + entry.images.map(function (img, i) {
        return '<button type="button" class="mini" data-index="' + i + '" aria-label="Show image ' + (i + 1) + ', ' + esc(img) + '">' + ui.shot(i) + '</button>';
      }).join('') + '</div>';

    function q(selector) { return el.querySelector(selector); }
    var prev = q('[data-prev]');
    var next = q('[data-next]');
    var minis = Array.prototype.slice.call(el.querySelectorAll('.mini'));

    function paint() {
      q('.lb-count').textContent = 'Image ' + (index + 1) + ' of ' + (last + 1);
      var img = q('.lb-img');
      img.innerHTML = ui.shot(index);
      img.setAttribute('aria-label', entry.images[index]);
      q('.lb-caption').textContent = entry.images[index];
      prev.hidden = index === 0;
      q('[data-prev-slot]').hidden = index !== 0;
      next.hidden = index === last;
      q('[data-next-slot]').hidden = index !== last;
      minis.forEach(function (m, i) {
        m.classList.toggle('active', i === index);
        if (i === index) m.setAttribute('aria-current', 'true'); else m.removeAttribute('aria-current');
      });
      /* No wrap-around: when the focused arrow disappears, focus moves to Close. */
      if (!el.contains(document.activeElement) || document.activeElement.hidden) q('[data-close]').focus();
    }

    function go(i) {
      if (i < 0 || i > last) return;
      index = i;
      paint();
    }

    el.addEventListener('click', function (e) {
      var mini = e.target.closest('.mini');
      if (e.target.closest('[data-close]')) layer.close();
      else if (e.target.closest('[data-prev]')) go(index - 1);
      else if (e.target.closest('[data-next]')) go(index + 1);
      else if (mini) go(Number(mini.getAttribute('data-index')));
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    });

    var layer = B.openLayer(el, { returnTo: opener });
    paint();
  }

  /* ---------- Copy code ---------- */
  function copyText(text, button) {
    function done() {
      var label = button.querySelector('span');
      button.classList.add('copied');
      label.textContent = 'Copied';
      setTimeout(function () {
        button.classList.remove('copied');
        label.textContent = 'Copy code';
      }, 2000);
    }
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      area.remove();
      button.focus();
      if (ok) done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  /* ---------- Entry list events ---------- */
  entriesEl.addEventListener('click', function (e) {
    var entryEl = e.target.closest('.entry');
    var id = entryEl ? entryEl.getAttribute('data-id') : null;
    var entry = id ? data.findEntry(id) : null;
    var action = e.target.closest('[data-action]');

    if (action) {
      var kind = action.getAttribute('data-action');
      if (kind === 'clear-search') {
        term = '';
        searchInput.value = '';
        renderEntries(true);
        searchInput.focus();
      } else if (kind === 'clear-filters') {
        selectedTags = [];
        tagFilter.setSelected([]);
        renderEntries(true);
        tagFilter.el.querySelector('.select').focus();
      } else if (kind === 'new-entry') {
        openEditor(null, action);
      }
      return;
    }
    if (!entry) return;

    var toggle = e.target.closest('.entry-toggle');
    var edit = e.target.closest('[data-edit]');
    var del = e.target.closest('[data-delete]');
    var copy = e.target.closest('[data-copy]');
    var image = e.target.closest('[data-image]');
    if (toggle) {
      setOpen(entryEl, !entryEl.classList.contains('open'));
      syncExpandAll();
    } else if (edit) {
      openEditor(entry, edit);
    } else if (del) {
      confirmDelete(entry, del);
    } else if (copy && entry.code) {
      copyText(entry.code.text, copy);
    } else if (image) {
      openLightbox(entry, Number(image.getAttribute('data-image')), image);
    }
  });

  /* ---------- Start ---------- */
  var requested = params.get('entry');
  var all = sortEntries(data.entriesOf(name), sortKey);
  var focusId = requested && data.findEntry(requested) && data.findEntry(requested).logbook === name ? requested : null;
  if (focusId) openIds[focusId] = true;
  else if (all.length) openIds[all[0].id] = true;

  renderAll();

  if (focusId) {
    var toggleEl = toggleOf(focusId);
    if (toggleEl) {
      toggleEl.closest('.entry').scrollIntoView({ block: 'start' });
      toggleEl.focus({ preventScroll: true });
    }
  }
})();
