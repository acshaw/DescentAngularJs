# Dev Plan 01: Foundation + Skills

**Status:** DRAFT, awaiting approval
**Depends on:** Plan 00 (approved with the recommended options)
**Style mock:** [`mockups/01-card-style.html`](mockups/01-card-style.html) (screenshot: [`mockups/01-card-style.png`](mockups/01-card-style.png))

## Goal

Build the shared card machinery (data loading, the card renderer, the text markup, the card CSS, the proof page and save migration) and prove it on the **84 skill cards**. When this phase is done, skills render from `data/skills.json`, and every other card type still uses its images.

---

## Findings since plan 00 that change it

1. **Skills have hard-coded stat effects too, not only upgrades.** Eight skills change stats, keyed by name in `charctrl.js`: Bear Tattoo, Tough, Nimble, Shark Tattoo, Tiger Tattoo, Skilled, Spry and Swift. Each switch is copied three times (add from list, add random, remove). → **Amendment to D4:** skills get structured `effects` too. See decision 01-A.
2. **Spry is wrong today.** The card says +1 max fatigue **and** +1 speed. The code adds only +1 fatigue, and removing the card subtracts **2** fatigue. Moving effects into data fixes this as a side effect.
3. **Deck counts can be derived instead of saved.** The only things that change a skill deck's `qty` are taking a card (−1) and returning it (+1). So *remaining = deck qty − copies held by the party*. If saves store only what each hero holds, then adding or editing cards in the JSON later can never conflict with an old save. See decision 01-B.
4. The skill picker uses `<option value="{{item}}">` and `JSON.parse`, which stringifies whole objects. It will switch to `ng-options` keyed by id.

---

## Decisions for this phase

### 01-A. Effects schema for skills (amends D4)

**Recommended:**

```json
"effects": { "maxWounds": 2, "maxFatigue": 1, "speed": 1 }
```

The semantics match today's behaviour, minus the bugs:

- **Gain card:** each max goes up by n, and its current value goes up by the same n. Speed goes up by n.
- **Lose card:** each max goes down by n, and the current value is clamped to the new max. Speed goes down by n.

Upgrades (phase 05) will reuse the same keys plus power dice keys. This one code path replaces 3 × 8 switch cases.

### 01-B. Save format

**Recommended:** saves get `"version": 2`, and each character's skills are stored as a list of card ids. Skill deck arrays are **no longer saved**; they are rebuilt from the JSON minus what the party holds. Non-skill fields are saved exactly as today until their own phases.

Old (v1) saves are migrated on load. Each held skill's `name` is matched to an id within its deck. The old `fighterSkills` / `subterfugeSkills` / `wizardrySkills` arrays are ignored, since their counts are derivable. Character stats are **not** recalculated: old saves already have the effects baked in.

Unknown names (a card renamed or removed from the JSON) are kept as a placeholder "missing card" that shows its old name and can be removed. They are never silently dropped.

### 01-C. Keep the scans as a fallback?

**Recommended:** yes for now. Every card has an optional `scan` path. A small "view original" link shows the scan in the existing modal, and the proof page uses it too. Once you're happy with all the phases, a cleanup plan can delete the scans (about 90 MB).

---

## Work breakdown

### 1. Data: `data/skills.json`

- 84 records: `id`, `name`, `deck` (`fighter` | `subterfuge` | `wizardry`), `qty`, `text`, and optionally `effects`, `scan`
- ids are slugs of the name (`"Bear Tattoo"` → `"bear-tattoo"`), unique across all decks
- I transcribe the text from each scan using the markup from plan 00 (`**bold**`, `{fatigue}`, `{surge}`, ...)
- The small expansion symbol in the card corner is ignored, since the app doesn't use it. Say so if you want a `set` field.

### 2. `appScripts/cardService.js`

- Loads `data/*.json` once at startup with `$http`. The route waits for it, so templates never render half-loaded.
- `byId(id)`, `deck(kind, deck)`, `remaining(card, party)`
- `applyEffects(character, card, +1 | -1)`

### 3. `appScripts/cardText.js`: filter `cardText`

- HTML-escape → `**x**` → `<b>` → `{token}` → icon `<i>` → blank lines → `<p>`
- Rendered with `ng-bind-html` and `ngSanitize`; the module is added to `index.html`
- Unknown `{tokens}` are left visible as text, so typos are easy to spot

### 4. `appScripts/cardDirective.js`: `<dj-card card="..." on-remove="...">`

- A single template covering the header (kind and name), the text, effect chips and the optional art and footer (used from phase 03 on)
- Shown at a fixed width on a sideways-scrolling row, as in the mock

### 5. `Content/cards.css`

- The styles from the mock, moved out of inline `<style>` blocks
- Deck colours are defined once as CSS variables

### 6. Rewire skills in the app

- `character.html` Skills tab: an `ng-options` picker, the random button (unchanged behaviour) and a `<dj-card>` per held skill
- `charctrl.js`: `addSkill`, `addRandomSkill` and `removeItemFromSkills` collapse to a few lines each, using `cardService`. The three switch copies are deleted.
- `main.js`: the three skill arrays (about 90 lines) are deleted
- Save is copy-pasted in **three** controllers (`mainctrl`, `navctrl` and `charctrl`), and load lives in `mainctrl`. I'll consolidate them into one `saveService` so the format lives in one place.

### 7. `proof.html` (dev and review page, linked from nowhere in the app)

- Shows every skill as the new HTML card next to its original scan, grouped by deck
- On a phone it shows one pair per row; tap the scan to enlarge it
- This is how you review the transcription

### 8. `tools/check-data.js` (Node, run by me before each push)

- Checks that ids are unique, required fields are present, `effects` keys are valid and markup tokens are known
- Checks that `scan` and `art` paths exist with **exact case**, since Pages is case-sensitive

---

## Test plan

Automated headless Chromium runs at phone (Pixel 7) and desktop size:

1. Create a party, add a skill from each deck, and add a random skill. The decks' remaining counts drop.
2. Add Spry: max fatigue +1, fatigue +1, speed +1. Remove it: everything is back to the start values. This is the regression test for the old bug.
3. Add Tough with the hero wounded, then remove it: wounds are clamped to the max.
4. Save, reload the page, and load the file: same skills, same counts.
5. **Load a v1 save** (I'll generate one from the current app before changing anything): skills appear as HTML cards, stats are unchanged, and deck counts are correct.
6. No 404s or JS errors in the console, except the pre-existing `src="{{...}}"` noise for not-yet-converted types.

Manual (you): skim `proof.html` on your phone and report any transcription errors.

## Out of scope for 01

Feats, items, upgrades and heroes. Restyling the rest of the page. Deleting the skill scans (see 01-C).

## Risks

- **Transcription errors.** These are mitigated by the proof page and your review.
- **`$http` loading means the app needs a web server.** That's already true on Pages and IIS, but opening `index.html` straight from disk (`file://`) won't load the data. This is accepted per plan 00, and I'll note it in a README.
- **Three duplicate save copies.** If consolidation turns up behaviour differences between them, I'll keep the `mainctrl` version and note it.

## Deliverables

`data/skills.json`, `appScripts/cardService.js`, `cardText.js`, `cardDirective.js`, `saveService.js`, `Content/cards.css`, `proof.html`, `tools/check-data.js`, edits to `index.html`, `character.html`, `main.js`, `charctrl.js`, `mainctrl.js` and `navctrl.js`, and this plan marked DONE with notes.
