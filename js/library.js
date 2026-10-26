/* Library page: table of logbooks with sortable headers and a search field that opens the results page. */
(function () {
  'use strict';

  var CCL = window.CCL;
  var ui = CCL.ui;
  var icon = CCL.icon;
  var data = CCL.data;

  var body = document.getElementById('library-rows');
  var count = document.getElementById('library-count');
  var headers = document.querySelectorAll('thead th button[data-sort]');
  var sort = { key: 'updated', dir: 'desc' };

  /* A column sorts descending first, except the name. */
  var FIRST_DIRECTION = { name: 'asc', entries: 'desc', updated: 'desc' };

  function rows() {
    var list = data.logbooks.map(function (lb) {
      var s = data.summary(lb.name);
      return { name: lb.name, tags: lb.tags, count: s.count, updated: s.updated, by: s.by };
    });
    list.sort(function (a, b) {
      var result;
      if (sort.key === 'name') result = a.name.localeCompare(b.name);
      else if (sort.key === 'entries') result = a.count - b.count;
      else result = a.updated < b.updated ? -1 : a.updated > b.updated ? 1 : 0;
      if (sort.dir === 'desc') result = -result;
      return result || a.name.localeCompare(b.name);
    });
    return list;
  }

  function row(lb) {
    var url = ui.logbookUrl(lb.name);
    var dated = lb.updated ? ui.formatDate(lb.updated) + '<span class="by">by ' + ui.esc(lb.by) + '</span>' : '<span class="by">No entries yet</span>';
    return '<tr data-href="' + ui.esc(url) + '">' +
      '<td class="col-name"><div class="name-wrap"><span class="lb-icon">' + icon('Book') + '</span>' +
      '<a class="name-link" href="' + ui.esc(url) + '">' + ui.esc(lb.name) + '</a></div></td>' +
      '<td class="col-count">' + lb.count + '</td>' +
      '<td><div class="tags">' + ui.tagList(lb.tags, 3) + '</div></td>' +
      '<td class="col-date">' + dated + '</td>' +
      '<td class="col-actions dev-only"><div class="action-icons">' +
      ui.iconButton({ icon: 'Pencil', label: 'Rename ' + lb.name }) +
      ui.iconButton({ icon: 'Trash', label: 'Delete ' + lb.name, tone: 'danger' }) +
      '</div></td></tr>';
  }

  function render() {
    var list = rows();
    body.innerHTML = list.map(row).join('');
    count.textContent = ui.plural(list.length, 'logbook', 'logbooks');

    Array.prototype.forEach.call(headers, function (button) {
      var key = button.getAttribute('data-sort');
      var active = key === sort.key;
      button.classList.toggle('sorted', active);
      button.classList.toggle('asc', active && sort.dir === 'asc');
      button.parentElement.setAttribute('aria-sort', active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
      button.innerHTML = button.textContent.trim() + icon(active ? 'ChevDown' : 'Selector', 12);
    });
  }

  Array.prototype.forEach.call(headers, function (button) {
    button.addEventListener('click', function () {
      var key = button.getAttribute('data-sort');
      sort = key === sort.key
        ? { key: key, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
        : { key: key, dir: FIRST_DIRECTION[key] };
      render();
    });
  });

  /* The whole row opens the logbook; the name link keeps the keyboard path. */
  body.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-href]');
    if (tr && !e.target.closest('a, button')) window.location.href = tr.getAttribute('data-href');
  });

  document.getElementById('library-search').addEventListener('submit', function (e) {
    var term = this.elements.q.value.trim();
    if (!term) {
      e.preventDefault();
      this.elements.q.focus();
    } else {
      this.elements.q.value = term;
    }
  });

  render();
})();
