(function () {
  'use strict';

  var WHATSAPP = '393881778110';
  // Orari per giorno della settimana (0 = domenica). null = chiuso. Chiusura a mezzanotte.
  var ORARI = { 0: 11, 1: 14, 2: null, 3: 14, 4: 14, 5: 11, 6: 11 };
  var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var ULTIMO_TAVOLO = 22.5; // ultimo orario prenotabile: 22:30

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Data e ora correnti a Prato, indipendenti dal fuso del visitatore.
  function oraRoma() {
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Rome', hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) {
      var d = new Date();
      parts = { year: d.getFullYear(), month: pad(d.getMonth() + 1), day: pad(d.getDate()), hour: d.getHours(), minute: d.getMinutes() };
    }
    var iso = parts.year + '-' + parts.month + '-' + parts.day;
    return {
      iso: iso,
      giorno: new Date(iso + 'T12:00:00Z').getUTCDay(),
      ore: Number(parts.hour) + Number(parts.minute) / 60
    };
  }

  function prossimaApertura(daGiorno) {
    for (var i = 1; i <= 7; i++) {
      var g = (daGiorno + i) % 7;
      if (ORARI[g] !== null) return { giorno: g, domani: i === 1 };
    }
  }

  var adesso = oraRoma();

  // Stato "aperto ora" nell'hero
  var stato = document.getElementById('stato');
  var statoTxt = document.getElementById('stato-txt');
  if (stato && statoTxt) {
    var apre = ORARI[adesso.giorno];
    if (apre !== null && adesso.ore >= apre) {
      stato.classList.add('is-open');
      statoTxt.textContent = 'Aperto ora, fino a mezzanotte';
    } else if (apre !== null) {
      stato.classList.add('is-shut');
      statoTxt.textContent = 'Chiuso ora, apriamo oggi alle ' + apre + ':00';
    } else {
      var p = prossimaApertura(adesso.giorno);
      stato.classList.add('is-shut');
      statoTxt.textContent = 'Oggi chiuso, riapriamo ' + (p.domani ? 'domani' : GIORNI[p.giorno]) + ' alle ' + ORARI[p.giorno] + ':00';
    }
  }

  // Riga di oggi nella tabella orari
  var riga = document.querySelector('.hours tr[data-d="' + adesso.giorno + '"]');
  if (riga) riga.classList.add('is-today');

  var anno = document.getElementById('anno');
  if (anno) anno.textContent = adesso.iso.slice(0, 4);

  // Il pulsante flottante compare solo tra l'hero e il modulo di prenotazione
  var fab = document.querySelector('.fab');
  var zone = [document.querySelector('.hero'), document.getElementById('prenota')].filter(Boolean);
  if (fab && zone.length && 'IntersectionObserver' in window) {
    var visibili = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visibili[en.isIntersecting ? 'add' : 'delete'](en.target); });
      fab.classList.toggle('is-hidden', visibili.size > 0);
    }, { rootMargin: '0px 0px -15% 0px' });
    zone.forEach(function (z) { io.observe(z); });
  }

  // Modulo di prenotazione -> messaggio WhatsApp
  var form = document.getElementById('form-prenota');
  if (!form) return;

  var nome = form.elements.nome;
  var data = form.elements.data;
  var ora = form.elements.ora;
  var errNome = document.getElementById('e-nome');
  var errData = document.getElementById('e-data');
  var errOra = document.getElementById('e-ora');

  data.min = adesso.iso;

  function giornoDi(iso) { return new Date(iso + 'T12:00:00Z').getUTCDay(); }

  function mostra(campo, box, msg) {
    if (msg) {
      box.textContent = msg;
      box.hidden = false;
      campo.setAttribute('aria-invalid', 'true');
    } else {
      box.hidden = true;
      campo.removeAttribute('aria-invalid');
    }
    return !msg;
  }

  function riempiOrari() {
    var iso = data.value;
    var scelto = ora.value;
    ora.innerHTML = '';
    var apre = iso ? ORARI[giornoDi(iso)] : null;
    var primo = document.createElement('option');
    primo.value = '';
    primo.textContent = !iso ? 'Scegli prima il giorno' : (apre === null ? 'Chiuso' : 'Scegli l’orario');
    ora.appendChild(primo);
    if (apre === null) return;
    var inizio = apre;
    if (iso === adesso.iso) inizio = Math.max(apre, Math.ceil((adesso.ore + 0.5) * 2) / 2);
    for (var t = inizio; t <= ULTIMO_TAVOLO; t += 0.5) {
      var v = pad(Math.floor(t)) + ':' + (t % 1 ? '30' : '00');
      var o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      if (v === scelto) o.selected = true;
      ora.appendChild(o);
    }
  }

  function controllaData() {
    var iso = data.value;
    if (!iso) return mostra(data, errData, 'Scegli il giorno.');
    if (iso < adesso.iso) return mostra(data, errData, 'Questa data è già passata.');
    if (ORARI[giornoDi(iso)] === null) return mostra(data, errData, 'Il martedì siamo chiusi: scegli un altro giorno.');
    if (ora.options.length < 2) return mostra(data, errData, 'Per oggi non ci sono più orari: scegli un altro giorno.');
    return mostra(data, errData, '');
  }

  data.addEventListener('change', function () { riempiOrari(); controllaData(); });
  nome.addEventListener('input', function () { if (nome.value.trim()) mostra(nome, errNome, ''); });
  ora.addEventListener('change', function () { if (ora.value) mostra(ora, errOra, ''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var okNome = mostra(nome, errNome, nome.value.trim() ? '' : 'Scrivi il nome per la prenotazione.');
    var okData = controllaData();
    var okOra = !okData || mostra(ora, errOra, ora.value ? '' : 'Scegli un orario.');
    if (!okNome) { nome.focus(); return; }
    if (!okData) { data.focus(); return; }
    if (!okOra) { ora.focus(); return; }

    var d = new Date(data.value + 'T12:00:00Z');
    var quando = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    var persone = form.elements.persone.value;
    var note = form.elements.note.value.trim();

    var righe = [
      'Ciao Jindalai, vorrei prenotare un tavolo.',
      '',
      'Nome: ' + nome.value.trim(),
      'Giorno: ' + quando,
      'Orario: ' + ora.value,
      'Persone: ' + persone
    ];
    if (note) righe.push('Note: ' + note);

    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(righe.join('\n'));
    var w = window.open(url, '_blank', 'noopener');
    if (!w) window.location.href = url;
  });
})();
