// Card data loaded from data/*.json. Everything card-related lives in the
// 'djCards' module so proof.html can use it without the rest of the app.
var djCards = angular.module('djCards', ['ngSanitize']);

djCards.factory('cardService', function ($http, $q) {
    var KINDS = ['skills', 'feats'];
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
        // holds. A hero's held cards of a kind live in character[kind] as ids.
        remaining: function (card, characters) {
            var held = 0;
            (characters || []).forEach(function (character) {
                (character[card.kind] || []).forEach(function (id) {
                    if (id === card.id) held++;
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

        give: function (character, card) {
            character[card.kind].push(card.id);
            service.applyEffects(character, card, +1);
        },

        take: function (character, kind, index) {
            var id = character[kind].splice(index, 1)[0];
            service.applyEffects(character, service.byId(id), -1);
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
