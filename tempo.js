// Weather details for the Brasil TV app: tempo.html?c=rio | edmond
// Runs on the TV's Chromium 63: ES2017, no optional chaining.
(function () {
  var CITIES = {
    rio: { name: 'Rio de Janeiro', lat: -22.91, lon: -43.17 },
    edmond: { name: 'Edmond', lat: 35.65, lon: -97.48 }
  };
  var ICONS = {
    sun: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="13" fill="#ffd166"/><g stroke="#ffd166" stroke-width="4" stroke-linecap="round"><line x1="32" y1="4" x2="32" y2="12"/><line x1="32" y1="52" x2="32" y2="60"/><line x1="4" y1="32" x2="12" y2="32"/><line x1="52" y1="32" x2="60" y2="32"/><line x1="12" y1="12" x2="18" y2="18"/><line x1="46" y1="46" x2="52" y2="52"/><line x1="12" y1="52" x2="18" y2="46"/><line x1="46" y1="18" x2="52" y2="12"/></g></svg>',
    moon: '<svg viewBox="0 0 64 64"><path d="M40 8a24 24 0 1 0 16 40A20 20 0 0 1 40 8z" fill="#f4e7b9"/><circle cx="14" cy="14" r="1.6" fill="#fff"/><circle cx="22" cy="6" r="1.2" fill="#fff"/><circle cx="8" cy="28" r="1.2" fill="#fff"/></svg>',
    partly: '<svg viewBox="0 0 64 64"><circle cx="24" cy="24" r="11" fill="#ffd166"/><path d="M22 50h26a10 10 0 0 0 0-20 14 14 0 0 0-26 4 8 8 0 0 0 0 16z" fill="#eef2f7"/></svg>',
    cloud: '<svg viewBox="0 0 64 64"><path d="M16 48h32a11 11 0 0 0 0-22 16 16 0 0 0-30 5 9 9 0 0 0-2 17z" fill="#d9dee7"/></svg>',
    rain: '<svg viewBox="0 0 64 64"><path d="M16 40h32a11 11 0 0 0 0-22 16 16 0 0 0-30 5 9 9 0 0 0-2 17z" fill="#d9dee7"/><g stroke="#7cc4ff" stroke-width="4" stroke-linecap="round"><line x1="22" y1="46" x2="18" y2="56"/><line x1="34" y1="46" x2="30" y2="56"/><line x1="46" y1="46" x2="42" y2="56"/></g></svg>',
    storm: '<svg viewBox="0 0 64 64"><path d="M16 38h32a11 11 0 0 0 0-22 16 16 0 0 0-30 5 9 9 0 0 0-2 17z" fill="#b8bfcc"/><path d="M34 40l-8 12h7l-4 10 11-14h-7l4-8z" fill="#ffd166"/></svg>',
    fog: '<svg viewBox="0 0 64 64"><g stroke="#d9dee7" stroke-width="5" stroke-linecap="round"><line x1="10" y1="24" x2="54" y2="24"/><line x1="16" y1="34" x2="48" y2="34"/><line x1="10" y1="44" x2="54" y2="44"/></g></svg>'
  };
  function describe(code, isDay) {
    if (code === 0) return [isDay ? 'sun' : 'moon', 'Céu limpo'];
    if (code <= 2) return [isDay ? 'partly' : 'moon', 'Poucas nuvens'];
    if (code === 3) return ['cloud', 'Nublado'];
    if (code <= 48) return ['fog', 'Neblina'];
    if (code <= 57) return ['rain', 'Garoa'];
    if (code <= 67) return ['rain', 'Chuva'];
    if (code <= 82) return ['rain', 'Pancadas de chuva'];
    return ['storm', 'Tempestade'];
  }

  var $ = function (id) { return document.getElementById(id); };
  var key = (location.search.match(/[?&]c=(\w+)/) || [])[1];
  var city = CITIES[key] || CITIES.rio;
  $('city').textContent = city.name;

  // Times from the API are the city's own local time, e.g. "2026-10-31T14:00"
  function hourOf(t) { return t.slice(11, 13) + 'h'; }
  function dayName(d, i) {
    if (i === 0) return 'Hoje';
    if (i === 1) return 'Amanhã';
    var s = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
    return s.replace('-feira', '');
  }
  function rain(p) { return '<div class="rain">' + (p >= 10 ? '💧 ' + p + '%' : '&nbsp;') + '</div>'; }

  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat + '&longitude=' + city.lon +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day' +
    '&hourly=temperature_2m,weather_code,precipitation_probability,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset' +
    '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7';

  fetch(url).then(function (r) { return r.json(); }).then(function (w) {
    var c = w.current, h = w.hourly, d = w.daily;
    var now = describe(c.weather_code, c.is_day === 1);
    $('now-icon').innerHTML = ICONS[now[0]];
    $('now-temp').textContent = Math.round(c.temperature_2m) + '°F';
    $('now-desc').textContent = now[1] + ' · ↑' + Math.round(d.temperature_2m_max[0]) + '° ↓' + Math.round(d.temperature_2m_min[0]) + '°';
    $('now-facts').innerHTML =
      '<div><span>Sensação</span>' + Math.round(c.apparent_temperature) + '°F</div>' +
      '<div><span>Umidade</span>' + c.relative_humidity_2m + '%</div>' +
      '<div><span>Vento</span>' + Math.round(c.wind_speed_10m) + ' mph</div>' +
      '<div><span>Chuva hoje</span>' + d.precipitation_probability_max[0] + '%</div>';
    $('sun').innerHTML = '☀ nasce ' + d.sunrise[0].slice(11).replace(':', 'h') + ' · se põe ' + d.sunset[0].slice(11).replace(':', 'h') +
      '<div class="local">horário local de ' + city.name + '</div>';

    // Every 2 hours from the current hour, 12 slots = the next day
    var start = h.time.indexOf(c.time.slice(0, 13) + ':00');
    if (start < 0) start = 0;
    var hours = '';
    for (var i = start; i < start + 24 && i < h.time.length; i += 2) {
      var x = describe(h.weather_code[i], h.is_day[i] === 1);
      hours += '<div class="cell"><div class="when">' + (i === start ? 'Agora' : hourOf(h.time[i])) + '</div>' +
        ICONS[x[0]] + '<div class="t">' + Math.round(h.temperature_2m[i]) + '°</div>' + rain(h.precipitation_probability[i]) + '</div>';
    }
    $('hours').innerHTML = hours;

    var days = '';
    for (var j = 0; j < d.time.length; j++) {
      var y = describe(d.weather_code[j], true);
      days += '<div class="cell day"><div class="when">' + dayName(d.time[j], j) + '</div>' + ICONS[y[0]] +
        '<div class="t">' + Math.round(d.temperature_2m_max[j]) + '° <span>' + Math.round(d.temperature_2m_min[j]) + '°</span></div>' +
        '<div class="d">' + y[1] + '</div>' + rain(d.precipitation_probability_max[j]) + '</div>';
    }
    $('days').innerHTML = days;
    $('msg').textContent = '';
  }).catch(function () { $('msg').textContent = 'Não foi possível carregar a previsão.'; });
})();
