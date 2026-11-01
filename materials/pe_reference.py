"""Reference engine for the Release Desk (Python). The browser engine (assets/pe-engine.js)
must agree with this file to the row. Run from this folder:

    python3 pe_reference.py            # writes ../assets/pe-data.js and canon-py.json

Data: UCI Adult, adult.data (32,561 rows), Becker and Kohavi 1996, CC BY 4.0.
"""
from __future__ import annotations

import json
import math
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
ROWS_FILE = HERE / "data" / "adult.data"

# ---------------------------------------------------------------- vocabularies
SEX = ["Male", "Female"]
RACE = ["White", "Black", "Asian-Pac-Islander", "Amer-Indian-Eskimo", "Other"]
MARITAL = ["Married-civ-spouse", "Never-married", "Divorced", "Separated", "Widowed",
           "Married-spouse-absent", "Married-AF-spouse"]
EDU = ["Preschool", "1st-4th", "5th-6th", "7th-8th", "9th", "10th", "11th", "12th", "HS-grad",
       "Some-college", "Assoc-voc", "Assoc-acdm", "Bachelors", "Masters", "Prof-school", "Doctorate"]
WORK = ["Private", "Self-emp-not-inc", "Self-emp-inc", "Federal-gov", "Local-gov", "State-gov",
        "Without-pay", "Never-worked", "?"]
OCC = ["Prof-specialty", "Craft-repair", "Exec-managerial", "Adm-clerical", "Sales", "Other-service",
       "Machine-op-inspct", "Transport-moving", "Handlers-cleaners", "Farming-fishing",
       "Tech-support", "Protective-serv", "Priv-house-serv", "Armed-Forces", "?"]
INCOME = ["<=50K", ">50K"]


def load():
    rows = []
    countries: list[str] = []
    for line in ROWS_FILE.read_text().splitlines():
        p = [x.strip() for x in line.split(",")]
        if len(p) < 15:
            continue
        if p[13] not in countries:
            countries.append(p[13])
        rows.append(p)
    # stable country order: United-States first, then alphabetical, "?" last
    countries = ["United-States"] + sorted(c for c in countries if c not in ("United-States", "?")) + ["?"]
    cols = {
        "age": [int(p[0]) for p in rows],
        "sex": [SEX.index(p[9]) for p in rows],
        "race": [RACE.index(p[8]) for p in rows],
        "marital": [MARITAL.index(p[5]) for p in rows],
        "edu": [EDU.index(p[3]) for p in rows],
        "country": [countries.index(p[13]) for p in rows],
        "work": [WORK.index(p[1]) for p in rows],
        "occ": [OCC.index(p[6]) for p in rows],
        "income": [INCOME.index(p[14]) for p in rows],
    }
    return cols, countries


# ---------------------------------------------------------------- hierarchies
# Every generaliser maps (value, level) -> a label. The top level is always "*".
MAX_LEVEL = {"age": 4, "sex": 1, "race": 2, "marital": 2, "edu": 3, "country": 2, "work": 2}


def g_age(v, lv):
    if lv == 0:
        return str(v)
    if lv == 1:
        b = v // 5 * 5
        return f"{b}-{b + 4}"
    if lv == 2:
        b = v // 10 * 10
        return f"{b}-{b + 9}"
    if lv == 3:
        b = (v - 17) // 20 * 20 + 17
        return f"{b}-{b + 19}"
    return "*"


def g_sex(v, lv):
    return SEX[v] if lv == 0 else "*"


def g_race(v, lv):
    if lv == 0:
        return RACE[v]
    if lv == 1:
        return "White" if v == 0 else "Not white"
    return "*"


def g_marital(v, lv):
    if lv == 0:
        return MARITAL[v]
    if lv == 1:
        if v in (0, 5, 6):
            return "Married"
        if v == 1:
            return "Never married"
        return "Previously married"
    return "*"


