// Builds package/index.html: Shawn's three Bourbonnais purchases on the sellers' ACTUAL 12-month earnings,
// with two tabs: paying a cleaner vs. cleaning it himself. Run: node build-three.js
// Source: Downloads\2026-10-07 17-37.pdf (Airbnb earnings report + Vrbo payout summary, Oct 6 2025 - Oct 6 2026).
const fs = require('fs');
const path = __dirname + '/index.html';
const old = fs.readFileSync(path, 'utf8');
const head = old.slice(0, old.indexOf('</head>') + 7)
  .replace(/<title>[^<]*<\/title>/, '<title>Your Three Bourbonnais Houses — Actual Earnings</title>');
const tail = old.slice(old.indexOf('<div class="tooltip" id="tt"></div>'));

const RATES = [0.075, 0.08, 0.085];
const MAIN = 0.08;
const pmt = (loan, apr) => { const r = apr / 12, n = 360; return loan * r / (1 - Math.pow(1 + r, -n)); };

// Airbnb report "Reporting period" payouts, all three Airbnb homes combined (Oct = Oct 6-31 2025 + Oct 1-6 2026).
const MONTHS = [['October', 3830.10 + 1588.59], ['November', 3146.22], ['December', 7314.09], ['January', 6810.95],
  ['February', 7533.42], ['March', 8407.07], ['April', 10721.38], ['May', 7454.45], ['June', 10223.90],
  ['July', 8403.99], ['August', 12694.48], ['September', 8735.17]];
const MTOT = MONTHS.reduce((a, m) => a + m[1], 0);
const SHARE = MONTHS.map(m => m[1] / MTOT);

const houses = [
  {
    name: '423 S Rivard St', beds: '2BR/1BA', price: 200000, priceNote: 'price named',
    airbnb: { label: 'Airbnb "Revard"', gross: 29659.56, paid: 28064.71, nights: 178, avgStay: 3.1 },
    vrbo: { gross: 14598.37, paid: 13465.78, nights: 85, bookings: 27 },
    clean: 100, tax: 3170, taxNote: 'actual bill', maint: 125,
    chips: [['', 'Turnkey · already operating'], ['', '4.95★ × 374 reviews, Top 10%']],
    ev: 'Booked 263 of 365 nights last year (72%), above the town average of 64%. Lowest property-tax bill of the three.',
  },
  {
    name: '239 W Country Ct', beds: '3BR/1BA', price: 225000, priceNote: 'price named',
    airbnb: { label: 'Airbnb "Arnie\'s place"', gross: 37235.73, paid: 35553.20, nights: 211, avgStay: 3.2 },
    vrbo: { gross: 11085.44, paid: 10233.64, nights: 53, bookings: 26 },
    clean: 125, tax: 4800, taxNote: 'estimate — get the real bill', maint: 135,
    chips: [['', 'Turnkey · already operating'], ['tbd', '"Arnie\'s place" = Country Ct — confirm']],
    ev: 'Booked 264 of 365 nights last year (72%). Biggest earner of the three. Matched to the Airbnb report\'s "Arnie\'s place" because Ami hosts the Country Ct listing and her report covers only three houses (Smitty\'s, Rivard, Arnie\'s place).',
  },
  {
    name: '287 E Munroe St', beds: '4BR/1BA', price: 210000, priceNote: 'your offer',
    airbnb: null,
    vrbo: { gross: 14870.62, paid: 13719.46, nights: 74, bookings: 23 },
    clean: 150, tax: 4670, taxNote: 'estimate', maint: 135,
    chips: [['risk', 'Only 74 nights booked last year'], ['tbd', 'Vrbo lists it as "272 E Munroe Ave"']],
    ev: 'Vrbo only — it is not in the Airbnb report. 74 booked nights is 20% of the year. If a long-term tenant also paid rent for part of the year, that rent is not in this report and would raise this number.',
  },
];

