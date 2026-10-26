# Client Code Library

Static front end for an internal logbook of the custom code made for each client or project.
A working interface skeleton in plain HTML, CSS and JavaScript, with sample data and no backend.

## Folder structure

- `css/` tokens (light and dark), base styles, component styles, page layout
- `js/` sample data, icons, UI helpers, shared behaviours, editor and one script per page
- `index.html`, `search.html`, `logbook.html` the pages

## Pages

- `index.html` Library: sortable table of logbooks and a search field.
- `search.html` Library search results: logbook matches, then entry matches (`?q=term`).
- `logbook.html` Logbook (`?lb=name`): entries, tag filter, sort, editor drawer, dialogs and image lightbox.

## Known limitations

- No backend: data lives in `js/data.js` and changes are lost on reload.
- No real login: Dev login and Log out only switch the role stored in the browser.
- Not implemented: page loading and error states, loading more results, saving and deleting
  in progress, save and delete errors, and image load errors.
- New logbook, Rename logbook and Delete logbook have no action.
- Images are placeholders; uploads are validated but not stored.
- Desktop only; there is no mobile or touch layout.
- Google Fonts are loaded from the network.
