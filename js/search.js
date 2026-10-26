/* Library search results: logbook matches, a divider, then entry matches, filtered live from the sample data. */
(function () {
  'use strict';

  var CCL = window.CCL;
  var ui = CCL.ui;
  var icon = CCL.icon;
  var data = CCL.data;

  var form = document.getElementById('search-form');
  var input = document.getElementById('search-input');
  var clear = document.getElementById('search-clear');
  var countEl = document.getElementById('result-count');
  var results = document.getElementById('results');

  var initial = (new URLSearchParams(window.location.search).get('q') || '').trim();
  if (!initial) {
    window.location.replace('index.html');
    return;
  }
  input.value = initial;

  function logbookMatches(term) {
    var needle = term.toLowerCase();
    return data.logbooks.filter(function (lb) { return lb.name.toLowerCase().indexOf(needle) > -1; });
  }

  function entryMatches(term) {
    var needle = term.toLowerCase();
    return data.entries
      .filter(function (e) { return (e.title + ' ' + e.notes).toLowerCase().indexOf(needle) > -1; })
      .sort(function (a, b) { return a.updated.date < b.updated.date ? 1 : a.updated.date > b.updated.date ? -1 : 0; });
  }

  function logbookResult(lb, term) {
    var s = data.summary(lb.name);
    var sub = ui.plural(s.count, 'entry', 'entries') + (s.updated ? ', updated ' + ui.formatDate(s.updated) : '');
    return '<a class="lb-result" href="' + ui.esc(ui.logbookUrl(lb.name)) + '">' +
      '<span class="lb-icon">' + icon('Book', 18) + '</span>' +
      '<div><div class="lb-name">' + ui.mark(lb.name, term) + '</div><div class="lb-sub">' + ui.esc(sub) + '</div></div>' +
      icon('ChevRight').replace('class="icon"', 'class="icon go"') + '</a>';
  }

  function entryResult(entry, term) {
    return '<a class="er" href="' + ui.esc(ui.logbookUrl(entry.logbook, entry.id)) + '">' +
      '<div class="er-top"><div class="er-title">' + ui.mark(entry.title, term) + '</div>' +
      '<div class="er-date">' + ui.formatDate(entry.updated.date) + '</div></div>' +
      '<p class="er-snippet">' + ui.bold(ui.excerpt(entry.notes, term), term) + '</p>' +
      '<div class="er-bottom"><span class="in-logbook">' + icon('Book') + ui.esc(entry.logbook) + '</span>' + ui.tagList(entry.tags) + '</div></a>';
  }

  function render(term) {
    var logbooks = logbookMatches(term);
    var entries = entryMatches(term);
    var total = logbooks.length + entries.length;

    if (!total) {
      countEl.textContent = '';
      results.innerHTML = ui.emptyState({
        icon: 'Search',
        title: 'No logbooks or entries match "' + ui.esc(term) + '"',
        text: 'Try a shorter term or the client name.',
        actions: [ui.button({ variant: 'default', label: 'Clear search', href: 'index.html' })]
      });
      return;
    }

    countEl.textContent = ui.plural(total, 'result', 'results');
    var html = '';
    if (logbooks.length) {
      html += '<div class="results-section" aria-labelledby="res-logbooks"><div class="results-head"><h3 id="res-logbooks">Logbooks <span class="count-badge">' + logbooks.length + '</span></h3></div>' +
        '<div class="lb-results">' + logbooks.map(function (lb) { return logbookResult(lb, term); }).join('') + '</div></div>';
    }
    if (logbooks.length && entries.length) html += '<div class="divider"></div>';
    if (entries.length) {
      html += '<div class="results-section" aria-labelledby="res-entries"><div class="results-head"><h3 id="res-entries">Entries <span class="count-badge">' + entries.length + '</span></h3></div>' +
        '<div class="entry-results">' + entries.map(function (e) { return entryResult(e, term); }).join('') + '</div></div>';
    }
    results.innerHTML = html;
  }

  input.addEventListener('input', function () {
    var term = input.value.trim();
    if (!term) {
      window.location.href = 'index.html';
      return;
    }
    window.history.replaceState(null, '', 'search.html?q=' + encodeURIComponent(term));
    document.title = 'Search results · Client Code Library';
    render(term);
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });
  clear.addEventListener('click', function () { window.location.href = 'index.html'; });

  render(initial);
})();
