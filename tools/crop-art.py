"""Crop card artwork out of card scans into each card's "art" path.

Usage (from the repo root): python3 tools/crop-art.py [id ...]
With no ids, crops every card in DATA_FILES that has both "art" and
"scan" (cards sharing an art path are cropped once). A card can set
"artBox": [left, top, right, bottom] as fractions of the scan to override
the default frame box, or "artBox": null to skip cropping.
"""
import json
import os
import sys

from PIL import Image

# Where the picture sits inside the standard item frame, as fractions of the scan.
DEFAULT_BOX = (0.178, 0.139, 0.831, 0.518)
MAX_WIDTH = 400
DATA_FILES = ['data/items.json', 'data/upgrades.json']


def crop(card):
    box = card.get('artBox', DEFAULT_BOX)
    scan = Image.open(card['scan']).convert('RGB')
    w, h = scan.size
    art = scan.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))
    if art.width > MAX_WIDTH:
        art = art.resize((MAX_WIDTH, round(art.height * MAX_WIDTH / art.width)), Image.LANCZOS)
    path = card['art']
    os.makedirs(os.path.dirname(path), exist_ok=True)
    art.save(path, quality=85, optimize=True)
    return path


def main(ids):
    cards = []
    for path in DATA_FILES:
        cards += json.load(open(path, encoding='utf-8'))
    done = set()
    for card in cards:
        if ids and card['id'] not in ids:
            continue
        if not card.get('scan') or not card.get('art') or card['art'] in done:
            continue
        if 'artBox' in card and card['artBox'] is None:
            continue
        done.add(card['art'])
        print(crop(card))


if __name__ == '__main__':
    main(sys.argv[1:])
