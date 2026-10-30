/* Rendering and event handling only. All numbers come from Calc / DemoData. All element IDs use the prefixes rc-, mc-, iv-. */
(function () {
var D = window.DemoData, C = window.Calc, ch = {}, sorts = {}, cal = { ym: C.orderMonths()[0], sel: null };
var OT = { ZPM1: '#c1272d', ZPM2: '#484848' };
function otc(t) { return OT[t] || '#9e9e9e'; }
var IS = { 'Out of Stock': '#c1272d', 'Below Minimum': '#d9822b', Normal: '#2e7d32', 'Above Maximum': '#484848', Unclassified: '#9e9e9e' };
var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function $(i) { return document.getElementById(i); }
function nf(n, d) { return n == null ? 'Unavailable' : n.toLocaleString('id-ID', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
function rp(n) { return 'Rp ' + nf(n); }
function fd(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '-'; }
function mix(f, o) { return { from: o.from, to: o.to, site: f.site, section: f.section }; }
function pill(s) { return '<span class="pill" style="background:' + (IS[s] || otc(s)) + '">' + s + '</span>'; }
function opts(el, list, all) { el.innerHTML = (all ? '<option value="">' + all + '</option>' : '') + list.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join(''); }
function card(l, v, d, n) { return '<div class="kpi"><div class="kl">' + l + '</div><div class="kv">' + v + '</div><div class="kd ' + (d ? d.c : '') + '">' + (d ? d.t : '') + '</div><div class="kn">' + (n || '') + '</div></div>'; }
function dl(cur, prev, low, pp) {
  if (cur == null || prev == null || (!pp && prev === 0)) return { t: 'vs previous: n/a', c: '' };
  var x = pp ? cur - prev : (cur - prev) / prev * 100;
  return { t: (x > 0 ? '+' : '') + nf(x, 1) + (pp ? ' pp' : '%') + ' vs previous', c: x === 0 ? '' : ((x < 0) === !!low ? 'good' : 'bad') };
}
function chart(id, cfg) {
  if (typeof Chart === 'undefined') { $('app-warn').hidden = false; return; }
  Chart.defaults.global.defaultFontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif'; Chart.defaults.global.defaultFontColor = '#333';
  Chart.defaults.scale.gridLines.color = 'rgba(0,0,0,.1)';
  if (ch[id]) ch[id].destroy();
  cfg.options = cfg.options || {}; cfg.options.maintainAspectRatio = false;
  ch[id] = new Chart($(id).getContext('2d'), cfg);
}
function tbl(id, cols, rows, re, emptyMsg) {
  var el = $(id), s = sorts[id];
  if (s) rows = rows.slice().sort(function (a, b) { var x = a[s.k], y = b[s.k]; if (x == null) return 1; if (y == null) return -1; return (x < y ? -1 : x > y ? 1 : 0) * s.d; });
  el.onclick = function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-k'), o = sorts[id]; if (!k) return; sorts[id] = { k: k, d: o && o.k == k ? -o.d : 1 }; re(); };
  el.innerHTML = '<table class="dt"><thead><tr>' + cols.map(function (c) { return '<th data-k="' + c.k + '"' + (c.n ? ' class="num"' : '') + '>' + c.l + (s && s.k == c.k ? (s.d > 0 ? ' &#9650;' : ' &#9660;') : '') + '</th>'; }).join('') + '</tr></thead><tbody>' +
    (rows.length ? rows.map(function (r) { return '<tr>' + cols.map(function (c) { return '<td' + (c.n ? ' class="num"' : '') + '>' + (c.f ? c.f(r) : (r[c.k] == null ? '-' : r[c.k])) + '</td>'; }).join('') + '</tr>'; }).join('') :
    '<tr><td colspan="' + cols.length + '" class="empty">' + emptyMsg + '</td></tr>') + '</tbody></table>';
}
/* ---------- Reliability & Cost ---------- */
function rcF() { return { from: $('rc-from').value, to: $('rc-to').value, site: $('rc-site').value, section: $('rc-sec').value }; }
function rcRender() {
  var f = rcF(), k = $('rc-kpis');
  if (f.from > f.to) { k.innerHTML = '<div class="empty">The start month is after the end month. Change the period.</div>'; return; }
  var c = C.reliability(f), pr = C.prev(f), p = pr && C.reliability(mix(f, pr));
  $('rc-note').textContent = 'Period ' + f.from + ' to ' + f.to + (pr ? ', compared with ' + pr.from + ' to ' + pr.to : ', no previous period in the data');
  k.innerHTML = card('Incident Rate (IR)', c.ir == null ? 'Unavailable' : nf(c.ir, 2) + '%', dl(c.ir, p && p.ir, 1, 1), 'breakdown ' + nf(c.troubleH, 0) + ' h of loading ' + nf(c.loadH, 0) + ' h') +
    card('MTTR', c.mttr == null ? 'Unavailable' : nf(c.mttr, 2) + ' h', dl(c.mttr, p && p.mttr, 1), 'breakdown time / breakdown frequency') +
    card('MTBF', c.mtbf == null ? 'Unavailable' : nf(c.mtbf, 1) + ' h', dl(c.mtbf, p && p.mtbf, 0), 'loading time / breakdown frequency') +
    card('Breakdown frequency', nf(c.freq), dl(c.freq, p && p.freq, 1), 'machine-stop troubles in the period') +
    card('Total Maintenance Cost', 'Unavailable', null, 'no cost field in Call System 2026');
  var s = C.series(f), m = $('rc-metric').value, lab = $('rc-metric').options[$('rc-metric').selectedIndex].text, sec = C.bySection(f);
  chart('rc-c1', { type: m == 'ir' ? 'bar' : 'line', data: { labels: s.labels, datasets: [{ label: lab, data: s[m], backgroundColor: '#484848', borderColor: '#484848', fill: false }] },
    options: { legend: { display: false }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } } });
  chart('rc-c2', { type: 'bar', data: { labels: sec.map(function (x) { return x.id; }), datasets: [{ label: 'IR (%)', data: sec.map(function (x) { return x.ir == null ? null : Math.round(x.ir * 100) / 100; }), backgroundColor: '#c1272d' }] },
    options: { legend: { display: false }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } } });
  tbl('rc-table', [{ k: 'id', l: 'Section' }, { k: 'group', l: 'Group' }, { k: 'site', l: 'Site' },
    { k: 'loadH', l: 'Loading time (h)', n: 1, f: function (r) { return nf(r.loadH, 0); } }, { k: 'troubleH', l: 'Breakdown time (h)', n: 1, f: function (r) { return nf(r.troubleH, 0); } },
    { k: 'freq', l: 'Frequency', n: 1, f: function (r) { return nf(r.freq); } }, { k: 'ir', l: 'IR (%)', n: 1, f: function (r) { return nf(r.ir, 2); } },
    { k: 'mttr', l: 'MTTR (h)', n: 1, f: function (r) { return nf(r.mttr, 2); } }, { k: 'mtbf', l: 'MTBF (h)', n: 1, f: function (r) { return nf(r.mtbf, 1); } }], sec, rcRender, 'No data for the selected filters.');
}
function rcSec() { opts($('rc-sec'), D.rel.sections.filter(function (s) { return !$('rc-site').value || s.site == $('rc-site').value; }).map(function (s) { return [s.id, s.group == s.id ? s.id : s.id + ' (' + s.group + ')']; }), 'All sections'); }
/* ---------- Maintenance Calendar ---------- */
var OC = [{ k: 'order', l: 'Maintenance Order' }, { k: 'equipmentNo', l: 'Equipment No.' }, { k: 'type', l: 'Type', f: function (r) { return pill(r.type); } },
  { k: 'plannedStart', l: 'Planned Start', f: function (r) { return fd(r.plannedStart); } }, { k: 'plant', l: 'Plant' }];
function mcRender() {
  var ym = cal.ym, y = +ym.slice(0, 4), m = +ym.slice(5) - 1, off = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7, dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), by = {}, types = C.orderTypes(), h, d, i, key, cnt;
  D.orders.forEach(function (o) { (by[o.plannedStart] = by[o.plannedStart] || []).push(o); });
  $('mc-title').textContent = MN[m] + ' ' + y;
  h = '<table class="cal"><tr>' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr><tr>';
  for (i = 0; i < off; i++) h += '<td class="e"></td>';
  for (d = 1; d <= dim; d++) {
    key = ym + '-' + ('0' + d).slice(-2); cnt = {};
    (by[key] || []).forEach(function (o) { cnt[o.type] = (cnt[o.type] || 0) + 1; });
    h += '<td data-d="' + key + '" class="' + (key == cal.sel ? 'sel' : '') + '"><div class="d">' + d + '</div>' +
      types.filter(function (t) { return cnt[t]; }).map(function (t) { return '<span class="b" title="' + t + '" style="background:' + otc(t) + '">' + cnt[t] + '</span>'; }).join('') + '</td>';
    if ((off + d) % 7 === 0 && d < dim) h += '</tr><tr>';
  }
  $('mc-grid').innerHTML = h + '</tr></table>';
  var rows = cal.sel ? (by[cal.sel] || []) : [];
  $('mc-dtitle').textContent = cal.sel ? 'Activities on ' + fd(cal.sel) : 'Select a date';
  $('mc-detail').innerHTML = !cal.sel ? '<div class="empty">Click a date to see its maintenance orders.</div>' : !rows.length ? '<div class="empty">No maintenance activity on this date.</div>' :
    '<table class="dt"><tr><th>Order</th><th>Equipment No.</th><th>Type</th><th>Planned Start</th><th>Plant</th></tr>' +
    rows.map(function (r) { return '<tr><td>' + r.order + '</td><td>' + r.equipmentNo + '</td><td>' + pill(r.type) + '</td><td>' + fd(r.plannedStart) + '</td><td>' + r.plant + '</td></tr>'; }).join('') + '</table>';
  var p = C.monthOrders(ym);
  $('mc-kpis').innerHTML = card('Orders', nf(p.total), null, 'planned start in ' + ym) + types.map(function (t) { return card('Type ' + t, nf(p.byType[t]), null, 'planned start in ' + ym); }).join('') +
    card('Equipment', nf(p.equipment), null, 'distinct equipment with an order') + card('Completion Rate', 'Unavailable', null, 'no status or confirmation field in the source sheet');
  $('mc-ttitle').textContent = 'Maintenance orders starting in ' + MN[m] + ' ' + y;
  tbl('mc-table', OC, p.orders, mcRender, 'No maintenance orders start in this month.');
  var ms = C.orderMonths();
  chart('mc-c1', { type: 'bar', data: { labels: ms, datasets: types.map(function (t) { return { label: t, backgroundColor: otc(t), data: ms.map(function (x) { return C.monthOrders(x).byType[t]; }) }; }) },
    options: { scales: { xAxes: [{ stacked: true }], yAxes: [{ stacked: true, ticks: { beginAtZero: true } }] } } });
}
/* ---------- Inventory Monitoring ---------- */
function ivRender() {
  var pl = $('iv-plant').value, st = $('iv-status').value, q = $('iv-search').value.toLowerCase(), n = {};
  var rows = D.materials.map(C.inv).filter(function (r) { return (!pl || r.plant == pl) && (!st || r.status == st) && (!q || (r.material + ' ' + r.description).toLowerCase().indexOf(q) >= 0); });
  rows.forEach(function (r) { n[r.status] = (n[r.status] || 0) + 1; });
  $('iv-count').textContent = nf(rows.length) + ' data found.';
  $('iv-kpis').innerHTML = card('Total monitored materials', rows.length, null, (n.Unclassified || 0) + ' unclassified (no minimum)') + card('Out of stock', n['Out of Stock'] || 0) +
    card('Below minimum', n['Below Minimum'] || 0) + card('Normal', n.Normal || 0) + card('Above maximum', n['Above Maximum'] || 0);
  var q2 = function (v) { return nf(v); };
  tbl('iv-table', [{ k: 'plant', l: 'Plant' }, { k: 'material', l: 'Material' }, { k: 'description', l: 'Description' },
    { k: 'min', l: 'Minimum Stock', n: 1, f: function (r) { return q2(r.min, r); } }, { k: 'max', l: 'Maximum Stock', n: 1, f: function (r) { return q2(r.max, r); } },
    { k: 'actual', l: 'Actual Stock', n: 1, f: function (r) { return q2(r.actual, r); } }, { k: 'gap', l: 'Gap', n: 1, f: function (r) { return r.gap == null ? 'Unavailable' : (r.gap > 0 ? '+' : '') + nf(r.gap); } },
    { k: 'status', l: 'Status', f: function (r) { return pill(r.status); } }], rows, ivRender, 'No materials match the selected filters.');
}
/* ---------- Tabs and init ---------- */
var R = { rc: rcRender, mc: mcRender, iv: ivRender };
var cur = 'rc';
function show(t) {
  cur = t;
  ['rc', 'mc', 'iv'].forEach(function (x) { $('tab-' + x).hidden = x != t; });
  Array.prototype.forEach.call(document.querySelectorAll('nav button'), function (b) { b.className = b.getAttribute('data-tab') == t ? 'on' : ''; });
  var nb = document.querySelector('nav button[data-tab="' + t + '"]');
  $('app-title').innerHTML = '<span class="no">' + nb.getAttribute('data-no') + '</span> ' + nb.getAttribute('data-name');
  $('app-crumb').innerHTML = 'Transaction &#9656; ' + nb.getAttribute('data-no') + ' ' + nb.getAttribute('data-name');
  R[t]();
}
function init() {
  var ml = D.rel.months.map(function (m) { return [m, m]; }), sites = [];
  D.rel.sections.forEach(function (s) { if (sites.indexOf(s.site) < 0) sites.push(s.site); });
  opts($('rc-from'), ml); opts($('rc-to'), ml); $('rc-from').value = '2026-02'; $('rc-to').value = D.rel.months[D.rel.months.length - 1];
  opts($('rc-site'), sites.map(function (x) { return [x, x]; }), 'All sites'); rcSec();
  ['rc-from', 'rc-to', 'rc-sec', 'rc-metric'].forEach(function (i) { $(i).onchange = rcRender; });
  $('rc-site').onchange = function () { rcSec(); rcRender(); };
  opts($('iv-plant'), D.materials.map(function (m) { return m.plant; }).filter(function (p, i, a) { return a.indexOf(p) === i; }).sort().map(function (p) { return [p, p]; }), 'All plants'); opts($('iv-status'), Object.keys(IS).map(function (s) { return [s, s]; }), 'All statuses');
  $('iv-plant').onchange = $('iv-status').onchange = $('iv-search').oninput = ivRender;
  $('mc-legend').innerHTML = C.orderTypes().map(pill).join('');
  $('mc-prev').onclick = function () { cal.ym = C.mAdd(cal.ym, -1); cal.sel = null; mcRender(); };
  $('mc-next').onclick = function () { cal.ym = C.mAdd(cal.ym, 1); cal.sel = null; mcRender(); };
  $('mc-cur').onclick = function () { cal.ym = C.orderMonths()[0]; cal.sel = null; mcRender(); };
  $('mc-grid').onclick = function (e) { var el = e.target; while (el && el.getAttribute && !el.getAttribute('data-d')) el = el.parentNode; if (el && el.getAttribute) { cal.sel = el.getAttribute('data-d'); mcRender(); } };
  Array.prototype.forEach.call(document.querySelectorAll('nav button'), function (b) { b.onclick = function () { show(b.getAttribute('data-tab')); }; });
  $('app-refresh').onclick = function () { R[cur](); };
  Array.prototype.forEach.call(document.querySelectorAll('[data-apply]'), function (b) { b.onclick = function () { R[cur](); }; });
  show('rc');
}
init();
})();
