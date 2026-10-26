/*
  Sample data. There is no backend: everything lives in memory and resets on reload.
  Dates are ISO strings; js/ui.js formats them as "24 Sep 2026".
  Authors are neutral placeholders; replace the entries of USERS to show real names.
*/
(function () {
  'use strict';

  var USERS = {
    'Developer A': { initials: 'DA', color: 'blue' },
    'Developer B': { initials: 'DB', color: 'teal' }
  };
  var CURRENT_USER = 'Developer A';

  /* The controlled tag list, alphabetical. Colours of Abstract Logic and Participant Logic are placeholders until the final list is confirmed. */
  var TAGS = [
    { name: 'Abstract Logic', color: 'grape' },
    { name: 'Base code modification', color: 'grape' },
    { name: 'Email template', color: 'indigo' },
    { name: 'Form layout', color: 'teal' },
    { name: 'Participant Logic', color: 'blue' },
    { name: 'Payment', color: 'cyan' },
    { name: 'Programme', color: 'gray' },
    { name: 'UI improvement', color: 'blue' },
    { name: 'Validation', color: 'orange' }
  ];

  var LANGUAGES = ['HTML', 'CSS', 'JavaScript', 'PHP', 'ASP (VBScript)', 'C#', 'SQL', 'JSON', 'Plain text'];

  /* tags: tags in use, in the order the Library table shows them. */
  var LOGBOOKS = [
    { name: 'IWA', tags: ['Form layout', 'Validation', 'UI improvement', 'Base code modification', 'Programme', 'Email template'] },
    { name: 'PLA', tags: ['Base code modification', 'Payment', 'Email template', 'Form layout', 'Validation'] },
    { name: 'EPMA 2026', tags: ['Payment', 'Programme', 'UI improvement', 'Form layout'] },
    { name: 'EVF 2026', tags: ['Email template', 'Form layout'] },
    { name: 'Stripe migration', tags: ['Payment', 'Base code modification'] },
    { name: 'Atlas Oncology Congress', tags: ['Validation', 'Programme'] },
    { name: 'Nordic Cardiology Forum', tags: ['UI improvement'] },
    { name: 'Global Hepatology Summit', tags: ['Form layout'] },
    { name: 'EPMA 2027', tags: [] }
  ];

  var A = 'Developer A';
  var B = 'Developer B';
  var HOST = 'https://pl.shocklogic.com/';

  var VAT_CODE = [
    '// Hide VAT number when the billing country is United Kingdom',
    "document.addEventListener('DOMContentLoaded', () => {",
    "  const country = document.querySelector('#billing_country');",
    "  const vatRow = document.querySelector('.field-vat-number');",
    '  if (!country || !vatRow) return;',
    '',
    '  const toggleVat = () => {',
    "    vatRow.hidden = country.value === 'GB';",
    '  };',
    '',
    "  country.addEventListener('change', toggleVat);",
    '  toggleVat();',
    '});'
  ].join('\n');

  /* id, logbook, title, tags, updated, updatedBy, path, notes, extras (created, process, code, images) */
  var RAW = [
    ['vat', 'IWA', 'Hide VAT number for UK billing addresses', ['Form layout', 'UI improvement'], '2026-09-24', A,
      'iwa2026/registration/step-3-billing',
      'Requested by the IWA finance team. UK delegates were entering company numbers in the VAT field, which broke invoice validation. The field stays visible for every other billing country.',
      {
        created: ['2026-09-22', B],
        process: '<ol><li>Add the script in <strong>Registration Settings &gt; Custom JS</strong> for the billing step.</li><li>Check that the country select keeps the id <code>billing_country</code> after any form rebuild.</li><li>Test with GB and one EU country before publishing.</li></ol>',
        code: { language: 'JavaScript', text: VAT_CODE },
        images: ['billing-uk.png', 'billing-es.png', 'invoice-preview.png']
      }],
    ['words', 'IWA', 'Word counter excludes the references block', ['Validation'], '2026-09-18', B,
      'iwa2026/abstracts/submit',
      'Authors were hitting the word limit because the references list was counted. The counter now skips the references block and updates while the author types.',
      {
        code: { language: 'JavaScript', text: 'const countWords = (el) => {\n  const clone = el.cloneNode(true);\n  clone.querySelectorAll(\'.references\').forEach((node) => node.remove());\n  return clone.textContent.trim().split(/\\s+/).filter(Boolean).length;\n};' }
      }],
    ['orcid', 'IWA', 'ORCID iD field in the author block', ['Base code modification', 'Form layout'], '2026-09-09', A,
      'iwa2026/abstracts/authors',
      'Adds an optional ORCID iD to each author. The field checks the format before the abstract can be submitted.',
      {
        process: '<ol><li>Enable the custom author fields for the abstract form.</li><li>Paste the snippet in the author block template.</li></ol>',
        code: { language: 'HTML', text: '<div class="field field-orcid">\n  <label for="orcid">ORCID iD</label>\n  <input id="orcid" name="orcid" type="text"\n    pattern="\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dX]"\n    placeholder="0000-0000-0000-0000">\n</div>' }
      }],
    ['session', 'IWA', 'Session colours by track in the online programme', ['UI improvement', 'Programme'], '2026-08-27', B,
      'iwa2026/programme',
      'Each track gets its own colour in the programme grid so attendees can scan the day by topic.',
      { code: { language: 'CSS', text: '.session[data-track="plenary"] { background: #e7f5ff; }\n.session[data-track="workshop"] { background: #fff4e6; }\n.session[data-track="poster"] { background: #f8f0fc; }' } }],
    ['ack', 'IWA', 'Acknowledgement email with invoice link', ['Email template'], '2026-08-14', A,
      'iwa2026/admin/emails/acknowledgement',
      'The acknowledgement email now includes a link to download the invoice once the payment is confirmed.', {}],
    ['score', 'IWA', 'Reviewer score summary rounds to whole numbers', ['Base code modification'], '2026-07-02', B,
      'iwa2026/reviewers/summary',
      'The score summary in the reviewer area showed decimals that confused the committee. Scores now round to whole numbers.',
      { code: { language: 'SQL', text: 'SELECT abstract_id, ROUND(AVG(score)) AS score\nFROM reviews\nGROUP BY abstract_id;' } }],

    ['pla-1', 'PLA', 'Invoice number prefix by registration type', ['Payment', 'Base code modification'], '2026-09-19', B,
      'pla/admin/invoices', 'Student invoices now start with STU and all other invoices with REG, so finance can split the export.',
      { code: { language: 'PHP', text: "$prefix = $registration->type === 'student' ? 'STU' : 'REG';\n$invoiceNumber = sprintf('%s-%05d', $prefix, $registration->id);" } }],
    ['pla-2', 'PLA', 'Confirmation email lists selected workshops', ['Email template'], '2026-09-12', A,
      'pla/admin/emails/confirmation', 'The confirmation email shows each workshop the participant selected, with its date and room.', {}],
    ['pla-3', 'PLA', 'Early bird deadline banner on the registration form', ['Form layout'], '2026-09-05', B,
      'pla/registration/step-1', 'A banner above the form shows how many days are left for the early bird fee and disappears after the deadline.', {}],
    ['pla-4', 'PLA', 'Passport number required for visa letters', ['Validation'], '2026-08-29', A,
      'pla/registration/visa-letter', 'The visa letter request cannot be sent without a passport number. The field accepts letters and digits only.', {}],
    ['pla-5', 'PLA', 'Group registration discount line in the order summary', ['Payment'], '2026-08-22', B,
      'pla/registration/summary', 'Shows the group discount as its own line in the order summary instead of lowering each ticket price.', {}],
    ['pla-6', 'PLA', 'Cancellation email with refund amount', ['Email template', 'Payment'], '2026-08-15', A,
      'pla/admin/emails/cancellation', 'The cancellation email states the refund amount and the expected refund date.', {}],
    ['pla-7', 'PLA', 'Dietary requirements field order', ['Form layout'], '2026-08-01', B,
      'pla/registration/step-2', 'Moves the dietary requirements field next to the accommodation choices, where participants expect it.', {}],
    ['pla-8', 'PLA', 'Duplicate email check on participant import', ['Validation', 'Base code modification'], '2026-07-24', A,
      'pla/admin/import', 'The participant import skips rows whose email already exists and lists them in the import report.', {}],
    ['pla-9', 'PLA', 'Payment reminder wording for bank transfers', ['Email template'], '2026-07-10', B,
      'pla/admin/emails/reminder', 'Reminder text for bank transfers now includes the reference the participant has to use.', {}],
    ['pla-10', 'PLA', 'Hide company field for student tickets', ['Form layout', 'Validation'], '2026-06-26', A,
      'pla/registration/step-1', 'Student tickets do not need a company, so the field is hidden and no longer required for them.', {}],
    ['pla-11', 'PLA', 'Receipt PDF footer with VAT registration', ['Payment', 'Base code modification'], '2026-06-12', B,
      'pla/admin/receipts', 'The receipt PDF footer now prints the VAT registration number of the organiser.', {}],

    ['epma-1', 'EPMA 2026', 'Stripe checkout redirect after abstract payment', ['Payment'], '2026-09-02', A,
      'epma2026/abstracts/payment',
      'Sends the submitter back to the abstract confirmation page after a successful Stripe checkout instead of the generic payment receipt.',
      { code: { language: 'JavaScript', text: "const params = new URLSearchParams(window.location.search);\nif (params.get('payment') === 'success') {\n  window.location.replace('/abstracts/confirmation');\n}" } }],
    ['epma-2', 'EPMA 2026', 'Programme grid highlights keynote sessions', ['Programme', 'UI improvement'], '2026-08-26', B,
      'epma2026/programme', 'Keynote sessions get a stronger title weight and a label in the programme grid.', {}],
    ['epma-3', 'EPMA 2026', 'Author affiliation autocomplete', ['Form layout'], '2026-08-19', A,
      'epma2026/abstracts/authors', 'Suggests affiliations already used in the submission so authors type them once.', {}],
    ['epma-4', 'EPMA 2026', 'Submission deadline countdown on the dashboard', ['UI improvement'], '2026-08-12', B,
      'epma2026/dashboard', 'Shows the days left to submit on the author dashboard and hides it after the deadline.', {}],
    ['epma-5', 'EPMA 2026', 'Session filters keep their state on reload', ['Programme'], '2026-08-05', A,
      'epma2026/programme', 'The selected programme filters are kept in the URL, so a reload or a shared link shows the same view.', {}],
    ['epma-6', 'EPMA 2026', 'Abstract topic list grouped by track', ['Form layout', 'Programme'], '2026-07-29', B,
      'epma2026/abstracts/submit', 'The topic select groups its options by track to make the list shorter to scan.', {}],
    ['epma-7', 'EPMA 2026', 'Payment status badge in the participant list', ['Payment', 'UI improvement'], '2026-07-22', A,
      'epma2026/admin/participants', 'Adds a paid, pending or refunded badge to each row of the participant list.', {}],
    ['epma-8', 'EPMA 2026', 'Poster session room labels', ['Programme'], '2026-07-15', B,
      'epma2026/programme/posters', 'Poster sessions show the room and the board number next to the title.', {}],
    ['epma-9', 'EPMA 2026', 'Sticky save button on long forms', ['UI improvement', 'Form layout'], '2026-07-01', A,
      'epma2026/abstracts/submit', 'Keeps the save button visible while the author scrolls through a long form.', {}],

    ['evf-1', 'EVF 2026', 'Receipt line items from Stripe metadata', ['Payment', 'Email template'], '2026-08-28', B,
      'evf2026/admin/receipts',
      'Builds the receipt table from the Stripe session metadata so workshop add-ons appear as separate lines.', {}],
    ['evf-2', 'EVF 2026', 'Badge name format for double surnames', ['Form layout'], '2026-08-21', A,
      'evf2026/registration/step-2', 'Splits the badge name into first name and surnames so double surnames print on one line.', {}],
    ['evf-3', 'EVF 2026', 'Reminder email 48 hours before the event', ['Email template'], '2026-08-14', B,
      'evf2026/admin/emails/reminder', 'Sends a short reminder with the venue, the schedule and the check-in QR code.', {}],
    ['evf-4', 'EVF 2026', 'Accompanying person fields', ['Form layout'], '2026-08-07', A,
      'evf2026/registration/step-2', 'Adds name and dietary needs for an accompanying person, shown only when the ticket allows one.', {}],
    ['evf-5', 'EVF 2026', 'Registration closed message with contact link', ['Form layout'], '2026-07-31', B,
      'evf2026/registration', 'After the closing date the form is replaced by a message with the organiser contact.', {}],
    ['evf-6', 'EVF 2026', 'Ticket summary email with calendar file', ['Email template'], '2026-07-17', A,
      'evf2026/admin/emails/tickets', 'Attaches a calendar file with the event dates to the ticket summary email.', {}],
    ['evf-7', 'EVF 2026', 'Shorter company field label', ['Form layout'], '2026-07-03', B,
      'evf2026/registration/step-1', 'The company label was wrapping to two lines in the narrow layout, so it now reads "Company".', {}],

    ['stripe-1', 'Stripe migration', 'Retry failed Stripe webhooks for registrations', ['Payment', 'Base code modification'], '2026-08-21', A,
      'stripe-migration/admin/webhooks',
      'Queues failed webhook calls and retries them three times before flagging the registration as pending payment.', {}],
    ['stripe-2', 'Stripe migration', 'Payment method icons in the checkout footer', ['Payment'], '2026-08-12', B,
      'stripe-migration/checkout', 'Shows the accepted card and wallet icons below the pay button.', {}],
    ['stripe-3', 'Stripe migration', 'Checkout error messages in plain language', ['Payment', 'Base code modification'], '2026-07-30', A,
      'stripe-migration/checkout', 'Maps the gateway error codes to short messages that tell the participant what to do next.', {}],
    ['stripe-4', 'Stripe migration', 'Order reference passed to the payment gateway', ['Base code modification'], '2026-07-18', B,
      'stripe-migration/checkout', 'Sends the registration order reference with every payment so finance can match it later.', {}],

    ['atlas-1', 'Atlas Oncology Congress', 'Abstract word limit per category', ['Validation'], '2026-07-30', B,
      'atlas/abstracts/submit', 'The word limit changes with the selected category and the counter shows the limit that applies.', {}],
    ['atlas-2', 'Atlas Oncology Congress', 'Programme day tabs with date labels', ['Programme'], '2026-07-22', A,
      'atlas/programme', 'Day tabs show the weekday and the date instead of "Day 1", "Day 2".', {}],
    ['atlas-3', 'Atlas Oncology Congress', 'Speaker conflict warning in the session builder', ['Programme', 'Validation'], '2026-07-14', B,
      'atlas/admin/sessions', 'Warns when a speaker is scheduled in two sessions that overlap.', {}],
    ['atlas-4', 'Atlas Oncology Congress', 'Required consent checkbox before submit', ['Validation'], '2026-07-02', A,
      'atlas/abstracts/submit', 'The abstract cannot be submitted until the author accepts the data consent.', {}],
    ['atlas-5', 'Atlas Oncology Congress', 'Session time zone shown next to start times', ['Programme'], '2026-06-20', B,
      'atlas/programme', 'Start times show the event time zone so remote attendees convert them correctly.', {}],

    ['nordic-1', 'Nordic Cardiology Forum', 'Larger click targets for programme filters', ['UI improvement'], '2026-06-12', A,
      'nordic/programme', 'Increases the size of the programme filter chips so they are easier to hit with a mouse.', {}],
    ['nordic-2', 'Nordic Cardiology Forum', 'Consistent button order on the review form', ['UI improvement'], '2026-05-28', B,
      'nordic/reviewers/form', 'Places Save draft before Submit review on every step of the form.', {}],
    ['nordic-3', 'Nordic Cardiology Forum', 'Page title shows the event name', ['UI improvement'], '2026-05-10', A,
      'nordic/registration', 'The browser tab title now starts with the event name.', {}],

    ['global-1', 'Global Hepatology Summit', 'Two column layout for the abstract form', ['Form layout'], '2026-04-03', B,
      'global/abstracts/submit', 'Short fields sit side by side on wide screens, which shortens the form.', {}],
    ['global-2', 'Global Hepatology Summit', 'Field help text under the label', ['Form layout'], '2026-03-20', A,
      'global/abstracts/submit', 'Moves the help text from below the field to just under the label.', {}]
  ];

  var entries = RAW.map(function (r) {
    var extra = r[8] || {};
    return {
      id: r[0],
      logbook: r[1],
      title: r[2],
      tags: r[3].slice(),
      link: HOST + r[6],
      notes: r[7],
      process: extra.process || '',
      code: extra.code || null,
      images: (extra.images || []).slice(),
      created: { date: (extra.created || [r[4], r[5]])[0], by: (extra.created || [r[4], r[5]])[1] },
      updated: { date: r[4], by: r[5] }
    };
  });

  var data = {
    users: USERS,
    currentUser: CURRENT_USER,
    tags: TAGS,
    languages: LANGUAGES,
    logbooks: LOGBOOKS,
    entries: entries,

    tagColor: function (name) {
      for (var i = 0; i < TAGS.length; i++) if (TAGS[i].name === name) return TAGS[i].color;
      return 'gray';
    },
    findLogbook: function (name) {
      for (var i = 0; i < LOGBOOKS.length; i++) if (LOGBOOKS[i].name === name) return LOGBOOKS[i];
      return null;
    },
    entriesOf: function (logbook) {
      return entries.filter(function (e) { return e.logbook === logbook; });
    },
    /* Entry count and last update of a logbook, taken from its entries. */
    summary: function (logbook) {
      var list = data.entriesOf(logbook);
      var last = null;
      list.forEach(function (e) { if (!last || e.updated.date > last.date) last = e.updated; });
      return { count: list.length, updated: last ? last.date : '', by: last ? last.by : '' };
    },
    findEntry: function (id) {
      for (var i = 0; i < entries.length; i++) if (entries[i].id === id) return entries[i];
      return null;
    },
    addEntry: function (entry) { entries.push(entry); return entry; },
    removeEntry: function (id) {
      var i = entries.findIndex(function (e) { return e.id === id; });
      if (i > -1) entries.splice(i, 1);
    }
  };

  window.CCL = window.CCL || {};
  window.CCL.data = data;
})();
