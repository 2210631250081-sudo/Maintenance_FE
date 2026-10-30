// Run: node test/validate.js  (checks data consistency and calculations; does not test the browser UI)
global.window = global;
require('../js/data.js'); require('../js/calc.js');
var D = DemoData, C = Calc, ok = 0, bad = 0;
function t(name, cond, info) { (cond ? ok++ : bad++); console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  [' + info + ']' : '')); }
function near(a, b, e) { return a != null && Math.abs(a - b) <= e; }

/* ---- Reliability: expected IR / MTTR / MTBF are the values printed in CALL SISTEM 2026.xlsx, sheet "new section" ---- */
var all = { from: '2025-10', to: '2026-04' };
t('35 rows = 5 sections x 7 months', D.rel.rows.length === 35 && D.rel.sections.length === 5 && D.rel.months.length === 7);
t('every row has load, trouble, frequency > 0 and a known section', D.rel.rows.every(function (r) { return r.load > 0 && r.trouble > 0 && r.freq > 0 && D.rel.sections.some(function (s) { return s.id === r.section; }); }));
function chk(label, f, ir, mttr, mtbf) { var x = C.reliability(f); t(label, near(x.ir, ir, .005) && near(x.mttr, mttr, .005) && near(x.mtbf, mtbf, .005), x.ir.toFixed(2) + ' / ' + x.mttr.toFixed(2) + ' / ' + x.mtbf.toFixed(2)); }
chk('ALL Oct 2025 matches report (5.34 / 6.20 / 116.12)', { from: '2025-10', to: '2025-10' }, 5.34, 6.20, 116.12);
chk('ALL Jan 2026 matches report (5.57 / 5.41 / 97.12)', { from: '2026-01', to: '2026-01' }, 5.57, 5.41, 97.12);
chk('ALL Apr 2026 matches report (5.21 / 5.73 / 110.04)', { from: '2026-04', to: '2026-04' }, 5.21, 5.73, 110.04);
chk('Cikarang Jan 2026 matches report (6.05 / 7.77 / 128.55)', { from: '2026-01', to: '2026-01', site: 'Cikarang' }, 6.05, 7.77, 128.55);
chk('Karawang Apr 2026 matches report (5.20 / 3.18 / 61.23)', { from: '2026-04', to: '2026-04', site: 'Karawang' }, 5.20, 3.18, 61.23);
var ck = C.reliability({ from: all.from, to: all.to, site: 'Cikarang' }), kw = C.reliability({ from: all.from, to: all.to, site: 'Karawang' }), al = C.reliability(all);
t('Cikarang + Karawang = all (loading, breakdown, frequency)', near(ck.loadH + kw.loadH, al.loadH, 1e-6) && near(ck.troubleH + kw.troubleH, al.troubleH, 1e-6) && ck.freq + kw.freq === al.freq);
t('formulas: IR = T/L, MTTR = T/N, MTBF = L/N', near(al.ir, al.troubleH / al.loadH * 100, 1e-9) && near(al.mttr, al.troubleH / al.freq, 1e-9) && near(al.mtbf, al.loadH / al.freq, 1e-9));
t('series has one point per month', C.series(all).labels.length === 7 && C.series(all).ir.length === 7);
t('bySection: 5 sections, 3 for Cikarang', C.bySection(all).length === 5 && C.bySection({ from: all.from, to: all.to, site: 'Cikarang' }).length === 3);
t('empty selection gives null (Unavailable), not 0', C.reliability({ from: '2027-01', to: '2027-02' }).ir === null);
t('previous period: 2026-02..04 -> 2025-11..2026-01', JSON.stringify(C.prev({ from: '2026-02', to: '2026-04' })) === '{"from":"2025-11","to":"2026-01"}');
t('no previous period for the full range', C.prev(all) === null);

/* ---- Maintenance orders: Data_dashboard.xlsx, sheet Maintenance_Kalender ---- */
var o = D.orders;
t('239 orders, all order numbers unique and 7 digits', o.length === 239 && o.every(function (x) { return /^\d{7}$/.test(x.order); }) && Object.keys(o.reduce(function (a, x) { a[x.order] = 1; return a; }, {})).length === 239);
t('all planned start dates are valid YYYY-MM-DD', o.every(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(x.plannedStart) && !isNaN(Date.parse(x.plannedStart)); }));
t('order types ZPM1 6 / ZPM2 233', JSON.stringify(C.orderTypes()) === '["ZPM1","ZPM2"]' && o.filter(function (x) { return x.type === 'ZPM1'; }).length === 6 && o.filter(function (x) { return x.type === 'ZPM2'; }).length === 233);
t('months Aug 188 / Sep 50 / Oct 1', JSON.stringify(C.orderMonths()) === '["2026-08","2026-09","2026-10"]' && C.monthOrders('2026-08').total === 188 && C.monthOrders('2026-09').total === 50 && C.monthOrders('2026-10').total === 1);
t('month type counts add up to month total', C.orderMonths().every(function (m) { var x = C.monthOrders(m); return x.byType.ZPM1 + x.byType.ZPM2 === x.total; }));
t('138 distinct equipment overall; all rows plant 6410', Object.keys(o.reduce(function (a, x) { a[x.equipmentNo] = 1; return a; }, {})).length === 138 && o.every(function (x) { return x.plant === '6410'; }));
t('a month without orders is empty, not an error', C.monthOrders('2027-01').total === 0 && C.monthOrders('2027-01').equipment === 0);

/* ---- Inventory: Data_dashboard.xlsx, sheet Min_Max_Stok ---- */
var inv = D.materials.map(C.inv), n = {};
inv.forEach(function (x) { n[x.status] = (n[x.status] || 0) + 1; });
t('inventory 1676 rows, 1676 distinct materials', inv.length === 1676 && Object.keys(inv.reduce(function (a, x) { a[x.material] = 1; return a; }, {})).length === 1676);
t('inventory: all rows plant 6410, minimum and maximum filled, minimum <= maximum', inv.every(function (x) { return x.plant === '6410' && x.min > 0 && x.max >= x.min; }));
t('inventory status counts add up to the total', Object.keys(n).reduce(function (a, k) { return a + n[k]; }, 0) === 1676, JSON.stringify(n));
t('gap = actual - min; null (Unavailable) when min missing', inv.every(function (x) { return x.min == null ? x.gap === null : x.gap === x.actual - x.min; }));
t('status rules on sample records', C.inv({ plant: '6410', material: 'X', description: '', min: 4, max: 10, actual: 2 }).status === 'Below Minimum' && C.inv({ plant: '6410', material: 'X', description: '', min: 4, max: 10, actual: 11 }).status === 'Above Maximum' && C.inv({ plant: '6410', material: 'X', description: '', min: 4, max: 10, actual: 6 }).status === 'Normal');
console.log('\n' + ok + ' passed, ' + bad + ' failed'); process.exit(bad ? 1 : 0);
