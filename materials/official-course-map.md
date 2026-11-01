# Official course map - learn-privacy-engineering-with-phoebe

Internal build document. Never link from an audience page. Built 2026-11-01.
Verified facts and their tiers live in `source-facts.md` (rows P1 to P44); this map says which
session teaches which row, and holds every COMPUTED number. Use ONLY numbers that appear here or in
`source-facts.md`. Re-verify PDPC Selected Topics cover date and ICO "under review" banner before delivery.

## Spine

- **Official spine:** PDPC Singapore. Guide to Basic Anonymisation (2022; day-level date ambiguous, cite the year only) and
  Advisory Guidelines on the PDPA for Selected Topics, Chapter 3 Anonymisation (issued 24 Sep 2013, revised 23 May 2024).
- **Definitions where PDPC is silent (definitions only, per Phoebe 2026-11-01):** Sweeney 2002 (k-anonymity), Machanavajjhala
  et al. 2007 (l-diversity), Li, Li and Venkatasubramanian 2007 (t-closeness), Dwork and Roth 2014 (differential privacy,
  Laplace mechanism, composition Theorem 3.14 / Corollary 3.15), NIST SP 800-226 (March 2025) for evaluating DP.
- **Real rows:** UCI Adult, adult.data, 32,561 rows (train split of 48,842), extracted by Barry Becker from the 1994 Census
  database; Becker and Kohavi 1996; CC BY 4.0; DOI 10.24432/C5XW20. Also called "Census Income". It is US data.
- **Constructed case:** Brightwater Social Research Institute, a Singapore research trust that holds the extract and is
  asked to share it with three university partners. People: Dr Hana Seow (research director), Ravi Menon (data engineer),
  Lim Su-Ann (data protection officer). Always say "constructed". The rows are real; say "real" about them.

## Seams (never reteach the other side; link instead)

| Topic | Owner | Link |
|---|---|---|
| What the PDPA requires, consent, obligations, breach, DNC | learn-pdpa-dnc | https://phoebefu6.github.io/learn-pdpa-dnc-with-phoebe/ |
| GDPR reach, lawful bases, Recital 26 as law | learn-gdpr | https://phoebefu6.github.io/learn-gdpr-with-phoebe/ |
| Governance programme, DPO role, data inventory | learn-data-governance | https://phoebefu6.github.io/learn-data-governance-with-phoebe/ |
| Internal access, masking, tokenisation, row/column policies | learn-data-access-control (b5 tokenisation) | https://phoebefu6.github.io/learn-data-access-control-with-phoebe/ |
| Selling data, pricing, is it ours to sell | learn-data-monetisation (a2, b2) | https://phoebefu6.github.io/learn-data-monetisation-with-phoebe/ |
| Small-cell suppression in published city count tables | learn-smart-city (p7) | https://phoebefu6.github.io/learn-smart-city-with-phoebe/ |

Privacy Engineering owns: measuring re-identification risk, k / l / t, generalisation and suppression, linkage attacks,
differential privacy (Laplace, epsilon, budget, composition), synthetic data testing, release records. It is engineering,
not legal advice; whether data is personal data is a legal question owned by the PDPA and GDPR courses.

## Computed canon (engine = assets/pe-engine.js, reference = materials/pe_reference.py; 375 numbers agree)

Quasi-identifiers (QIs): age, sex, race, marital, education, country of birth. Attacker: 1,000 real rows chosen by a fixed
seed; knows those six facts exactly. Sensitive: occupation (15 values incl. "?") unless stated; income band (2).

**Uniqueness climb (b1):** age 0.01% (2 rows, 73 classes) · +sex 0.02% (5, 144) · +race 0.20% (65, 546) · +marital 1.73%
(563, 1,772) · +education 10.39% (3,382, 6,493) · +country 17.18% (5,594 rows, 8,553 classes) · +workclass 27.78% (9,046).
Possible combinations of the six: 3,433,920. Country: 29,170 US-born, 2,808 elsewhere, 583 unknown. pandas reproduces these.

**Ladder (Release Desk, occupation sensitive):**

