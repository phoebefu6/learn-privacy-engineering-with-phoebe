# Agent brief - shared by every fan-out page of learn-privacy-engineering-with-phoebe

Internal build document, filled from course-builder `agent-brief.template.md` on 2026-11-01. Never link from an audience page.

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

## Read first, in this order

1. The template page for YOUR track. Copy its structure, classes, SVG grammar and quiz markup
   EXACTLY, including 4 options per quiz question:
   - Leader track: `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-privacy-engineering-with-phoebe/courses/a1-pseudonymous-is-not-anonymous.html`
   - Engineer track: `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-privacy-engineering-with-phoebe/courses/b1-finding-the-quasi-identifiers.html`
   - The bench page `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-privacy-engineering-with-phoebe/courses/b8-the-release-desk.html` shows how a page embeds the desk widget.
2. The source map: every computed number, per-session coverage, the seams:
   `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-privacy-engineering-with-phoebe/materials/official-course-map.md`
   and the verified facts it points to (rows P1 to P44, with tiers and EXACT wording traps):
   `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-privacy-engineering-with-phoebe/materials/source-facts.md`.
   Use ONLY their numbers; never invent a statistic; if a fact is missing, teach the uncertainty.
   Read the map's "Banned / exact strings" section twice.
3. The stylesheet `:root` block for the palette tokens: `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-privacy-engineering-with-phoebe/assets/style.css`

## Page skeleton (keep every component)

toolbar (crumb EXACTLY "learn-privacy-engineering-with-phoebe / Leader session N of 4" or "... / Engineer session N of 8",
the repo name linked to ../index.html, #toggle-all, #zoom-toggle) · masthead (eyebrow
"Learn Privacy Engineering with Phoebe · Leader session N of 4" or "· Engineer session N of 8", h1 with one
`<span class="accent">`, .sub, .chip-row with the level chip "🟢 Leader" / "🟡 Leader" / "🟠 Leader" or the Engineer
equivalent matching the session colour you are given, .agenda a1-a4) · main.wrap · section#intro (Part 0: kicker, .lede, .legend pills,
.callout.win "★ What you walk out with tonight") · 3 Parts, each `section.section#part-N` with
section-kicker (klabel "Part N · covers ...", h2, `.tag.concept "N min live"`), a `.lede`, ONE
figure, `details.card` accordions (summary: `.mode.live` or `.mode.self`, title, `.mini`,
`.caret ▶`), at least one `.callout.example` with `span.ex-pill` "Real world" on the page ·
section#demo-1 Build-along (kicker `.tag.demo "★ 22 min · everyone builds"`, .lede, ONE figure,
`.steps > .step`, each with a `.prompt-box.good` carrying a `span.label`; the widget div where your outline says)
· section#exercise Homework (ol, 4 items) · section#quiz (3 x `.quiz-q data-answer="0-based"`,
`p.qtext`, 4 `button.qopt` "A · ..." as in your template, `p.qwhy`; one `p.quiz-score` after the
last; vary the correct letter) · section#official, h2 EXACTLY "What this session teaches, and where it came from",
`.covered > .covered-row` (pill solid ✓ / light ◐ + name + note), then the `.mono` line EXACTLY
"Every fact on this page, and its verification tier, is recorded in the course's source map." ·
section.cheat#cheatsheet (h3 "Leader session N cheat sheet <span>· pin this</span>" or Engineer, .grid-2 of six
.cheat-item) · `.callout.next` with `.nx-pill` "Next session" · footer.pagefoot ·
scripts exactly as the template: `../assets/pe-data.js?v=1`, `../assets/pe-engine.js?v=1`, `../assets/pe-desk.js?v=1`, `../assets/app.js?v=1`
(keep all four even on a page without a widget; they are cheap and app.js must come last).

Head: the template's social meta block with this page's own title/description/url;
`<title>Leader session N · Title - learn privacy engineering with phoebe</title>`; `<link rel="stylesheet" href="../assets/style.css?v=2">`.
Nothing else external.

