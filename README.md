# Descent Party Tracker

An AngularJS 1.x app for tracking a party in *Descent: Journeys in the Dark* (1st edition).

Live: https://acshaw.github.io/DescentAngularJs/

## Running locally

Card data loads from `data/*.json`, so the app has to be served over HTTP. Opening `index.html` straight from disk (`file://`) won't work. From the repo root:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Card data

Cards that have been converted are defined in `data/*.json` (see `docs/devplans/`). To add or edit a card, edit the JSON and then run:

```
node tools/check-data.js
```

`proof.html` shows every data-driven card next to its original scan.

Card text markup:

- `**bold**`, `*italic*`, `***bold italic***`
- `{surge}`, `{fatigue}`, `{wound}`, `{power}`, `{red}`, `{blue}`, `{white}`, `{green}`, `{yellow}`, `{black}`, `{silver}`, `{gold}`
- a blank line (`\n\n` in JSON) starts a new paragraph

Skill `effects` change hero stats when the card is gained or lost: `maxWounds`, `maxFatigue`, `speed`.

Items (`data/items.json`) also take `category` (Weapon, Armor, Shield, Other, Potion), `rune`, `attack` (Melee, Ranged, Magic), `abilities` (bold lines), `surges` (`[{"cost": 2, "effect": "+1 Damage"}]`), `cost`, `hands` and `dice` (e.g. `["red", "green"]`). `art` points at a picture; `python3 tools/crop-art.py <id>` crops one from the card's scan. An item with only a `scan` (no text or category yet) shows the scan as its picture.

## Tests

`tests/e2e-cards.js` drives the app in headless Chromium (Playwright). See the comment at the top of the file for how to run it.
