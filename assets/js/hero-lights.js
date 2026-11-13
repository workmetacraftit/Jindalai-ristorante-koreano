/* Luci della facciata: le lampadine della foto brillano davvero.
   Sopra l'immagine dell'hero c'è un <canvas> trasparente che accende e spegne piccoli aloni
   esattamente sulle lampadine della foto. Il sito funziona per intero anche senza questo file. */
(function () {
  'use strict';

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var hero = document.querySelector('.hero');
  var canvas = document.querySelector('.hero__spark');
  var img = document.querySelector('.hero__img img');
  if (!hero || !canvas || !img || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Posizioni delle lampadine nella foto originale (2016 x 1512 px).
  // Ogni lampadina occupa 4 caratteri: x e y a metà risoluzione, due cifre in base 36 ciascuna.
  var DATA = '2lbp8jd5bu8ubv9kac9f1qar8r9bb1cm7val7tcam8ewbdd8l1ddrbf38u8ul9c41g9d8rc0lh9vc09ca789bqcfpncnmpds3cb3a2bbkuaa7pb1leblpjaoaibuma7p9z8joa93lceybhc9p17zrt7tmfb0mmdlmk8c8bd22mbzp3fc7zajbcc09rc8379ja98v818nku9wa48zb88tac8n9fbnbs9tbxasbk9v1696lcdl9ea8949jbqbvmg9uld9p8dctkzbnn5b6mobcl1akmhcd23aflbaonpf1bwcm8fci2yafljf2bha0pvaon5bda5am8eb89f8enqadl87ynydf9k8la4bh9od6b68gbhdfbf9lbsdplgcg9d8ql3ez8rccb5c6kybzb19h8pajaoc53094pe708mcg1w9n2rac1nb63abnqud098agbxc1mhax22azl5dpbhbgazdlm0dg2h9812a7c0dyl59abwczljdj309c2o9jp7bhl7dia58iqrd828a0l97sa98ymj8u9nccko8j8rba0q9v819t24bmn2ae7wcvmqbwmr8031b07qajlhadp77km48yahc4ac9fr4f1kub7aidflhbr18a28bdc91bd9499878i3895au8pky8slw7wkp7xbu8ekt9l8lc4lg9vludvawdcmj8uagd9luea97ce99bvacctaod3ald6269kl78slh7ulueab9d40v998ya01aarl97h39arb9af239naxbql8d0ltcrmqeb1yb59scvky9haecjlccyb1a4mca3ag8hl7ag1baam97d9tcma2bwa9dmooelly8wa29ca1d4lhd5bu9b38a9kyboppcd2jbi7u8k8693bd87a5cua5czl57gae9nmnakmget9nc799d0mr76bqbf39b9m67pmgef99d4nbdrbzegp08cm89wl3cj9uc7bvd58z8xmfak9td588co2m9a15amae9nawbvlxeo2d9i2capa4a92zc42mbv1c9pmhdqqob6bxe437aub1aemhb0mi7z1ga87sawbxas1zb0btbql1ej2jaelgbs9g980qa2939v9u8w8jbcaxc42ea0bdankw7bqr9gbebm1da19nb29p9cb7cqbse285bvkuae8sb2ar9aa791abda8mbmme9ibi8tleak27b7kk88azdt1ba6a6arq6asm8762qa438by2s9xlu7ea7adl5ey7y92mk8nma99mm7kko8obgc9becuc08rac8t0s9tl5dp29ax9f8eoq923ebymg9u8ocybpcya08o818nabcumif4l6a2828hogal9nbsapbqbu8umnbqbw8i81b088bunk8aqq919ub89sbt2k9m7rc6ntciaqakly8kmeaf2lblmscopib8bk9bm3ec309wb8d4a78mrka72babmbaaaldjbha9bebq8mdc829poe8ma9c681ccqjewnn9sl5euki7cm19nlwcv1ma0918j8vbp7sapa9bmaxaxa0av2obg8sc618adlbd82vbznfctl3eopo8qq88ebgcokza5a8dbmge2lje7lwdsla8k92cw9z8t7s9lmcc7rh89b5debtambxdu298x8q8m32a3baapa2b43b9vbx92a78qkw8mbqbklcezmfa47p9d33a72k9f8kbyn89g7yas869bag9x97ar1q9w3ac2bse3m8ccmp7wpeacbydmmrbklzd2bzamqa781vbb91a789cobeec87afrpf7bscup4fdbv9qb1b2mna61z9slu83mgd2n376l2bu119pkp7ha7bqbkaja7dkatcpmoavn7chb7cl20a8ozcplgcta8am8w97o37z9ba3me979ab9l2eol38mbuc4mgcj86b91qa5qdf9139jmpeg2ia3asbw36b8prbebx89ak9e8qc8l8eyn7c31r9xbd9voqfea9cn2abm3094atbdof9ine7q8c8u8xcj1ya22ya2lh7qldem9t9mbcd8b4e6qfcsa9auq2fbp4eymma6mfanawajmx9q9ldalwdtldeul37clda939a0bh9qljexmnd38za09j9q7t96qxdwow8vle822h8x80baah7y24bb1zb8aj8pn296m6ei98c5mfa3agd17kcyl0cb2gbo8jbg8dd5aa8f9ictl38zqvae8fd89f9rmgef2nb9mh9nqnb6l1c5l4d0ltdf82af9z95l1aml38z7tcxaadym97dpe6zni7z939gldak399c2gb9ri8klz7d96c0axe5a0chbgax7zbvlvewbpbu9qb39ibz918dldbkqnbb2n9fm1et9593mnakkt8dauau129c1oazrh8skv7sbobca9d5bp9xl2e0olaj2c9vbdb2mfb49rap129i1garqcd4bxbhmgcikp7ha3a9qqcx8w9gm987kub6lfaw9dbd9qbdku9xm8a41oal9t9mrxf8bpbp9c8wmz7nmec187azlmca8cccmi90828zascfmi7hoxbkaxb7359smc85m6fbb5e93197l3cboqbnlbapl9ecltcepza09nbk7na38wbjl2cpolcmmgemlh9j9ka1ba9m1rauaxe8lc9d2j9xod8vl1azbp85b28h1s9jbya9quc3l789a9aza29uatdklietboaeag9maqe07t9i32ajbtddm5f5l37b1hau3f95a6a385bqkt97ks9tmleyaxe082daagbym5ehm2dn2ubdm19mbxad2fadpe7tow75kwanaq9m1lao9897m0eh839cmleza08gp099ktaimrbk9ga097aj8ccc2fa0l0a88g9jry79b8dl8tag37aja4b4979g8ccj80brbya9ai838fanahcmox7v8m9x2caoq0bub4cb8rasb7dv2saxl789ascz0ta6lv838m909gailedz3h8ubdafaabwlaap3h9xbh8z89c28uao9x9dm48x2cb6kvby3gag9oaeak9rb4chakbom692149tn1dxmgbn89anoe7bmgem23a59o9x9lcqaha43bc69fc3la928vcr9vbl279ol0a11padbsb5p48obsb2bubz9t8l7nasa698ks9lrqdk9r8c2mbvlb8sl4d8kvetaebclebjbx9eau95loezlz8fbqaa9r8u9f9rlvd3lkebbtayn59wozf28z9sm0en29a5aqa5kvay8q9wbxa2bhaxbxcemibhmfc5aqbnoof18s9kmrf1bkaj9w9zbc9b9obw179z8a90ljdu9cc898cwmncmm69ekv8tmi7hascfouf9ate98nco9ra4m59yaia9mpdylg96oqc5l2858r8vb6cum29m9faz918pbn8b2ubdnf7plfbvnjea0s93que82q9matbz21a9lyd91oao7vdc3ga5pxbhl5eb2iaam0ehmnb78jar32a4kxbc7pc388bgqbb09rain19tkycspsbm2a9t2vbrb8bc8p91mkceajcs9bbra8aqngdpl5e6ajb2aybb1i92lkeh33calddz1u96l2bann723cbo9jd2a08oay8db98olxf12vbv9nb8qhdepq9hn9al3eau9tdhb4dnaobqb68lme9mm976839glc937sb71d9836ca2vbr9b9ul69kb7cq1991lgb8b69881czakc8lleibo9qo98alh8q2k8yabagb28rl6899kd52ebdks90br979oat';

  // Ritagli della foto usati nell'hero: [x, y, larghezza, altezza] nella foto originale.
  var RITAGLI = { largo: [0, 280, 2016, 1020], alto: [600, 400, 850, 940] };

  var lampadine = [];
  for (var i = 0; i < DATA.length; i += 4) {
    lampadine.push({
      x: parseInt(DATA.substr(i, 2), 36) * 2,
      y: parseInt(DATA.substr(i + 2, 2), 36) * 2,
      fase: Math.random() * 6.2832,
      ritmo: 0.55 + Math.random() * 1.9,
      forza: 0.55 + Math.random() * 0.45
    });
  }

  // Alone caldo disegnato una volta sola e poi riusato per ogni lampadina
  var alone = document.createElement('canvas');
  alone.width = alone.height = 64;
  (function () {
    var c = alone.getContext('2d');
    var g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,248,226,1)');
    g.addColorStop(0.18, 'rgba(255,226,160,.85)');
    g.addColorStop(0.45, 'rgba(255,190,90,.28)');
    g.addColorStop(1, 'rgba(255,170,60,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  })();

  var visibili = [];
  var scala = 1;
  var dpr = 1;

  function misura() {
    var W = canvas.clientWidth;
    var H = canvas.clientHeight;
    if (!W || !H) return;
    // Risoluzione contenuta: gli aloni sono morbidi, non serve la piena densità dello schermo
    dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2200000 / (W * H)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    var r = /hero-m-/.test(img.currentSrc || img.src) ? RITAGLI.alto : RITAGLI.largo;
    var pos = window.getComputedStyle(img).objectPosition.split(' ');
    var px = parseFloat(pos[0]) / 100;
    var py = parseFloat(pos[1]) / 100;
    if (isNaN(px)) px = 0.5;
    if (isNaN(py)) py = 0.5;

    // Stessa geometria di object-fit: cover
    scala = Math.max(W / r[2], H / r[3]);
    var ox = (W - r[2] * scala) * px;
    var oy = (H - r[3] * scala) * py;
    var limite = Math.min(W, hero.clientWidth) + 12;
    var quante = hero.clientWidth < 720 ? 170 : 340;

    visibili = [];
    for (var i = 0; i < lampadine.length && visibili.length < quante; i++) {
      var l = lampadine[i];
      var X = (l.x - r[0]) * scala + ox;
      var Y = (l.y - r[1]) * scala + oy;
      if (X < -12 || X > limite || Y < -12 || Y > H + 12) continue;
      visibili.push({ X: X * dpr, Y: Y * dpr, fase: l.fase, ritmo: l.ritmo, forza: l.forza });
    }
  }

  var attivo = false;
  var inVista = true;
  var raf = 0;
  var ultimo = 0;
  var inizio = 0;

  function disegna(ora) {
    raf = window.requestAnimationFrame(disegna);
    if (ora - ultimo < 33) return; // circa 30 fotogrammi al secondo
    ultimo = ora;
    if (!inizio) inizio = ora;
    var t = ora / 1000;
    var entrata = Math.min(1, (ora - inizio) / 1600);
    var base = scala * dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < visibili.length; i++) {
      var l = visibili[i];
      var v = Math.sin(t * l.ritmo + l.fase);
      if (v <= 0) continue;
      v = v * v * v * l.forza * entrata;
      var d = (15 + 30 * v) * base;
      ctx.globalAlpha = v;
      ctx.drawImage(alone, l.X - d / 2, l.Y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  function aggiorna() {
    var deve = inVista && !document.hidden;
    if (deve && !attivo) { attivo = true; raf = window.requestAnimationFrame(disegna); }
    else if (!deve && attivo) { attivo = false; window.cancelAnimationFrame(raf); }
  }

  var attesa;
  function rimisura() { clearTimeout(attesa); attesa = setTimeout(misura, 160); }

  function avvia() {
    misura();
    window.addEventListener('resize', rimisura);
    img.addEventListener('load', rimisura);
    document.addEventListener('visibilitychange', aggiorna);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { inVista = e[0].isIntersecting; aggiorna(); }).observe(hero);
    }
    aggiorna();
  }

  // Parte dopo il sipario d'apertura
  setTimeout(avvia, 900);
})();
