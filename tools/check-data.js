// Validates data/*.json. Run from the repo root: node tools/check-data.js
// Exits non-zero on any problem.
var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var ICONS = ['surge', 'fatigue', 'wound', 'power', 'red', 'blue', 'white', 'green', 'yellow', 'black', 'silver', 'gold'];
var SCHEMAS = {
    skills: {
        required: ['id', 'name', 'deck', 'qty', 'text'],
        optional: ['effects', 'aliases', 'scan'],
        decks: ['fighter', 'subterfuge', 'wizardry'],
        effectKeys: ['maxWounds', 'maxFatigue', 'speed']
    },
    feats: {
        required: ['id', 'name', 'deck', 'qty', 'text'],
        optional: ['aliases', 'scan'],
        decks: ['fighter', 'subterfuge', 'wizardry'],
        effectKeys: []
    },
    items: {
        required: ['id', 'name', 'deck', 'qty'],
        optional: ['category', 'rune', 'cursed', 'attack', 'subtitle', 'abilities', 'surges', 'text', 'grants', 'cost', 'hands', 'dice', 'art', 'artBox', 'aliases', 'scan'],
        decks: ['store', 'copper', 'silver', 'gold'],
        effectKeys: [],
        categories: ['Weapon', 'Armor', 'Shield', 'Other', 'Potion'],
        attacks: ['Melee', 'Ranged', 'Magic']
    }
};
var DICE = ['red', 'blue', 'white', 'green', 'yellow', 'black', 'power', 'silver', 'gold'];

var problems = [];
var pendingGrants = []; // checked once every id is known
var seenIds = {};

// GitHub Pages is case-sensitive, so check each path segment exactly.
function existsExact(relPath) {
    var dir = ROOT;
    return relPath.split('/').every(function (part) {
        if (!fs.existsSync(dir) || fs.readdirSync(dir).indexOf(part) === -1) return false;
        dir = path.join(dir, part);
        return true;
    });
}

Object.keys(SCHEMAS).forEach(function (kind) {
    var schema = SCHEMAS[kind];
    var file = path.join(ROOT, 'data', kind + '.json');
    var cards;
    try {
        cards = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        problems.push(kind + '.json: ' + e.message);
        return;
    }
    cards.forEach(function (card, i) {
        var where = kind + '.json[' + i + '] ' + (card.id || card.name || '');
        schema.required.forEach(function (key) {
            if (card[key] === undefined || card[key] === '') problems.push(where + ': missing ' + key);
        });
        Object.keys(card).forEach(function (key) {
            if (schema.required.indexOf(key) === -1 && schema.optional.indexOf(key) === -1) problems.push(where + ': unknown field ' + key);
        });
        if (card.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(card.id)) problems.push(where + ': id must be lowercase-with-dashes');
        if (seenIds[card.id]) problems.push(where + ': duplicate id (also in ' + seenIds[card.id] + ')');
        seenIds[card.id] = kind;
        if (schema.decks.indexOf(card.deck) === -1) problems.push(where + ': unknown deck ' + card.deck);
        if (!(Number.isInteger(card.qty) && card.qty > 0)) problems.push(where + ': qty must be a positive whole number');
        Object.keys(card.effects || {}).forEach(function (key) {
            if (schema.effectKeys.indexOf(key) === -1) problems.push(where + ': unknown effect ' + key);
            if (!Number.isInteger(card.effects[key])) problems.push(where + ': effect ' + key + ' must be a whole number');
        });
        (String(card.text || '').concat((card.surges || []).map(function (x) { return x.effect; }).join(' ')).match(/\{(\w+)\}/g) || []).forEach(function (token) {
            if (ICONS.indexOf(token.slice(1, -1)) === -1) problems.push(where + ': unknown text token ' + token);
        });
        if ((String(card.text || '').match(/\*/g) || []).length % 2) problems.push(where + ': unbalanced * in text');
        if (card.scan && !existsExact(card.scan)) problems.push(where + ': scan not found (check exact case): ' + card.scan);
        if (card.art && !existsExact(card.art)) problems.push(where + ': art not found (check exact case): ' + card.art);
        if (kind === 'items' && !card.text && !card.category) problems.push(where + ': needs text or a category (scan-only cards are not allowed)');
        if (card.grants) {
            Object.keys(card.grants).forEach(function (key) {
                if (['coins', 'items'].indexOf(key) === -1) problems.push(where + ': unknown grant ' + key);
            });
            if (card.grants.coins !== undefined && !(Number.isInteger(card.grants.coins) && card.grants.coins > 0)) problems.push(where + ': grants.coins must be a positive whole number');
            pendingGrants.push({ where: where, items: card.grants.items || [] });
        }
        if (card.category && schema.categories && schema.categories.indexOf(card.category) === -1) problems.push(where + ': unknown category ' + card.category);
        if (card.attack && schema.attacks.indexOf(card.attack) === -1) problems.push(where + ': unknown attack ' + card.attack);
        (card.dice || []).forEach(function (d) { if (DICE.indexOf(d) === -1) problems.push(where + ': unknown die ' + d); });
        (card.surges || []).forEach(function (s) {
            if (!(Number.isInteger(s.cost) && s.cost > 0) || !s.effect) problems.push(where + ': surges need a positive cost and an effect');
        });
        if (card.hands !== undefined && [1, 2].indexOf(card.hands) === -1) problems.push(where + ': hands must be 1 or 2');
    });
    console.log(kind + ': ' + cards.length + ' cards');
});

pendingGrants.forEach(function (g) {
    g.items.forEach(function (id) { if (!seenIds[id]) problems.push(g.where + ': grants unknown card ' + id); });
});

if (problems.length) {
    console.log('\n' + problems.length + ' problem(s):');
    problems.forEach(function (p) { console.log('  - ' + p); });
    process.exit(1);
}
console.log('OK');
