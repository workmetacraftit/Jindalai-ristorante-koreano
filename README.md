# Jindalai Ristorante — sito

Sito statico (HTML, CSS e JavaScript, senza build) del ristorante coreano Jindalai di Prato.

## Le pagine

| Pagina | File | Contenuto |
|---|---|---|
| Home | `index.html` | Hero, introduzione, piatti in evidenza, «Le nostre radici», prenotazione via WhatsApp, orari, indirizzo, FAQ |
| Menu | `menu/index.html` | Tutti i piatti con le foto, allergeni e note |
| La storia | `storia/index.html` | Il testo sull'etnia coreana di Yanbian che apre il menu del ristorante |
| Errore | `404.html` | Pagina non trovata |

## Come modificare il menu

Piatti, prezzi e foto stanno in **`data/menu.json`** e **`data/photos.json`**. Dopo ogni modifica:

```
node tools/build-menu.mjs
```

Lo script riscrive dentro `menu/index.html` l'elenco dei piatti con le foto, la barra delle sezioni,
la legenda degli allergeni, i crediti fotografici, la data di aggiornamento e i dati strutturati per
i motori di ricerca. Non servono installazioni: basta Node.js. Se c'è un errore (prezzo mancante,
foto non trovata, allergene inesistente) lo script si ferma e dice quale.

Ogni voce può avere:

| Campo | Significato |
|---|---|
| `n` | Numero del piatto sul menu del ristorante |
| `name`, `ko`, `zh` | Nome in italiano, coreano e cinese |
| `desc` | Descrizione o ingredienti |
| `price` | Prezzo in euro (`prices` quando ce n'è più d'uno, come per la pancetta) |
| `photo` | Nome della foto del piatto (vedi sotto) |
| `spicy` | `true` per l'etichetta «Piccante» |
| `frozen` | `true` per l'etichetta «Surgelato» (l'asterisco del menu cartaceo) |
| `allergens` | Lettere degli allergeni del singolo piatto, es. `["B", "N"]` |

Gli allergeni indicati per un'intera sezione (`allergens` della sezione) compaiono sotto il titolo.
Per cambiare la data «menu aggiornato a…» si modifica `updated` in cima al file (anno-mese).

**I prezzi** restano nel file ma sul sito non si vedono: in cima a `data/menu.json` c'è
`"showPrices": false`. Per mostrarli di nuovo basta scrivere `true` e rilanciare lo script.

Due voci del menu cartaceo non sono state riportate perché sul menu risultano coperte o cancellate:
la n. 15 e la n. 23.

### Le foto dei piatti

Per aggiungere o sostituire una foto (serve Python con Pillow 11.3 o successivo):

```
python3 tools/menu-photo.py la-mia-foto.jpg bibimbap
```

Il comando ritaglia la foto in un quadrato e la salva in tre misure in `assets/img/menu/`
(`--focus` e `--zoom` servono a centrare il piatto: `python3 tools/menu-photo.py -h`). Poi:

1. in `data/photos.json` aggiungi `"bibimbap": { "source": "own", "alt": "breve descrizione della foto" }`;
2. in `data/menu.json` scrivi `"photo": "bibimbap"` nel piatto;
3. lancia `node tools/build-menu.mjs`.

Le foto con `"source": "own"` sono quelle del ristorante. Quelle con `"source": "menu"` sono ritagli
dalle foto del menu stampato: sono piccole, quindi hanno `"small": true` e sul sito compaiono solo
come miniatura, senza ingrandimento (si preparano con `python3 tools/menu-photo.py … --paper`).
Appena c'è una foto vera del piatto conviene sostituirle. Quelle con `"source": "commons"` vengono
da Wikimedia Commons con licenza libera: per ognuna il file riporta titolo, autore, licenza e
indirizzo della fonte, e lo script compone da solo l'elenco dei crediti in fondo al menu (la
licenza lo richiede) e l'avviso che si tratta di foto indicative. Sostituendo una di queste con
una foto vera del piatto, basta cambiare `source` in `own` e togliere i dati dell'autore.

## Gli altri file

| File | A cosa serve |
|---|---|
| `assets/css/style.css` | Tutto lo stile, compresi sipario d'apertura e ingresso dell'hero (solo CSS) |
| `assets/js/main.js` | Stato aperto/chiuso, modulo di prenotazione, navigazione su telefono, sezione evidenziata e foto ingrandita nel menu, caricamento delle animazioni |
| `assets/js/motion.js` | Animazioni di scroll: titoli, foto in parallasse, nastro dei piatti, striscia orizzontale fissata, linea del tempo, ingressi |
| `assets/js/hero-lights.js` | Le lampadine della foto di facciata che brillano (un `<canvas>` sopra l'immagine) |
| `assets/js/vendor/` | Librerie in copia locale: GSAP 3.15.1, ScrollTrigger 3.15.1, Lenis 1.3.27 |
| `assets/img/` | Foto in AVIF e WebP, in più larghezze (`menu/` per quelle dei piatti) |
| `tools/menu-photo.py` | Prepara la foto di un piatto per il menu |
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

## Dove è pubblicato

Il sito è online su Vercel, all'indirizzo **https://jindalai-ristorante.vercel.app**
(progetto `jindalai-ristorante`).

Il collegamento tra Vercel e questo repository GitHub non è ancora attivo: ogni pubblicazione va
lanciata a mano e scarica il sito da GitHub a un commit preciso. Per avere la pubblicazione
automatica a ogni modifica basta installare l'app GitHub di Vercel sull'organizzazione
`workmetacraftit` e collegare il repository al progetto (Vercel → progetto → Settings → Git).

### Quando ci sarà un dominio proprio

L'indirizzo `https://jindalai-ristorante.vercel.app` è scritto in `index.html`, `menu/index.html`,
`storia/index.html` (canonical, Open Graph, dati strutturati), `robots.txt` e `sitemap.xml`.
Dopo aver aggiunto il dominio su Vercel va sostituito in questi file, poi si rilancia
`node tools/build-menu.mjs`.

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