def g_edu(v, lv):
    if lv == 0:
        return EDU[v]
    if lv == 1:
        if v <= 7:
            return "No high school diploma"
        if v == 8:
            return "High school"
        if v <= 11:
            return "Some college or associate"
        if v == 12:
            return "Bachelors"
        return "Postgraduate"
    if lv == 2:
        return "Degree" if v >= 12 else "No degree"
    return "*"


def make_g_country(countries):
    def g(v, lv):
        if lv == 0:
            return countries[v]
        if lv == 1:
            if countries[v] == "United-States":
                return "United States"
            if countries[v] == "?":
                return "Unknown"
            return "Outside US"
        return "*"
    return g


def g_work(v, lv):
    if lv == 0:
        return WORK[v]
    if lv == 1:
        if v == 0:
            return "Private"
        if v in (1, 2):
            return "Self-employed"
        if v in (3, 4, 5):
            return "Government"
        return "Other or unknown"
    return "*"


# ---------------------------------------------------------------- release
def release(cols, countries, levels: dict, k: int, sensitive: str = "occ", forgot_work: bool = False):
    """levels: {qi: level}; a QI absent from levels is not released (dropped).
    Classes smaller than k are suppressed (whole records removed).
    forgot_work: workclass is also published, exact, but was never declared a quasi-identifier,
    so k and suppression ignore it while the attacker joins on it (the break button)."""
    gens = {"age": g_age, "sex": g_sex, "race": g_race, "marital": g_marital, "edu": g_edu,
            "country": make_g_country(countries), "work": g_work}
    n = len(cols["age"])
    qis = [q for q in ["age", "sex", "race", "marital", "edu", "country", "work"] if q in levels]
    keys = []
    for i in range(n):
        keys.append("|".join(gens[q](cols[q][i], levels[q]) for q in qis))
    size = Counter(keys)
    unique_rows = sum(1 for key in keys if size[key] == 1)
    kept = [size[keys[i]] >= k for i in range(n)]
    suppressed = n - sum(kept)
    kept_sizes = [c for c in size.values() if c >= k]
    k_achieved = min(kept_sizes) if kept_sizes else 0
    # sensitive distribution per kept class
    sens = cols[sensitive]
    ncat = len(OCC) if sensitive == "occ" else len(INCOME)
    glob = [0] * ncat
    per = defaultdict(lambda: [0] * ncat)
    for i in range(n):
        if kept[i]:
            per[keys[i]][sens[i]] += 1
            glob[sens[i]] += 1
    kept_n = sum(glob)
    l_min = min((sum(1 for x in d if x) for d in per.values()), default=0)
    homog_rows = sum(sum(d) for d in per.values() if sum(1 for x in d if x) == 1)
    if kept_n:
        gp = [x / kept_n for x in glob]
        t_max = 0.0
        for d in per.values():
            s = sum(d)
            # equal ground distance: EMD = half the L1 distance (variational distance)
            t = 0.5 * sum(abs(d[j] / s - gp[j]) for j in range(ncat))
            t_max = max(t_max, t)
    else:
        t_max = 0.0
    # precision (Sweeney's Prec): 1 - mean normalised generalisation height over released QIs
    prec = 1 - (sum(levels[q] / MAX_LEVEL[q] for q in qis) / len(qis)) if qis else 0.0
    # linkage attack: 1,000 seeded targets, attacker knows age, sex, race, marital, edu, country
    # (+ workclass when attacker_knows_work). A target links to the released class with its own
    # generalised key; if work is not released, the attacker cannot use it.
    targets = attack_targets(n)
    exact_hits = 0
    expected = 0.0
    attr_disclosed = 0
    if forgot_work:
        akeys = [keys[i] + "|" + WORK[cols["work"][i]] for i in range(n)]
        asize = Counter(akeys[i] for i in range(n) if kept[i])
        aper = defaultdict(lambda: [0] * ncat)
        for i in range(n):
            if kept[i]:
                aper[akeys[i]][sens[i]] += 1
    else:
        akeys, asize, aper = keys, {kk: c for kk, c in size.items() if c >= k}, per
    for t in targets:
        if not kept[t]:
            continue
        key = akeys[t]
        c = asize[key]
        expected += 1 / c
        if c == 1:
            exact_hits += 1
        d = aper[key]
        if sum(1 for x in d if x) == 1:
            attr_disclosed += 1
    return {
        "n": n,
        "classes": len(size),
        "unique_rows": unique_rows,
        "unique_pct": round(100 * unique_rows / n, 2),
        "suppressed": suppressed,
        "suppressed_pct": round(100 * suppressed / n, 2),
        "k": k_achieved,
        "l": l_min,
        "t": round(t_max, 4),
        "homog_rows": homog_rows,
        "prec": round(prec, 4),
        "link_exact": exact_hits,
        "link_expected": round(expected, 1),
        "attr_disclosed": attr_disclosed,
    }


