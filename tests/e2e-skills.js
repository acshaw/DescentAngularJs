// End-to-end test for plan 01 (data-driven skills).
// Needs Playwright and the site served at BASE, e.g. from the parent directory:
//   python3 -m http.server 8765   (with this repo at ./DescentAngularJs)
//   BASE=http://localhost:8765/DescentAngularJs/ node tests/e2e-skills.js
var path = require('path');
var fs = require('fs');
var os = require('os');
var playwright = require('playwright');

var BASE = process.env.BASE || 'http://localhost:8765/DescentAngularJs/';
var V1_SAVE = path.join(__dirname, 'fixtures', 'v1-save.json');
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

    var hero = function () {
        return page.evaluate(function () {
            var c = angular.element(document.body).injector().get('appData').characters[0];
            return { w: c.wounds, wc: c.woundsCap, f: c.fatigue, fc: c.fatigueCap, s: c.speed, skills: c.skills.slice() };
        });
    };
    var choices = function () {
        return page.$$eval('select[ng-model="pick.skill"] option', function (os) { return os.map(function (o) { return o.textContent.trim(); }); });
    };
    var deckButton = page.locator('button[ng-click="switchDeck(currentSkillDeck)"]');
    var showDeck = async function (deck) {
        for (var i = 0; i < 3 && (await deckButton.innerText()).trim() !== deck; i++) await deckButton.click();
    };
    var addSkill = async function (deck, name) {
        await showDeck(deck);
        await page.selectOption('select[ng-model="pick.skill"]', { label: name });
    };

    // 1. New party, add skills from each deck and a random one.
    await page.goto(BASE);
    await page.click('text=Create New Party');
    await page.locator('select').nth(0).selectOption({ label: 'Andira Runehand' });
    await page.locator('select').nth(1).selectOption({ label: 'Lyssa' });
    await page.click('text=Done');
    await page.waitForSelector('select[ng-model="pick.skill"]');
    var start = await hero();
    await showDeck('Fighter');
    var fighterBefore = (await choices()).length;
    await addSkill('Fighter', 'Able Warrior');
    check('fighter deck shrinks after adding', (await choices()).length === fighterBefore - 1);
    check('picked card is no longer offered', (await choices()).indexOf('Able Warrior') === -1);
    await addSkill('Wizardry', 'Alchemist');
    await showDeck('Subterfuge');
    var subBefore = (await choices()).length;
    await page.click('button[ng-click="addRandomSkill()"]');
    check('random skill drawn from current deck', (await choices()).length === subBefore - 1);
    check('cards render as HTML', (await page.locator('dj-card .dj-card-name').count()) === 3);
    var random = (await hero()).skills[2];
    await page.click('dj-card:nth-of-type(3) .dj-card-x');
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

    // 4. Save, reload, load: same skills.
    await addSkill('Fighter', 'Tough');
    var saved = await hero();
    var download = await Promise.all([page.waitForEvent('download'), page.evaluate(function () {
        angular.element(document.querySelector('[ng-view]').firstElementChild).scope().exportToFile();
    })]).then(function (r) { return r[0]; });
    var savePath = path.join(os.tmpdir(), 'dj-v2-save-' + device.name + '.json');
    await download.saveAs(savePath);
    var v2 = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    check('save is version 2 without skill decks', v2.version === 2 && !v2.fighterSkills && Array.isArray(v2.characters[0].skills) && typeof v2.characters[0].skills[0] === 'string', Object.keys(v2));
    check('save has no $$hashKey noise', fs.readFileSync(savePath, 'utf8').indexOf('$$hashKey') === -1);
    await page.goto(BASE);
    await page.reload();
    await page.waitForSelector('input[type=file]', { state: 'attached' });
    await page.setInputFiles('input[type=file]', savePath);
    await page.waitForSelector('select[ng-model="pick.skill"]');
    var reloaded = await hero();
    check('v2 save round-trips skills and stats', JSON.stringify(reloaded) === JSON.stringify(saved), { saved: saved, reloaded: reloaded });

    // 5. Old v1 save: migrated, stats untouched, deck counts derived.
    await page.goto(BASE);
    await page.reload();
    await page.waitForSelector('input[type=file]', { state: 'attached' });
    await page.setInputFiles('input[type=file]', V1_SAVE);
    await page.waitForSelector('select[ng-model="pick.skill"]');
    var v1 = await hero();
    check('v1 skills migrated to ids', JSON.stringify(v1.skills) === JSON.stringify(['spry', 'tough', 'alchemist']), v1.skills);
    check('v1 stats unchanged by migration', v1.w === 16 && v1.wc === 16 && v1.f === 6 && v1.fc === 6 && v1.s === 5, v1);
    check('v1 cards render with names', (await page.locator('dj-card .dj-card-name').allInnerTexts()).join('|') === 'Spry|Tough|Alchemist');
    await showDeck('Fighter');
    var fighterChoices = await choices();
    check('v1 held cards not offered (Tough, and Lyssa\'s Bear Tattoo)', fighterChoices.indexOf('Tough') === -1 && fighterChoices.indexOf('Bear Tattoo') === -1 && fighterChoices.indexOf('Able Warrior') === -1);
    check('no missing-card placeholders', (await page.locator('.dj-missing').count()) === 0);

    await page.screenshot({ path: path.join(os.tmpdir(), 'dj-skills-' + device.name + '.png'), fullPage: true });
    check('no 404s or JS errors', errors.length === 0, errors);
    await browser.close();
}

(async function () {
    await run({ name: 'phone', options: playwright.devices['Pixel 7'] });
    await run({ name: 'desktop', options: { viewport: { width: 1280, height: 900 } } });
    console.log(failures ? '\n' + failures + ' failure(s)' : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
