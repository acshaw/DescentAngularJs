# Dev Plan 03: Store Items (and the item machinery)

**Status:** DRAFT, awaiting approval
**Depends on:** Plan 02 (done, merged in PR #2)

## Goal

Render the **27 store items** (Healing Potion, Sword, Chain Mail, …) from `data/items.json`, with the full item layout: artwork, category, attack type, abilities, surge abilities, cost, hands and dice. Rebuild the Equipped and Backpack tabs on the shared card code.

## What I found

- **Items are more complex than skills or feats.** The cards show:

  | Field | Examples |
  |---|---|
  | category | Weapon, Armor, Shield, Other, Potion; some add "— Rune" |
  | attack type | Melee, Ranged, Magic (weapons only) |
  | ability line | **Pierce 1**, **Knockback**, **Reach**, **+2 Armor** |
  | surge lines | ⚡⚡: +1 Damage |
  | rules text | "Your base speed is reduced to 4." |
  | footer | cost, hands (1 or 2), attack dice (e.g. red + green) |

  Potions use a simpler layout: no footer, and Healing and Vitality have no printed cost.
- **The item code is the most copied in the app.** Every add, remove and random-draw function has a four-way Store/Copper/Silver/Gold switch, copied six times (about 300 lines).
- **Equipped and Backpack share one deck picker and one set of decks.** Store, Copper, Silver and Gold all go through the same picker and the same "give away" and "move" buttons. Converting only Store would leave each tab handling two formats at once (see 03-A).
- **Items can be tapped** (greyed out when exhausted). The tapped state lives on each held copy, so held items need more than an id (see 03-B).
- **Bugs to fix along the way:**
  - The "give to hero 1–4" buttons always show four heroes. Tapping 3 or 4 in a two-hero party throws an error and loses the item.
  - The random draw is slightly biased toward the first card in each deck, an off-by-one in the old weighting.
- **App names differ from the printed names on 5 cards:**

  | App name | Printed name |
  |---|---|
  | Potion of Health | **Healing Potion** |
  | Potion of Vitality | **Vitality Potion** |
  | Potion of Power | **Power Potion** |
  | Potion of Invisibility | **Invisibility Potion** (subtitle "Stealth Potion") |
  | Wizards Robe | **Wizard's Robe** |

  As before, the printed names win and the old names become aliases.
- **Two leftover files** in `Images/Items/Store/`: `template.jpg` (a blank card frame with Vitality Potion art) and `Thumbs.db` (a Windows thumbnail cache). Neither is a card.

---

## Decisions for this phase

### 03-A. Scope: all four item decks' mechanics now, store text now, treasure text later

- **Recommended:** this phase moves **all four** decks onto the data and card code, but only types up the **store** cards. Copper, Silver and Gold go into `items.json` as *scan-only* records (id, name, deck, qty, scan, no text yet). The card shows the scan as its picture until phase 04 fills in the text. Phase 04 then becomes transcription only, with no code changes.
- Alternative: convert only Store and keep the old code running for the treasure decks. That means two item formats side by side for a whole phase, plus a second migration later.

### 03-B. How held items are stored

- **Recommended:** equipped and backpack items are stored as `{ "id": "sword", "tapped": false }`. Skills and feats stay as plain ids. "Copies left" counts across both Equipped and Backpack for the whole party.
- Alternative: plain ids plus a separate list of which positions are tapped. That's fragile when items move between heroes.

### 03-C. Artwork

- **Recommended:** crop the art from each scan automatically with a fixed frame box, save it as `Images/Art/items/<id>.jpg` (about 400 px wide, around 30 KB each), and check every crop on the proof page. If a crop is off, a per-card `art` override fixes it. Art stays optional, so new items you invent don't need a picture.
- Alternative: no art for items, text only.

### 03-D. Surge and dice icons

- **Recommended:**
  - **Surge:** crop the real surge symbol (the black splat) from one scan into a small PNG for `{surge}`. It's instantly recognisable to anyone who knows the game, unlike the ⚡ in the mock.
  - **Dice:** small CSS cubes in the die colours. They're crisp at any size and there's nothing to crop.
- Alternative: keep ⚡ for surge.

### 03-E. Give-away buttons

- **Recommended:** replace "1 2 3 4 B ✕" on each item with clear controls. "Give to…" shows only the *other* heroes in the party, using their face portraits. "→ Backpack" / "→ Equip" moves the item, and ✕ removes it. This fixes the four-hero bug.
- Alternative: keep the numbered buttons and just hide numbers for heroes who don't exist.

### 03-F. Potion costs (minor)

Healing and Vitality Potions print no cost. **Recommended:** leave the cost blank, as printed. Say if you'd rather show the rulebook price.

---

## Work breakdown

1. **`data/items.json`**:
   - 27 store items, fully transcribed. Fields: `id`, `name`, `deck` (`store` | `copper` | `silver` | `gold`), `qty`, `category`, `rune`, `attack`, `abilities`, `surges` (a list of `{cost, effect}`), `text`, `cost`, `hands`, `dice`, `art`, `aliases`, `scan`.
   - Treasure items are scan-only for now.
2. **Art**: `tools/crop-art.py` crops the art into `Images/Art/items/`, plus the surge icon into `Images/Icons/surge.png`. The script stays in the repo so new scans can be cropped the same way.
3. **`cardService`**:
   - Add the `items` kind.
   - Held cards can be `{id, tapped}`.
   - "Remaining" counts both `equipped` and `bag`.
4. **`<dj-card>`**: an item layout (art, category line, abilities, surges, text and footer). A scan-only card shows its scan.
5. **`<dj-deck-picker>`**: works for items. Its deck button cycles Store → Copper → Silver → Gold, and the same picker serves the Equipped and Backpack tabs.
6. **Equipped and Backpack tabs**:
   - Card rows with tap-to-exhaust, "give to" portraits, move and remove (03-E).
   - The nav bar's "untap all" works on the new format.
7. **`charctrl.js`**: delete the six item functions and their switches (about 300 lines), and move to the shared helpers.
8. **`main.js`**: delete the four item arrays (about 140 lines).
9. **Saves**: version 4, with equipped and bag stored as `{id, tapped}` and no item deck arrays. Older saves are migrated by name and deck, keeping each item's tapped state.
10. **`proof.html`, `check-data.js`, tests**: extended for items. Before any changes, I'll make a v3 save fixture holding store and treasure items in both tabs, some tapped.

## Test plan

Everything existing still passes, plus:

- Add store items to Equipped and to Backpack. Potions (12 copies) stay available, and the deck count includes items in both tabs across the whole party.
- Tap and untap an item. "Untap all" clears it. Tapped state survives a move to the Backpack and a save/load.
- Give an item to another hero. Only real party members are offered, and the deck count doesn't change.
- Draw a random Copper item. It appears as a scan-only card, and the count drops.
- Load the v3, v2 and v1 fixtures. Items are migrated with the right ids and tapped states.
- No 404s or JS errors.

You'll proofread the 27 store items and the art crops on `proof.html`.

## Out of scope

Typing up the Copper/Silver/Gold text (phase 04), upgrades (phase 05), heroes (phase 06), and deleting the scans.

## Size

Medium-large: the biggest code change so far (items touch two tabs, the nav bar and saves), but only 27 cards to transcribe.
