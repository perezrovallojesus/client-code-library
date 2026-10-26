# Client Code Library

Static front end for an internal logbook of the custom code and changes made for each client or project: a Library of logbooks, search, and a Logbook page where developers write and edit entries.

It is a working skeleton of the interface, not a design system and not a product. There is no backend: data comes from sample files and changes live in memory until the page is reloaded.

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies. The only external resource is Google Fonts (Roboto and JetBrains Mono), so fonts need an internet connection.

## Open it with Live Server

1. Install the **Live Server** extension in VS Code.
2. Open this folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server** (or click **Go Live** in the status bar).

Any other static server works too, for example `python3 -m http.server` from this folder. Open the pages through a server rather than as `file://` so links, query strings and the clipboard behave as in production.

## Folder structure

```
index.html            Library: table of logbooks, search field
search.html           Library search results (?q=term)
logbook.html          Logbook (?lb=name): entries, editor drawer, dialogs, lightbox
css/
  tokens.css          Design tokens as CSS variables, light and dark
  base.css            Reset, focus ring, role switch, utilities
  components.css      Component styles (buttons, inputs, tags, entries, modal, drawer, ...)
  pages.css           Page layout only (cards, headers, toolbar, results)
js/
  boot.js             Applies the stored theme and role before first paint
  icons.js            Inline SVG icons
  data.js             Sample data: logbooks, entries, tags, languages, one empty logbook
  ui.js               Markup and text helpers (escaping, dates, tags, highlighting, sanitizer)
  behaviors.js        Menus, selects, tag filter, focus-trapping layers, modal, notifications
  shell.js            Top bar: theme toggle, Dev login, user menu
  library.js          Library page
  search.js           Search results page
  editor.js           Entry editor drawer
  logbook.js          Logbook page
```

Scripts are plain files that share one global, `CCL`. Every page loads them in the same order: `icons`, `data`, `ui`, `behaviors`, `shell`, then the page scripts.

## How it works

**Theme.** The theme follows the operating system by default. The toggle in the top bar sets `data-theme` on `<html>` and stores the choice in `localStorage` (`ccl-theme`); a stored choice wins over the system setting on later visits. Components only read variables from `css/tokens.css`, so a theme is a change of tokens, never a branch in a component.

**Roles.** `data-role` on `<html>` is `viewer` (default) or `dev`, stored in `localStorage` (`ccl-role`). **Dev login** switches to dev and **Log out** in the user menu switches back to viewer. There is no real authentication. Markup marked `.dev-only` is hidden for viewers and `.viewer-only` is hidden for devs. Viewers can search, filter, sort, open entries and images; devs also get New entry, Edit, Delete, the logbook options menu and the Dev mode badge.

**Data.** `js/data.js` holds 9 logbooks and 47 entries, including one logbook without entries (`EPMA 2027`) to show the empty state. Search is scoped to the current view: the Library searches logbook names, then entry titles and notes; a Logbook searches its own entries and adds a tag filter, which keeps entries that have **every** selected tag. Author names are neutral placeholders (`Developer A`, `Developer B`); change `USERS` in `data.js` to use real ones.

**Accessibility.** Semantic landmarks and headings, visible focus (2px outline), accessible names on icon-only buttons, `aria-live` for the result count, entry count changes and notifications, `aria-describedby` and `role="alert"` on field errors, keyboard support for menus, selects, the tag filter, the tags field (ARIA combobox) and the lightbox, and focus trapping with return of focus in the drawer, dialogs and lightbox. The pages are designed for desktop monitors; there is no mobile or touch layout.

## Flows

- **Library.** Sort by Logbook, Entries or Last updated from the table header. A logbook opens from its row. Searching goes to `search.html`.
- **Search results.** Logbook matches, a divider, then entry matches, with the match marked in titles and bold in snippets. An entry result opens the logbook with that entry expanded.
- **Logbook.** The first entry is expanded. **Expand all** turns into **Collapse all** when every entry is open and is hidden when no entry is listed.
- **Entry editor (dev).** Save never gets disabled: with errors it shows them and focuses the first invalid field; with no changes on an existing entry it closes the drawer. Cancel, the close button, Esc and a click outside open **Discard changes?** when there are unsaved changes. Closing or reloading the tab asks for confirmation only while changes exist.
- **Delete entry (dev).** Confirmation dialog with focus on Cancel, then an **Entry deleted.** notification and focus on the next entry.
- **Images.** Thumbnails open a lightbox: Esc closes, arrow keys navigate, no wrap-around. Images are drawn placeholders; uploads in the editor check type (JPG or PNG) and size (5 MB) but are not stored.

