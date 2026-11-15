#!/usr/bin/env python3
"""Prepara la foto di un piatto per il menu: ritaglio quadrato e tre misure, in AVIF e WebP.

Uso:
  python3 tools/menu-photo.py FOTO NOME [--box x0,y0,x1,y1] [--focus fx,fy] [--zoom z]

  FOTO     la foto di partenza (JPEG o PNG)
  NOME     il nome da dare ai file, senza spazi: es. bibimbap  → assets/img/menu/bibimbap-400.webp
  --box    usa solo questo rettangolo della foto (in pixel), per escludere scritte o bordi
  --focus  il punto che deve restare al centro, da 0 a 1 (0.5,0.5 è il centro della foto)
  --zoom   quanto stringere sul piatto: 1 = tutto il lato corto, 1.3 = un po' più vicino

Poi: aggiungi la foto in data/photos.json, scrivi "photo": "NOME" nel piatto in data/menu.json
e lancia  node tools/build-menu.mjs.  Serve Python con Pillow 11.3 o successivo (per l'AVIF).
"""
import argparse
import os
import sys

from PIL import Image, ImageOps

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


def export(src, name, box=None, focus=(0.5, 0.5), zoom=1.0, out=OUT):
    os.makedirs(out, exist_ok=True)
    sq = square(Image.open(src), box, focus, zoom)
    for side, (q_avif, q_webp) in SIZES.items():
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
    a = ap.parse_args()
    if not a.nome.replace('-', '').isalnum() or a.nome != a.nome.lower():
        sys.exit('Il nome può contenere solo lettere minuscole, cifre e trattini.')
    side = export(a.foto, a.nome, [int(v) for v in a.box.split(',')] if a.box else None,
                  tuple(float(v) for v in a.focus.split(',')), a.zoom)
    print(f'{a.nome}: ritaglio di {side} px, file scritti in assets/img/menu/')
    if side < 400:
        print('Attenzione: la foto è piccola, da vicino può apparire sfocata.')
