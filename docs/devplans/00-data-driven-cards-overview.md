# Dev Plan 00: Data-Driven Cards (Overview)

**Status:** APPROVED with the recommended option for every decision (D1–D7).
Amendment proposed in plan 01: D4 extends structured `effects` to skills as well as upgrades, because skills also carry hard-coded stat changes.
**Branch:** `claude/project-phone-support-y0h17l`

## Goal

Replace the scanned card images with cards drawn in HTML/CSS from JSON data. Adding a card should mean adding a JSON entry, not finding a scan. Convert one card type at a time, and keep the app working after every phase.

## Process

1. Each phase gets its own dev plan in `docs/devplans/` (`01-...md`, `02-...md`, ...).
2. A plan stays **DRAFT** until you approve it. Nothing is built before approval.
3. After a phase ships, its plan is marked **DONE** with notes on anything that differed from the plan.

This document is the umbrella plan. It sets the shared architecture and the decisions that affect every phase. Approving it does **not** approve any phase.

---

## Current state (what we're replacing)

| Card type | Count (data / images) | Where defined | On the card |
|---|---|---|---|
| Skills (Fighter / Subterfuge / Wizardry) | 84 / 84 | `main.js` arrays | Title, rules text. No art. |
| Feats (Fighting / Subterfuge / Wizardry) | 27 / 30 | `main.js` arrays | Title, rules text, small deck icon. No art. |
| Store items | 27 / 29 | `main.js` | Title, art, type (Weapon, Melee), rules, cost, hands, dice |
| Copper / Silver / Gold treasure | 115 / 118 | `main.js` | Same as store, plus a tier icon |
| Upgrades (training) | 15 / 15 | `main.js` + **hard-coded effects** in `charctrl.js` switch statements | Title, art, XP cost, effect text, gold cost |
| Relics, RTL Upgrades | 0 / 21 | **Images only, not in the app** | Same as items |
| Heroes | 48 | `main.js` (already data) | Body and face portraits, trait text, stats |

Facts that shape the plan:

- **All card text exists only inside the images.** About 270 cards' worth of rules text has to be transcribed. This is the largest single piece of work.
- **Save files embed whole card objects**, including deck quantities and `src` image paths. A data change can break old saves unless loading migrates them.
- **Upgrade effects are hard-coded by name** (e.g. `case 'Maximum Wounds Copper': woundsCap + 4`). This is the one place where cards already have mechanical behaviour.
- `main.js` holds about 1,100 lines of data mixed with app setup.

---

## Target architecture

```
data/
  skills.json        one file per card type, loaded on demand
  feats.json
  items.json         store + copper/silver/gold (+ relics later)
  upgrades.json
  heroes.json
appScripts/
  cardService.js     loads JSON, indexes cards by id, builds the decks
  cardDirective.js   <dj-card card="item"></dj-card>, the one renderer for all types
  cardText.js        filter that turns the text markup into HTML icons and bold
Content/
  cards.css          card layout and theming per type and tier
```

### Card record (illustrative; each phase plan finalises its type)

```json
{
  "id": "able-warrior",
  "name": "Able Warrior",
  "kind": "skill",
  "deck": "fighter",
  "qty": 1,
  "text": "When you declare an **Advance** action, you may immediately spend 2 {fatigue} to make 2 attacks this turn instead of 1."
}
```

```json
{
  "id": "sword",
  "name": "Sword",
  "kind": "item",
  "deck": "store",
  "qty": 12,
  "category": "Weapon",
  "subtype": "Melee",
  "hands": 1,
  "dice": ["red", "green"],
  "cost": 75,
  "text": "{surge}{surge}: +1 Damage\n\nOff-Hand Bonus: +1 Damage",
  "art": "Images/Art/sword.jpg"
}
```

### Text markup

The text is a small, hand-editable markup that the filter turns into HTML:

- `**word**` renders as bold
- `{surge}`, `{fatigue}`, `{wound}`, `{red}`, `{blue}`, `{white}`, `{green}`, `{yellow}`, `{black}`, `{gold}`, `{silver}`, `{power}` render as small inline icons
- A blank line starts a new paragraph

The text is escaped before the markup is applied, so a mistake in the JSON can't inject HTML. The app adds `angular-sanitize`, which is already in `Scripts/`.

---

## Critical decision points

These are the choices I need you to make before phase plans can be finalised. My recommendation is listed first.

### D1. Who transcribes the card text?

