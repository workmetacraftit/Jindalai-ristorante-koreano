# Jindalai Ristorante — sito

Sito statico (HTML, CSS, JS senza dipendenze né build) del ristorante coreano Jindalai di Prato.

- `index.html` — pagina unica: piatti, prenotazione via WhatsApp, orari, indirizzo, FAQ
- `assets/css/style.css`, `assets/js/main.js` — stile e logica (stato aperto/chiuso, modulo prenotazione)
- `assets/img/` — foto in AVIF e WebP, in due larghezze
- `vercel.json` — cache e header di sicurezza (per il deploy su Vercel)

## Prima di andare online

Il dominio `https://www.jindalaiprato.it` è un segnaposto. Sostituiscilo con quello vero in
`index.html` (canonical, Open Graph, dati strutturati), `robots.txt` e `sitemap.xml`.

## Modifiche frequenti

- **Orari**: tabella in `index.html`, blocco `openingHoursSpecification` nel JSON-LD e oggetto `ORARI` in `main.js`.
- **Numero WhatsApp**: costante `WHATSAPP` in `main.js` e link `wa.me` in `index.html`.
- Dopo aver cambiato CSS o JS, aumenta il `?v=` nei link in `index.html`.

## Anteprima in locale

```
python3 -m http.server 8080
```