| Rung | Setting | unique | k | l | t | suppressed | single matches /1000 | expected | occupation revealed /1000 | precision |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 Pseudonymise only | all exact, k 1 | 17.18% | 1 | 1 | 0.9997 | 0 | 175 | 272.5 | 201 | 100% |
| 2 Age in 10-year bands | | 7.18% | 1 | 1 | 0.9954 | 0 | 85 | 129.6 | 97 | 92% |
| 3 Coarsen five columns | age 10y, race W/not, marital 3 groups, edu 5 levels, country US/outside/unknown | 0.57% | 1 | 1 | 0.9954 | 0 | 6 | 29.0 | 10 | 61% |
| 4 Same, k = 5 | | 0.57% | 5 | 1 | 0.8741 | 725 (2.23%) | 0 | 16.7 | 0 | 61% |
| 5 Same, k = 10 | | 0.57% | 10 | 2 | 0.8056 | 1,801 (5.53%) | 0 | 10.8 | 0 | 61% |
| 6 Heavy, k = 10 | age 20y, edu degree yes/no | 0.09% | 10 | 3 | 0.7116 | 345 (1.06%) | 0 | 4.4 | 0 | 51% |

Rung 3 has 872 classes; rung 6 has 227. Rung 4: 5 rows sit in homogeneous (single-occupation) classes; none of the 1,000 targets
is among them, so the attack reads 0 while l reads 1. Rung 1 classes 8,553; homogeneous rows 6,331.
**Break (rung 4 + workclass published exact, undeclared):** k still printed 5; single matches 22; expected 73.5; occupation
revealed 89. Expected = sum over the 1,000 of 1 / class size. Desk's bar (a teaching rule of thumb, NOT a standard):
k >= 10, l >= 3, suppressed < 5%. PDPC: minimum k 5 external, 3 internal (P13).
For income-band sensitive values run the desk (l can never exceed 2).

**Differential privacy (b5, b6):** query = count of >50K earners per education level (16 bins); true counts
Preschool 0, 1st-4th 6, 5th-6th 16, 7th-8th 40, 9th 27, 10th 62, 11th 60, 12th 33, HS-grad 1,675, Some-college 1,387,
Assoc-voc 361, Assoc-acdm 265, Bachelors 2,221, Masters 959, Prof-school 423, Doctorate 306; total 7,841. Sensitivity 1
(add or remove one person changes one count by 1). Laplace scale b = 1 / epsilon per query. Seeded draw (seed 7):
epsilon 0.1 -> b 10, mean absolute error 9.42, Preschool released -37.5 · epsilon 0.5 -> b 2, MAE 1.88, Preschool -7.5 ·
epsilon 1 -> b 1, MAE 0.94, Preschool -3.8 · epsilon 2 -> b 0.5, MAE 0.47, Preschool -1.9. Composition: total epsilon 1
split over 10 queries -> epsilon 0.1 each -> MAE 9.42 per query (same as epsilon 0.1). The widget offers epsilon 0.05, 0.1,
0.2, 0.5, 1, 2, 5 and 1 to 20 queries; other numbers: "your draw will differ" is FALSE here (seeded), so say "the widget prints".
Clamping negatives to 0 is post-processing and costs no privacy (Dwork and Roth Prop 2.1; state as reported unless in sheet).
Laplace variance is 2 b^2 (standard deviation sqrt(2) b).

**Synthetic (b7):** two toy generators, 32,561 rows each, eight columns (six QIs + occupation + income).
Independent columns: 8,855 synthetic rows (27.2%) identical to some real row; 2,183 of 13,496 real unique rows reproduced
exactly, by chance; pay gap (share >50K, men minus women) real 19.6 points, synthetic 0.2. Memorising generator (copies a
real row, nudges age by -2..+2 in half): 26,987 (82.88%) identical; 6,818 of 13,496 unique reproduced; gap 19.9.
Lesson: an exact match is not proof of a leak (chance makes 2,183); the leak is the EXCESS over a chance baseline.
Real: men 21,790 rows, 30.6% >50K; women 10,771, 10.9%. Income share overall 24.08%.

## Session coverage

### Leader track (4, no code). Template: a1 (hand-authored)

