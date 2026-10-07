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

Upgrades (`data/upgrades.json`) have a `tier`, `xp`, `cost` and `effects`. Besides `maxWounds`, `maxFatigue` and `speed`, effects can change power dice: `meleePower`, `meleeSilverPower`, `meleeGoldPower` (and the same for `ranged` and `magic`). A die count can't go below 0, and a hero can hold at most 5 power dice per attack type; changes that would break this are refused with a message.

Heroes live in `data/heroes.json`: `ability`, `wounds`, `fatigue`, `armor`, `speed`, `dice` (`melee`/`ranged`/`magic`), `traits` (`fighter`/`subterfuge`/`wizardry`) and `face`/`body` portrait paths. Saves store each party member's `heroId`, so edits to a hero's ability reach existing saves.

## Tests

`tests/e2e-cards.js` drives the app in headless Chromium (Playwright). See the comment at the top of the file for how to run it.
