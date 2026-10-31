// Dollar-to-real details for the Brasil TV app: today's rate, change, last 3 months, conversions.
// Runs on the TV's Chromium 63: ES2017, no optional chaining.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function brl(v, digits) { return v.toFixed(digits === undefined ? 2 : digits).replace('.', ','); }
  function money(v) {
    var parts = v.toFixed(2).split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + parts[1];
  }
  function dayLabel(d, opts) { return new Intl.DateTimeFormat('pt-BR', Object.assign({ timeZone: 'UTC' }, opts)).format(new Date(d + 'T12:00:00Z')); }

  var from = new Date(Date.now() - 92 * 86400000).toISOString().slice(0, 10);
  fetch('https://api.frankfurter.dev/v1/' + from + '..?from=USD&to=BRL').then(function (r) { return r.json(); }).then(function (j) {
    var dates = Object.keys(j.rates).sort();
    var vals = dates.map(function (d) { return j.rates[d].BRL; });
    var last = vals[vals.length - 1], prev = vals[vals.length - 2];
    var diff = last - prev;

    $('rate').textContent = 'R$ ' + brl(last);
    $('change').className = 'change ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : '');
    $('change').textContent = (diff > 0 ? '▲ subiu ' : diff < 0 ? '▼ caiu ' : '= igual ') +
      'R$ ' + brl(Math.abs(diff), 3) + ' (' + brl(Math.abs(diff / prev * 100), 1) + '%) desde o dia anterior';
    $('asof').textContent = 'US$ 1 · cotação de ' + dayLabel(dates[dates.length - 1], { weekday: 'long', day: 'numeric', month: 'long' });

    drawChart(dates, vals);

    var rows = [1, 10, 50, 100, 500, 1000].map(function (u) {
      return '<tr><td>US$ ' + money(u).replace(',00', '') + '</td><td>R$ ' + money(u * last) + '</td></tr>';
    });
    rows.push('<tr><td>R$ 100</td><td>US$ ' + money(100 / last) + '</td></tr>');
    $('table').innerHTML = rows.join('');
    $('msg').textContent = '';
  }).catch(function () { $('msg').textContent = 'Não foi possível carregar a cotação.'; });

  // Line chart of the last 3 months with the low, high and month marks
  function drawChart(dates, vals) {
    var W = 1180, H = 560, L = 40, R = 150, T = 50, B = 60;
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = (hi - lo) * 0.12 || 0.05;
    lo -= pad; hi += pad;
    function x(i) { return L + i * (W - L - R) / (vals.length - 1); }
    function y(v) { return T + (hi - v) * (H - T - B) / (hi - lo); }
    var pts = vals.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); });
    var s = '<defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc66d" stop-opacity="0.35"/><stop offset="1" stop-color="#ffc66d" stop-opacity="0"/></linearGradient></defs>';

    // Month marks
    var month = '';
    dates.forEach(function (d, i) {
      if (d.slice(0, 7) === month) return;
      month = d.slice(0, 7);
      if (i === 0) return;
      s += '<line x1="' + x(i) + '" y1="' + T + '" x2="' + x(i) + '" y2="' + (H - B) + '" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>' +
        '<text x="' + (x(i) + 10) + '" y="' + (H - 22) + '">' + dayLabel(d, { month: 'long' }) + '</text>';
    });

    s += '<polygon points="' + x(0) + ',' + (H - B) + ' ' + pts.join(' ') + ' ' + x(vals.length - 1) + ',' + (H - B) + '" fill="url(#fill)"/>' +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#ffc66d" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>';

    function mark(i, label, above) {
      var cx = x(i), cy = y(vals[i]);
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="9" fill="#ffc66d"/>' +
        '<text x="' + Math.min(cx, W - R + 20) + '" y="' + (above ? cy - 20 : cy + 40) + '" text-anchor="middle">' + label + ' R$ ' + brl(vals[i]) + '</text>';
    }
    var iHi = vals.indexOf(Math.max.apply(null, vals)), iLo = vals.indexOf(Math.min.apply(null, vals));
    mark(iHi, 'máx.', true);
    mark(iLo, 'mín.', false);
    var n = vals.length - 1;
    s += '<circle cx="' + x(n) + '" cy="' + y(vals[n]) + '" r="12" fill="#fff"/>' +
      '<text x="' + (x(n) + 22) + '" y="' + (y(vals[n]) + 8) + '" style="font-size:30px;font-weight:800;fill:#fff">' + brl(vals[n]) + '</text>';
    $('chart').innerHTML = s;
  }
})();
