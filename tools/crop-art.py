"""Crop card artwork out of item scans into Images/Art/items/<id>.jpg.

Usage (from the repo root): python3 tools/crop-art.py [id ...]
With no ids, crops every item in data/items.json that has a scan and no
"artBox" of null. A card can set "artBox": [left, top, right, bottom] as
fractions of the scan to override the default frame box.
"""
import json
import os
import sys

from PIL import Image

# Where the picture sits inside the standard item frame, as fractions of the scan.
DEFAULT_BOX = (0.178, 0.139, 0.831, 0.518)
OUT_DIR = 'Images/Art/items'
MAX_WIDTH = 400


def crop(card):
    box = card.get('artBox', DEFAULT_BOX)
    scan = Image.open(card['scan']).convert('RGB')
    w, h = scan.size
    art = scan.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))
    if art.width > MAX_WIDTH:
        art = art.resize((MAX_WIDTH, round(art.height * MAX_WIDTH / art.width)), Image.LANCZOS)
    path = os.path.join(OUT_DIR, card['id'] + '.jpg')
    art.save(path, quality=85, optimize=True)
    return path


def main(ids):
    cards = json.load(open('data/items.json', encoding='utf-8'))
    os.makedirs(OUT_DIR, exist_ok=True)
    for card in cards:
        if ids and card['id'] not in ids:
            continue
        if not card.get('scan') or 'artBox' in card and card['artBox'] is None or 'art' not in card:
            continue
        print(crop(card))


if __name__ == '__main__':
    main(sys.argv[1:])
