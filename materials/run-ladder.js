// Runs the browser engine (assets/pe-engine.js) on assets/pe-data.js under node and compares
// every number with canon-py.json BY VALUE. Exit 1 on any mismatch.
//   node materials/run-ladder.js            -> compare
//   node materials/run-ladder.js --plant    -> must FAIL (proves the comparison can fail)
const fs = require("fs"), path = require("path"), vm = require("vm");
const here = __dirname, assets = path.join(here, "..", "assets");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(assets, "pe-data.js"), "utf8"), ctx);
const PE = require(path.join(assets, "pe-engine.js"));
const R = PE.load(ctx.window.PE_DATA);
const canon = JSON.parse(fs.readFileSync(path.join(here, "canon-py.json"), "utf8"));

const RAW = { age: 0, sex: 0, race: 0, marital: 0, edu: 0, country: 0 };
const COARSE = { age: 2, sex: 0, race: 1, marital: 1, edu: 1, country: 1 };
const PRESETS = {
  "1 Names removed (pseudonymised)": [RAW, 1],
  "2 Age in 10-year bands": [{ ...RAW, age: 2 }, 1],
  "3 Coarsen four columns": [COARSE, 1],
  "4 Same, suppress classes under k=5": [COARSE, 5],
  "5 Same, k=10": [COARSE, 10],
  "6 Heavy: 20-year age, degree yes/no, k=10": [{ ...COARSE, age: 3, edu: 2 }, 10],
};
const js = { rows: R.age.length, presets: {}, dp: {} };
for (const [name, [lv, k]] of Object.entries(PRESETS)) {
  js.presets[name] = { occ: PE.release(R, lv, k, "occ"), income: PE.release(R, lv, k, "income") };
}
js.break_forgot_work = PE.release(R, COARSE, 5, "occ", true);
for (const e of [0.1, 0.5, 1.0, 2.0]) js.dp[String(e === 1 ? "1.0" : e === 2 ? "2.0" : e)] = PE.dpHistogram(R, e);
js.dp_composition_eps1_q10 = PE.dpHistogram(R, 1.0, 10);
js.synthetic = { marginals: PE.synthesise(R, "marginals"), overfit: PE.synthesise(R, "overfit") };
if (process.argv.includes("--plant")) js.presets["4 Same, suppress classes under k=5"].occ.link_expected *= 1.001;
fs.writeFileSync(path.join(here, "canon-js.json"), JSON.stringify(js, null, 1));

let bad = 0, checked = 0;
function cmp(a, b, p) {
  if (typeof a === "number" && typeof b === "number") {
    checked++;
    if (Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a))) { bad++; console.log("MISMATCH", p, a, b); }
  } else if (Array.isArray(a)) a.forEach((x, i) => cmp(x, b[i], p + "[" + i + "]"));
  else if (a && typeof a === "object") Object.keys(a).forEach((key) => {
    if (!(key in b)) { bad++; console.log("MISSING", p + "." + key); } else cmp(a[key], b[key], p + "." + key);
  });
  else if (a !== b) { bad++; console.log("MISMATCH", p, a, b); }
}
const pyCompare = { ...canon };
delete pyCompare.countries; delete pyCompare.income_share;
cmp(pyCompare, js, "canon");
console.log(bad ? `FAIL ${bad} of ${checked}` : `PASS ${checked} numbers agree`);
process.exit(bad ? 1 : 0);
