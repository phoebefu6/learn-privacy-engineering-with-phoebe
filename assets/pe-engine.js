/* Release Desk engine: k-anonymity, l-diversity, t-closeness, a linkage attack, the Laplace
   mechanism and a synthetic-data check, computed on the real UCI Adult rows in pe-data.js.
   Mirrors materials/pe_reference.py; materials/run-ladder.js checks the two agree. */
(function (root) {
  "use strict";

  function decode(s, off) {
    var out = new Array(s.length);
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      out[i] = c - 48 - (c > 92 ? 1 : 0) + (off || 0);
    }
    return out;
  }

  function load(D) {
    return {
      age: decode(D.c_age, 17), sex: decode(D.c_sex), race: decode(D.c_race),
      marital: decode(D.c_marital), edu: decode(D.c_edu), country: decode(D.c_country),
      work: decode(D.c_work), occ: decode(D.c_occ), income: decode(D.c_income), D: D
    };
  }

  var MAX_LEVEL = { age: 4, sex: 1, race: 2, marital: 2, edu: 3, country: 2, work: 2 };
  var QI_ORDER = ["age", "sex", "race", "marital", "edu", "country", "work"];

  function gens(D) {
    return {
      age: function (v, lv) {
        if (lv === 0) return String(v);
        if (lv === 1) { var b = Math.floor(v / 5) * 5; return b + "-" + (b + 4); }
        if (lv === 2) { var b2 = Math.floor(v / 10) * 10; return b2 + "-" + (b2 + 9); }
        if (lv === 3) { var b3 = Math.floor((v - 17) / 20) * 20 + 17; return b3 + "-" + (b3 + 19); }
        return "*";
      },
      sex: function (v, lv) { return lv === 0 ? D.SEX[v] : "*"; },
      race: function (v, lv) {
        if (lv === 0) return D.RACE[v];
        if (lv === 1) return v === 0 ? "White" : "Not white";
        return "*";
      },
      marital: function (v, lv) {
        if (lv === 0) return D.MARITAL[v];
        if (lv === 1) { if (v === 0 || v === 5 || v === 6) return "Married"; if (v === 1) return "Never married"; return "Previously married"; }
        return "*";
      },
      edu: function (v, lv) {
        if (lv === 0) return D.EDU[v];
        if (lv === 1) { if (v <= 7) return "No high school diploma"; if (v === 8) return "High school"; if (v <= 11) return "Some college or associate"; if (v === 12) return "Bachelors"; return "Postgraduate"; }
        if (lv === 2) return v >= 12 ? "Degree" : "No degree";
        return "*";
      },
      country: function (v, lv) {
        if (lv === 0) return D.countries[v];
        if (lv === 1) { if (D.countries[v] === "United-States") return "United States"; if (D.countries[v] === "?") return "Unknown"; return "Outside US"; }
        return "*";
      },
      work: function (v, lv) {
        if (lv === 0) return D.WORK[v];
        if (lv === 1) { if (v === 0) return "Private"; if (v === 1 || v === 2) return "Self-employed"; if (v >= 3 && v <= 5) return "Government"; return "Other or unknown"; }
        return "*";
      }
    };
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
      t = (t ^ ((t + (Math.imul(t ^ (t >>> 7), t | 61) >>> 0)) >>> 0)) >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var targetCache = {};
  function attackTargets(n) {
    if (targetCache[n]) return targetCache[n];
    var rnd = mulberry32(20261101), seen = {}, out = [];
    while (out.length < 1000) {
      var i = Math.floor(rnd() * n);
      if (!seen[i]) { seen[i] = 1; out.push(i); }
    }
    return (targetCache[n] = out);
  }

  function round(x, d) { var p = Math.pow(10, d); return Math.round(x * p) / p; }
  function distinct(arr) { var c = 0; for (var j = 0; j < arr.length; j++) if (arr[j]) c++; return c; }

  /* levels: {qi: level}; a QI absent from levels is not released. Classes under k are
     suppressed. forgotWork: workclass is published exact but never declared a QI. */
  function release(R, levels, k, sensitive, forgotWork) {
    var g = gens(R.D), n = R.age.length, qis = QI_ORDER.filter(function (q) { return q in levels; });
    var keys = new Array(n), size = new Map();
    for (var i = 0; i < n; i++) {
      var parts = [];
      for (var q = 0; q < qis.length; q++) parts.push(g[qis[q]](R[qis[q]][i], levels[qis[q]]));
      var key = parts.join("|");
      keys[i] = key;
      size.set(key, (size.get(key) || 0) + 1);
    }
    var uniqueRows = 0, kept = new Array(n), keptN = 0;
    for (i = 0; i < n; i++) {
      var c = size.get(keys[i]);
      if (c === 1) uniqueRows++;
      kept[i] = c >= k;
      if (kept[i]) keptN++;
    }
    var kAch = 0;
    size.forEach(function (c) { if (c >= k && (kAch === 0 || c < kAch)) kAch = c; });
    var sens = R[sensitive], ncat = sensitive === "occ" ? R.D.OCC.length : R.D.INCOME.length;
    var glob = new Array(ncat).fill(0), per = new Map();
    for (i = 0; i < n; i++) {
      if (!kept[i]) continue;
      var d = per.get(keys[i]);
      if (!d) { d = new Array(ncat).fill(0); per.set(keys[i], d); }
      d[sens[i]]++;
      glob[sens[i]]++;
    }
    var lMin = 0, homog = 0, tMax = 0, first = true;
    per.forEach(function (d) {
      var dc = distinct(d), s = 0;
      for (var j = 0; j < ncat; j++) s += d[j];
      if (first || dc < lMin) lMin = dc;
      first = false;
      if (dc === 1) homog += s;
      var t = 0;
      for (j = 0; j < ncat; j++) t += Math.abs(d[j] / s - glob[j] / keptN);
      t *= 0.5;
      if (t > tMax) tMax = t;
    });
    var prec = qis.length ? 1 - qis.reduce(function (a, q2) { return a + levels[q2] / MAX_LEVEL[q2]; }, 0) / qis.length : 0;

    var akeys = keys, asize = size, aper = per;
    if (forgotWork) {
      akeys = new Array(n); asize = new Map(); aper = new Map();
      for (i = 0; i < n; i++) {
        akeys[i] = keys[i] + "|" + R.D.WORK[R.work[i]];
        if (!kept[i]) continue;
        asize.set(akeys[i], (asize.get(akeys[i]) || 0) + 1);
        var ad = aper.get(akeys[i]);
        if (!ad) { ad = new Array(ncat).fill(0); aper.set(akeys[i], ad); }
        ad[sens[i]]++;
      }
    }
    var exact = 0, expected = 0, attr = 0, targets = attackTargets(n);
    for (var ti = 0; ti < targets.length; ti++) {
      var t0 = targets[ti];
      if (!kept[t0]) continue;
      var cs = asize.get(akeys[t0]);
      expected += 1 / cs;
      if (cs === 1) exact++;
      if (distinct(aper.get(akeys[t0])) === 1) attr++;
    }
    return {
      n: n, classes: size.size, unique_rows: uniqueRows, unique_pct: round(100 * uniqueRows / n, 2),
      suppressed: n - keptN, suppressed_pct: round(100 * (n - keptN) / n, 2), k: kAch, l: lMin,
      t: round(tMax, 4), homog_rows: homog, prec: round(prec, 4), link_exact: exact,
      link_expected: round(expected, 1), attr_disclosed: attr
    };
  }

  function laplace(rnd, scale) {
    var u = rnd() - 0.5;
    return -scale * (u < 0 ? -1 : 1) * Math.log(1 - 2 * Math.abs(u));
  }

  function dpHistogram(R, epsilon, queries, seed) {
    queries = queries || 1;
    var nb = R.D.EDU.length, truth = new Array(nb).fill(0);
    for (var i = 0; i < R.edu.length; i++) if (R.income[i] === 1) truth[R.edu[i]]++;
    var rnd = mulberry32(seed === undefined ? 7 : seed), scale = 1 / (epsilon / queries);
    var noisy = truth.map(function (t) { return t + laplace(rnd, scale); });
    var mae = 0, sm = 0;
    for (i = 0; i < nb; i++) { mae += Math.abs(noisy[i] - truth[i]); if (truth[i] < truth[sm]) sm = i; }
    return {
      true: truth, noisy: noisy.map(function (x) { return round(x, 1); }), scale: round(scale, 3),
      mae: round(mae / nb, 2), smallest_bin: R.D.EDU[sm], smallest_true: truth[sm],
      smallest_noisy: round(noisy[sm], 1)
    };
  }

  var SYN_COLS = ["age", "sex", "race", "marital", "edu", "country", "occ", "income"];
  function synthesise(R, mode, seed) {
    var n = R.age.length, rnd = mulberry32(seed === undefined ? 11 : seed), syn = {};
    SYN_COLS.forEach(function (c) { syn[c] = new Array(n); });
    var i, c;
    if (mode === "marginals") {
      for (c = 0; c < SYN_COLS.length; c++) {
        var src = R[SYN_COLS[c]], dst = syn[SYN_COLS[c]];
        for (i = 0; i < n; i++) dst[i] = src[Math.floor(rnd() * n)];
      }
    } else {
      for (i = 0; i < n; i++) {
        var j = Math.floor(rnd() * n);
        for (c = 0; c < SYN_COLS.length; c++) syn[SYN_COLS[c]][i] = R[SYN_COLS[c]][j];
        if (rnd() < 0.5) syn.age[i] = Math.min(90, Math.max(17, syn.age[i] + Math.floor(rnd() * 5) - 2));
      }
    }
    function keyOf(d, r) { var p = []; for (var q = 0; q < SYN_COLS.length; q++) p.push(d[SYN_COLS[q]][r]); return p.join("|"); }
    var realCount = new Map();
    for (i = 0; i < n; i++) { var rk = keyOf(R, i); realCount.set(rk, (realCount.get(rk) || 0) + 1); }
    var synSet = new Set(), copies = 0;
    for (i = 0; i < n; i++) { var sk = keyOf(syn, i); synSet.add(sk); if (realCount.has(sk)) copies++; }
    var realUnique = 0, reproduced = 0;
    realCount.forEach(function (cnt, key) { if (cnt === 1) { realUnique++; if (synSet.has(key)) reproduced++; } });
    function gap(d) {
      var m = 0, mn = 0, f = 0, fn = 0;
      for (var r = 0; r < n; r++) { if (d.sex[r] === 0) { m += d.income[r]; mn++; } else { f += d.income[r]; fn++; } }
      return round(100 * (m / mn - f / fn), 1);
    }
    return {
      mode: mode, exact_copies: copies, exact_copies_pct: round(100 * copies / n, 2), real_unique: realUnique,
      unique_reproduced: reproduced, gap_real: gap(R), gap_syn: gap(syn)
    };
  }

  var api = { load: load, release: release, dpHistogram: dpHistogram, synthesise: synthesise, MAX_LEVEL: MAX_LEVEL, gens: gens };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PE = api;
})(typeof window !== "undefined" ? window : this);
