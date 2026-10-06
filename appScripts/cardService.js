// Card data loaded from data/*.json. Everything card-related lives in the
// 'djCards' module so proof.html can use it without the rest of the app.
var djCards = angular.module('djCards', ['ngSanitize']);

djCards.factory('cardService', function ($http, $q) {
    var KINDS = ['skills'];
    var EFFECT_KEYS = ['maxWounds', 'maxFatigue', 'speed'];

    var byKind = {};
    var byId = {};
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
        byId: function (id) {
            if (byId[id]) return byId[id];
            var label = String(id).indexOf('legacy:') === 0 ? id.slice(7) : id;
            return { id: id, name: label, missing: true, text: 'This card is no longer in the card data. Remove it, or add it back to the JSON.' };
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

        // How many copies are left in the deck: deck size minus what the party holds.
        remaining: function (card, characters, field) {
            var held = 0;
            (characters || []).forEach(function (character) {
                (character[field] || []).forEach(function (id) {
                    if (id === card.id) held++;
                });
            });
            return card.qty - held;
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