First `details.card` in the FIRST Part is `open`; no other. Sentence case headings. Warm
practitioner voice, concrete, never dry. Inside prompt-boxes escape `&` `<` `>`. 450 to 650 lines
is guidance about depth, never a target: never collapse whitespace, dissolve a list into a
paragraph, or drop a component to fit.

## Widgets (computed live on the real rows; never hand-write their outputs except numbers in the map)

- `<div data-pe="desk" id="UNIQUE" data-preset="p1|p2|p3|p4|p5|p6"></div>` Release Desk (presets = ladder rungs 1-6; break button = publish workclass undeclared).
- `<div data-pe="uniq" id="UNIQUE"></div>` uniqueness counter (QI checkboxes).
- `<div data-pe="dp" id="UNIQUE"></div>` Laplace histogram (epsilon 0.05-5, queries 1-20, clamp toggle). Default epsilon 1, 1 query.
- `<div data-pe="syn" id="UNIQUE"></div>` two toy synthetic generators.
Place the widget inside the build-along step that uses it, as b1 and b8 do. The widget prints the numbers in the map exactly (seeded); say "the widget prints", never "your numbers will differ".

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". State
  the professional norm directly with its reason. The two exact estate phrases above are the only
  self-references; "Engineer session 5" / "Leader session 2" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map / source-facts or is labelled constructed.
- Contested or missing evidence: teach the disagreement; never resolve what the literature has not
  (k thresholds, epsilon values, whether synthetic data is anonymous).
- Citations in the form the source facts give; anything marked SECONDARY or NOT FOUND is "reported" or omitted.
- NEVER "lottery" or "lotteries"; say the mechanism ("decided by row order", "arbitrary", "a random draw").
- Default to the English word. No Chinese terms are needed.
- Titles, widget ids and class names must not collide with siblings: do not use "Release Desk" outside b8; widget ids
  are `<session>-<kind>` e.g. `b3-desk`; do not reuse the session titles of other sessions as headings.
- Law stays with siblings: one-line pointer + link for anything about what the PDPA or GDPR requires. This is engineering, not legal advice.
- Brightwater people: Dr Hana Seow (research director), Ravi Menon (data engineer), Lim Su-Ann (DPO). Partners: three university teams.
  The rows are US census rows; Brightwater is a constructed Singapore trust that holds them. Never imply the rows are Singaporean.

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): ink `#23220E`, muted `#57553F`, accent `#7A7600`, accent-deep `#4A4700`,
accent-mid `#666200`, accent-soft `#D6D29A`, accent-50 `#F7F6E4`, faint `#D2D0BC`, hairline `#E8E7D8`, contrast plum `#8E2A4F`,
plum-ink `#5C1A33`, plum-50 `#FBEEF3`, paper `#FDFDF8` · `#FFFFFF` · universal reds
`#991B1B` `#FEF2F2` `#FCA5A5` only for a wrong-way panel. White text only on `#7A7600`, `#4A4700`, `#8E2A4F`, `#5C1A33`.
Text on `#F7F6E4` or hachure: ink, muted or `#4A4700` only (never `#7A7600` text on a tint: it fails contrast).

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" role="img" aria-label="the data, not the
  shape">` > `<defs>` + `<style>` + content, then `<figcaption>🔍 Click to zoom - takeaway</figcaption>`.
  Grow H, never W.
