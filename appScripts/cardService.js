// Card data loaded from data/*.json. Everything card-related lives in the
// 'djCards' module so proof.html can use it without the rest of the app.
var djCards = angular.module('djCards', ['ngSanitize']);

djCards.factory('cardService', function ($http, $q) {
    var KINDS = ['skills', 'feats', 'items'];
    // Where a hero holds each kind of card. Items can be equipped or in the backpack.
    var HOLDINGS = { skills: ['skills'], feats: ['feats'], items: ['equipped', 'bag'] };
    // Kinds whose held copies carry state (an item can be tapped), stored as
    // { id, tapped } instead of a plain id.
    var STATEFUL = { items: true };
    var EFFECT_KEYS = ['maxWounds', 'maxFatigue', 'speed'];

    var byKind = {};
    var byId = {};
    var placeholders = {};
    var readyPromise = null;

    function normalize(name) {
        return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function index(kind, cards) {
        byKind[kind] = cards;
        cards.forEach(function (card) {
            card.kind = kind;
            byId[card.id] = card;
        });
    }

    var service = {
        EFFECT_KEYS: EFFECT_KEYS,
        HOLDINGS: HOLDINGS,

        // A held entry is either an id or { id, tapped }.
        entryId: function (entry) {
            return typeof entry === 'string' ? entry : entry && entry.id;
        },

        // Resolves once every data file is loaded. Routes wait on this.
        ready: function () {
            if (!readyPromise) {
                readyPromise = $q.all(KINDS.map(function (kind) {
                    return $http.get('data/' + kind + '.json').then(function (res) {
                        index(kind, res.data);
                    });
                })).then(function () { return service; });
            }
            return readyPromise;
        },

        // Name shown in pickers. Cards that grant a reward (Treasure Caches all
        // share a name) say what they grant so they can be told apart.
        pickerLabel: function (card) {
            if (!card.grants) return card.name;
            var parts = [];
            if (card.grants.coins) parts.push(card.grants.coins + ' coins');
            (card.grants.items || []).forEach(function (id) { parts.push(service.byId(id).name); });
            return card.name + (parts.length ? ' (' + parts.join(' + ') + ')' : '');
        },

        all: function (kind) {
            return byKind[kind] || [];
        },

        deck: function (kind, deck) {
            return service.all(kind).filter(function (card) { return card.deck === deck; });
        },

        // Unknown ids (cards removed from the data, or legacy names that could
        // not be matched) come back as a placeholder so they stay visible and
        // removable instead of disappearing.
        // Placeholders are cached: templates call byId on every digest, and a
        // new object each time would never settle.
        byId: function (id) {
            if (byId[id]) return byId[id];
            if (!placeholders[id]) {
                var label = String(id).indexOf('legacy:') === 0 ? id.slice(7) : id;
                placeholders[id] = { id: id, name: label, missing: true, text: 'This card is no longer in the card data. Remove it, or add it back to the JSON.' };
            }
            return placeholders[id];
        },

        // Matches an old save's card name to an id within a kind (and deck, if given).
        idForLegacyName: function (kind, name, deck) {
            var target = normalize(name);
            var match = service.all(kind).filter(function (card) {
                if (deck && card.deck !== deck) return false;
                if (normalize(card.name) === target) return true;
                return (card.aliases || []).some(function (alias) { return normalize(alias) === target; });
            })[0];
            return match ? match.id : 'legacy:' + name;
        },

        // How many copies are left in the deck: deck size minus what the party
        // holds, across every place a hero can hold that kind (see HOLDINGS).
        remaining: function (card, characters) {
            var held = 0;
            (characters || []).forEach(function (character) {
                HOLDINGS[card.kind].forEach(function (field) {
                    (character[field] || []).forEach(function (entry) {
                        if (service.entryId(entry) === card.id) held++;
                    });
                });
            });
            return card.qty - held;
        },

        // Cards in a deck with at least one copy left, for the pickers.
        choices: function (kind, deck, characters) {
            return service.deck(kind, deck).filter(function (card) {
                return service.remaining(card, characters) > 0;
            });
        },

        // Picks from the copies left, so every remaining copy is equally likely.
        drawRandom: function (kind, deck, characters) {
            var pool = [];
            service.choices(kind, deck, characters).forEach(function (card) {
                for (var n = service.remaining(card, characters); n > 0; n--) pool.push(card);
            });
            return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
        },

        // field defaults to the kind's first holding (items: 'equipped').
        give: function (character, card, field) {
            field = field || HOLDINGS[card.kind][0];
            character[field].push(STATEFUL[card.kind] ? { id: card.id, tapped: false } : card.id);
            service.applyEffects(character, card, +1);
        },

        take: function (character, field, index) {
            var entry = character[field].splice(index, 1)[0];
            service.applyEffects(character, service.byId(service.entryId(entry)), -1);
        },

        // Moves a held copy (keeping its tapped state) between fields or heroes.
        // Effects follow the card when it changes hero.
        move: function (from, fromField, index, to, toField) {
            var entry = from[fromField].splice(index, 1)[0];
            to[toField].push(entry);
            if (from !== to) {
                var card = service.byId(service.entryId(entry));
                service.applyEffects(from, card, -1);
                service.applyEffects(to, card, +1);
            }
        },

        // sign is +1 when a hero gains the card and -1 when they lose it.
        // Gaining raises the max and the current value together; losing lowers
        // the max and clamps the current value to it.
        applyEffects: function (character, card, sign) {
            var effects = card.effects || {};
            if (effects.maxWounds) {
                character.woundsCap += sign * effects.maxWounds;
                character.wounds = sign > 0 ? character.wounds + effects.maxWounds : Math.min(character.wounds, character.woundsCap);
            }
            if (effects.maxFatigue) {
                character.fatigueCap += sign * effects.maxFatigue;
                character.fatigue = sign > 0 ? character.fatigue + effects.maxFatigue : Math.min(character.fatigue, character.fatigueCap);
            }
            if (effects.speed) {
                character.speed += sign * effects.speed;
            }
        }
    };
    return service;
});
