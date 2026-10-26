/*
  Entry editor: the right-side drawer used to create and edit an entry.
  - Save is never disabled: it shows the errors and focuses the first invalid field.
    With no changes on an existing entry it just closes the drawer.
  - Cancel, Close, Esc and a click outside open "Discard changes?" when the form has changes.
  - Tab close or reload asks for confirmation (beforeunload) only while changes exist.
*/
(function () {
  'use strict';

  var CCL = window.CCL;
  var ui = CCL.ui;
  var icon = CCL.icon;
  var data = CCL.data;
  var B = CCL.behaviors;
  var esc = ui.esc;

  var ERRORS = {
    title: 'Enter a title.',
    tags: 'Select at least one tag.',
    missing: 'Enter the implementation link.',
    invalid: 'Enter a full URL starting with https://'
  };
  var IMAGE_ERRORS = {
    type: 'File type not supported. Use JPG or PNG.',
    size: 'File is too large. Maximum size is 5 MB.'
  };
  var IMAGE_TYPES = ['image/jpeg', 'image/png'];
  var MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  var TOOLBAR = [
    [['bold', 'Bold', 'Bold'], ['italic', 'Italic', 'Italic'], ['underline', 'Underline', 'Underline'], ['code', 'CodeInline', 'Inline code']],
    [['heading', 'H2', 'Heading'], ['ul', 'List', 'Bulleted list'], ['ol', 'ListNum', 'Numbered list']],
    [['link', 'Link', 'Link']]
  ];

  function isHttpsUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' && url.hostname.indexOf('.') > -1;
    } catch (e) {
      return false;
    }
  }

  function toolbarHtml() {
    return TOOLBAR.map(function (group) {
      return '<div class="rte-group">' + group.map(function (b) {
        return '<button type="button" class="rte-btn" data-cmd="' + b[0] + '" aria-label="' + b[2] + '" aria-pressed="false">' + icon(b[1]) + '</button>';
      }).join('') + '</div>';
    }).join('');
  }

  function template(opts) {
    var entry = opts.entry;
    var isNew = !entry;
    var created = entry ? ui.formatDate(entry.created.date) : 'Not saved yet';
    var author = entry ? entry.created.by : data.currentUser;
    var note = entry ? 'Last saved ' + ui.formatDate(entry.updated.date) + ' by ' + entry.updated.by : '';
    return '<div class="overlay" data-overlay></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">' +
      '<div class="drawer-head"><div><div class="doc-label">' + icon('Book', 13) + esc(opts.logbook) + '</div>' +
      '<h3 id="drawer-title">' + (isNew ? 'New entry' : 'Edit entry') + '</h3></div>' +
      ui.iconButton({ icon: 'X', label: 'Close editor', attrs: 'data-close' }) + '</div>' +
      '<form class="drawer-form" novalidate>' +
      '<div class="drawer-body">' +
      '<p class="drawer-required-note">Fields marked * are required.</p>' +

      '<div class="field"><label class="field-label" for="ed-title">Title<span class="req" aria-hidden="true">*</span></label>' +
      '<input class="input" id="ed-title" type="text" required aria-required="true" placeholder="Short description of the change" data-autofocus>' +
      '<div class="field-error" id="ed-title-error" role="alert" hidden></div></div>' +

      '<div class="field"><span class="field-label" id="ed-tags-label">Tags<span class="req" aria-hidden="true">*</span></span>' +
      '<div class="field-desc" id="ed-tags-desc">Pick from the shared tag list. Ask an admin to add new tags.</div>' +
      '<div class="multiselect-wrap"><div class="multiselect" id="ed-tags-box">' +
      '<input class="multiselect-input" id="ed-tags" type="text" readonly role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="ed-tags-list" aria-labelledby="ed-tags-label" aria-describedby="ed-tags-desc" aria-required="true" placeholder="Select tags">' +
      icon('ChevDown').replace('class="icon"', 'class="icon chev"') + '</div>' +
      '<div class="menu tag-menu" id="ed-tags-menu" hidden><div class="tf-list" id="ed-tags-list" role="listbox" aria-multiselectable="true" aria-label="Tags">' +
      data.tags.map(function (t, i) {
        return '<div class="tf-option" role="option" id="ed-tag-opt-' + i + '" aria-selected="false" data-tag="' + esc(t.name) + '">' +
          '<span class="checkbox-box" aria-hidden="true">' + icon('Check', 12) + '</span><span>' + esc(t.name) + '</span></div>';
      }).join('') + '</div></div></div>' +
      '<div class="field-error" id="ed-tags-error" role="alert" hidden></div></div>' +

      '<div class="field"><label class="field-label" for="ed-link">Implementation link<span class="req" aria-hidden="true">*</span></label>' +
      '<div class="field-desc" id="ed-link-desc">Direct link to the page in PL or AL where this code runs.</div>' +
      '<div class="input-icon">' + icon('Link') + '<input class="input" id="ed-link" type="url" required aria-required="true" aria-describedby="ed-link-desc" placeholder="https://"></div>' +
      '<div class="field-error" id="ed-link-error" role="alert" hidden></div></div>' +

      '<div class="field"><label class="field-label" for="ed-notes">Registration notes</label>' +
      '<textarea class="textarea" id="ed-notes" placeholder="Who asked for the change and why"></textarea></div>' +

      '<div class="field"><span class="field-label" id="ed-process-label">Process details</span>' +
      '<div class="rte"><div class="rte-toolbar" role="toolbar" aria-label="Text formatting">' + toolbarHtml() + '</div>' +
      '<div class="rte-content" id="ed-process" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="ed-process-label" data-placeholder="Steps to apply and test the change"></div></div></div>' +

      '<div class="field"><span class="field-label" id="ed-code-label">Code</span>' +
      '<div class="code-editor"><div class="code-editor-head"><span data-language-slot></span><span class="hint">One code block per entry</span></div>' +
      '<div class="code-body"><div class="code-gutter" aria-hidden="true"></div>' +
      '<textarea class="code-input" id="ed-code" aria-labelledby="ed-code-label" spellcheck="false" wrap="off" placeholder="Paste the code"></textarea></div></div></div>' +

      '<div class="field"><span class="field-label" id="ed-images-label">Images</span>' +
      '<button type="button" class="dropzone" id="ed-dropzone" aria-describedby="ed-images-error">' +
      '<span class="dz-icon">' + icon('Upload', 20) + '</span>' +
      '<span class="dz-text"><span class="dz-title">Drag images here or <span class="dz-link">browse</span></span><span class="dz-sub">JPG or PNG, up to 5 MB each</span></span></button>' +
      '<input type="file" id="ed-file" accept="image/png,image/jpeg" multiple hidden>' +
      '<div class="field-error dz-error" id="ed-images-error" role="alert" hidden></div>' +
      '<div class="upload-list" id="ed-uploads"></div></div>' +

      '<dl class="drawer-meta" aria-label="Set automatically">' +
      '<div><dt>Created</dt><dd>' + esc(created) + '</dd></div><div><dt>Author</dt><dd>' + esc(author) + '</dd></div></dl>' +
      '</div>' +
      '<div class="drawer-foot"><span class="note">' + esc(note) + '</span><div class="btns">' +
      ui.button({ variant: 'default', label: 'Cancel', attrs: 'data-cancel' }) +
      '<button type="submit" class="btn btn-primary">Save entry</button></div></div>' +
      '</form></aside>';
  }

  /*
    opts: { logbook, entry (omit for a new entry), returnTo, onSave(entry, isNew) -> { focus, notice } }
  */
  function open(opts) {
    var entry = opts.entry || null;
    var isNew = !entry;
    var root = document.createElement('div');
    root.innerHTML = template(opts);

    function $(selector) { return root.querySelector(selector); }
    var form = $('form');
    var titleEl = $('#ed-title');
    var linkEl = $('#ed-link');
    var notesEl = $('#ed-notes');
    var rte = $('#ed-process');
    var codeEl = $('#ed-code');
    var gutter = $('.code-gutter');
    var tags = entry ? entry.tags.slice() : [];
    var images = entry ? entry.images.slice() : [];

    /* ---------- Initial values ---------- */
    if (entry) {
      titleEl.value = entry.title;
      linkEl.value = entry.link;
      notesEl.value = entry.notes;
      rte.innerHTML = ui.sanitizeHtml(entry.process);
      codeEl.value = entry.code ? entry.code.text : '';
    }

    var language = B.select({
      label: 'Code language',
      options: data.languages,
      value: entry && entry.code ? entry.code.language : 'JavaScript',
      compact: true
    });
    $('[data-language-slot]').replaceWith(language.el);

    /* ---------- Field errors ---------- */
    var FIELDS = {
      title: { control: titleEl, mark: titleEl, error: $('#ed-title-error'), desc: '' },
      tags: { control: $('#ed-tags'), mark: $('#ed-tags-box'), error: $('#ed-tags-error'), desc: 'ed-tags-desc' },
      link: { control: linkEl, mark: linkEl, error: $('#ed-link-error'), desc: 'ed-link-desc' }
    };

    function setError(key, message) {
      var f = FIELDS[key];
      f.mark.classList.toggle('has-error', !!message);
      f.control.setAttribute('aria-invalid', message ? 'true' : 'false');
      f.error.textContent = message || '';
      f.error.hidden = !message;
      var ids = [f.desc, message ? f.error.id : ''].filter(Boolean).join(' ');
      if (ids) f.control.setAttribute('aria-describedby', ids); else f.control.removeAttribute('aria-describedby');
    }

    titleEl.addEventListener('input', function () { if (titleEl.value.trim()) setError('title', ''); });
    linkEl.addEventListener('input', function () { if (linkEl.value.trim() && isHttpsUrl(linkEl.value.trim())) setError('link', ''); });

    /* ---------- Tags combobox ---------- */
    var tagsInput = FIELDS.tags.control;
    var tagsBox = FIELDS.tags.mark;
    var tagsMenu = $('#ed-tags-menu');
    var tagsList = $('#ed-tags-list');
    var tagOptions = Array.prototype.slice.call(tagsList.children);
    var tagActive = -1;
    var stopTagsOutside = null;

    function tagsOpen() { return !tagsMenu.hidden; }

    function renderTags() {
      Array.prototype.slice.call(tagsBox.querySelectorAll('.pill')).forEach(function (p) { p.remove(); });
      tags.forEach(function (name) {
        var pill = document.createElement('span');
        pill.className = 'pill';
        pill.setAttribute('data-tag', name);
        pill.innerHTML = esc(name) + ui.iconButton({ icon: 'X', label: 'Remove ' + name });
        tagsBox.insertBefore(pill, tagsInput);
      });
      tagsInput.placeholder = tags.length ? '' : 'Select tags';
      tagOptions.forEach(function (el) {
        el.setAttribute('aria-selected', tags.indexOf(el.getAttribute('data-tag')) > -1 ? 'true' : 'false');
      });
      if (tags.length) setError('tags', '');
    }

    function activateTag(i) {
      tagActive = Math.max(0, Math.min(tagOptions.length - 1, i));
      B.setActive(tagsList, tagOptions, tagActive);
      tagsInput.setAttribute('aria-activedescendant', tagOptions[tagActive].id);
    }

    function closeTags() {
      if (!tagsOpen()) return;
      tagsMenu.hidden = true;
      tagsInput.setAttribute('aria-expanded', 'false');
      tagsInput.removeAttribute('aria-activedescendant');
      B.setActive(tagsList, tagOptions, -1);
      if (stopTagsOutside) { stopTagsOutside(); stopTagsOutside = null; }
    }

    function openTags() {
      if (tagsOpen()) return;
      tagsMenu.hidden = false;
      tagsInput.setAttribute('aria-expanded', 'true');
      stopTagsOutside = B.onOutsidePress(tagsBox.parentElement, closeTags);
      activateTag(0);
    }

    function toggleTag(name) {
      var at = tags.indexOf(name);
      if (at > -1) tags.splice(at, 1); else tags.push(name);
      renderTags();
    }

    tagsBox.addEventListener('click', function (e) {
      var remove = e.target.closest('.pill .icon-btn');
      if (remove) {
        toggleTag(remove.parentElement.getAttribute('data-tag'));
        tagsInput.focus();
        return;
      }
      tagsInput.focus();
      if (tagsOpen()) closeTags(); else openTags();
    });

    tagsInput.addEventListener('keydown', function (e) {
      var key = e.key;
      if (key === 'ArrowDown') {
        if (!tagsOpen()) openTags(); else activateTag(tagActive + 1);
      } else if (key === 'ArrowUp') {
        if (tagsOpen()) activateTag(tagActive - 1);
      } else if (key === 'Home' && tagsOpen()) {
        activateTag(0);
      } else if (key === 'End' && tagsOpen()) {
        activateTag(tagOptions.length - 1);
      } else if (key === 'Enter' || key === ' ') {
        if (tagsOpen() && tagActive > -1) toggleTag(tagOptions[tagActive].getAttribute('data-tag')); else openTags();
      } else if (key === 'Escape') {
        if (!tagsOpen()) return;
        e.stopPropagation();
        closeTags();
      } else if (key === 'Backspace') {
        if (tags.length) toggleTag(tags[tags.length - 1]);
      } else if (key === 'Tab') {
        closeTags();
        return;
      } else {
        return;
      }
      e.preventDefault();
    });

    tagsList.addEventListener('mousedown', function (e) { e.preventDefault(); });
    tagsList.addEventListener('click', function (e) {
      var el = e.target.closest('.tf-option');
      if (!el) return;
      activateTag(tagOptions.indexOf(el));
      toggleTag(el.getAttribute('data-tag'));
      tagsInput.focus();
    });
    renderTags();

    /* ---------- Rich text ---------- */
    function inside(tagName) {
      var node = window.getSelection().anchorNode;
      while (node && node !== rte) {
        if (node.nodeType === 1 && node.tagName.toLowerCase() === tagName) return true;
        node = node.parentNode;
      }
      return false;
    }

    function wrapInlineCode() {
      var sel = window.getSelection();
      if (!sel.rangeCount || sel.isCollapsed) return;
      var range = sel.getRangeAt(0);
      if (inside('code')) return;
      var code = document.createElement('code');
      code.appendChild(range.extractContents());
      range.insertNode(code);
      sel.removeAllRanges();
      var after = document.createRange();
      after.selectNodeContents(code);
      sel.addRange(after);
    }

    function runCommand(cmd) {
      rte.focus();
      if (cmd === 'bold') document.execCommand('bold');
      else if (cmd === 'italic') document.execCommand('italic');
      else if (cmd === 'underline') document.execCommand('underline');
      else if (cmd === 'ul') document.execCommand('insertUnorderedList');
      else if (cmd === 'ol') document.execCommand('insertOrderedList');
      else if (cmd === 'heading') document.execCommand('formatBlock', false, inside('h2') ? 'p' : 'h2');
      else if (cmd === 'code') wrapInlineCode();
      else if (cmd === 'link') {
        var url = window.prompt('Enter a full URL starting with https://', 'https://');
        if (url && isHttpsUrl(url.trim())) document.execCommand('createLink', false, url.trim());
      }
      syncToolbar();
    }

    function syncToolbar() {
      var active = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
        heading: inside('h2'),
        code: inside('code'),
        link: inside('a')
      };
      Array.prototype.forEach.call(root.querySelectorAll('.rte-btn'), function (btn) {
        btn.setAttribute('aria-pressed', active[btn.getAttribute('data-cmd')] ? 'true' : 'false');
      });
    }

    var toolbar = $('.rte-toolbar');
    toolbar.addEventListener('mousedown', function (e) { if (e.target.closest('.rte-btn')) e.preventDefault(); });
    toolbar.addEventListener('click', function (e) {
      var btn = e.target.closest('.rte-btn');
      if (btn) runCommand(btn.getAttribute('data-cmd'));
    });
    rte.addEventListener('input', function () {
      if (!rte.textContent.trim() && !rte.querySelector('li')) rte.innerHTML = '';
    });
    rte.addEventListener('keyup', syncToolbar);
    rte.addEventListener('mouseup', syncToolbar);
    rte.addEventListener('focus', syncToolbar);

    /* ---------- Code field ---------- */
    function paintGutter() {
      var lines = codeEl.value.split('\n').length;
      var html = '';
      for (var i = 1; i <= lines; i++) html += '<div>' + i + '</div>';
      gutter.innerHTML = html;
      codeEl.rows = Math.max(7, lines);
    }
    codeEl.addEventListener('input', paintGutter);
    paintGutter();

    /* ---------- Images ---------- */
    var dropzone = $('#ed-dropzone');
    var fileInput = $('#ed-file');
    var imageError = $('#ed-images-error');
    var uploads = $('#ed-uploads');

    function renderUploads() {
      uploads.innerHTML = images.map(function (name, i) {
        return '<div class="upload"><div class="thumb">' + ui.shot(i) + '</div>' +
          '<button type="button" class="remove" aria-label="Remove ' + esc(name) + '" data-remove="' + i + '">' + icon('X', 12) + '</button>' +
          '<div class="fname">' + esc(name) + '</div></div>';
      }).join('');
    }

    function showImageError(message) {
      imageError.textContent = message || '';
      imageError.hidden = !message;
      dropzone.classList.toggle('has-error', !!message);
    }

    function addFiles(files) {
      var problem = '';
      Array.prototype.forEach.call(files, function (file) {
        if (IMAGE_TYPES.indexOf(file.type) === -1) problem = IMAGE_ERRORS.type;
        else if (file.size > MAX_IMAGE_BYTES) problem = IMAGE_ERRORS.size;
        else if (images.indexOf(file.name) === -1) images.push(file.name);
      });
      showImageError(problem);
      renderUploads();
    }

    dropzone.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      addFiles(fileInput.files);
      fileInput.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (type) {
      dropzone.addEventListener(type, function (e) { e.preventDefault(); dropzone.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (type) {
      dropzone.addEventListener(type, function (e) { e.preventDefault(); dropzone.classList.remove('is-over'); });
    });
    dropzone.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
    uploads.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove]');
      if (!btn) return;
      images.splice(Number(btn.getAttribute('data-remove')), 1);
      renderUploads();
      dropzone.focus();
    });
    renderUploads();

    /* ---------- Unsaved changes ---------- */
    function snapshot() {
      return JSON.stringify([titleEl.value, tags, linkEl.value, notesEl.value, ui.sanitizeHtml(rte.innerHTML), language.getValue(), codeEl.value, images]);
    }
    var initial = snapshot();
    function isDirty() { return snapshot() !== initial; }

    function onBeforeUnload(e) {
      if (!isDirty()) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);

    var layer;
    function closeDrawer(target) {
      window.removeEventListener('beforeunload', onBeforeUnload);
      layer.close(target);
    }

    function requestClose() {
      if (!isDirty()) { closeDrawer(); return; }
      B.modal({
        title: 'Discard changes?',
        bodyHtml: '<p>You have unsaved changes in this entry. If you close the editor now, they will be lost.</p>',
        cancelLabel: 'Keep editing',
        confirmLabel: 'Discard changes',
        danger: true,
        onConfirm: function (close) {
          close(null);
          closeDrawer();
        }
      });
    }

    /* ---------- Save ---------- */
    function validate() {
      var first = null;
      function fail(key, message) {
        setError(key, message);
        if (!first) first = FIELDS[key].control;
      }
      if (!titleEl.value.trim()) fail('title', ERRORS.title); else setError('title', '');
      if (!tags.length) fail('tags', ERRORS.tags); else setError('tags', '');
      var link = linkEl.value.trim();
      if (!link) fail('link', ERRORS.missing);
      else if (!isHttpsUrl(link)) fail('link', ERRORS.invalid);
      else setError('link', '');
      return first;
    }

    function save() {
      if (!isNew && !isDirty()) { closeDrawer(); return; }
      var invalid = validate();
      if (invalid) { invalid.focus(); return; }

      var today = ui.todayISO();
      var by = data.currentUser;
      var codeText = codeEl.value.replace(/\s+$/, '');
      var fields = {
        title: titleEl.value.trim(),
        tags: tags.slice(),
        link: linkEl.value.trim(),
        notes: notesEl.value.trim(),
        process: rte.textContent.trim() ? ui.sanitizeHtml(rte.innerHTML) : '',
        code: codeText.trim() ? { language: language.getValue(), text: codeText } : null,
        images: images.slice()
      };
      if (isNew) {
        entry = data.addEntry(Object.assign({
          id: 'entry-' + Date.now(),
          logbook: opts.logbook,
          created: { date: today, by: by },
          updated: { date: today, by: by }
        }, fields));
      } else {
        Object.assign(entry, fields);
        entry.updated = { date: today, by: by };
      }

      var result = opts.onSave(entry, isNew) || {};
      closeDrawer(result.focus);
      if (result.notice) B.toast(result.notice);
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); save(); });
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-cancel], [data-close]') || e.target.hasAttribute('data-overlay')) requestClose();
    });

    layer = B.openLayer(root, { onEscape: requestClose, returnTo: opts.returnTo, aboveDock: true });
  }

  CCL.editor = { open: open };
})();
