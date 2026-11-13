# Jindalai Ristorante — sito

Sito statico (HTML, CSS e JavaScript, senza build) del ristorante coreano Jindalai di Prato.

## Le pagine

| Pagina | File | Contenuto |
|---|---|---|
| Home | `index.html` | Hero, introduzione, piatti in evidenza, «Le nostre radici», prenotazione via WhatsApp, orari, indirizzo, FAQ |
| Menu | `menu/index.html` | Tutti i piatti con i prezzi, allergeni e note |
| La storia | `storia/index.html` | Il testo sull'etnia coreana di Yanbian che apre il menu del ristorante |
| Errore | `404.html` | Pagina non trovata |

## Come modificare il menu

Piatti e prezzi stanno in **`data/menu.json`**. Dopo ogni modifica:

```
node tools/build-menu.mjs
```

Lo script riscrive dentro `menu/index.html` l'elenco dei piatti, la barra delle sezioni, la legenda
degli allergeni, la data di aggiornamento e i dati strutturati per i motori di ricerca. Non servono
installazioni: basta Node.js. Se nel file c'è un errore (prezzo mancante, allergene inesistente) lo
script si ferma e dice quale.

Ogni voce può avere:

| Campo | Significato |
|---|---|
| `n` | Numero del piatto sul menu del ristorante |
| `name`, `ko`, `zh` | Nome in italiano, coreano e cinese |
| `desc` | Descrizione o ingredienti |
| `price` | Prezzo in euro (`prices` quando ce n'è più d'uno, come per la pancetta) |
| `spicy` | `true` per l'etichetta «Piccante» |
| `frozen` | `true` per l'etichetta «Surgelato» (l'asterisco del menu cartaceo) |
| `allergens` | Lettere degli allergeni del singolo piatto, es. `["B", "N"]` |

Gli allergeni indicati per un'intera sezione (`allergens` della sezione) compaiono sotto il titolo.
Per cambiare la data «prezzi aggiornati a…» si modifica `updated` in cima al file (anno-mese).

Due voci del menu cartaceo non sono state riportate perché sul menu risultano coperte o cancellate:
la n. 15 e la n. 23.

## Gli altri file

| File | A cosa serve |
|---|---|
| `assets/css/style.css` | Tutto lo stile, compresi sipario d'apertura e ingresso dell'hero (solo CSS) |
| `assets/js/main.js` | Stato aperto/chiuso, modulo di prenotazione, navigazione su telefono, sezione evidenziata nel menu, caricamento delle animazioni |
| `assets/js/motion.js` | Animazioni di scroll: titoli, foto in parallasse, nastro dei piatti, striscia orizzontale fissata, linea del tempo, ingressi |
| `assets/js/hero-lights.js` | Le lampadine della foto di facciata che brillano (un `<canvas>` sopra l'immagine) |
| `assets/js/vendor/` | Librerie in copia locale: GSAP 3.15.1, ScrollTrigger 3.15.1, Lenis 1.3.27 |
| `assets/img/` | Foto in AVIF e WebP, in più larghezze |
| `vercel.json`, `.vercelignore` | Cache, header di sicurezza e file esclusi per il deploy su Vercel |

Testata e piè di pagina sono ripetuti uguali nelle tre pagine: una modifica va riportata in tutte
e tre. `node tools/build-menu.mjs` avvisa se non coincidono.

## Come funzionano le animazioni

- Il sito è completo anche senza JavaScript: gli script aggiungono solo il movimento. Anche la
  navigazione su telefono si apre senza script.
- I file di animazione vengono scaricati da `main.js` dopo il caricamento della pagina, così non
  pesano sull'apertura. L'elenco è nella costante `ANIMAZIONI`.
- Chi ha attivato «riduci movimento» nel sistema non vede né sipario né animazioni, e gli script
  non vengono nemmeno scaricati.
- Si anima solo ciò che è ancora sotto lo schermo: quello che il visitatore sta già guardando
  non scompare per poi riapparire.
- **Sipario d'apertura**: blocco `.ov` in cima a `index.html` e relative regole in `style.css`.
  Compare solo in home e solo arrivando senza `#sezione` nell'indirizzo; per questo i link interni
  alla home sono scritti `/#inizio`, `/#prenota` eccetera. Per toglierlo basta eliminare il blocco
  `.ov` e portare `--d0` a `0s` sotto «hero entrance».
- **Luci dell'hero**: le posizioni delle lampadine sono state rilevate dalla foto originale e
  stanno nella costante `DATA` di `hero-lights.js`. Se si cambia la foto dell'hero vanno
  ricalcolate (o si toglie il file dall'elenco `ANIMAZIONI`).

## Prima di andare online

Il dominio `https://www.jindalaiprato.it` è un segnaposto. Sostituiscilo con quello vero in
`index.html`, `menu/index.html`, `storia/index.html` (canonical, Open Graph, dati strutturati),
`robots.txt` e `sitemap.xml`, poi rilancia `node tools/build-menu.mjs`.

## Modifiche frequenti

- **Orari**: tabella in `index.html`, blocco `openingHoursSpecification` e FAQ nel JSON-LD, oggetto `ORARI` in `main.js`.
- **Numero WhatsApp**: costante `WHATSAPP` in `main.js` e link `wa.me` nelle tre pagine.
- Dopo aver cambiato CSS o JS, aumenta il numero dopo `?v=` nel riferimento a quel file
  (nelle pagine, oppure in `ANIMAZIONI` dentro `main.js` per i file di animazione).

## Anteprima in locale

```
python3 -m http.server 8080
```

Poi apri `http://localhost:8080`. Non aprire i file con il doppio clic: i percorsi partono
dalla radice del sito.
