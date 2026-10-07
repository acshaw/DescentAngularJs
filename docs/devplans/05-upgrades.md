# Dev Plan 05: Upgrades (training)

**Status:** DONE (see "Build notes" at the end). Approved with 05-A to 05-E as recommended.
**Depends on:** Plan 04 (done, merged in PR #4)

## Goal

Render the **15 upgrade cards** from `data/upgrades.json`, and replace the last block of hard-coded card logic: about 230 lines of switch statements in `charctrl.js` that change wounds, fatigue and power dice, with structured `effects` and one set of rules.

## What the cards are

There are three upgrade lines, each in three tiers:

| Card (printed) | App name | Effect | XP | Gold |
|---|---|---|---|---|
| Maximum Wounds | Maximum Wounds Copper / Silver / Gold | +4 max wounds | 20 / 25 / 30 | 500 / 750 / 1000 |
| Maximum Fatigue | Maximum Fatigue Copper / Silver / Gold | +2 max fatigue | 20 / 25 / 30 | 500 / 750 / 1000 |
| Black / Silver / Gold Melee Die | Melee Power, Melee Power Silver / Gold | +1 power die | 15 / 20 / 25 | 500 / 750 / 1000 |
| Black / Silver / Gold Ranged Die | Ranged Power … | same | same | same |
| Black / Silver / Gold Magic Die | Magic Power … | same | same | same |

The Silver "Maximum Wounds" card is misprinted as **"Maximum Hearts"** (see 05-C). The scans are small (301×464), but the art is just an icon (heart, fatigue drop, weapon), so the low resolution is fine.

## Bugs in the current upgrade code

All of these go away when the code is replaced:

1. **Removing an upgrade shrinks the deck** (`qty--` instead of `qty++`), so every removal permanently loses a copy.
2. **Removing "Melee Power" can crash** because of a typo (`orginal`), when the hero has no black melee dice left.
3. **Removing "Ranged Power Silver" pops up two debug alerts** ("hi" and "HI").
4. **A refused add still uses up a copy.** For example, trying a 6th power die is refused, but the deck count drops anyway.
5. **Removing a wounds or fatigue upgrade can leave current wounds negative or above the new maximum**, because the value isn't clamped. Skills already clamp.
6. **The gold melee and ranged refusal messages say "magic".**

## Decisions for this phase

### 05-A. Power die rules

- **Recommended: keep the app's current rules.**
  - **Black die:** adds a black power die.
  - **Silver die:** upgrades one black die to silver.
  - **Gold die:** upgrades one silver die to gold.
  - **Limit:** at most 5 power dice per attack type.

  In data, a Silver Melee Die is `"effects": { "meleePower": -1, "meleeSilverPower": 1 }`. One generic check replaces all the switches: a change is refused if any die count would go below 0 or an attack type would exceed 5. The refusal message is built from the card ("no black melee power dice to upgrade").
- Alternative: read the cards literally ("+1 Silver Melee Power Die" adds a die without replacing one).

### 05-B. Removing an upgrade that was built on

For example, removing a Black Melee Die after that die was upgraded to Silver.

- **Recommended: refuse with a clear message**, which is what the old code intended before its crash. Remove the Silver upgrade first, then the Black one.
- Alternative: remove the whole chain automatically.

### 05-C. "Maximum Hearts"

- **Recommended:** show it as **Maximum Wounds**, keeping the printed name as an alias. It's the same effect as the other two wound cards.
- Alternative: show the misprint as printed.

### 05-D. Picker for upgrades

Upgrades are bought, not drawn, and they're one list, not three decks.

- **Recommended:** the upgrade picker has **no deck button and no random button**. It's one list labelled with tiers, e.g. "Maximum Wounds (Silver)" and "Gold Melee Die".

### 05-E. XP and gold (no change proposed)

Cards show their XP and gold cost in the footer, but the app doesn't track XP and won't deduct gold automatically, the same as today. Auto-paying gold would be a separate feature if you want it.

## Work breakdown

1. **`data/upgrades.json`**: 15 records with `id`, `name`, `tier` (`copper`/`silver`/`gold`, or `black`/`silver`/`gold` for dice), `qty`, `xp`, `cost`, `text`, `effects`, `art`, `aliases` and `scan`. Quantities are as today: 4 of each wounds and fatigue card, and effectively unlimited dice (99).
2. **Effects**:
   - New effect keys for the nine die counts (`meleePower`, `meleeSilverPower`, …).
   - A generic `cardService.check(character, card, sign)` that returns a refusal reason or nothing.
   - `give`, `take` and `move` all use the check. A refusal shows the message with the existing pop-up (sweetalert) and changes nothing.
3. **`<dj-card>`**:
   - Header colour by tier.
   - A footer with XP and gold.
   - No effect chips for die changes, since the card text already says it.
4. **`<dj-deck-picker>`**: an option to hide the deck and random buttons (05-D).
5. **Upgrades tab**: a picker and a card row like the other tabs.
6. **Removed code**: `addUpgrade` and `removeItemFromUpgrades` (about 230 lines), and the upgrade array in `main.js`.
7. **Saves**: version 5, with upgrades stored as ids and `upgradeItems` no longer saved. Older saves are migrated by name. Stats aren't re-applied, as before.
8. **Art**: cropped from the scans with a per-card `artBox` for the upgrade frame.
9. **Proof page and `check-data.js`**: extended for upgrades.

## Test plan

Everything existing still passes, plus:

- **Wounds and fatigue:** adding Maximum Wounds gives +4 max and current wounds. Removing it while wounded clamps current wounds to the new max (bug 5).
- **Dice:** Black → Silver → Gold Melee Die moves one die along the chain. A Silver die with no black dice is refused with a message, and nothing changes (bug 4).
- **Limit:** a 6th power die on one attack type is refused.
- **Removal:** removing a Black die that was upgraded is refused (05-B). Removing in reverse order works, and deck counts come back each time (bug 1).
- **No pop-up bugs:** no debug alerts, and no crash removing any upgrade (bugs 2 and 3).
- **Old save:** a v4 save with upgrades (generated from the current app before changes) loads with the right ids and unchanged stats.

You'll proofread the 15 cards on `proof.html`.

## Out of scope

Heroes (phase 06), XP and gold tracking (05-E), and deleting scans.

## Size

Small to medium: 15 simple cards, but the dice rules need careful tests.

---

## Build notes (what differed from the plan)

- **The rules check is generic.** `cardService.check()` applies to every give, take and move, not just upgrades, so any future card with die effects follows the same rules. Refusals now come back from `give`, `take` and `move` and are shown by one `cardNotice` helper. That uses sweetalert as before, falling back to a plain alert if the sweetalert script (loaded from a CDN) is unavailable.
- **Ids** follow the printed names: `maximum-wounds-copper`, `black-melee-die`, `silver-ranged-die`, … The old app names ("Melee Power Silver") and "Maximum Hearts" are aliases.
- **Upgrade art** is shown at full height. The pictures are near-square icons, and the standard 130 px item art strip cut off the "+4".
- **Code removed:** `charctrl.js` lost 230 more lines and is now 144 lines, down from about 1,030 before phase 01. The upgrade array in `main.js` is gone, so `main.js` now holds only app setup and the 48 heroes.
- **Saves:** version 5 stores no decks at all.
- **Tests:** 71 checks, run at phone and desktop size, all pass. They cover:
  - the wounds clamp;
  - refusing a Silver die with no Black die (the copy isn't used up);
  - the Black → Silver → Gold chain;
  - refusing to remove an upgraded Black die, then removing in reverse order;
  - the 5-dice limit;
  - deck counts coming back on removal;
  - no stray alerts;
  - the v4 fixture (made from the phase 04 app) loading with unchanged stats.

  A deliberate break (limit raised to 99) failed the limit checks, as expected. I also confirmed, with a stand-in `swal`, that the real pop-up receives the refusal message.
