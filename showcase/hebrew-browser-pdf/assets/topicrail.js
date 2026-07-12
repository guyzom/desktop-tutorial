// Topic rail (ROADMAP C8): a paged.js Handler that injects a per-page progress
// rail — one dot per \part, the current one enlarged and labelled — into each
// page's top-center margin box. Loaded AFTER the paged.js polyfill.
//
// The current part is tracked as pages lay out in order: a page carries an
// element with [data-part] exactly when a part divider lands on it; that index
// then applies to the divider page and every following body page until the next
// part. Front-matter pages (before the first part) get no rail. Back-matter
// parts beyond the tracked topics (e.g. an exercises or appendix \part() added
// after topicRail(labels) was called with a shorter, curated topic list) ALSO
// get no rail — deliberately, not as a bug: current can legitimately be >=
// labels.length, and showing a stale/wrong dot enlarged would be worse than
// showing nothing (found empirically: this used to leave the rail in a fully
// unmatched state — no dot enlarged, no label — because the dots are only
// rendered for indices within `labels`).
//
// Needs: window.__railLabels = [..part labels..]; and @page { @top-center {
// content: ''; } } so paged.js creates the margin box.
(function () {
  if (typeof Paged === 'undefined') return;

  // Styles are INLINE: injected margin-box content doesn't reliably pick up the
  // document stylesheet, so the rail must be self-styling.
  //
  // The current-part label is laid out IN NORMAL FLOW (a second flex row under
  // the dots), not position:absolute. This content is injected via afterRendered
  // — i.e. AFTER paged.js has already finished its own layout/pagination pass —
  // and paged.js's own CSS puts `align-items:center` on the top-center margin
  // box; a position:absolute label there does not contribute to the dot row's
  // auto-height, so its visibility ends up depending on incidental per-page
  // box-sizing/timing rather than being guaranteed. Normal in-flow stacking
  // renders identically on every page regardless of that.
  function renderRail(labels, current) {
    const dots = labels.map((l, i) => {
      const cur = i === current;
      const size = cur ? 11 : 7;
      const dot = `display:inline-block;width:${size}px;height:${size}px;border-radius:50%;` +
        `background:${cur ? '#2f6fb0' : '#c3c8d0'};` +
        `${cur ? '' : 'margin-top:2px;'}`;
      return `<span style="${dot}"></span>`;
    }).join('');
    const label = labels[current] != null ? labels[current] : '';
    return `<div style="display:flex;flex-direction:column;align-items:center;direction:rtl">` +
      `<div style="display:flex;gap:9px;align-items:flex-end;justify-content:center">${dots}</div>` +
      `<div style="margin-top:3px;font:8px 'Frank Ruhl Libre',serif;color:#2f6fb0;white-space:nowrap">${label}</div>` +
    `</div>`;
  }

  class TopicRailHandler extends Paged.Handler {
    afterRendered(pages) {
      const labels = window.__railLabels || [];
      if (!labels.length) return;
      let current = -1;
      for (const page of pages) {
        const el = page.element || page;                 // .pagedjs_page
        if (!el || !el.querySelector) continue;
        const marker = el.querySelector('[data-part]');
        if (marker) current = parseInt(marker.getAttribute('data-part'), 10);
        if (current < 0) continue;                        // front matter: no rail
        if (current >= labels.length) continue;           // back matter beyond tracked topics: no rail
        const box = el.querySelector('.pagedjs_margin-top-center .pagedjs_margin-content');
        if (box) box.innerHTML = renderRail(labels, current);
      }
    }
  }
  Paged.registerHandlers(TopicRailHandler);
})();
