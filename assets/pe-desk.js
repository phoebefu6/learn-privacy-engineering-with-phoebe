/* Release Desk widgets. Mounts on any element with data-pe="desk|uniq|dp|syn".
   Every number is computed live by pe-engine.js on the real UCI Adult rows in pe-data.js. */
(function () {
  "use strict";
  if (!window.PE || !window.PE_DATA) return;
  var R = null;
  function rows() { return R || (R = PE.load(window.PE_DATA)); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function fmt(x) { return Number(x).toLocaleString("en-US"); }
  function metric(label, value, unit, kind) {
    return '<div class="mb-metric"><span class="mb-mlabel">' + label + '</span><span class="mb-mvalue">' + value +
      '</span><span class="mb-munit">' + unit + '</span><span class="mb-mkind is-' + (kind || "measured") + '">' +
      (kind === "heuristic" ? "rule of thumb" : "computed") + "</span></div>";
  }
  var SOURCE = '<p class="mb-hint">Real rows: UCI Adult, 32,561 people from the 1994 US Census extract (Becker and Kohavi, CC BY 4.0). ' +
    "Computed in your browser; nothing leaves the page. Brightwater is constructed.</p>";

  var QI_UI = [
    { q: "age", name: "Age", opts: ["exact", "5-year band", "10-year band", "20-year band", "removed"] },
    { q: "sex", name: "Sex", opts: ["exact", "removed"] },
    { q: "race", name: "Race", opts: ["exact", "White / not white", "removed"] },
    { q: "marital", name: "Marital status", opts: ["exact", "3 groups", "removed"] },
    { q: "edu", name: "Education", opts: ["exact (16)", "5 levels", "degree yes / no", "removed"] },
    { q: "country", name: "Country of birth", opts: ["exact (42)", "US / outside / unknown", "removed"] }
  ];
  var RAW = { age: 0, sex: 0, race: 0, marital: 0, edu: 0, country: 0 };
  var COARSE = { age: 2, sex: 0, race: 1, marital: 1, edu: 1, country: 1 };
  var PRESETS = [
    { id: "p1", name: "Pseudonymise only", note: "Names and IDs gone, six demographics exact", lv: RAW, k: 1, anti: true },
    { id: "p2", name: "Age in 10-year bands", note: "One column coarsened", lv: Object.assign({}, RAW, { age: 2 }), k: 1 },
    { id: "p3", name: "Coarsen five columns", note: "Bands and groups, nothing suppressed", lv: COARSE, k: 1 },
    { id: "p4", name: "Same, k = 5", note: "Suppress every class under 5", lv: COARSE, k: 5 },
    { id: "p5", name: "Same, k = 10", note: "Suppress every class under 10", lv: COARSE, k: 10 },
    { id: "p6", name: "Heavy, k = 10", note: "20-year age, degree yes / no", lv: Object.assign({}, COARSE, { age: 3, edu: 2 }), k: 10 }
  ];

  /* ---------------------------------------------------------------- desk */
  function mountDesk(el) {
    var st = { lv: Object.assign({}, RAW), k: 1, sens: "occ", forgot: false, preset: "p1" };
    var wrap = h("div", "mb-wrap");
    wrap.innerHTML = '<h4>Release Desk</h4><p class="mb-intro">Choose how coarse each column is released and the smallest class you will publish. ' +
      "The desk recomputes k, l and t, the share of rows that are unique, and a linkage attack by an outsider who knows six facts about 1,000 people in the file.</p>";
    var pre = h("div", "mb-presets");
    PRESETS.forEach(function (p) {
      var b = h("label", "mb-preset" + (p.anti ? " is-anti" : ""));
      b.innerHTML = '<input type="radio" name="' + el.id + '-pre" value="' + p.id + '"><span class="mb-pname">' + p.name +
        (p.anti ? ' <i class="mb-anti">the trap</i>' : "") + '</span><span class="mb-pnote">' + p.note + "</span>";
      b.querySelector("input").addEventListener("change", function () {
        st.lv = Object.assign({}, p.lv); st.k = p.k; st.preset = p.id; sync(); run();
      });
      pre.appendChild(b);
    });
    wrap.appendChild(pre);
    var ctls = h("div", "mb-ctls"), sels = {};
    QI_UI.forEach(function (u) {
      var lab = h("label", "mb-ctl", u.name + " ");
      var s = h("select");
      u.opts.forEach(function (o, i) { var op = h("option", null, o); op.value = i === u.opts.length - 1 ? PE.MAX_LEVEL[u.q] : i; s.appendChild(op); });
      s.addEventListener("change", function () { st.lv[u.q] = +s.value; st.preset = null; sync(); run(); });
      sels[u.q] = s; lab.appendChild(s); ctls.appendChild(lab);
    });
    wrap.appendChild(ctls);
    var ctl2 = h("div", "mb-ctls");
    var kl = h("label", "mb-ctl mb-range", 'Smallest class published (k) <input type="range" min="1" max="25" step="1"><b></b>');
    var kin = kl.querySelector("input"), kout = kl.querySelector("b");
    kin.addEventListener("input", function () { st.k = +kin.value; st.preset = null; sync(); run(); });
    var sl = h("label", "mb-ctl", 'Sensitive column <select><option value="occ">Occupation (15)</option><option value="income">Income band (2)</option></select>');
    var ssel = sl.querySelector("select");
    ssel.addEventListener("change", function () { st.sens = ssel.value; run(); });
    var br = h("button", "mb-break", "Break it: publish workclass too");
    br.type = "button";
    br.addEventListener("click", function () { st.forgot = !st.forgot; br.textContent = st.forgot ? "Undo: stop publishing workclass" : "Break it: publish workclass too"; run(); });
    ctl2.appendChild(kl); ctl2.appendChild(sl); ctl2.appendChild(br);
    wrap.appendChild(ctl2);
    var verdict = h("div", "mb-verdict"), mets = h("div", "mb-metrics"), tbl = h("div", "mk-tablewrap");
    wrap.appendChild(verdict); wrap.appendChild(mets); wrap.appendChild(tbl);
    wrap.appendChild(h("div", null, SOURCE));
    el.appendChild(wrap);

    function sync() {
      QI_UI.forEach(function (u) { sels[u.q].value = st.lv[u.q]; });
      kin.value = st.k; kout.textContent = st.k;
      pre.querySelectorAll("input").forEach(function (i) { i.checked = i.value === st.preset; i.parentNode.classList.toggle("is-on", i.checked); });
    }
    function run() {
      var r = PE.release(rows(), st.lv, st.k, st.sens, st.forgot);
      var bad = r.link_exact > 0 || r.attr_disclosed > 0, good = !bad && r.k >= 10 && r.l >= 3 && r.suppressed_pct < 5;
      verdict.className = "mb-verdict " + (bad ? "is-bad" : good ? "is-good" : "is-ok");
      verdict.textContent = bad
        ? "Not releasable: " + r.link_exact + " of 1,000 known people link to exactly one row, and " + r.attr_disclosed + " have their " + (st.sens === "occ" ? "occupation" : "income band") + " revealed by their class."
        : good ? "Passes the desk's bar: k " + r.k + ", l " + r.l + ", " + r.suppressed_pct + "% of rows suppressed. Context still decides."
          : "No single-row links, but the bar is not met: aim for k of at least 10 and l of at least 3 with under 5% suppressed.";
      mets.innerHTML =
        metric("Rows unique on the released columns", r.unique_pct + "%", fmt(r.unique_rows) + " of " + fmt(r.n) + " before suppression") +
        metric("k achieved", r.k, "smallest released class") +
        metric("l (distinct sensitive values)", r.l, "in the least diverse class") +
        metric("t (distance to overall mix)", r.t, "worst class, 0 = identical") +
        metric("Rows suppressed", r.suppressed_pct + "%", fmt(r.suppressed) + " rows withheld") +
        metric("Linkage: single-row matches", r.link_exact, "of 1,000 people the outsider knows") +
        metric("Linkage: expected re-identifications", r.link_expected, "sum of 1 / class size over the 1,000") +
        metric("Sensitive value revealed", r.attr_disclosed, "of 1,000, class has one value") +
        metric("Precision kept", Math.round(r.prec * 100) + "%", "1 - average generalisation height", "heuristic");
      tbl.innerHTML = smallest(st);
    }
    function smallest(st2) {
      var g = PE.gens(rows().D), Rr = rows(), n = Rr.age.length, qis = ["age", "sex", "race", "marital", "edu", "country"], m = new Map();
      for (var i = 0; i < n; i++) {
        var key = qis.map(function (q) { return g[q](Rr[q][i], st2.lv[q]); }).join(" · ") + (st2.forgot ? " · " + Rr.D.WORK[Rr.work[i]] : "");
        var e = m.get(key); if (!e) { e = { n: 0, s: {} }; m.set(key, e); }
        e.n++; e.s[Rr[st2.sens][i]] = 1;
      }
      var arr = []; m.forEach(function (v, key) { if (v.n >= st2.k) arr.push([key, v.n, Object.keys(v.s).length]); });
      arr.sort(function (a, b) { return a[1] - b[1] || a[2] - b[2] || (a[0] < b[0] ? -1 : 1); });
      var out = '<table class="mk-table"><tr><th>Smallest published classes, as the outsider sees them</th><th>Rows</th><th>Distinct ' + (st2.sens === "occ" ? "occupations" : "income bands") + "</th></tr>";
      arr.slice(0, 5).forEach(function (a) { out += "<tr><td>" + a[0] + '</td><td class="mk-n">' + a[1] + '</td><td class="mk-n">' + a[2] + "</td></tr>"; });
      return out + "</table>";
    }
    var init = el.getAttribute("data-preset");
    var p0 = PRESETS.filter(function (p) { return p.id === init; })[0] || PRESETS[0];
    st.lv = Object.assign({}, p0.lv); st.k = p0.k; st.preset = p0.id;
    sync(); run();
  }

  /* ---------------------------------------------------------------- uniqueness only */
  function mountUniq(el) {
    var on = { age: true, sex: true, race: false, marital: false, edu: false, country: false };
    var wrap = h("div", "mb-wrap");
    wrap.innerHTML = "<h4>How many people are alone?</h4><p class=\"mb-intro\">Tick the columns an outsider could know about someone. The counter shows the share of the 32,561 real rows that no other row shares on those columns.</p>";
    var ctls = h("div", "mb-ctls");
    QI_UI.forEach(function (u) {
      var lab = h("label", "mb-ctl", '<input type="checkbox"> ' + u.name);
      var cb = lab.querySelector("input"); cb.checked = on[u.q];
      cb.addEventListener("change", function () { on[u.q] = cb.checked; run(); });
      ctls.appendChild(lab);
    });
    var mets = h("div", "mb-metrics");
    wrap.appendChild(ctls); wrap.appendChild(mets); wrap.appendChild(h("div", null, SOURCE));
    el.appendChild(wrap);
    function run() {
      var lv = {}; Object.keys(on).forEach(function (q) { if (on[q]) lv[q] = 0; });
      if (!Object.keys(lv).length) { mets.innerHTML = metric("Rows unique", "0%", "no column ticked"); return; }
      var r = PE.release(rows(), lv, 1, "occ", false);
      mets.innerHTML = metric("Rows unique on these columns", r.unique_pct + "%", fmt(r.unique_rows) + " of " + fmt(r.n)) +
        metric("Distinct combinations", fmt(r.classes), "equivalence classes") +
        metric("Single-row matches", r.link_exact, "of 1,000 people the outsider knows");
    }
    run();
  }

  /* ---------------------------------------------------------------- differential privacy */
  var EPS = [0.05, 0.1, 0.2, 0.5, 1, 2, 5];
  function mountDp(el) {
    var st = { ei: 4, q: 1, clamp: false };
    var wrap = h("div", "mb-wrap");
    wrap.innerHTML = "<h4>Noise with a guarantee</h4><p class=\"mb-intro\">The released table: how many people earn over 50K at each of 16 education levels. Each count gets Laplace noise with scale 1 / (epsilon per query). Split the budget over more queries and every answer gets noisier.</p>";
    var ctls = h("div", "mb-ctls");
    var el1 = h("label", "mb-ctl mb-range", 'Total epsilon <input type="range" min="0" max="6" step="1"><b></b>');
    var ein = el1.querySelector("input"), eout = el1.querySelector("b");
    var el2 = h("label", "mb-ctl mb-range", 'Queries sharing it <input type="range" min="1" max="20" step="1"><b></b>');
    var qin = el2.querySelector("input"), qout = el2.querySelector("b");
    var el3 = h("label", "mb-ctl", '<input type="checkbox"> Round and clamp at 0 (post-processing)');
    var cin = el3.querySelector("input");
    ein.value = st.ei; qin.value = st.q;
    ein.addEventListener("input", function () { st.ei = +ein.value; run(); });
    qin.addEventListener("input", function () { st.q = +qin.value; run(); });
    cin.addEventListener("change", function () { st.clamp = cin.checked; run(); });
    ctls.appendChild(el1); ctls.appendChild(el2); ctls.appendChild(el3);
    var mets = h("div", "mb-metrics"), stage = h("div", "mb-stage");
    wrap.appendChild(ctls); wrap.appendChild(mets); wrap.appendChild(stage); wrap.appendChild(h("div", null, SOURCE));
    el.appendChild(wrap);
    function run() {
      var eps = EPS[st.ei]; eout.textContent = eps; qout.textContent = st.q;
      var r = PE.dpHistogram(rows(), eps, st.q);
      var shown = r.noisy.map(function (x) { return st.clamp ? Math.max(0, Math.round(x)) : x; });
      var mae = shown.reduce(function (a, x, i) { return a + Math.abs(x - r.true[i]); }, 0) / shown.length;
      mets.innerHTML = metric("Epsilon per query", +(eps / st.q).toFixed(4), "total " + eps + " over " + st.q) +
        metric("Noise scale b", r.scale, "1 / epsilon per query") +
        metric("Mean absolute error", mae.toFixed(2), "people per count, this draw") +
        metric(r.smallest_bin + " (true " + r.smallest_true + ")", shown[r.true.indexOf(r.smallest_true)], "released value");
      stage.innerHTML = bars(r.true, shown);
    }
    function bars(t, nz) {
      var W = 860, H = 250, top = 20, base = 200, mx = Math.max.apply(null, t.concat(nz)) || 1, bw = 48, out = [];
      out.push('<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Sixteen pairs of bars: true count of over-50K earners per education level, and the noisy released count.">');
      out.push('<line x1="20" y1="' + base + '" x2="' + (W - 20) + '" y2="' + base + '" stroke="#D2D0BC"/>');
      for (var i = 0; i < t.length; i++) {
        var x = 30 + i * 51.5, ht = (t[i] / mx) * (base - top), hn = (Math.max(0, nz[i]) / mx) * (base - top);
        out.push('<rect x="' + x + '" y="' + (base - ht) + '" width="' + (bw / 2 - 2) + '" height="' + ht + '" fill="#D6D29A"/>');
        out.push('<rect x="' + (x + bw / 2) + '" y="' + (base - hn) + '" width="' + (bw / 2 - 2) + '" height="' + hn + '" fill="#7A7600"/>');
        if (nz[i] < 0) out.push('<text class="mb-lab" x="' + (x + bw / 2) + '" y="' + (base + 14) + '" fill="#8E2A4F">' + Math.round(nz[i]) + "</text>");
        out.push('<text class="mb-lab" x="' + (x + 2) + '" y="' + (base + 34) + '" fill="#57553F">' + (i + 1) + "</text>");
      }
      out.push('<text class="mb-lab" x="20" y="14" fill="#57553F">pale: true count · olive: released count · numbers below 0 in plum · 1 = Preschool, 16 = Doctorate</text>');
      out.push("</svg>");
      return out.join("");
    }
    run();
  }

  /* ---------------------------------------------------------------- synthetic */
  function mountSyn(el) {
    var wrap = h("div", "mb-wrap");
    wrap.innerHTML = "<h4>Synthetic data: what did it copy?</h4><p class=\"mb-intro\">Two toy generators each make 32,561 synthetic rows. One draws every column independently; the other memorised its training rows and nudges the age. Compare how many real people who are unique in the data appear, exactly, in the synthetic file, and whether the pay gap between men and women survives.</p>";
    var pre = h("div", "mb-presets"), mets = h("div", "mb-metrics");
    [["marginals", "Independent columns", "each column drawn on its own"], ["overfit", "Memorising generator", "copies rows, jitters age"]].forEach(function (m, i) {
      var b = h("label", "mb-preset" + (i ? " is-anti" : ""));
      b.innerHTML = '<input type="radio" name="' + el.id + '-syn"><span class="mb-pname">' + m[1] + (i ? ' <i class="mb-anti">the trap</i>' : "") + '</span><span class="mb-pnote">' + m[2] + "</span>";
      b.querySelector("input").addEventListener("change", function () {
        pre.querySelectorAll(".mb-preset").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on"); run(m[0]);
      });
      pre.appendChild(b);
    });
    wrap.appendChild(pre); wrap.appendChild(mets); wrap.appendChild(h("div", null, SOURCE));
    el.appendChild(wrap);
    function run(mode) {
      mets.innerHTML = "<p class=\"mb-hint\">Generating 32,561 rows...</p>";
      setTimeout(function () {
        var r = PE.synthesise(rows(), mode);
        mets.innerHTML = metric("Synthetic rows identical to a real row", r.exact_copies_pct + "%", fmt(r.exact_copies) + " of 32,561, on eight columns") +
          metric("Unique real people reproduced", fmt(r.unique_reproduced), "of " + fmt(r.real_unique) + " unique real rows") +
          metric("Pay gap, real rows", r.gap_real + " pts", "men minus women, share over 50K") +
          metric("Pay gap, synthetic rows", r.gap_syn + " pts", "what a researcher would find");
      }, 20);
    }
    pre.querySelector("input").checked = true; pre.firstChild.classList.add("is-on"); run("marginals");
  }

  var M = { desk: mountDesk, uniq: mountUniq, dp: mountDp, syn: mountSyn };
  document.querySelectorAll("[data-pe]").forEach(function (el, i) {
    if (!el.id) el.id = "pe-w" + i;
    var f = M[el.getAttribute("data-pe")];
    if (f) f(el);
  });
})();