def mulberry32(seed):
    state = [seed & 0xFFFFFFFF]

    def rnd():
        state[0] = (state[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = state[0]
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return rnd


def attack_targets(n, count=1000, seed=20261101):
    rnd = mulberry32(seed)
    seen, out = set(), []
    while len(out) < count:
        i = int(rnd() * n)
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out


# ---------------------------------------------------------------- differential privacy
def laplace(rnd, scale):
    u = rnd() - 0.5
    return -scale * math.copysign(1, u) * math.log(1 - 2 * abs(u))


def dp_histogram(cols, epsilon, queries=1, seed=7):
    """Count of >50K earners by education (16 bins). Each of `queries` releases spends
    epsilon/queries (sequential composition); we report the error of the first release."""
    true = [0] * len(EDU)
    for e, inc in zip(cols["edu"], cols["income"]):
        if inc == 1:
            true[e] += 1
    rnd = mulberry32(seed)
    scale = 1 / (epsilon / queries)  # sensitivity 1 under add/remove one person
    noisy = [t + laplace(rnd, scale) for t in true]
    mae = sum(abs(a - b) for a, b in zip(noisy, true)) / len(true)
    smallest = min(range(len(true)), key=lambda j: true[j])
    return {"true": true, "noisy": [round(x, 1) for x in noisy], "scale": round(scale, 3),
            "mae": round(mae, 2), "smallest_bin": EDU[smallest], "smallest_true": true[smallest],
            "smallest_noisy": round(noisy[smallest], 1)}


# ---------------------------------------------------------------- synthetic data
SYN_COLS = ["age", "sex", "race", "marital", "edu", "country", "occ", "income"]


def synthesise(cols, mode, seed=11):
    """mode 'marginals': every column drawn independently from its real distribution.
    mode 'overfit': a generator that memorised its training rows - copy a real row, then nudge
    age by -2..+2 in half the copies. Returns privacy and utility checks against the real rows."""
    n = len(cols["age"])
    rnd = mulberry32(seed)
    syn = {c: [0] * n for c in SYN_COLS}
    if mode == "marginals":
        for c in SYN_COLS:
            src = cols[c]
            for i in range(n):
                syn[c][i] = src[int(rnd() * n)]
    else:
        for i in range(n):
            j = int(rnd() * n)
            for c in SYN_COLS:
                syn[c][i] = cols[c][j]
            if rnd() < 0.5:
                syn["age"][i] = min(90, max(17, syn["age"][i] + int(rnd() * 5) - 2))
    real_keys = ["|".join(str(cols[c][i]) for c in SYN_COLS) for i in range(n)]
    syn_keys = ["|".join(str(syn[c][i]) for c in SYN_COLS) for i in range(n)]
    real_count = Counter(real_keys)
    real_unique = {kk for kk, c in real_count.items() if c == 1}
    syn_set = set(syn_keys)
    exact_copies = sum(1 for kk in syn_keys if kk in real_count)
    unique_reproduced = len(real_unique & syn_set)

    def gap(d):
        m = [d["income"][i] for i in range(n) if d["sex"][i] == 0]
        f = [d["income"][i] for i in range(n) if d["sex"][i] == 1]
        return round(100 * (sum(m) / len(m) - sum(f) / len(f)), 1)
    return {"mode": mode, "exact_copies": exact_copies, "exact_copies_pct": round(100 * exact_copies / n, 2),
            "real_unique": len(real_unique), "unique_reproduced": unique_reproduced,
            "gap_real": gap(cols), "gap_syn": gap(syn)}


# ---------------------------------------------------------------- presets (the ladder)
RAW = {"age": 0, "sex": 0, "race": 0, "marital": 0, "edu": 0, "country": 0}
PRESETS = {
    "1 Names removed (pseudonymised)": (RAW, 1),
    "2 Age in 10-year bands": ({**RAW, "age": 2}, 1),
    "3 Coarsen four columns": ({"age": 2, "sex": 0, "race": 1, "marital": 1, "edu": 1, "country": 1}, 1),
    "4 Same, suppress classes under k=5": ({"age": 2, "sex": 0, "race": 1, "marital": 1, "edu": 1, "country": 1}, 5),
    "5 Same, k=10": ({"age": 2, "sex": 0, "race": 1, "marital": 1, "edu": 1, "country": 1}, 10),
    "6 Heavy: 20-year age, degree yes/no, k=10": ({"age": 3, "sex": 0, "race": 1, "marital": 1, "edu": 2, "country": 1}, 10),
}


def main():
    cols, countries = load()
    canon = {"rows": len(cols["age"]), "countries": len(countries), "presets": {}, "dp": {}}
    for name, (lv, k) in PRESETS.items():
        canon["presets"][name] = {"occ": release(cols, countries, lv, k, "occ"),
                                  "income": release(cols, countries, lv, k, "income")}
    # break button: the attacker also knows workclass, released exact
    lv4, _ = PRESETS["4 Same, suppress classes under k=5"]
    canon["break_forgot_work"] = release(cols, countries, lv4, 5, "occ", forgot_work=True)
    for eps in (0.1, 0.5, 1.0, 2.0):
        canon["dp"][str(eps)] = dp_histogram(cols, eps)
    canon["dp_composition_eps1_q10"] = dp_histogram(cols, 1.0, queries=10)
    canon["synthetic"] = {m: synthesise(cols, m) for m in ("marginals", "overfit")}
    canon["income_share"] = round(sum(cols["income"]) / len(cols["income"]), 4)
    (HERE / "canon-py.json").write_text(json.dumps(canon, indent=1))
    # data pack: one char per value, offset 48, so every column is a plain ASCII string
    pack = {"countries": countries, "SEX": SEX, "RACE": RACE, "MARITAL": MARITAL, "EDU": EDU,
            "WORK": WORK, "OCC": OCC, "INCOME": INCOME}
    for c in ["age", "sex", "race", "marital", "edu", "country", "work", "occ", "income"]:
        vals = cols[c]
        off = 17 if c == "age" else 0  # ages 17-90 -> 0-73
        s = "".join(chr(48 + (v - off) + (1 if 48 + (v - off) >= 92 else 0)) for v in vals)
        assert all(48 <= ord(ch) <= 125 and ch not in '"\\' for ch in s), c
        pack["c_" + c] = s
    js = ("/* UCI Adult, adult.data, 32,561 real rows from the 1994 US Census extract "
          "(Becker and Kohavi 1996, CC BY 4.0, doi:10.24432/C5XW20). One char per value: code = charCode - 48, minus 1 more above 92 (backslash skipped); "
          "age adds 17. Generated by materials/pe_reference.py. */\nwindow.PE_DATA = "
          + json.dumps(pack, separators=(",", ":")) + ";\n")
    (HERE.parent / "assets").mkdir(exist_ok=True)
    (HERE.parent / "assets" / "pe-data.js").write_text(js)
    print(json.dumps({k: v["occ"] for k, v in canon["presets"].items()}, indent=1))
    print("break", canon["break_forgot_work"])
    print("dp", {e: (d["scale"], d["mae"], d["smallest_bin"], d["smallest_true"], d["smallest_noisy"]) for e, d in canon["dp"].items()})
    print("syn", canon["synthetic"])
    print("comp", canon["dp_composition_eps1_q10"]["mae"], "income share", canon["income_share"])


if __name__ == "__main__":
    main()
