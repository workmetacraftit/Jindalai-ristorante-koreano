# Jindalai Ristorante — sito

Sito statico (HTML, CSS e JavaScript, senza build) del ristorante coreano Jindalai di Prato.

## Cosa c'è

| File | A cosa serve |
|---|---|
| `index.html` | Pagina unica: hero, introduzione, piatti, prenotazione via WhatsApp, orari, indirizzo, FAQ |
| `assets/css/style.css` | Tutto lo stile, compresi sipario d'apertura e ingresso dell'hero (solo CSS) |
| `assets/js/main.js` | Stato aperto/chiuso, modulo di prenotazione, striscia a scorrimento su telefono, caricamento delle animazioni |
| `assets/js/motion.js` | Animazioni di scroll: titolo che si accende, foto in parallasse, nastro dei piatti, striscia orizzontale fissata, ingressi |
| `assets/js/hero-lights.js` | Le lampadine della foto di facciata che brillano (un `<canvas>` sopra l'immagine) |
| `assets/js/vendor/` | Librerie in copia locale: GSAP 3.15.1, ScrollTrigger 3.15.1, Lenis 1.3.27 |
| `assets/img/` | Foto in AVIF e WebP, in più larghezze |
| `vercel.json` | Cache e header di sicurezza per il deploy su Vercel |

## Come funzionano le animazioni

- Il sito è completo anche senza JavaScript: gli script aggiungono solo il movimento.
- I file di animazione vengono scaricati da `main.js` dopo il caricamento della pagina, così non
  pesano sull'apertura. L'elenco è nella costante `ANIMAZIONI`.
- Chi ha attivato "riduci movimento" nel sistema non vede né sipario né animazioni, e gli script
  non vengono nemmeno scaricati.
- Si anima solo ciò che è ancora sotto lo schermo: quello che il visitatore sta già guardando
  non scompare per poi riapparire.
- **Sipario d'apertura**: blocco `.ov` in cima a `index.html` e relative regole in `style.css`.
  Per toglierlo basta eliminare quel blocco e azzerare i ritardi sotto "hero entrance".
- **Luci dell'hero**: le posizioni delle lampadine sono state rilevate dalla foto originale e
  stanno nella costante `DATA` di `hero-lights.js`. Se si cambia la foto dell'hero vanno
  ricalcolate (o si toglie il file dall'elenco `ANIMAZIONI`).

## Prima di andare online

Il dominio `https://www.jindalaiprato.it` è un segnaposto. Sostituiscilo con quello vero in
`index.html` (canonical, Open Graph, dati strutturati), `robots.txt` e `sitemap.xml`.

## Modifiche frequenti

- **Orari**: tabella in `index.html`, blocco `openingHoursSpecification` nel JSON-LD e oggetto `ORARI` in `main.js`.
- **Numero WhatsApp**: costante `WHATSAPP` in `main.js` e link `wa.me` in `index.html`.
- Dopo aver cambiato CSS o JS, aumenta il numero dopo `?v=` nel riferimento a quel file
  (in `index.html`, oppure in `ANIMAZIONI` dentro `main.js` per i file di animazione).

## Anteprima in locale

```
python3 -m http.server 8080
```

Poi apri `http://localhost:8080`. Non aprire `index.html` con il doppio clic: i percorsi partono
dalla radice del sito.
