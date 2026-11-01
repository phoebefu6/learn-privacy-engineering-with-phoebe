#!/usr/bin/env python3
"""Writes index.html (landing page): cards, paths and knowledge map from ONE session spec,
serialised with json.dumps. Internal build script; never linked from an audience page."""
import html
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
G, Y, O, R = "#34D399", "#FBBF24", "#FB923C", "#F87171"
# (file, title, map label, diff colour, icon, blurb, pill, concepts)
A = [
    ("a1-pseudonymous-is-not-anonymous", "Pseudonymous is not anonymous", "Pseudonymous is\nnot anonymous", G, "🎭",
     "Why removing names changes nothing on the real rows: 17.18% of 32,561 people are alone on six ordinary facts. PDPC's line between anonymised and pseudonymised, and three releases that were undone.",
     "▶ Start here", ["Pseudonymised vs anonymised", "Uniqueness on the rows", "Releases that failed"]),
    ("a2-the-release-environment", "The release environment", "The release\nenvironment", G, "🏛️",
     "Risk is the data plus where it lands. Public, restricted and enclave releases, the controls on the recipient, and who the realistic intruder is.",
     "data + environment", ["Three release routes", "Recipient controls", "The realistic intruder"]),
    ("a3-choosing-the-technique", "Choosing the technique", "Choosing the\ntechnique", Y, "🧰",
     "Generalise and suppress, add calibrated noise, or generate synthetic rows: what each protects, what each costs the researcher, and when to use which.",
     "three tools, three costs", ["PDPC's technique list", "Protection vs usefulness", "Matching tool to release"]),
    ("a4-signing-off-a-release", "Signing off a release", "Signing off\na release", O, "✍️",
     "The thresholds, the attack test, the privacy budget and the record that lets someone else check your decision a year later.",
     "the sign-off memo", ["Thresholds you can defend", "The attack test", "The release record"]),
]
B = [
    ("b1-finding-the-quasi-identifiers", "Finding the quasi-identifiers", "Finding the\nquasi-identifiers", G, "🔎",
     "Direct identifiers, quasi-identifiers and sensitive columns. Count the people who are alone as you add columns: 0.01% on age, 17.18% on six.",
     "▶ Start here", ["Three kinds of column", "Equivalence classes", "The uniqueness climb"]),
    ("b2-generalise-and-suppress-to-k", "Generalise and suppress to k", "Generalise and\nsuppress to k", G, "🧱",
     "Generalisation hierarchies, record suppression and k-anonymity computed on the real rows, with the precision each step gives up.",
     "k on real rows", ["Hierarchies", "Suppression", "What k costs"]),
    ("b3-when-k-is-not-enough", "When k is not enough", "When k is\nnot enough", Y, "🧬",
     "A class of five where everyone has the same occupation tells the attacker everything. l-diversity and t-closeness, and why t stays high on these rows.",
     "homogeneity attack", ["Homogeneity", "l-diversity", "t-closeness"]),
    ("b4-the-linkage-attack", "The linkage attack", "The linkage\nattack", Y, "🔗",
     "Play the outsider: join what you know about 1,000 people to the release. 175 single-row matches on the pseudonymised file, 0 at k = 5, 22 again once workclass slips out.",
     "1,000 known people", ["The join", "Prosecutor risk", "The forgotten column"]),
    ("b5-noise-with-a-guarantee", "Noise with a guarantee", "Noise with a\nguarantee", O, "🎲",
     "Differential privacy from the definition up: sensitivity, the Laplace mechanism, epsilon, and why the noise is the same size for every count.",
     "epsilon, not a vibe", ["The definition", "Sensitivity", "Laplace noise"]),
    ("b6-spending-a-privacy-budget", "Spending a privacy budget", "Spending a\nprivacy budget", O, "💰",
     "Every query spends epsilon. Composition, the budget for a whole release, post-processing for free, and the US 2020 Census as the worked example.",
     "the budget", ["Composition", "Post-processing", "A real budget"]),
    ("b7-synthetic-data-and-its-leaks", "Synthetic data and its leaks", "Synthetic data\nand its leaks", O, "🧪",
     "Two toy generators on the real rows: one destroys the pay gap researchers need, the other copies real people. How to test a synthetic file before release.",
     "copied or generated?", ["Utility lost", "Memorised rows", "Testing a generator"]),
    ("b8-the-release-desk", "The Release Desk", "The Release\nDesk", R, "🛡️",
     "The bench: six presets from pseudonymised to heavy, live k, l, t, suppression and a linkage attack, a break button, and a release you can sign.",
     "★ the bench", ["The ladder", "The trap preset", "The break button"]),
]


def cards(spec, track, total):
    out = []
    for i, (f, title, _lab, col, icon, blurb, pill, _c) in enumerate(spec, 1):
        num = f"{track} session {i}" + (" · start here" if i == 1 else " · bench night" if col == R else "")
        cls = "pill amber" if pill.startswith(("▶", "★")) else "pill"
        out.append(f'      <a class="course-card" href="courses/{f}.html" style="--diff:{col}"><span class="cicon">{icon}</span>'
                   f'<span class="cnum">{num}</span><h3>{html.escape(title)}</h3><p>{html.escape(blurb)}</p>'
                   f'<span class="meta"><span class="{cls}">{html.escape(pill)}</span></span></a>')
    return "\n".join(out)


def path(spec, letter, idx):
    return '<span class="parr">→</span>'.join(
        f'<a class="pstep" href="courses/{spec[i][0]}.html">{letter}{i + 1}</a>' for i in idx)


MM = {"title": "Privacy\nengineering", "centerColor": "#4A4700",
      "sessions": [{"label": s[2], "href": "courses/%s.html" % s[0], "color": s[3],
                    "concepts": [{"label": c, "href": "courses/%s.html" % s[0]} for c in s[7]]} for s in A + B]}

tpl = open(os.path.join(HERE, "index.template.html")).read()
out = (tpl.replace("<!--CARDS_A-->", cards(A, "Leader", 4))
          .replace("<!--CARDS_B-->", cards(B, "Engineer", 8))
          .replace("<!--PATH_LEAD-->", path(A, "A", range(4)))
          .replace("<!--PATH_ENG-->", path(B, "B", range(8)))
          .replace("<!--PATH_DPO-->", path(A, "A", [0, 1]) + '<span class="parr">→</span>' + path(B, "B", [3, 7]) + '<span class="parr">→</span>' + path(A, "A", [3]))
          .replace("/*MINDMAP*/", "window.MINDMAP_DATA = " + json.dumps(MM, indent=2, ensure_ascii=False) + ";"))
open(os.path.join(HERE, "..", "index.html"), "w").write(out)
print("index.html written")
