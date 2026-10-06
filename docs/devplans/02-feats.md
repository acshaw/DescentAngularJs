# Dev Plan 02: Feats

**Status:** DRAFT, awaiting approval
**Depends on:** Plan 01 (done)

## Goal

Render the **27 feat cards** (9 Fighter, 9 Subterfuge, 9 Wizardry, 46 copies in total) from `data/feats.json` using the phase 01 machinery, and remove the last image-based code from the Skills/Feats half of the app.

## What I found

- **The feat code is a copy of the old skill code**: a picker filled by stringified objects, plus `addFeat`, `addRandomFeat` and `removeItemFromFeats`, each with a three-way deck switch. No feat changes hero stats, so there are no hidden effects this time.
- **Feats have multiple copies.** For example, Fend, Follow Through, Hustle, Focus, Shooting for Distance and We Are Not Afraid each have 3 copies. The phase 01 "remaining = copies − copies held" logic already handles this.
- **Second Wind is in two decks.** It has the same text in Fighter and Subterfuge, but it is a separate physical card in each deck. Phase 01 ids are unique across the whole app, so these two need different ids (decision 02-A).
- **One printed title differs from the app's name:** the app says "Chink in Armor", the card says **Chink in the Armor**. As in phase 01, the printed name is used and the old one becomes an alias.
- **The three "orphan" images are card backs** (`Back.jpg` in each feat folder), not missing cards. There's nothing to add, so the "Relics"-style question from plan 00 doesn't come up for feats.
- **Feat text has no stat icons.** It's all plain words ("surge", "power die"), so no new markup tokens are needed.

## Decisions for this phase

### 02-A. Ids for cards that share a name across decks

- **Recommended: add a deck suffix only when names collide.** That gives `second-wind-fighter` and `second-wind-subterfuge`; every other feat is a plain slug (`hurry`, `focus`). `check-data.js` already fails on duplicate ids, so a future collision can't slip through.
- Alternative: prefix every feat id with its deck (`fighter-hurry`). This is uniform but noisier to type when editing the JSON.

### 02-B. Save format version

Phase 01 saves (v2) still store feats the old way: whole objects, plus the three feat deck arrays.

- **Recommended: bump the save to v3.** In v3, feats are stored as ids and feat deck arrays are no longer saved. Migration becomes per field rather than per version: any held card that is still an object gets mapped by name and deck. That way v1, v2 and v3 saves all load through one code path, and phases 03–06 extend it the same way.

### 02-C. Share the code, not just the renderer

- **Recommended:** turn the phase 01 skill functions into three generic helpers: `addCard(field, card)`, `removeCard(field, index)` and `drawRandom(field, choices)`. Skills and feats then both call them, the deck picker HTML becomes one reusable piece, and items/upgrades get it for free later. This touches phase 01 code, but the phase 01 test suite guards it.
- Alternative: copy the skill functions for feats. This is quicker today, but the next four phases would each copy them again.

## Work breakdown

1. **`data/feats.json`**: 27 records (`id`, `name`, `deck`, `qty`, `text`, optional `aliases` and `scan`), transcribed from the scans. The scan paths keep the existing folder names (`Images/Feats/Fighting/…`).
2. **`cardService`**: add `feats` to the loaded kinds, and add the generic helpers from 02-C.
3. **`charctrl.js`**: `addFeat`, `addRandomFeat`, `removeItemFromFeats` and `switchFeatDeck` collapse onto the helpers, and the skill functions move onto them too.
4. **`character.html` Feats tab**: an `ng-options` picker and `<dj-card>` row, the same as Skills. The existing deck button (`switchFeatLabel`) keeps working.
5. **`main.js`**: delete the three feat arrays (about 35 lines).
6. **`saveService`**: v3 format and per-field migration (02-B).
7. **`cardDirective` / `cards.css`**: a "feat" kind label. The deck colours already exist.
8. **`proof.html`**: add feat groups below the skills.
9. **`check-data.js`**: add a feats schema.

## Test plan

Everything from phase 01 still passes, plus:

1. Add a feat from each deck, plus a random one. The deck shrinks, and a feat with 3 copies stays in the picker until all 3 are held.
2. Both Second Winds can be held at once (one from each deck), and removing one doesn't affect the other.
3. Save as v3, reload and load: skills and feats round-trip.
4. **A v2 save (phase 01 format) with feats** loads with the feats migrated. I'll generate that fixture from the current app before changing anything.
5. The v1 fixture still loads.
6. No new 404s or JS errors.

You'll proofread the 27 feats on `proof.html`.

## Out of scope

Items, upgrades and heroes, and deleting the feat scans or card backs (left for a cleanup plan).

## Size

Small: about 27 cards to transcribe plus a modest refactor. Most of the risk is in 02-C, and the existing tests cover it.
