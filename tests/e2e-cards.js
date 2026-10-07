// End-to-end tests for the data-driven cards (plans 01 and 02: skills, feats).
// Needs Playwright and the site served at BASE, e.g. from the parent directory:
//   python3 -m http.server 8765   (with this repo at ./DescentAngularJs)
//   BASE=http://localhost:8765/DescentAngularJs/ node tests/e2e-cards.js
var path = require('path');
var fs = require('fs');
var os = require('os');
var playwright = require('playwright');

var BASE = process.env.BASE || 'http://localhost:8765/DescentAngularJs/';
var V1_SAVE = path.join(__dirname, 'fixtures', 'v1-save.json');
var V2_SAVE = path.join(__dirname, 'fixtures', 'v2-save.json');
var failures = 0;

function check(label, ok, detail) {
    console.log((ok ? '  ok   ' : '  FAIL ') + label + (ok || detail === undefined ? '' : '  -> ' + JSON.stringify(detail)));
    if (!ok) failures++;
}

async function run(device) {
    console.log('\n[' + device.name + ']');
    var browser = await playwright.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
    var context = await browser.newContext(Object.assign({ acceptDownloads: true }, device.options));
    var page = await context.newPage();
    var errors = [];
    page.on('pageerror', function (e) { errors.push('JS ' + e.message); });
    page.on('response', function (r) {
        // src="{{...}}" requests from not-yet-converted card types are known noise.
        if (r.status() >= 400 && r.url().indexOf('%7B%7B') === -1 && r.url().indexOf('Portraits/.PNG') === -1) errors.push(r.status() + ' ' + r.url());
    });

    var hero = function (n) {
        return page.evaluate(function (n) {
            var c = angular.element(document.body).injector().get('appData').characters[n || 0];
            return { w: c.wounds, wc: c.woundsCap, f: c.fatigue, fc: c.fatigueCap, s: c.speed, skills: c.skills.slice(), feats: c.feats.slice() };
        }, n);
    };
    var picker = function (kind) { return 'dj-deck-picker[kind=' + kind + '] '; };
    var choices = function (kind) {
        return page.$$eval(picker(kind || 'skills') + 'select option', function (os) { return os.map(function (o) { return o.textContent.trim(); }); });
    };
    var showDeck = async function (deck, kind) {
        var button = page.locator(picker(kind || 'skills') + '.dj-deck-button');
        for (var i = 0; i < 3 && (await button.innerText()).trim() !== deck; i++) await button.click();
    };
    var addCard = async function (kind, deck, name) {
        await showDeck(deck, kind);
        await page.selectOption(picker(kind) + 'select', { label: name });
    };
    var addSkill = function (deck, name) { return addCard('skills', deck, name); };
    var held = function (kind) { return page.locator('dj-card[ng-repeat^="id in character.' + kind + '"]'); };
    var loadSave = async function (file) {
        await page.goto(BASE);
        await page.reload();
        await page.waitForSelector('input[type=file]', { state: 'attached' });
        await page.setInputFiles('input[type=file]', file);
        await page.waitForSelector(picker('skills') + 'select');
    };

    // 1. New party, add skills from each deck and a random one.
    await page.goto(BASE);
    await page.click('text=Create New Party');
    await page.locator('select').nth(0).selectOption({ label: 'Andira Runehand' });
    await page.locator('select').nth(1).selectOption({ label: 'Lyssa' });
    await page.click('text=Done');
    await page.waitForSelector(picker('skills') + 'select');
    var start = await hero();
    await showDeck('Fighter');
    var fighterBefore = (await choices()).length;
    await addSkill('Fighter', 'Able Warrior');
    check('fighter deck shrinks after adding', (await choices()).length === fighterBefore - 1);
    check('picked card is no longer offered', (await choices()).indexOf('Able Warrior') === -1);
    await addSkill('Wizardry', 'Alchemist');
    await showDeck('Subterfuge');
    var subBefore = (await choices()).length;
    await page.click(picker('skills') + '.dj-random');
    check('random skill drawn from current deck', (await choices()).length === subBefore - 1);
    check('cards render as HTML', (await held('skills').count()) === 3);
    var random = (await hero()).skills[2];
    await held('skills').nth(2).locator('.dj-card-x').click();
    var afterRandom = await hero();
    check('removing restores stats after random draw', afterRandom.skills.length === 2 && afterRandom.fc === start.fc && afterRandom.s === start.s && afterRandom.wc === start.wc, { random: random, afterRandom: afterRandom, start: start });

    // 2. Spry: +1 max fatigue, +1 fatigue, +1 speed, and back again on removal (old bug).
    var before = await hero();
    await addSkill('Subterfuge', 'Spry');
    var withSpry = await hero();
    check('Spry raises max fatigue, fatigue and speed by 1', withSpry.fc === before.fc + 1 && withSpry.f === before.f + 1 && withSpry.s === before.s + 1, withSpry);
    await page.click('button[aria-label="Remove Spry"]');
    var noSpry = await hero();
    check('removing Spry restores every stat', noSpry.fc === before.fc && noSpry.f === before.f && noSpry.s === before.s, noSpry);

    // 3. Tough: removal clamps current wounds to the new max.
    await addSkill('Fighter', 'Tough');
    var tough = await hero();
    check('Tough adds 4 max and current wounds', tough.wc === before.wc + 4 && tough.w === before.w + 4, tough);
    await page.click('button[aria-label="Remove Tough"]');
    var noTough = await hero();
    check('removing Tough clamps wounds to max', noTough.wc === before.wc && noTough.w === before.wc, noTough);

    // 3b. Feats: multiple copies, the two Second Winds, random draw.
    await page.click('button[ng-click="handBtn(3)"]');
    await page.waitForSelector(picker('feats') + 'select', { state: 'visible' });
    await addCard('feats', 'Wizardry', 'Focus');
    await addCard('feats', 'Wizardry', 'Focus');
    check('Focus (3 copies) still offered after taking 2', (await choices('feats')).indexOf('Focus') !== -1);
    await addCard('feats', 'Wizardry', 'Focus');
    check('Focus no longer offered after taking all 3', (await choices('feats')).indexOf('Focus') === -1);
    await addCard('feats', 'Fighter', 'Second Wind');
    await addCard('feats', 'Subterfuge', 'Second Wind');
    var feats = (await hero()).feats;
    check('both Second Winds held at once', feats.indexOf('second-wind-fighter') !== -1 && feats.indexOf('second-wind-subterfuge') !== -1, feats);
    await held('feats').nth(feats.indexOf('second-wind-fighter')).locator('.dj-card-x').click();
    feats = (await hero()).feats;
    check('removing one Second Wind keeps the other', feats.indexOf('second-wind-fighter') === -1 && feats.indexOf('second-wind-subterfuge') !== -1, feats);
    await showDeck('Fighter', 'feats');
    check('removed Second Wind is back in the Fighter deck', (await choices('feats')).indexOf('Second Wind') !== -1);
    await page.click(picker('feats') + '.dj-random');
    check('random feat drawn', (await hero()).feats.length === feats.length + 1);
    check('feat stats untouched (feats have no effects)', JSON.stringify((await hero()).s) === JSON.stringify(before.s));
    check('feat cards render', (await held('feats').count()) === feats.length + 1);
    await page.click('button[ng-click="handBtn(0)"]');

    // 4. Save, reload, load: same skills and feats.
    await addSkill('Fighter', 'Tough');
    var saved = await hero();
    var download = await Promise.all([page.waitForEvent('download'), page.evaluate(function () {
        angular.element(document.querySelector('[ng-view]').firstElementChild).scope().exportToFile();
    })]).then(function (r) { return r[0]; });
    var savePath = path.join(os.tmpdir(), 'dj-v2-save-' + device.name + '.json');
    await download.saveAs(savePath);
    var v2 = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    check('save is version 3 without skill or feat decks', v2.version === 3 && !v2.fighterSkills && !v2.fighterFeats && Array.isArray(v2.characters[0].skills) && typeof v2.characters[0].skills[0] === 'string', Object.keys(v2));
    check('save has no $$hashKey noise', fs.readFileSync(savePath, 'utf8').indexOf('$$hashKey') === -1);
    await loadSave(savePath);
    var reloaded = await hero();
    check('save round-trips skills, feats and stats', JSON.stringify(reloaded) === JSON.stringify(saved), { saved: saved, reloaded: reloaded });

    // 5. Old v1 save: migrated, stats untouched, deck counts derived.
    await loadSave(V1_SAVE);
    var v1 = await hero();
    check('v1 skills migrated to ids', JSON.stringify(v1.skills) === JSON.stringify(['spry', 'tough', 'alchemist']), v1.skills);
    check('v1 stats unchanged by migration', v1.w === 16 && v1.wc === 16 && v1.f === 6 && v1.fc === 6 && v1.s === 5, v1);
    check('v1 cards render with names', (await held('skills').locator('.dj-card-name').allInnerTexts()).join('|') === 'Spry|Tough|Alchemist');
    await showDeck('Fighter');
    var fighterChoices = await choices();
    check('v1 held cards not offered (Tough, and Lyssa\'s Bear Tattoo)', fighterChoices.indexOf('Tough') === -1 && fighterChoices.indexOf('Bear Tattoo') === -1 && fighterChoices.indexOf('Able Warrior') === -1);
    check('no missing-card placeholders', (await page.locator('.dj-missing').count()) === 0);

    // 6. Phase 01 (v2) save with feats stored as objects: migrated.
    await loadSave(V2_SAVE);
    var a = await hero(0), l = await hero(1);
    check('v2 skills kept, stats unchanged', JSON.stringify(a.skills) === '["swift"]' && a.s === 7, a);
    check('v2 feats migrated to ids', JSON.stringify(a.feats) === '["second-wind-fighter","focus","focus"]' && JSON.stringify(l.feats) === '["second-wind-subterfuge","chink-in-the-armor"]', { a: a.feats, l: l.feats });
    check('v2 feats render with printed names', (await held('feats').allTextContents()).join('|').indexOf('Second Wind') !== -1);
    await page.click('button[ng-click="handBtn(3)"]');
    await showDeck('Wizardry', 'feats');
    check('v2 Focus: 1 of 3 copies left, still offered', (await choices('feats')).indexOf('Focus') !== -1);
    await showDeck('Subterfuge', 'feats');
    var sub = await choices('feats');
    check('v2 held Subterfuge feats not offered', sub.indexOf('Second Wind') === -1 && sub.indexOf('Chink in the Armor') === -1, sub);
    check('no missing-card placeholders after v2 load', (await page.locator('.dj-missing').count()) === 0);

    // 7. A card that's not in the data: shown as a removable placeholder.
    var oddPath = path.join(os.tmpdir(), 'dj-unknown-card.json');
    var odd = JSON.parse(fs.readFileSync(V1_SAVE, 'utf8'));
    odd.characters[0].skills.push({ type: 'Fighter', name: 'Totally Made Up' });
    fs.writeFileSync(oddPath, JSON.stringify(odd));
    await loadSave(oddPath);
    check('unknown card shows as a missing placeholder', (await page.locator('.dj-missing .dj-card-name').allInnerTexts()).join() === 'Totally Made Up');
    await page.click('.dj-missing .dj-card-x');
    check('missing placeholder can be removed', (await page.locator('.dj-missing').count()) === 0 && (await hero()).skills.length === 3);

    await page.screenshot({ path: path.join(os.tmpdir(), 'dj-cards-' + device.name + '.png'), fullPage: true });
    check('no 404s or JS errors', errors.length === 0, errors);
    await browser.close();
}

(async function () {
    await run({ name: 'phone', options: playwright.devices['Pixel 7'] });
    await run({ name: 'desktop', options: { viewport: { width: 1280, height: 900 } } });
    console.log(failures ? '\n' + failures + ' failure(s)' : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
