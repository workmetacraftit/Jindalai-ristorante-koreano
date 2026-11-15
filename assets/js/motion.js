/* Animazioni legate allo scroll (GSAP, ScrollTrigger e Lenis, nella cartella vendor/).
   Il sito funziona per intero anche senza questo file: qui si aggiunge solo il movimento.

   Come è organizzato:
   - gli elementi che "entrano" (testi, schede, modulo…) usano un solo IntersectionObserver;
   - ScrollTrigger serve solo dove il movimento segue lo scroll: foto dell'hero, titolo che si
     accende, foto dell'introduzione, nastro dei piatti e striscia orizzontale dei tagli da griglia;
   - il lavoro è spezzato in passi brevi, per non bloccare la pagina mentre si avvia. */
(function () {
  'use strict';

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true });

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return gsap.utils.toArray(sel, ctx); };

  // Regola di base: si anima solo ciò che è ancora sotto lo schermo.
  // Quello che il visitatore sta già guardando non sparisce per poi riapparire.
  function sotto(el) { return el.getBoundingClientRect().top > window.innerHeight * 0.97; }
  function soloSotto(list) { return list.filter(sotto); }

  var lenis = null;

  /* ---------- ingressi: un solo osservatore per tutta la pagina ---------- */
  var opzioni = new WeakMap();
  var osservatore = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    var gruppi = [];
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      osservatore.unobserve(en.target);
      var o = opzioni.get(en.target);
      if (!o) return;
      var g = null;
      for (var i = 0; i < gruppi.length; i++) if (gruppi[i].o === o) g = gruppi[i];
      if (!g) { g = { o: o, els: [] }; gruppi.push(g); }
      g.els.push(en.target);
    });
    gruppi.forEach(function (g) { g.o.mostra(g.els); });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;

  // Quando "el" entra nello schermo viene chiamata o.mostra con gli elementi entrati insieme
  function osserva(el, o) {
    if (!osservatore) { o.mostra([el]); return; }
    opzioni.set(el, o);
    osservatore.observe(el);
  }

  // Ingresso standard: dissolvenza con un piccolo spostamento
  function entra(sel, vars) {
    var list = soloSotto($$(sel));
    if (!list.length || !osservatore) return;
    vars = vars || {};
    var da = { opacity: 0 };
    if (vars.x) da.x = vars.x;
    if (vars.y !== 0) da.y = vars.y || 26;
    gsap.set(list, da);
    var o = {
      mostra: function (els) {
        gsap.to(els, { opacity: 1, x: 0, y: 0, stagger: vars.stagger || 0.07, duration: vars.duration || 0.8, overwrite: true, clearProps: 'transform' });
      }
    };
    list.forEach(function (el) { osserva(el, o); });
  }

  // Parole avvolte in due span: quello esterno fa da maschera, quello interno si muove
  function dividi(el) {
    var out = [];
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var outer = document.createElement('span');
            var inner = document.createElement('span');
            outer.className = 'sw';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
            out.push(inner);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    };
    walk(el);
    return out;
  }

  /* ---------- punto di lettura ---------- */
  // La striscia fissata allunga la pagina: prima di crearla si prende nota di cosa c'è in cima
  // allo schermo, e subito dopo si riporta lo scroll nello stesso punto.
  function puntoDiLettura() {
    if (window.scrollY < 8) return null;
    var els = $$('main h2, main h3, main .card, main .form, main .panel, main details, main p');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (!r.width && !r.height) continue; // elementi nascosti (es. i messaggi d'errore del modulo)
      if (r.top >= 0) return { el: els[i], top: r.top };
    }
    return null;
  }

  function vaiA(y) {
    if (lenis) {
      lenis.resize(); // la pagina si è appena allungata: senza questo il limite di scroll sarebbe quello vecchio
      lenis.scrollTo(y, { immediate: true, force: true });
    } else {
      window.scrollTo(0, y);
    }
  }

  function riordina() { ScrollTrigger.sort(); ScrollTrigger.refresh(); }

  /* ---------- i passi ---------- */
  var passi = [];

  // 1. Scroll morbido, barra di avanzamento, hero
  passi.push(function () {
    // Con mouse e trackpad lo scroll diventa morbido; sul touch resta quello nativo del telefono.
    // Lo spazio per l'intestazione fissa viene da scroll-margin-top nel CSS.
    if (window.Lenis) {
      lenis = new window.Lenis({
        anchors: true, lerp: 0.12,
        // a navigazione aperta (telefono) o con una foto ingrandita la pagina sotto resta ferma: Lenis lascia fare al browser
        prevent: function () { return /\b(nav|zoom)-open\b/.test(document.documentElement.className); }
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Home: la foto dell'hero scorre più lenta del testo
    if ($('.hero')) {
      gsap.to('.hero__shift', {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('.hero__in', {
        y: -60, opacity: 0.12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true }
      });
    }
  });

  // 2. Introduzione
  passi.push(function () {
    // Il titolo grande si accende parola per parola mentre si scorre.
    // Si parte da 0.4 e non da meno: così resta leggibile (contrasto) anche "spento".
    var frase = $('.statement');
    if (frase && sotto(frase)) {
      gsap.fromTo(dividi(frase), { opacity: 0.4 }, {
        opacity: 1, stagger: 0.16, duration: 0.5, ease: 'none',
        scrollTrigger: { trigger: frase, start: 'top 88%', end: 'top 42%', scrub: 0.4 }
      });
    }
    entra('.intro .kicker, .intro__txt > p, .facts li');

    var foto = $$('.intro .pic');
    var cornice = $('.intro__pics');
    if (cornice && sotto(cornice)) {
      gsap.set(foto, { clipPath: 'inset(100% 0% 0% 0%)' });
      osserva(cornice, {
        mostra: function () {
          gsap.to(foto, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.out', stagger: 0.12, clearProps: 'clipPath' });
        }
      });
    }
    foto.forEach(function (pic, i) {
      gsap.fromTo($('img', pic), { scale: 1.22 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: pic, start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.fromTo(pic, { y: i ? -34 : 34 }, {
        y: i ? 34 : -34, ease: 'none',
        scrollTrigger: { trigger: cornice, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });
  });

  // 3. Nastro dei piatti e titoli di sezione
  passi.push(function () {
    // Il nastro scorre da solo, accelera e cambia verso con lo scroll
    var nastro = $('.marquee__track');
    if (nastro) {
      var giro = gsap.to(nastro, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
      giro.totalTime(giro.duration() * 200); // margine per poter scorrere anche all'indietro
      giro.pause();
      var posa;
      ScrollTrigger.create({
        trigger: '.marquee', start: 'top bottom', end: 'bottom top',
        onToggle: function (self) { if (self.isActive) giro.play(); else giro.pause(); },
        onUpdate: function (self) {
          var v = self.getVelocity();
          var verso = v < 0 ? -1 : 1;
          gsap.to(giro, { timeScale: verso * (1 + Math.min(Math.abs(v) / 350, 6)), duration: 0.25, overwrite: true });
          clearTimeout(posa);
          posa = setTimeout(function () { gsap.to(giro, { timeScale: verso, duration: 0.8, overwrite: true }); }, 140);
        }
      });
    }

    // Le parole dei titoli salgono una dopo l'altra
    soloSotto($$('main .sec h2:not(.statement), main .mgroup__head h2, main .cta h2')).forEach(function (h) {
      var parole = dividi(h);
      gsap.set(parole, { yPercent: 115 });
      osserva(h, { mostra: function () { gsap.to(parole, { yPercent: 0, stagger: 0.05, duration: 0.9 }); } });
    });
  });

  // 4. Piatti. La striscia fissata cambia la lunghezza della pagina: tutto nello stesso passo,
  //    così il punto di lettura viene ripristinato prima che lo schermo si aggiorni.
  passi.push(function () {
    var segno = puntoDiLettura();
    var mm = gsap.matchMedia();
    var avviato = false;

    // Desktop: i tagli da griglia scorrono in orizzontale mentre la sezione resta ferma
    mm.add('(min-width: 1000px)', function () {
      var wrap = $('.grill');
      var list = wrap && $('.grid--grill', wrap);
      if (!list) return;
      var cards = $$('.card', list);
      var bar = $('.grill__bar i', wrap);
      list.classList.add('is-h');
      wrap.classList.add('is-pinned');
      // offsetWidth e non scrollWidth: non deve risentire delle schede ancora spostate dall'animazione d'ingresso
      var corsa = function () { return Math.max(0, list.offsetWidth - wrap.clientWidth); };

      if (sotto(wrap)) {
        gsap.set(cards, { opacity: 0, x: 90 });
        osserva(wrap, {
          mostra: function () { gsap.to(cards, { opacity: 1, x: 0, stagger: 0.09, duration: 0.9, overwrite: true, clearProps: 'opacity,transform' }); }
        });
      }
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap, start: 'center 53%', end: function () { return '+=' + corsa(); },
          pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true
        }
      });
      tl.to(list, { x: function () { return -corsa(); }, ease: 'none' }, 0);
      if (bar) tl.fromTo(bar, { scaleX: 0.18 }, { scaleX: 1, ease: 'none' }, 0);

      if (avviato) window.requestAnimationFrame(riordina); // cambio di larghezza a pagina già avviata
      return function () {
        list.classList.remove('is-h');
        wrap.classList.remove('is-pinned');
        gsap.set([list].concat(cards, bar ? [bar] : []), { clearProps: 'all' });
      };
    });

    // Telefono e tablet: la striscia si scorre col dito, le schede entrano insieme
    mm.add('(max-width: 999px)', function () {
      var cards = soloSotto($$('.grid--grill .card'));
      var strip = $('.strip');
      if (!cards.length || !strip) return;
      gsap.set(cards, { opacity: 0, x: 60 });
      osserva(strip, {
        mostra: function () { gsap.to(cards, { opacity: 1, x: 0, stagger: 0.1, duration: 0.9, overwrite: true, clearProps: 'transform' }); }
      });
      return function () { gsap.set(cards, { clearProps: 'all' }); };
    });

    // Le posizioni si calcolano dall'alto verso il basso, poi si torna al punto di lettura
    riordina();
    if (segno) {
      var delta = segno.el.getBoundingClientRect().top - segno.top;
      if (Math.abs(delta) > 2) vaiA(window.scrollY + delta);
      ScrollTrigger.update();
    }
    avviato = true;

    entra('.piatti .kicker, .piatti .sec__lead, .piatti .group, .piatti .note');
    entra('.grid--kitchen .card', { y: 48, stagger: 0.09, duration: 0.9 });
  });

  // 5. Home, "Le nostre radici": i petali girano con lo scroll e la linea del tempo si accende
  passi.push(function () {
    var radici = $('.radici');
    if (!radici) return;
    entra('.radici .kicker, .radici__txt > p, .radici__txt > .btn');

    var fiore = $('.azalea', radici);
    if (fiore) {
      gsap.fromTo(fiore, { rotation: -50, scale: 0.75 }, {
        rotation: 40, scale: 1, ease: 'none',
        scrollTrigger: { trigger: radici, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    }

    var linea = $('.tl', radici);
    if (linea) {
      // La linea dorata segue lo scroll (variabile --tl, letta dal CSS) e ogni data accende la sua lampadina
      gsap.fromTo(linea, { '--tl': 0 }, {
        '--tl': 1, ease: 'none',
        scrollTrigger: { trigger: linea, start: 'top 72%', end: 'bottom 62%', scrub: 0.4 }
      });
      $$('.tl__i', linea).forEach(function (li) {
        ScrollTrigger.create({
          trigger: li, start: 'top 72%',
          onEnter: function () { li.classList.add('is-on'); },
          onLeaveBack: function () { li.classList.remove('is-on'); }
        });
      });
      entra('.tl__i', { y: 30, stagger: 0.1 });
    }
  });

  // 6. Pagine interne: le voci del menu e i paragrafi della storia entrano mentre si scorre
  passi.push(function () {
    entra('.mgroup__head p, .msec__head, .mi, .alg, .credits, .cta__in > *', { y: 16, stagger: 0.03, duration: 0.5 });
    entra('.story__toc, .story__body > *', { y: 22 });
  });

  // 7. Prenotazione, orari, domande, scritta finale
  passi.push(function () {
    entra('.prenota .kicker, .prenota__txt > p, .direct li');
    entra('.form', { y: 60, duration: 1.1 });
    // I pannelli sono anche destinazioni del menu (#orari, #dove): solo dissolvenza, niente spostamenti,
    // altrimenti il punto d'arrivo dello scroll verrebbe calcolato mentre sono fuori posto
    entra('.panel', { y: 0, duration: 1.1, stagger: 0.12 });
    entra('.panel address, .panel > p, .panel__cta', { y: 20 });
    entra('.hours tr', { y: 14, stagger: 0.05 });
    entra('.faq .kicker, .faq details');

    // Le lettere della scritta finale salgono una alla volta
    var big = $('.foot__big');
    if (big && sotto(big)) {
      var txt = big.textContent;
      big.textContent = '';
      big.classList.add('is-split');
      txt.split('').forEach(function (ch) {
        var sp = document.createElement('span');
        sp.textContent = ch;
        big.appendChild(sp);
      });
      gsap.set(big.children, { yPercent: 105 });
      osserva(big, { mostra: function () { gsap.to(big.children, { yPercent: 0, stagger: 0.06, duration: 1.1, ease: 'power4.out' }); } });
    }

    // Se i caratteri arrivano dopo, le altezze cambiano: si ricalcola una volta
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  });

  (function avanti() {
    var passo = passi.shift();
    if (!passo) return;
    passo();
    if (passi.length) window.setTimeout(avanti, 0);
  })();
})();
