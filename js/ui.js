/*
  Markup and text helpers shared by every page. Functions return HTML strings;
  anything that comes from data or from the user goes through esc().
*/
(function () {
  'use strict';

  var CCL = window.CCL;
  var icon = CCL.icon;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* "2026-09-24" -> "24 Sep 2026" */
  function formatDate(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0];
  }

  function todayISO() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function logbookUrl(name, entryId) {
    return 'logbook.html?lb=' + encodeURIComponent(name) + (entryId ? '&entry=' + encodeURIComponent(entryId) : '');
  }

  function tag(name) {
    return '<span class="tag ' + CCL.data.tagColor(name) + '">' + esc(name) + '</span>';
  }

  function tagList(names, max) {
    var shown = max ? names.slice(0, max) : names;
    var html = shown.map(tag).join('');
    if (max && names.length > max) html += '<span class="tag more">+' + (names.length - max) + '</span>';
    return html;
  }

  function avatar(userName, small) {
    var user = CCL.data.users[userName] || { initials: userName.slice(0, 2).toUpperCase(), color: 'blue' };
    var cls = 'avatar' + (small ? ' sm' : '') + (user.color === 'teal' ? ' teal' : '');
    return '<span class="' + cls + '" aria-hidden="true">' + esc(user.initials) + '</span>';
  }

  /* Wraps every case-insensitive match of term; wrap(text) builds the markup for one match. */
  function wrapMatches(text, term, wrap) {
    var source = String(text == null ? '' : text);
    if (!term) return esc(source);
    var low = source.toLowerCase();
    var needle = term.toLowerCase();
    var out = '';
    var i = 0;
    var j;
    while ((j = low.indexOf(needle, i)) > -1) {
      out += esc(source.slice(i, j)) + wrap(esc(source.slice(j, j + needle.length)));
      i = j + needle.length;
    }
    return out + esc(source.slice(i));
  }

  function mark(text, term) { return wrapMatches(text, term, function (m) { return '<mark>' + m + '</mark>'; }); }
  function bold(text, term) { return wrapMatches(text, term, function (m) { return '<strong>' + m + '</strong>'; }); }

  /* Short excerpt of text around the first match of term. */
  function excerpt(text, term, length) {
    var max = length || 160;
    if (text.length <= max) return text;
    var at = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
    var start = at > 60 ? at - 60 : 0;
    var piece = text.slice(start, start + max).trim();
    return (start > 0 ? '… ' : '') + piece + (start + max < text.length ? ' …' : '');
  }

  function iconButton(opts) {
    return '<button type="button" class="icon-btn' + (opts.tone === 'danger' ? ' danger' : '') + (opts.cls ? ' ' + opts.cls : '') +
      '" aria-label="' + esc(opts.label) + '"' + (opts.attrs ? ' ' + opts.attrs : '') + '>' + icon(opts.icon) + '</button>';
  }

  function button(opts) {
    var cls = 'btn btn-' + (opts.variant || 'default') + (opts.size === 'sm' ? ' btn-sm' : '') + (opts.cls ? ' ' + opts.cls : '');
    var inner = (opts.icon ? icon(opts.icon) : '') + esc(opts.label);
    if (opts.href) return '<a class="' + cls + '" href="' + esc(opts.href) + '">' + inner + '</a>';
    return '<button type="button" class="' + cls + '"' + (opts.attrs ? ' ' + opts.attrs : '') + '>' + inner + '</button>';
  }

  /* Empty states. Actions with data-action are wired by the page script. */
  function emptyState(opts) {
    return '<div class="empty-state" role="status">' +
      '<div class="es-icon">' + icon(opts.icon, 22) + '</div>' +
      '<h3 class="es-title">' + opts.title + '</h3>' +
      (opts.text ? '<p>' + esc(opts.text) + '</p>' : '') +
      (opts.actions && opts.actions.length ? '<div class="es-actions">' + opts.actions.join('') + '</div>' : '') +
      '</div>';
  }

  /* ---------- Code display ---------- */
  var KEYWORDS = /^(const|let|var|function|return|if|else|new|import|export|from|class|for|while|true|false|null|undefined|public|private|static|void|echo|foreach|as)$/;
  var HIGHLIGHTED = { 'JavaScript': 1, 'JSON': 1, 'C#': 1, 'PHP': 1 };
  var TOKEN = /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)|(\.[A-Za-z_$][\w$]*)/g;

  /* Colours code tokens for the languages the tokenizer fits; the rest is shown plain. */
  function highlightCode(code, language) {
    if (!HIGHLIGHTED[language]) return esc(code);
    var out = '';
    var last = 0;
    var m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(code))) {
      var text = m[0];
      var cls = null;
      if (m[1]) cls = 'c';
      else if (m[2]) cls = 's';
      else if (m[3]) cls = 'n';
      else if (m[4]) cls = KEYWORDS.test(text) ? 'k' : 'f';
      else if (m[5]) cls = KEYWORDS.test(text) ? 'k' : null;
      else if (m[6]) cls = 'p';
      out += esc(code.slice(last, m.index)) + (cls ? '<span class="' + cls + '">' + esc(text) + '</span>' : esc(text));
      last = m.index + text.length;
    }
    return out + esc(code.slice(last));
  }

  /* ---------- Rich text ---------- */
  var ALLOWED = { strong: 1, b: 1, em: 1, i: 1, u: 1, code: 1, h2: 1, ul: 1, ol: 1, li: 1, a: 1, p: 1, br: 1, div: 1 };

  function cleanNode(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1) { node.removeChild(child); return; }
      var name = child.tagName.toLowerCase();
      if (name === 'script' || name === 'style') { node.removeChild(child); return; }
      cleanNode(child);
      if (!ALLOWED[name]) {
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        node.removeChild(child);
        return;
      }
      Array.prototype.slice.call(child.attributes).forEach(function (attr) {
        if (!(name === 'a' && attr.name === 'href' && /^https?:\/\//i.test(attr.value))) child.removeAttribute(attr.name);
      });
      if (name === 'a') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener');
      }
    });
  }

  /* Keeps only the formatting the editor toolbar can produce. */
  function sanitizeHtml(html) {
    var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    cleanNode(doc.body);
    return doc.body.innerHTML;
  }

  /* Placeholder drawing used instead of real screenshots. */
  var SHOT_KINDS = ['form', 'form-alt', 'summary'];
  function shot(index) {
    var kind = SHOT_KINDS[index % SHOT_KINDS.length];
    var line = 'fill:var(--color-border-light)';
    var dark = 'fill:var(--color-border)';
    var accent = 'fill:var(--color-primary-light)';
    var rects = kind === 'summary'
      ? '<rect x="12" y="12" width="60" height="8" rx="2" style="' + dark + '"/><rect x="12" y="30" width="136" height="28" rx="3" style="' + line + '"/><rect x="12" y="66" width="64" height="22" rx="3" style="' + accent + '"/><rect x="84" y="66" width="64" height="22" rx="3" style="' + line + '"/>'
      : '<rect x="12" y="12" width="50" height="8" rx="2" style="' + dark + '"/><rect x="12" y="28" width="136" height="14" rx="3" style="' + line + '"/><rect x="12" y="50" width="' + (kind === 'form-alt' ? 64 : 136) + '" height="14" rx="3" style="' + line + '"/><rect x="12" y="74" width="40" height="14" rx="3" style="' + accent + '"/>';
    return '<svg class="shot" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" style="background:var(--color-surface)">' + rects + '</svg>';
  }

  CCL.ui = {
    esc: esc,
    formatDate: formatDate,
    todayISO: todayISO,
    plural: plural,
    logbookUrl: logbookUrl,
    tag: tag,
    tagList: tagList,
    avatar: avatar,
    mark: mark,
    bold: bold,
    excerpt: excerpt,
    iconButton: iconButton,
    button: button,
    emptyState: emptyState,
    highlightCode: highlightCode,
    sanitizeHtml: sanitizeHtml,
    shot: shot
  };
})();