const BILLS = { insurance: 150, utilities: 450, lawn: 125, supplies: 100 };
for (const h of houses) {
  const a = h.airbnb || { gross: 0, paid: 0, nights: 0, avgStay: 1 };
  h.gross = a.gross + h.vrbo.gross;
  h.paid = a.paid + h.vrbo.paid;
  h.nights = a.nights + h.vrbo.nights;
  h.stays = (h.airbnb ? Math.round(a.nights / a.avgStay) : 0) + h.vrbo.bookings;
  h.down = h.price * 0.2;
  h.loan = h.price - h.down;
  h.incomeMo = h.paid / 12;
  h.cleanerMo = h.stays * h.clean / 12;
  h.fixedNoLoan = h.tax / 12 + BILLS.insurance + BILLS.utilities + BILLS.lawn + BILLS.supplies + h.maint;
}

const $ = n => (Math.round(n) < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
const s$ = n => (Math.round(n) > 0 ? '+' : '') + $(n);
const pctOcc = h => Math.round(h.nights / 365 * 100) + '%';

// per-mode numbers
const MODES = [
  { key: 'paid', tab: 'Paying a cleaner', cleaner: true },
  { key: 'self', tab: 'Cleaning it myself', cleaner: false },
];
const cf = (h, mode, rate = MAIN) => h.incomeMo - pmt(h.loan, rate) - h.fixedNoLoan - (mode.cleaner ? h.cleanerMo : 0);
const billsMo = (h, mode) => pmt(h.loan, MAIN) + h.fixedNoLoan + (mode.cleaner ? h.cleanerMo : 0);
const monthCf = (h, mode, i) => h.paid * SHARE[i] - pmt(h.loan, MAIN) - h.fixedNoLoan - (mode.cleaner ? h.stays * h.clean * SHARE[i] : 0);

// one chart scale shared by both tabs so the bars compare
const vals = houses.flatMap(h => MODES.flatMap(m => RATES.map(r => cf(h, m, r))));
const lo = Math.floor(Math.min(...vals, 0) / 500) * 500 - 250, hi = Math.ceil(Math.max(...vals, 0) / 500) * 500 + 250;
const P = v => ((v - lo) / (hi - lo) * 100);
const Z = P(0);
const ticks = []; for (let t = Math.ceil(lo / 500) * 500; t <= hi; t += 500) ticks.push(t);
const grid = ticks.filter(t => t !== 0).map(t => `<span class="gl" style="left:${P(t).toFixed(2)}%"></span>`).join('');
function bar(v, cls, tip, top) {
  const left = v >= 0 ? Z : P(v), width = Math.abs(P(v) - Z);
  const labLeft = v >= 0 ? left + width + 1 : Math.max(left - 9, 0);
  return `<span class="bar ${cls}${v < 0 ? ' neg' : ''}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%" data-tip="${tip}"></span>` +
    `<span class="val ${cls === 'b' ? 'vb ' : ''}${v < 0 ? 'negv' : 'pos'} num" style="left:${labLeft.toFixed(2)}%;top:${top}px">${s$(v)}</span>`;
}
const color = v => `color:var(--${Math.round(v) >= 0 ? 'good' : 'bad'})`;

function view(mode) {
  const order = [...houses].sort((a, b) => cf(b, mode) - cf(a, mode));
  const all = houses.reduce((s, h) => s + cf(h, mode), 0);
  const two = cf(houses[0], mode) + cf(houses[1], mode);
  const totalDown = houses.reduce((s, h) => s + h.down, 0);
  const monthAll = MONTHS.map((_, i) => houses.reduce((s, h) => s + monthCf(h, mode, i), 0));
  const worstI = monthAll.indexOf(Math.min(...monthAll));
  const monthTwo = MONTHS.map((_, i) => monthCf(houses[0], mode, i) + monthCf(houses[1], mode, i));
  const worstTwoI = monthTwo.indexOf(Math.min(...monthTwo));
  const cleanerNote = mode.cleaner
    ? 'Bills include paying a cleaner for every stay.'
    : 'Bills leave out the cleaner — you do the cleaning yourself for free. Guests still pay the cleaning fee, so that money stays with you.';

  const chartRows = order.map((h, i) => `
    <div class="row"><div class="who"><span class="rk">${i + 1}</span><span class="nm">${h.name}</span><br><span class="pr num">${h.beds} · ${$(h.price)} ${h.priceNote} · ${h.nights} nights booked</span></div>
      <div class="plot">${grid}<span class="zero" style="left:${Z.toFixed(2)}%"></span>
        ${bar(cf(h, mode), 'a', `<b>${h.name}</b><br>${s$(cf(h, mode))}/mo at 8.0%<br>Income ${$(h.incomeMo)}/mo − bills ${$(billsMo(h, mode))}/mo`, 5)}
        ${bar(cf(h, mode, 0.075), 'b', `${s$(cf(h, mode, 0.075))}/mo at 7.5%`, 26)}
      </div></div>`).join('');

  const cards = order.map((h, i) => `
  <div class="card${cf(h, mode) < 0 ? ' neg' : ''}"><div class="rank">${i + 1}</div><div class="body">
    <div class="headline"><h3>${h.name}, Bourbonnais</h3>${h.chips.map(([c, t]) => `<span class="chip ${c}">${t}</span>`).join('')}</div>
    <div class="figs">
      <div class="fig"><div class="l">Paid out, last 12 mo</div><div class="v num">${$(h.paid)}</div></div>
      <div class="fig"><div class="l">Income per month</div><div class="v num">${$(h.incomeMo)}</div></div>
      <div class="fig"><div class="l">Bills per month</div><div class="v num">${$(billsMo(h, mode))}</div></div>
      <div class="fig"><div class="l">Left over / month</div><div class="v ${cf(h, mode) >= 0 ? 'pos' : 'negv'} num">${s$(cf(h, mode))}</div></div>
      <div class="fig"><div class="l">Cash in (20% down)</div><div class="v num">${$(h.down)}</div></div>
    </div>
    <div class="ev">${h.ev}</div>
    <div class="ev num">Where it came from: ${h.airbnb ? `${h.airbnb.label} ${$(h.airbnb.paid)} paid out (${h.airbnb.nights} nights) + ` : ''}Vrbo ${$(h.vrbo.paid)} paid out (${h.vrbo.nights} nights, ${h.vrbo.bookings} bookings). Guests paid ${$(h.gross)} before Airbnb/Vrbo fees.${mode.cleaner ? '' : ` Doing the cleaning yourself saves about ${$(h.cleanerMo)}/mo (${h.stays} cleanings a year).`}</div>
  </div></div>`).join('');

  const lines = [
    ['Loan payment (8.0%, 30 yr)', h => pmt(h.loan, MAIN)],
    ['Property taxes', h => h.tax / 12],
    ['Insurance', () => BILLS.insurance],
    ['Cleaner', h => mode.cleaner ? h.cleanerMo : 0],
    ['Utilities + Wi-Fi', () => BILLS.utilities],
    ['Lawn + snow', () => BILLS.lawn],
    ['Supplies', () => BILLS.supplies],
    ['Repairs + upkeep', h => h.maint],
  ];
  const billRows = lines.map(([label, f]) => `<tr><td>${label}${label === 'Cleaner' && !mode.cleaner ? ' (you do it)' : ''}</td>${houses.map(h => `<td>${$(f(h))}</td>`).join('')}</tr>`).join('\n    ');

  const monthRows = MONTHS.map((m, i) => {
    const tough = i === worstI || monthAll[i] === Math.min(...monthAll);
    return `<tr${tough ? ' class="tough"' : ''}><td>${m[0]}${tough ? ' <span class="chip risk">toughest</span>' : ''}</td>` +
      houses.map(h => `<td>${$(h.paid * SHARE[i])}</td><td style="${color(monthCf(h, mode, i))}">${s$(monthCf(h, mode, i))}</td>`).join('') +
      `<td><b style="${color(monthAll[i])}">${s$(monthAll[i])}</b></td></tr>`;
  }).join('\n    ');

  return `
<div class="tabpanel" data-tab="${mode.key}"${mode.key === 'paid' ? '' : ' hidden'}>
<p class="sub" style="margin:0 0 16px"><b>${mode.tab}:</b> ${cleanerNote}</p>

<div class="tiles">
  <div class="tile ${all >= 0 ? 'good' : 'warn'}"><div class="lbl">All three together · at 8.0%</div><div class="big num">${s$(all)}/mo</div><div class="ctx num">${s$(all * 12)}/yr on ${$(totalDown)} down</div></div>
  <div class="tile ${two >= 0 ? 'good' : 'warn'}"><div class="lbl">Rivard + Country Ct</div><div class="big num">${s$(two)}/mo</div><div class="ctx num">${s$(two * 12)}/yr on ${$(houses[0].down + houses[1].down)} down</div></div>
  <div class="tile warn"><div class="lbl">Toughest month · all three</div><div class="big num">${s$(monthAll[worstI])}</div><div class="ctx">${MONTHS[worstI][0]} — Rivard + Country Ct alone: ${s$(monthTwo[worstTwoI])} (${MONTHS[worstTwoI][0]})</div></div>
  <div class="tile"><div class="lbl">Nights booked last year</div><div class="big num">${pctOcc(houses[0])} · ${pctOcc(houses[1])} · ${pctOcc(houses[2])}</div><div class="ctx">Rivard · Country Ct · Munroe — town average is 64% (AirDNA, $32,800/yr)</div></div>
</div>

<section>
  <div class="sect-head"><h2>Left over each month, ranked</h2><div class="note">yearly average after every bill and the loan · hover a bar for detail</div></div>
  <div class="chart-scroll"><div class="chart">
    <div class="legend"><span><i class="sw a"></i>bank loan at 8.0%</span><span><i class="sw b"></i>at 7.5%</span></div>
    ${chartRows}
    <div class="axis"><div class="pad"></div><div class="scale num">${ticks.map(t => `<span class="t" style="left:${P(t).toFixed(2)}%">${s$(t)}</span>`).join('')}</div></div>
  </div></div>
</section>

<section>
  <div class="sect-head"><h2>Month by month — plan for the slow months</h2><div class="note">income in · left over after all bills · bank loan at 8.0%</div></div>
  <div class="panel"><div class="table-scroll"><table class="num month">
    <tr><th rowspan="2">Month</th>${houses.map(h => `<th colspan="2">${h.name.replace(/^\d+ \w /, '')}</th>`).join('')}<th rowspan="2">All three<br>left over</th></tr>
    <tr>${houses.map(() => '<th>In</th><th>Left over</th>').join('')}</tr>
    ${monthRows}
    <tr class="tot"><td><b>Year</b></td>${houses.map(h => `<td><b>${$(h.paid)}</b></td><td><b style="${color(cf(h, mode) * 12)}">${s$(cf(h, mode) * 12)}</b></td>`).join('')}<td><b style="${color(all * 12)}">${s$(all * 12)}</b></td></tr>
  </table></div>
  <p class="fine">Monthly split is an estimate: the Airbnb report only gives month totals for all of Ami's Airbnb houses combined, and Vrbo gives no months. Each house's real yearly payout is spread across the months in that same seasonal pattern. Bills are the same every month except the cleaner, who is paid per stay.</p></div>
</section>

<section>
  <div class="sect-head"><h2>House by house</h2><div class="note">real payouts from the earnings report</div></div>
  <div class="cards">${cards}
  </div>
</section>

<section>
  <div class="sect-head"><h2>Monthly money in and out (yearly average)</h2><div class="note">bank loan at 8.0% · 20% down</div></div>
  <div class="panel"><div class="table-scroll"><table class="num">
    <tr><th></th>${houses.map(h => `<th>${h.name.replace(/^\d+ \w /, '')}</th>`).join('')}</tr>
    <tr><td><b>Money in (actual payouts ÷ 12)</b></td>${houses.map(h => `<td><b>${$(h.incomeMo)}</b></td>`).join('')}</tr>
    ${billRows}
    <tr><td><b>Total bills</b></td>${houses.map(h => `<td><b>${$(billsMo(h, mode))}</b></td>`).join('')}</tr>
    <tr><td><b>Left over at 8.0%</b></td>${houses.map(h => `<td><b style="${color(cf(h, mode))}">${s$(cf(h, mode))}</b></td>`).join('')}</tr>
    <tr><td>Left over at 7.5%</td>${houses.map(h => `<td>${s$(cf(h, mode, 0.075))}</td>`).join('')}</tr>
    <tr><td>Left over at 8.5%</td>${houses.map(h => `<td>${s$(cf(h, mode, 0.085))}</td>`).join('')}</tr>
    <tr><td>Yearly return on cash in (8.0%)</td>${houses.map(h => `<td>${(cf(h, mode) * 12 / h.down * 100).toFixed(1)}%</td>`).join('')}</tr>
  </table></div></div>
</section>
</div>`;
}

// Third tab: the three Deal Analyzer workbooks (analyzers.json is made by extract-analyzers.py)
function analyzersPanel() {
  const AZ = JSON.parse(fs.readFileSync(__dirname + '/analyzers.json', 'utf8'));
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const table = sh => `<div class="azsheet"><h4>${esc(sh.name)}</h4><table class="num">` + sh.rows.map(r => {
    const cells = r.filter(c => c !== 'None');
    if (cells.length === 1) {
      if (/^(Address|Bed|Sq Ft)/.test(cells[0]) || cells[0].trim() === sh.name || /Calculations$/.test(cells[0].trim())) return '';
      return `<tr class="sub"><td colspan="4">${esc(cells[0])}</td></tr>`;
    }
    return '<tr>' + r.map(c => `<td>${c === 'None' ? '' : esc(c)}</td>`).join('') + '</tr>';
  }).join('') + '</table></div>';
  return `<div class="tabpanel" data-tab="analyzers" hidden>
<p class="sub" style="margin:0 0 16px"><b>Property Analyzers:</b> your Deal Analyzer workbooks, updated with the sellers' actual earnings and the 8% bank loan. They use the paid-cleaner numbers — to see cleaning it yourself, set <i>Amount Paid to Cleaner</i> to 0 in the workbook.</p>
${AZ.map(a => `<section><div class="sect-head"><h2>${esc(a.name)}</h2><a class="dl" href="${a.file}" download>Download the Excel workbook</a></div>
<div class="azgrid">${a.sheets.map(table).join('')}</div>
<p class="fine">${a.notes.filter(Boolean).map(esc).join('<br>')}</p></section>`).join('\n')}
</div>`;
}

const munroeAt72 =houses[2].incomeMo * (0.72 / (houses[2].nights / 365));
const body = `
<body>
<style>
  .tabs{display:flex;gap:6px;margin:0 0 18px;border-bottom:1px solid var(--line)}
  .tabs button{font:inherit;font-size:14px;font-weight:600;background:none;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;padding:9px 16px;color:var(--ink-2);cursor:pointer;margin-bottom:-1px}
  .tabs button[aria-selected="true"]{background:var(--surface);border-color:var(--line);color:var(--ink)}
  table.month td,table.month th{padding:6px 8px}
  table.month tr.tough td{background:var(--bad-bg)}
  table.month tr.tot td{border-top:2px solid var(--line)}
  table.month th{text-align:center}
  .fine{font-size:12px;color:var(--muted);margin:10px 0 0}
  .azgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
  .azsheet{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;box-shadow:var(--shadow);overflow-x:auto}
  .azsheet h4{margin:0 0 4px;font-size:14px;font-family:Georgia,serif}
  .azsheet table{margin-top:4px;font-size:12.5px}
  .azsheet td{padding:4px 6px}
  .azsheet tr.sub td{font-weight:700;color:var(--ink);text-align:left;padding-top:10px;border-bottom:1px solid var(--line)}
  a.dl{margin-left:auto;font-size:13px;font-weight:600;color:var(--s55);border:1px solid var(--s55);border-radius:999px;padding:4px 12px;text-decoration:none;white-space:nowrap}
</style>
<div class="wrap">
<header>
  <div class="eyebrow">Airbnb Acquisitions · Your three Bourbonnais purchases · Updated Oct 18, 2026</div>
  <h1>Your Three Houses — What They Actually Earned</h1>
  <p class="sub">Income is the sellers' <b>real Airbnb + Vrbo payouts</b> for Oct 6, 2025 – Oct 6, 2026, straight from the earnings report. Bills are the same ones used in your workbooks. The loan is a <b>bank loan at 8.0%, 20% down, 30 years</b>.</p>
</header>

<div class="banner">⚠️ <div><b>Munroe booked only 74 nights last year</b> (Vrbo only — it isn't in the Airbnb report), so on last year's bookings it loses money every month, even if you clean it yourself. Rivard and Country Ct both booked about 72% of the year.</div></div>

<div class="tabs" role="tablist">${MODES.map(m => `<button role="tab" data-for="${m.key}" aria-selected="${m.key === 'paid'}">${m.tab}</button>`).join('')}<button role="tab" data-for="analyzers" aria-selected="false">Property Analyzers</button></div>
${MODES.map(view).join('\n')}
${analyzersPanel()}

<section class="two-col">
  <div class="panel">
    <h3>What would change these numbers</h3>
    <ul>
      <li><b>Munroe's long-term rent</b> → if a tenant paid rent for part of last year, that money isn't in this report. Ask the sellers for it.</li>
      <li><b>Munroe at Rivard's pace</b> → about 72% booked would bring in roughly ${$(munroeAt72)}/mo instead of ${$(houses[2].incomeMo)}.</li>
      <li><b>Country Ct's real tax bill</b> → $4,800 is an estimate; every $1,200/yr off adds $100/mo.</li>
      <li><b>The loan rate</b> → each half-point moves all three together by about ${$(Math.abs(houses.reduce((s, h) => s + pmt(h.loan, 0.075) - pmt(h.loan, MAIN), 0)))}/mo.</li>
    </ul>
  </div>
  <div class="panel">
    <h3>Before you sign</h3>
    <ul>
      <li>Confirm <b>"Arnie's place" is Country Ct</b> with Ami.</li>
      <li>Fix the <b>Munroe address</b>: Vrbo says "272 E Munroe Ave", your draft says "287 E Munroe St".</li>
      <li>Get Munroe's <b>long-term rent history</b> and the Country Ct and Munroe <b>tax bills</b>.</li>
      <li>Bourbonnais short-term-rental permit for each house; IL real-estate attorney + CPA.</li>
    </ul>
  </div>
</section>

<footer>
  Income = what Airbnb and Vrbo actually paid out (after their fees) from Oct 6, 2025 to Oct 6, 2026, per the sellers' earnings report; rows for other houses in that report are not used. Bills = the same monthly amounts as your Deal Analyzer workbooks (insurance $150, utilities $450, lawn/snow $125, supplies $100, upkeep $125–135, taxes as listed), with the cleaner paid per actual stay (Airbnb nights ÷ average stay + Vrbo bookings) at $100 Rivard / $125 Country Ct / $150 Munroe. Loan = 20% down, 30-year bank loan; closing costs not included. This page is analysis, not a recommendation to buy.
</footer>
</div>

<script>
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    document.querySelectorAll('.tabpanel').forEach(p => p.hidden = p.dataset.tab !== b.dataset.for);
  }));
</script>
`;
fs.writeFileSync(path, head + body + tail, 'utf8');
for (const m of MODES) {
  console.log('==', m.tab);
  for (const h of houses) console.log(' ', h.name.padEnd(18), 'in/mo', Math.round(h.incomeMo), 'bills', Math.round(billsMo(h, m)), 'left 7.5/8/8.5', RATES.map(r => Math.round(cf(h, m, r))).join(' / '), 'stays', h.stays);
  const ma = MONTHS.map((_, i) => Math.round(houses.reduce((s, h) => s + monthCf(h, m, i), 0)));
  console.log('  months all-three:', MONTHS.map((x, i) => x[0].slice(0, 3) + ' ' + ma[i]).join(', '));
}
