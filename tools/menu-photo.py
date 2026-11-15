#!/usr/bin/env python3
"""Prepara la foto di un piatto per il menu: ritaglio quadrato e tre misure, in AVIF e WebP.

Uso:
  python3 tools/menu-photo.py FOTO NOME [--box x0,y0,x1,y1] [--focus fx,fy] [--zoom z]

  FOTO     la foto di partenza (JPEG o PNG)
  NOME     il nome da dare ai file, senza spazi: es. bibimbap  → assets/img/menu/bibimbap-400.webp
  --box    usa solo questo rettangolo della foto (in pixel), per escludere scritte o bordi
  --focus  il punto che deve restare al centro, da 0 a 1 (0.5,0.5 è il centro della foto)
  --zoom   quanto stringere sul piatto: 1 = tutto il lato corto, 1.3 = un po' più vicino
  --paper  per i ritagli piccoli presi dalla foto di un menu stampato: attenua la grana di stampa
           e salva solo le due misure della miniatura (in data/photos.json va indicato "small": true)

Poi: aggiungi la foto in data/photos.json, scrivi "photo": "NOME" nel piatto in data/menu.json
e lancia  node tools/build-menu.mjs.  Serve Python con Pillow 11.3 o successivo (per l'AVIF).
"""
import argparse
import os
import sys

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SIZES = {200: (56, 78), 400: (52, 76), 800: (50, 74)}  # lato → qualità (AVIF, WebP)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'img', 'menu')


def square(im, box=None, focus=(0.5, 0.5), zoom=1.0):
    im = ImageOps.exif_transpose(im).convert('RGB')
    if box:
        im = im.crop(tuple(box))
    w, h = im.size
    side = min(w, h) / max(zoom, 1.0)
    cx = min(max(focus[0] * w, side / 2), w - side / 2)
    cy = min(max(focus[1] * h, side / 2), h - side / 2)
    return im.crop((round(cx - side / 2), round(cy - side / 2), round(cx + side / 2), round(cy + side / 2)))


def clean_print(im):
    """Stampa fotografata: toglie la grana, poi ridà un po' di nitidezza, contrasto e colore."""
    im = im.filter(ImageFilter.MedianFilter(3))
    im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=80, threshold=2))
    im = ImageEnhance.Contrast(im).enhance(1.10)
    return ImageEnhance.Color(im).enhance(1.12)


def export(src, name, box=None, focus=(0.5, 0.5), zoom=1.0, out=OUT, paper=False):
    os.makedirs(out, exist_ok=True)
    sq = square(Image.open(src), box, focus, zoom)
    if paper:
        sq = clean_print(sq)
    for side, (q_avif, q_webp) in SIZES.items():
        if paper and side > 400:
            continue
        im = sq.resize((side, side), Image.LANCZOS)
        im.save(os.path.join(out, f'{name}-{side}.avif'), quality=q_avif, speed=3)
        im.save(os.path.join(out, f'{name}-{side}.webp'), quality=q_webp, method=6)
    return sq.size[0]


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Prepara la foto di un piatto per il menu.')
    ap.add_argument('foto')
    ap.add_argument('nome')
    ap.add_argument('--box')
    ap.add_argument('--focus', default='0.5,0.5')
    ap.add_argument('--zoom', type=float, default=1.0)
    ap.add_argument('--paper', action='store_true')
    a = ap.parse_args()
    if not a.nome.replace('-', '').isalnum() or a.nome != a.nome.lower():
        sys.exit('Il nome può contenere solo lettere minuscole, cifre e trattini.')
    side = export(a.foto, a.nome, [int(v) for v in a.box.split(',')] if a.box else None,
                  tuple(float(v) for v in a.focus.split(',')), a.zoom, paper=a.paper)
    print(f'{a.nome}: ritaglio di {side} px, file scritti in assets/img/menu/')
    if side < 400 and not a.paper:
        print('Attenzione: la foto è piccola, da vicino può apparire sfocata.')