## States

Sheets named below are the state sheets of the design canvas (`01s` Library, `02s` Library search, `03s` Logbook, `04s` Entry editor, `05s` Unsaved changes, `06s` Image lightbox, `07s` Delete entry).

### States that need a backend

These are not implemented. The controls and copy that would trigger them are in the pages, but nothing sends a request.

| State | How to trigger it | Status | Sheet |
| --- | --- | --- | --- |
| Page loading (centred spinner) | Opening Library or Logbook while the request is pending | Not implemented: data is local and renders at once | 01s, 03s |
| Page error with "Try again" | The request for logbooks or entries fails | Not implemented | 01s, 03s |
| Loading more results | Scrolling to the end of a long result list (blocks of 20) | Not implemented: every match renders at once | 02s |
| Error while loading more, "Try again" | A block of results fails to load | Not implemented | 02s |
| End of list, "No more results" | Reaching the last block of results | Not implemented: needs the block loading above | 02s |
| Saving an entry (Save loading, Cancel disabled) | Save entry with valid fields while the request runs | Not implemented: Save is instant | 04s |
| Error while saving | The save request fails | Not implemented: it would keep the drawer open with an error | 04s |
| Deleting an entry (loading) | Delete entry in the dialog while the request runs | Not implemented: delete is instant | 07s |
| Delete failed | The delete request fails | Not implemented: it would keep the dialog open with an error | 07s |
| Image failed to load | An image in the lightbox cannot be loaded | Not implemented: images are placeholders | 06s |

### Also not wired

These controls appear in the screens but have no action in the skeleton: **New logbook** and the rename and delete buttons in the Library, **Rename logbook** and **Delete logbook** in the logbook options menu, and the platform login behind **Dev login**.

### States that work from user actions

| State | How to trigger it | Sheet |
| --- | --- | --- |
| Library search without results | Search `badge printer` | 01s |
| Logbook search without results | In `PLA`, search `orcid`; it offers a search across all logbooks | 03s |
| Filters without results, with and without a search term | In `IWA`, check `Validation` and `Form layout`; add a search term | 03s |
| "Clear filters" and "Clear search" | From the empty states above | 03s |
| Empty logbook, dev and viewer copy | Open `EPMA 2027` as dev, then as viewer | 03s |
| Tag filter with more than 8 tags ("Search tags") | Open the tag filter in any logbook | 03s |
| Required field errors | In a new entry, Save with empty Title, Tags and link | 04s |
| Invalid link error | Enter a link that does not start with `https://` and Save | 04s |
| Image type and size errors | Drop or pick a file that is not JPG or PNG, or is over 5 MB | 04s |
| Discard changes | Edit a field, then Cancel, close or Esc | 05s |
| Entry saved notification | Save a valid entry | 04s |
| Entry deleted notification | Confirm Delete entry | 07s |
| Lightbox first and last image | Open an entry with images and use the arrows | 06s |
| Logbook not found | Open `logbook.html?lb=unknown` | none |

## Reusing the tokens and components elsewhere

`css/tokens.css`, `css/base.css`, `css/components.css` and `js/icons.js` do not depend on the pages. Copy them to another repository and link the three stylesheets in that order, with the Google Fonts link from any page. Page layout stays in `css/pages.css`.

## Publish to GitHub

The repository was created with `git init` and has no remote. To publish it:

1. Create an empty repository on GitHub, without a README or license.
2. Add it as the remote and push:

   ```bash
   git remote add origin https://github.com/<user-or-org>/<repository>.git
   git branch -M main
   git push -u origin main
   ```

3. Optional, to serve it as a site: in the repository go to **Settings > Pages**, choose **Deploy from a branch**, select `main` and the `/ (root)` folder, and save. The pages use relative paths, so they work under a project URL.
