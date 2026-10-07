# Dev Plan 06: Heroes

**Status:** DONE (see "Build notes" at the end). Approved with 06-A to 06-D as recommended.
**Depends on:** Plan 05 (done, merged in PR #5)

## Goal

Move the 48 heroes out of `main.js` into `data/heroes.json`, so adding or fixing a hero is a JSON edit. After this, `main.js` holds only app setup (about 30 lines instead of 1,400). Portraits stay as images.

## What I found

- **Each hero in `main.js` mixes two things:**
  - **the hero card** (fixed): name, ability text, wounds, fatigue, armor, speed, starting power dice, and the three skill trait counts;
  - **the hero's live state**: current wounds and fatigue, held cards, and 8 status counters (bleed, daze, …).

  Creating a party copies the whole object. Saves store everything, including the ability text, so fixing a typo in a hero's ability never reaches existing saves.
- **The status token +/− buttons have never worked.** All 16 buttons call `incHealth()`, a function that doesn't exist anywhere in the code (not even in the first commit). Angular ignores the missing function silently, so tapping does nothing (see 06-C).
- **Small data problems:**
  - Four ability texts start with stray tabs or spaces (Hugo the Glorious, Ispher, Nanok of the Blade, Spiritspeaker Mok).
  - An unused `isTapped` field; the app actually uses `isCharTapped`.
  - The Frost status is stored as `freezeStatus`.
- **The same hero can be picked twice** when creating a party (see 06-D).
- **There are no hero card scans** in the repo, only portraits. So unlike the cards, the hero stats can't be checked against an image here. The proof page will show each hero's portrait with their stats so you can compare them with your physical hero sheets.

## Decisions for this phase

### 06-A. What a hero record holds

- **Recommended:**

  ```json
  {
    "id": "andira-runehand",
    "name": "Andira Runehand",
    "ability": "When Andira Runehand makes a Magic attack on an adjacent enemy, she gains Pierce 2.",
    "wounds": 12, "fatigue": 5, "armor": 1, "speed": 5,
    "dice": { "melee": 0, "ranged": 0, "magic": 3 },
    "traits": { "fighter": 0, "subterfuge": 0, "wizardry": 3 },
    "face": "Images/Face Portraits/Andira Runehand.JPG",
    "body": "Images/Body Portraits/Andira Runehand.PNG"
  }
  ```

  Party creation builds a hero's starting state from this record. The portrait paths are explicit rather than built from the name, so a new hero can use any image file. `check-data.js` verifies the files exist with exact case.

### 06-B. What saves store for a hero

- **Recommended: the hero's id plus live state** (current and max wounds/fatigue, speed, armor, dice, held cards, statuses, tapped). The name and ability text are looked up from the data by id, so fixes to the data reach old saves. Old saves are matched to an id by name.
- Alternative: keep saving full copies, as today.

### 06-C. Status token buttons

- **Recommended: make them work.** Add the missing function, so +/− changes the counter and it can't go below 0. It's a few lines, and since statuses are hero state it fits this phase.
- Alternative: leave them broken and note it.

### 06-D. Picking the same hero twice

- **Recommended:** a hero already chosen in another slot isn't offered again.
- Alternative: allow it (the game wouldn't).

## Work breakdown

1. **`data/heroes.json`**: 48 records generated from `main.js`, with the ability texts trimmed. They're generated rather than retyped, so there's no transcription risk.
2. **`heroService`**, in the card module:
   - loads the heroes;
   - `byId(id)`;
   - `newCharacter(hero)` builds the starting state, with the same fields as today so the existing character screen keeps working;
   - `idForLegacyName(name)` for old saves.
3. **Party creation (`main.html`, `mainctrl.js`)**: pickers use `ng-options` by id, and hide heroes already chosen (06-D). Each slot shows the hero's stats, ability and body portrait.
4. **Character screen, nav bar and party list**: name, ability and portraits come from the hero data via `heroId`.
5. **Statuses**: the missing handler (06-C). The 16 buttons share one function.
6. **Saves**: version 6, with `heroId` plus state and no `trait`. Older saves are migrated by matching the name. A v5 fixture is generated from the current app before any changes.
7. **`main.js`**: the hero array is deleted, leaving about 30 lines.
8. **`proof.html`**: a heroes section with each portrait plus stats and ability, for checking against your physical hero sheets.
9. **`check-data.js`**: a heroes schema, unique ids, and portrait files that exist with exact case.

## Test plan

Everything existing still passes, plus:

- Create a party: stats and ability shown from the data, a hero already chosen in slot 1 isn't offered in slot 2, and the character screen shows the right portrait and ability.
- Status +/− buttons change the counter and stop at 0. The value survives a save and load.
- A v6 save contains `heroId` and no ability text. A reload shows the ability from the data.
- The v5 fixture (and v1–v4) load with the right `heroId` and unchanged stats.
- Every one of the 48 heroes can be created with no missing portraits (no 404s).

You'll spot-check heroes against your hero sheets on `proof.html`.

## Out of scope

- **Relics and RTL Upgrades** (plan 07, optional).
- **Restyling the character screen.** It still uses the original layout; a visual refresh could be its own plan.
- **Deleting scans.**

## Size

Small to medium: no transcription, because the data already exists. The care goes into the save migration and party creation.

---

## Build notes (what differed from the plan)

- **Three heroes have another hero's ability text** (copied in the original data):
  - **Jonas the Kind** has Eliam's.
  - **Zyla** has Varikas the Dead's.
  - **Spiritspeaker Mok** starts with Mordrog's line, followed by what's probably Mok's own: "The overlord's cost to play cards is increased by 1 threat token per card."

  I didn't guess the correct text. `proof.html` flags these three heroes, and each is a one-line fix in `data/heroes.json` once you check your hero sheets. Because saves no longer copy ability text, fixes will show up in existing saves too.
- **Nanok of the Blade's armor is "\*"** (his ability defines it). `check-data.js` allows "\*" for armor.
- **Party creation** is one repeated slot template instead of four copies. Clearing a slot also clears the slots after it, since they're shown in order. Heroes are compared by id, because ngOptions with `track by` hands the model a copy of the object.
- **Status buttons:** I added the missing `incHealth()` handler. The 16 buttons already pass names like "BleedStatus", so no markup changed.
- **No more 404 noise:** the old `src="{{…}}"` portrait requests were the last source of 404s, and they're gone. The tests now allow no 404s at all.
- **`main.js`** is 34 lines, down from about 1,400 at the start of phase 06.
- **Tests:** 81 checks, run at phone and desktop size, all pass. They cover:
  - all 48 heroes creatable with a portrait that loads;
  - a chosen hero isn't offered again;
  - `heroId` stored and ability text not copied;
  - status +/− working and stopping at 0;
  - a v6 save round-trip;
  - the v5 fixture (made from the phase 05 app) keeping wounds, statuses, tapped state and cards.

  A deliberate break (removing the status handler) failed the status checks, as expected.