- **A (recommended): I transcribe from the scans; you spot-check.** I read each image and write the JSON. Each phase ships a **proof page** (`proof.html`) that shows every card's new HTML next to its original scan, so you can review a whole deck in a couple of minutes. Expect a few errors per hundred cards, usually punctuation or an icon misread.
- B: You transcribe. This is accurate but slow for about 270 cards.
- C: OCR. This is poor with this card frame and the inline icons, and it would still need full review.

### D2. Card artwork

The item and upgrade cards have a picture. Skills and feats don't.

- **A (recommended): Crop the existing art from the scans** into `Images/Art/` as small images. The `art` field is optional, so new cards you invent can have no art, or any image you drop in.
- B: No art at all. Text-only cards with a type icon. This is cleanest and smallest, but the item cards lose their character.
- C: Keep the full scan as a fallback "view original" option. This can be combined with A or B.

### D3. Visual style of the HTML card

- **A (recommended): A clean modern card** with a colored header strip per deck or tier (store, copper, silver, gold; fighter red, subterfuge green, wizardry purple), readable sans-serif text, and phone-first sizing. It's quick to build and easy to read at a glance.
- B: Imitate the original parchment frame. This takes more CSS work, the parchment texture would have to be self-hosted, and it reads less well on small screens.

Before any phase is built, I'll show you a rendered mock of 2 or 3 cards in the chosen style.

### D4. Mechanical effects in data, or text only?

Today only upgrades change stats, and they do it through hard-coded switches.

- **A (recommended): Text only for skills, feats and items; structured `effects` only for upgrades**, for example `"effects": {"woundsCap": 4, "wounds": 4}`. That replaces the 200-line switch and lets you invent new upgrades in JSON.
- B: Structured effects everywhere (e.g. armor +3 from an item). This is much bigger, it would mean modelling game rules, and nothing in the app uses those values today.

### D5. Old save files

- **A (recommended): Migrate on load.** When an old save is opened, look each card up by `name`, attach its `id`, and drop the stale `src`. New saves store only ids and quantities. Old saves keep working.
- B: Break compatibility. This is simpler, but your existing party files stop loading.

### D6. How you'll add new content

- **A (recommended for now): Edit the JSON files** in GitHub's web editor or locally. A pushed change goes live on Pages. The proof page doubles as a preview.
- B: An in-app card editor (a form that writes JSON and offers it as a download). This would be a later, separate plan if you want it.

### D7. Copyright and public repo (a heads-up, not a blocker)

The repo is public, and the scans are already in it. Transcribing the card text adds the same Fantasy Flight content in text form. This doesn't change your exposure much, but you should be aware of it. Nothing in the plan depends on it.

---

## Phase order

Each phase leaves the app fully working, with converted types rendered from data and the rest still showing images.

| # | Phase | Why this order | Size |
|---|---|---|---|
| 01 | **Foundation + Skills** (84): cardService, `<dj-card>`, text filter, `cards.css`, proof page, save migration | Skills are text-only, so this is the simplest way to prove the whole pipeline | L |
| 02 | **Feats** (27 + 3 orphan images) | Same shape as skills; mostly transcription | S |
| 03 | **Store items** (27) | Adds art, cost, hands, dice and the item layout | M |
| 04 | **Copper / Silver / Gold** (115) | Reuses the phase 03 layout; mostly transcription | M |
| 05 | **Upgrades** (15) + `effects` data, deleting the switch statements | The only phase that touches game logic | M |
| 06 | **Heroes** move to `heroes.json`; portraits stay images | Finishes emptying `main.js` | S |
| 07 | *(optional)* **Relics + RTL Upgrades** (21), which are new content | Images exist but the app never used them | S |
| 08 | *(optional)* In-app card editor (D6-B) | Only if you want it | M |

The statuses (8 small icons) and the dice and trait icons stay as images. They are icons, not cards.

## Testing approach (every phase)

- A headless browser test at phone and desktop size covers: create a party, add and remove cards of the converted type, check deck quantities go down and up, save, then reload the saved file.
- The old-save regression test loads a save made **before** the phase and confirms it still works.
- The data check script verifies that every card has a unique id and the required fields, and that every `art` path exists with exact case.
- I'll send screenshots of the rendered deck with each phase.

## Out of scope

Rewriting away from AngularJS 1.x, restyling non-card screens (that's a separate plan if you want it), and game rules beyond what the app tracks today.
