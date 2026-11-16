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

  // Striscia dei tagli da griglia: su telefono e tablet si scorre di lato
  var strip = document.querySelector('.strip');
  var grill = document.querySelector('.grill');
  var bar = document.querySelector('.grill__bar i');
  if (strip && grill && window.matchMedia) {
    var stretto = window.matchMedia('(max-width: 999px)');
    var aggiornaBarra = function () {
      var max = strip.scrollWidth - strip.clientWidth;
      if (bar && max > 0) bar.style.transform = 'scaleX(' + (0.18 + 0.82 * Math.min(1, strip.scrollLeft / max)).toFixed(3) + ')';
    };
    var impostaStriscia = function () {
      grill.classList.toggle('is-swipe', stretto.matches);
      if (stretto.matches) strip.tabIndex = 0; // raggiungibile da tastiera quando si può scorrere
      else { strip.removeAttribute('tabindex'); if (bar) bar.style.transform = ''; }
    };
    strip.addEventListener('scroll', function () { if (stretto.matches) aggiornaBarra(); }, { passive: true });
    if (stretto.addEventListener) stretto.addEventListener('change', impostaStriscia); else stretto.addListener(impostaStriscia);
    impostaStriscia();
  }

  var riduci = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Navigazione su telefono: è un <details>, quindi si apre anche senza questo script.
  // Qui si aggiungono le rifiniture: chiusura con Esc, al tocco su un link e quando il focus esce.
  var mnav = document.querySelector('.mnav');
  if (mnav) {
    var pulsante = mnav.querySelector('summary');
    var chiudiNav = function (riportaFocus) {
      if (!mnav.open) return;
      mnav.open = false;
      document.documentElement.classList.remove('nav-open');
      if (riportaFocus && pulsante) pulsante.focus();
    };
    mnav.addEventListener('toggle', function () { document.documentElement.classList.toggle('nav-open', mnav.open); });
    mnav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.mnav__panel a')) chiudiNav(false); });
    mnav.addEventListener('focusout', function (e) { if (e.relatedTarget && !mnav.contains(e.relatedTarget)) chiudiNav(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudiNav(true); });
    if (window.matchMedia) {
      var largo = window.matchMedia('(min-width: 860px)');
      var seLargo = function () { if (largo.matches) chiudiNav(false); };
      if (largo.addEventListener) largo.addEventListener('change', seLargo); else largo.addListener(seLargo);
    }
  }

  // Foto dei piatti: il tocco apre la versione grande in una finestra sopra la pagina.
  // Senza questo script il link porta semplicemente al file della foto.
  var zoom = null;
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[data-zoom]') : null;
    if (!link || !window.HTMLDialogElement || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    if (!zoom) {
      zoom = document.createElement('dialog');
      zoom.className = 'zoom';
      zoom.setAttribute('aria-label', 'Foto del piatto');
      zoom.innerHTML = '<figure><img alt="" width="800" height="800"><figcaption><b></b><span></span></figcaption></figure>' +
        '<form method="dialog"><button class="zoom__x" aria-label="Chiudi la foto">\u00d7</button></form>';
      zoom.addEventListener('click', function (ev) { if (ev.target === zoom) zoom.close(); }); // tocco fuori dalla foto
      zoom.addEventListener('close', function () { document.documentElement.classList.remove('zoom-open'); });
      document.body.appendChild(zoom);
    }
    var img = zoom.querySelector('img');
    img.removeAttribute('src'); // così non resta visibile la foto precedente mentre arriva la nuova
    img.src = link.getAttribute('href');
    img.alt = link.querySelector('img') ? link.querySelector('img').alt : '';
    zoom.querySelector('b').textContent = link.getAttribute('data-zoom');
    var credito = link.getAttribute('data-credit');
    var nota = zoom.querySelector('span');
    nota.textContent = credito || '';
    nota.hidden = !credito;
    document.documentElement.classList.add('zoom-open');
    zoom.showModal();
  });

  // Pagina del menu: nella barra delle sezioni resta evidenziata quella che si sta leggendo
  var cats = document.querySelector('.cats');
  if (cats && window.requestAnimationFrame) {
    var barra = cats.querySelector('.cats__in');
    var tappe = []; // le sezioni che hanno una voce nella barra, nell'ordine della pagina
    Array.prototype.forEach.call(cats.querySelectorAll('a[href^="#"]'), function (a) {
      var sez = document.getElementById(a.getAttribute('href').slice(1));
      if (sez) tappe.push({ sez: sez, voce: a });
    });
    var attuale = null;
    var segna = function (tappa) {
      if (tappa === attuale) return;
      if (attuale) attuale.voce.removeAttribute('aria-current');
      attuale = tappa;
      var x = 0;
      if (tappa) {
        tappa.voce.setAttribute('aria-current', 'location');
        x = tappa.voce.offsetLeft - (barra.clientWidth - tappa.voce.offsetWidth) / 2;
      }
      if (barra.scrollWidth > barra.clientWidth + 1) { // su telefono la barra scorre di lato: la voce attiva resta al centro
        if (barra.scrollTo) barra.scrollTo({ left: x, behavior: riduci ? 'auto' : 'smooth' }); else barra.scrollLeft = x;
      }
    };
    // "In lettura" è l'ultima sezione il cui inizio ha superato una linea a un terzo dello schermo.
    // Prima della prima sezione e dopo la fine dell'ultima non è evidenziato nulla.
    var inAttesa = false;
    var trovaAttuale = function () {
      inAttesa = false;
      var linea = window.innerHeight * 0.3;
      var trovata = null;
      for (var i = 0; i < tappe.length; i++) {
        if (tappe[i].sez.getBoundingClientRect().top > linea) break;
        trovata = tappe[i];
      }
      if (trovata === tappe[tappe.length - 1] && trovata.sez.getBoundingClientRect().bottom < linea) trovata = null;
      segna(trovata);
    };
    var chiedi = function () { if (!inAttesa) { inAttesa = true; window.requestAnimationFrame(trovaAttuale); } };
    window.addEventListener('scroll', chiedi, { passive: true });
    window.addEventListener('resize', chiedi);
    chiedi();
  }

  // Animazioni: i file si scaricano solo a pagina pronta e a sipario d'apertura alzato,
  // così non rallentano la comparsa della pagina. Vengono eseguiti nell'ordine qui sotto.
  // Chi ha chiesto al sistema di ridurre i movimenti non li scarica affatto.
  var ANIMAZIONI = [
    '/assets/js/vendor/gsap.min.js?v=3.15.1',
    '/assets/js/vendor/ScrollTrigger.min.js?v=3.15.1',
    '/assets/js/vendor/lenis.min.js?v=1.3.27',
    '/assets/js/motion.js?v=4'
  ];
  if (document.querySelector('.hero__spark')) ANIMAZIONI.push('/assets/js/hero-lights.js?v=1'); // le luci della facciata ci sono solo in home
  function avviaAnimazioni() {
    if (riduci) return;
    // Il sipario c'è solo in home, e solo quando non si arriva già puntati su una sezione
    var sipario = document.querySelector('.ov');
    var stile = sipario && window.getComputedStyle(sipario);
    var attesa = stile && stile.display !== 'none' && stile.visibility !== 'hidden' ? 1500 : 500;
    var trascorso = window.performance && performance.now ? performance.now() : 0;
    window.setTimeout(function () {
      ANIMAZIONI.forEach(function (src) {
        var s = document.createElement('script');
        s.src = src;
        s.async = false;
        document.head.appendChild(s);
      });
    }, Math.max(0, attesa - trascorso));
  }
  if (document.readyState === 'complete') avviaAnimazioni();
  else window.addEventListener('load', avviaAnimazioni);

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