- Prefix unique per figure, used for every class and id: session id + letter (a2a, a2b, a2c, a2d; b5a ...).
- `<defs>` holds three things with the figure prefix P: a wobble filter `id="PSk"`
  (`feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="<int>"` +
  `feDisplacementMap scale="2.4" xChannelSelector="R" yChannelSelector="G"`, `x="-3%" y="-3%"
  width="106%" height="106%"`), a hachure pattern `id="PHc"` (7x7 userSpaceOnUse, rotate(-38), one
  accent line, opacity .5), an open arrowhead `id="PAr"` (path `M1 1 L9 5 L1 9`, fill none, ink stroke
  1.6). ALL shapes sit inside ONE `<g filter="url(#PSk)" fill="none" stroke="#23220E" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">`; rects carry a tiny rotation (-4 to 4 degrees for
  hand-placed items, under 1 for panels). Fills: white, accent-50, the hachure for "the pile" or "the
  data", and the contrast colour ONLY for the one thing the figure is about. Text over hachure needs a plain
  white rect behind it OUTSIDE the filtered group (see a1 and b1). One doodle anchor per
  figure, simple strokes, never a mascot. Text classes: `.PH` 800 12px ink heading · `.PL` 600 12px
  ink label · `.PS` 400 11px muted · `.PB` 800 11px plum-ink · `.PV` 800 16-20px accent-deep
  value · `.PW` 800 12px white on a fill · `.PA` 700 11px accent-deep axis caption · `.PN` 400 12px muted
  note. Hand-stacked items must not overlap as painted rects (the gate flags a pile).
- ALL `<text>` outside any filtered group, sans stack (`Inter, sans-serif`), never below 10.5px.
- Fit: max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width note under 110 chars; 40px between
  neighbouring point labels; bottom note 22px below the last row, H clears it by 8px. A text line must end at least 12px
  inside its box's right edge. When in doubt, shorten or split into two lines.
- Floor: one figure per Part plus one in the build-along (4 figures). Draw the MECHANISM (classes splitting, a join
  matching rows, noise added to bars, a budget being spent, a generator copying rows, a recipient boundary with controls),
  never a metaphor literally, never decoration.

## Voice and honesty

Every Part gets a real-world story from the source facts (Weld/GIC, AOL, Netflix, US Census budget, Stadler et al.) or a
labelled constructed Brightwater example ("Constructed Brightwater example"). The rows are real, say so.

## Cross-links (absolute URLs)

- PDPA and DNC: https://phoebefu6.github.io/learn-pdpa-dnc-with-phoebe/
- GDPR: https://phoebefu6.github.io/learn-gdpr-with-phoebe/
- Data Governance: https://phoebefu6.github.io/learn-data-governance-with-phoebe/
- Data Access Control: https://phoebefu6.github.io/learn-data-access-control-with-phoebe/
- Data Monetisation: https://phoebefu6.github.io/learn-data-monetisation-with-phoebe/
- Smart City: https://phoebefu6.github.io/learn-smart-city-with-phoebe/
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Footer chains and session titles

Leader: a1-pseudonymous-is-not-anonymous → a2-the-release-environment → a3-choosing-the-technique → a4-signing-off-a-release (last: "← Prev" and "Course home").
Engineer: b1-finding-the-quasi-identifiers → b2-generalise-and-suppress-to-k → b3-when-k-is-not-enough → b4-the-linkage-attack →
b5-noise-with-a-guarantee → b6-spending-a-privacy-budget → b7-synthetic-data-and-its-leaks → b8-the-release-desk.
Footer left: "Leader session N of 4 · learn-privacy-engineering-with-phoebe · by Phoebe Fu &nbsp;·&nbsp; 📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>"
Footer right: "<a href="PREV.html">← Prev: <title></a> &nbsp;·&nbsp; <a href="NEXT.html">Next: <title> →</a>".

Session titles (exact, sentence case, one accent span in h1): a1 Pseudonymous is not anonymous · a2 The release environment ·
a3 Choosing the technique · a4 Signing off a release · b1 Finding the quasi-identifiers · b2 Generalise and suppress to k ·
b3 When k is not enough · b4 The linkage attack · b5 Noise with a guarantee · b6 Spending a privacy budget ·
b7 Synthetic data and its leaks · b8 The Release Desk.

## Before you return

Grep your file for "—", "–", "lottery", "this course", "sequential composition", "650,000", "adopted differential privacy"
(each must be 0), confirm every `<details>` and `<section>` opens and closes, and that every number you used appears in the
map or source facts.
