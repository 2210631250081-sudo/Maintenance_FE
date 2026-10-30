# SAP PM Dashboard: frontend demo (standalone)

Plain HTML, CSS and JavaScript. **Not integrated with B2E**, SAP or Call System. It exists to be studied and discussed with IT before being adapted to B2E.

| Module | Data source |
|---|---|
| 01 Reliability & Cost | `CALL SISTEM 2026.xlsx`, sheet `new section` (Oct 2025 to Apr 2026) |
| 02 Maintenance Calendar | `Data_dashboard.xlsx`, sheet `Maintenance_Kalender` (239 orders) |
| 03 Inventory Monitoring | `Data_dashboard.xlsx`, sheet `Min_Max_Stok` (1676 materials) |

## Run locally
1. Unzip and open `index.html` in a browser (no server, build step or install needed).
2. Charts use Chart.js 2.4.0 from cdnjs, so the first load needs internet. For offline use, download that file, save it as `vendor/Chart.min.js`, and change the script tag in `index.html` to `vendor/Chart.min.js`. Without Chart.js, the KPIs, calendar and tables still work and a warning banner appears.
3. Optional data and calculation checks (Node.js): `node test/validate.js`

## Files
| File | Role |
|---|---|
| `index.html` | Page layout, filters, containers. IDs are prefixed `rc-`, `mc-`, `iv-` per module |
| `css/styles.css` | Styling and status colors |
| `js/data.js` | The three datasets copied from the Excel files (REL, ORD, MAT). Replace this layer for real data |
| `js/calc.js` | Pure calculations (no DOM): IR, MTTR, MTBF, orders per month and type, inventory gap and status |
| `js/ui.js` | Rendering, filters, calendar, sortable tables, charts |
| `test/validate.js` | Node checks of data consistency and calculations |
| `CALL SISTEM 2026.xlsx`, `Data_dashboard.xlsx` | Source Excel files |

## Rules used
- Reliability (KALKULASI slide): IR (%) = Breakdown Time / Loading Time x 100; MTTR = Breakdown Time / Breakdown Frequency; MTBF = Loading Time / Breakdown Frequency. Loading Time = working hours - planned stop. Times are in minutes in the source and shown in hours. For a period, times and frequencies are summed first, then divided.
- Loading Time, Breakdown Time and Breakdown Frequency (troubles with Mesin Stop = Yes) are the per-section monthly figures in sheet `new section`. With these figures the formulas reproduce the IR, MTTR and MTBF printed in that sheet (checked in `test/validate.js`). PROD 1 to 3 = Cikarang, PROD 4 and 5 = Karawang.
- Maintenance cost, per-machine Loading Time and May 2026 are not available in the Call System file, so they show Unavailable or are left out.
- Calendar: each order is shown on its planned start date, coloured by order type (ZPM1, ZPM2). The sheet has no end date, status or confirmation, so Planned / Completed / Overdue and the completion rate are not calculated (Unavailable).
- Inventory: Gap = Actual Stock - Minimum Stock, calculated by the app. Out of Stock when Actual Stock is 0; then Below Minimum, Above Maximum, Normal. A material with no minimum is Unclassified. The sheet has no unit column, so quantities are shown without a unit.

## Not done / not verified
- In `Min_Max_Stok`, Actual Stock is 0 for all 1676 materials, so every material shows Out of Stock. The sheet's own Gap column equals Actual - Minimum in only 1012 of 1676 rows (for example the first row has minimum 4, actual 0 and Gap -2); the app ignores that column and calculates Gap itself.
- Recomputing Breakdown Time from the raw sheet `data` of the Call System file (sum of `ResolvedTime` for Mesin Stop = Yes, PROD 1 to 5) gives different totals from the KPI sheet (for example Jan 2026: 365,473 min against 433,643 min), so the dashboard uses the KPI sheet figures. The rule behind the KPI sheet figures is not confirmed.
- Not tested in the real B2E runtime, and not opened in every browser. Field names are proposed, not verified SAP or Call System names.
- The UI was opened in a headless Chromium without internet, so Chart.js did not load and the charts were not checked visually. KPIs, filters, calendar and tables were checked.
"# Maintenance_FE" 