- **a1 Pseudonymous is not anonymous** - P15a/P15b/P15c (PDPC "anonymised data is not personal data", GDPR Art 4(5) and Recital 26 as one-line pointers, law owned by siblings), P10 serious-possibility test (state it EXACTLY: data is NOT anonymised if there is a serious possibility of re-identification), P11 factors, uniqueness climb headline 17.18%, P17 Sweeney 87% likely unique (1990, 5-digit ZIP), P18 Golle 63%, P42 Rocher (model estimate), P19 Weld, P33 AOL, P31 Netflix. Uniq widget.
- **a2 The release environment** - P10 two limbs (data + other information the recipient has; measures and safeguards), P11 four factors (alteration, extent of disclosure, other information, recipients' ability and motivation), P12 recipient controls (limit recipients, restrict use and onward disclosure, destroy, contractual safeguards, undertaking not to re-identify; para 3.7(c), 3.18, 3.23, 3.42), P14 motivated intruder (para 3.11, 3.36-3.38, adapted from ICO), P44 ICO motivated intruder, P43 ICO guidance 28 March 2025 with "under review" banner (contested currency), P13 k 5 external / 3 internal, P15 Part 9B re-identification offence AS THE GUIDELINE'S STATEMENT (para 3.18), P10 para 3.5 review periodically. Three routes: public open data, restricted to named recipients under agreement, enclave (data never leaves; researchers query inside). Desk numbers as the "same data, different route" illustration (constructed judgement). Build-along: route x control risk register for Brightwater's three partners.
- **a3 Choosing the technique** - P3 PDPC Annex A seven techniques (record suppression, character masking, pseudonymisation, generalisation, swapping, data perturbation, data aggregation) + attribute suppression (Step 3, Annex B); synthetic data as a PDPC USE CASE not a technique, "not suitable for... AI model training or data analytics" (P3); P5 PDPC points to l-diversity, t-closeness, DP as outside its scope; P40 Stadler et al. synthetic is "far from the holy grail"; P35 US Census redistricting budget epsilon 19.61 (17.14 persons + 2.47 housing units), CB21-CN.42, 9 June 2021, REDISTRICTING ONLY; P37: do NOT say "the Census Bureau adopted differential privacy" as a sourced fact; say the release names a "privacy-loss budget" and the "TopDown Algorithm", and that the adoption of DP is widely reported. Compare protection vs usefulness with canon: rung 6 precision 51%; DP MAE at epsilon 1 = 0.94 on counts; synthetic gap 0.2 vs 19.6. Build-along: technique decision table for three Brightwater requests (a public dashboard of counts, a partner wanting row-level data for regression, a hackathon wanting "realistic" rows).
- **a4 Signing off a release** - P13 thresholds + para 3.10 if k5 unreachable: more stringent safeguards; P10 para 3.5 periodic review, effectiveness degrades over time; P2 Step 4 compute risk, Step 5 manage; P14 motivated intruder as the attack test; the break result (0 -> 22) as why the record lists every column; epsilon budget as a sign-off number (P35 as a real example of a published budget); P29 NIST pyramid: epsilon alone is not the guarantee (unit of privacy, trust model, etc.). Build-along: the sign-off memo (one page) from an Engineer's release record. Homework: schedule the re-review.

### Engineer track (8, browser + optional pandas). Template: b1 (hand-authored). Bench: b8 (hand-authored)

- **b1 Finding the quasi-identifiers** - DONE.
- **b2 Generalise and suppress to k** - P16 Sweeney 2002 Definition 3 (each QI value sequence appears at least k times; "cannot be distinguished from at least k-1"); P4 PDPC "industry threshold for k-anonymity value is at 3 or 5" (p24) and k counts only indirect identifiers (fn 12); P3 generalisation and record suppression in Annex A; hierarchies (age exact / 5y / 10y / 20y / removed; education 16 / 5 levels / degree yes-no / removed; etc. exactly as the desk); rungs 2-5; precision 100 -> 92 -> 61%; suppression 725 at k5, 1,801 at k10; generalise-more-suppress-less (rung 6 345). Widget: data-pe="desk" data-preset="p3". pandas build-along: generalise with pd.cut / maps, groupby size, drop classes under k; print k achieved and rows suppressed (MUST be verified by the lead before publish).
- **b3 When k is not enough** - P20 homogeneity attack and background-knowledge attack (Alice and the 4-anonymous inpatient table; Umeko), P22 t-closeness definition (distance between class distribution and whole table at most t; Earth Mover's Distance) and its claim that l-diversity is "neither necessary nor sufficient"; the desk uses distinct l and, for categorical values with equal distance, EMD = half the L1 distance (variational distance); rung 4 l = 1, rung 5 l = 2, rung 6 l = 3; t stays high (0.87, 0.81, 0.71) because occupation mixes differ by group; income band (2 values) cannot reach l 3. P2 attribute disclosure. Widget desk data-preset="p4".
- **b4 The linkage attack** - the join (outsider's table of 1,000 people with six facts) against the release; prosecutor-style risk 1 / class size; single matches 175 -> 85 -> 6 -> 0; expected 272.5 -> 4.4; break 22 / 73.5 / 89; P19 Weld (voter list for twenty dollars), P31 Netflix (IMDb), P2 identity disclosure; two releases joined (constructed explanation). Widget desk data-preset="p1", press break on p4. pandas: merge outsider sample on generalised keys (lead verifies).
- **b5 Noise with a guarantee** - P25 definition of epsilon-DP (neighbouring databases differing in one person; delta = 0 gives epsilon-DP), P26 sensitivity (Def 3.1) and Laplace mechanism Lap(delta f / epsilon) (Theorem 3.6), P23 origin in Dwork, McSherry, Nissim, Smith 2006 whose own term is epsilon-indistinguishability (do NOT say the 2006 paper says "differential privacy"; venue: Lecture Notes in Computer Science 2006, pp 265-284; do not say TCC); variance 2 b^2; P5 PDPC mentions DP as an alternative outside its scope. Noise is the same size for every count, so small counts are drowned (Preschool 0 -> -3.8 at epsilon 1). Widget data-pe="dp".
- **b6 Spending a privacy budget** - P27 composition Theorem 3.14 / Corollary 3.15 (sum of epsilons; do NOT call it "sequential composition" as Dwork and Roth's term); epsilon 1 over 10 queries = 9.42 MAE per query; post-processing (clamp/round) free; P30 unit of privacy (user-level stronger than event-level; guarantees with different units not comparable); P29 NIST pyramid components (do not state the layer order); P35 Census redistricting budget 19.61 = 17.14 + 2.47, redistricting product only; P36 no DHC number. Widget data-pe="dp".
- **b7 Synthetic data and its leaks** - canon synthetic numbers; P3 PDPC treats record-level synthetic data as a use case made by heavy anonymisation, not suitable for AI training or analytics, and from-scratch generation out of scope (fn 7); P40 Stadler et al. 2022 (USENIX Security 2022, arXiv 2011.07018): no better tradeoff than traditional anonymisation, linkage / membership / attribute inference evaluated; testing: exact-match rate vs a chance baseline, unique-reproduced vs baseline, utility check on a relationship researchers need (pay gap). Contested: vendors claim synthetic is anonymous by construction; teach the disagreement. Widget data-pe="syn".
- **b8 The Release Desk** - DONE.

## Not covered (honest list)

- Legal tests of personal data, lawful bases, cross-border transfer: sibling courses.
- (epsilon, delta)-DP mechanisms beyond a mention (Gaussian), advanced composition (Theorem 3.20), DP-SGD and DP in ML training.
- Federated learning, secure multi-party computation, homomorphic encryption, trusted execution environments.
- Text, image, location-trace and graph data anonymisation (PDPC's guide covers structured, non-complex data only, P6).
- The 2025 APPA and ASEAN anonymisation guides (P8, not read), EDPB Guidelines 02/2026 (consultation, not read).
- The 2020 Census DHC file budget (P36, not found).

## Banned / exact strings

- Never "sequential composition" attributed to Dwork and Roth. Never "the Census Bureau adopted differential privacy" as a sourced sentence.
- Never "87% identified"; say "87% likely unique (1990 census figures)".
- Never "650,000 AOL users". Use "about 20 million web search queries".
- AOL woman: Thelma Arnold, 62, Lilburn, Georgia (P33).
