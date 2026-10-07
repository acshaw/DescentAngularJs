# Dev Plan 04: Copper, Silver and Gold Treasure

**Status:** DRAFT, awaiting approval
**Depends on:** Plan 03 (done, merged in PR #3)

## Goal

Fill in the 115 treasure items (41 Copper, 40 Silver, 34 Gold; 118 copies) that phase 03 left as scan-only records, so every item renders as an HTML card. No new machinery is needed: this is mainly transcription plus art crops, with three small data additions.

## What I found

- **Shadow Blade was never missing.** Its scan is saved as `Images/Items/Copper/Shadowblade.jpg`, while the app looked for `Shadow Blade.jpg`. That's why it was the one broken image on day one. The card is printed as **Shadowblade**.
- **There's a card the app never used:** `Images/Items/Gold/Red Plate of Kellos.jpg` (Armor, +3 Armor). It's in your scans but not in the app's Gold deck (see 04-B).
- **"Cursed" items.** Some cards say *Weapon — Cursed* or *Other — Cursed* (Shadowblade, Bottle Imp), in the same place store items say *— Rune*. This needs a `cursed` flag next to `rune`.
- **Treasure Caches are rewards, not equipment.** There are 16 of them across the three decks: "Receive 50 coins and draw another card from this deck", sometimes with a potion. Today they get added to a hero's hand like an item, and you have to remember to add the coins and then remove the card (see 04-A).
- **Many printed names add an apostrophe** (Archer's Charm, Falcon's Claw, Aldar's Mirror, Jinn's Lamp, The Knight's Ring, …). As before, the printed names are used and the old names become aliases.
- **Scans:** 13 Gold scans are twice the resolution of the rest, which the art cropper handles since its box is proportional. `Thumbs.db` (Windows thumbnail cache) files in two folders are junk.

---

## Decisions for this phase

### 04-A. Treasure Caches

- **Recommended: add a "Collect" button.** Each cache gets structured data, e.g. `"grants": { "coins": 150, "items": ["invisibility-potion"] }`. On the card, **Collect** adds the coins to party gold, puts any granted potions in the hero's backpack, and removes the cache. You then draw again yourself, as the card says. The printed text stays on the card.
- Alternative: keep caches as plain cards, as today, and track the coins by hand.

### 04-B. Red Plate of Kellos

- **Recommended: add it** to the Gold deck (1 copy), since it's in your physical deck.
- Alternative: leave it out to match the old app.

### 04-C. Stat-changing items (no change proposed)

Some treasure items give stats, e.g. "+3 Armor" or "your speed is increased by 1". The app never applied item stats; armor and speed come from the hero card, and skills are the only cards that adjust stats. **Recommended: keep items text-only, per D4.** Applying item stats would mean deciding when an item counts as equipped and how armor stacks, which is a rules question best left for its own plan if you want it.

### 04-D. Shared art for Treasure Caches

All 16 caches use the same coin-pile picture. **Recommended:** one shared `Images/Art/items/treasure-cache.jpg` instead of 16 copies.

---

## Work breakdown

1. **Transcribe 115 cards** into `data/items.json` with the same fields as store items. Add `cursed` where printed, and `grants` on caches (04-A). Fix Shadowblade's scan path and name, and add Red Plate of Kellos (04-B).
2. **Crop art** for every treasure item with `tools/crop-art.py`, plus the one shared cache image (04-D). Check every crop on the proof page.
3. **`<dj-card>`**:
   - show "— Cursed";
   - show the **Collect** button on cards with `grants` (wired to party gold and the hero's backpack);
   - a scan-only card still shows its scan (kept as a fallback for cards you add later).
4. **`check-data.js`**:
   - validate `cursed` and `grants`, including that granted ids exist;
   - fail if any item is still scan-only, so nothing is accidentally left half-done.
5. **`proof.html`**: Copper, Silver and Gold groups.
6. Delete the two `Thumbs.db` files.

## Test plan

Everything existing still passes, plus:

- A random Copper draw now renders as a full HTML card. The scan-only fallback is still tested with a made-up card.
- Collect on a cache (e.g. Silver Treasure Cache 3, "150 coins and 1 invisibility potion") adds 150 party gold, puts an Invisibility Potion in the backpack and removes the cache. The potion counts against the store's 12. As with any removed card, the cache goes back into its deck, because the app has no discard pile.
- The v3 fixture's Archer's Charm and Aldar's Mirror now load as full cards.
- No 404s or JS errors.

You'll proofread the 116 treasure cards on `proof.html`. That's the biggest review so far, so filtering by deck helps.

## Out of scope

Upgrades (phase 05), heroes (phase 06), Relics / RTL Upgrades (phase 07), item stat effects (04-C), and deleting scans.

## Size

Medium. It's almost all transcription (about 4× phase 02). The code changes are small: the Cursed label, the Collect button and validation.
