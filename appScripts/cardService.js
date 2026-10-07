// Card data loaded from data/*.json. Everything card-related lives in the
// 'djCards' module so proof.html can use it without the rest of the app.
var djCards = angular.module('djCards', ['ngSanitize']);

djCards.factory('cardService', function ($http, $q) {
    var KINDS = ['skills', 'feats', 'items', 'upgrades'];
    // Where a hero holds each kind of card. Items can be equipped or in the backpack.
    var HOLDINGS = { skills: ['skills'], feats: ['feats'], items: ['equipped', 'bag'], upgrades: ['upgrades'] };
    // Kinds whose held copies carry state (an item can be tapped), stored as
    // { id, tapped } instead of a plain id.
    var STATEFUL = { items: true };
    // Power dice per attack type, black -> silver -> gold. A hero may hold at
    // most MAX_POWER_DICE of one attack type, and no count may go below 0.
    var ATTACKS = ['melee', 'ranged', 'magic'];
    var DIE_TIERS = [{ key: 'Power', label: 'black' }, { key: 'SilverPower', label: 'silver' }, { key: 'GoldPower', label: 'gold' }];
    var MAX_POWER_DICE = 5;
    var DIE_KEYS = [];
    ATTACKS.forEach(function (a) { DIE_TIERS.forEach(function (t) { DIE_KEYS.push(a + t.key); }); });
    var EFFECT_KEYS = ['maxWounds', 'maxFatigue', 'speed'].concat(DIE_KEYS);

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
        DIE_KEYS: DIE_KEYS,
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
            // Upgrades share names across tiers ("Maximum Wounds"), so add the tier.
            if (card.tier && card.name.toLowerCase().indexOf(card.tier) === -1) {
                return card.name + ' (' + card.tier.charAt(0).toUpperCase() + card.tier.slice(1) + ')';
            }
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
        // Why a hero can't gain (sign +1) or lose (sign -1) a card, or null if
        // they can. Only power dice have rules: no count below 0, at most
        // MAX_POWER_DICE per attack type.
        check: function (character, card, sign) {
            var effects = card.effects || {};
            var who = character.name || 'This hero';
            for (var a = 0; a < ATTACKS.length; a++) {
                var attack = ATTACKS[a], total = 0, touched = false;
                for (var t = 0; t < DIE_TIERS.length; t++) {
                    var key = attack + DIE_TIERS[t].key;
                    var change = sign * (effects[key] || 0);
                    var after = (character[key] || 0) + change;
                    if (change) touched = true;
                    if (after < 0) {
                        return sign > 0
                            ? who + ' has no ' + DIE_TIERS[t].label + ' ' + attack + ' power dice to upgrade.'
                            : 'Can\'t remove ' + card.name + ': that ' + DIE_TIERS[t].label + ' ' + attack + ' die has been upgraded. Remove the higher upgrade first.';
                    }
                    total += after;
                }
                if (touched && total > MAX_POWER_DICE) {
                    return who + ' already has ' + MAX_POWER_DICE + ' ' + attack + ' power dice, the limit.';
                }
            }
            return null;
        },

        // give, take and move return a reason (and change nothing) when the
        // rules refuse, otherwise null.
        // field defaults to the kind's first holding (items: 'equipped').
        give: function (character, card, field) {
            var reason = service.check(character, card, +1);
            if (reason) return reason;
            field = field || HOLDINGS[card.kind][0];
            character[field].push(STATEFUL[card.kind] ? { id: card.id, tapped: false } : card.id);
            service.applyEffects(character, card, +1);
            return null;
        },

        take: function (character, field, index) {
            var card = service.byId(service.entryId(character[field][index]));
            var reason = service.check(character, card, -1);
            if (reason) return reason;
            character[field].splice(index, 1);
            service.applyEffects(character, card, -1);
            return null;
        },

        // Moves a held copy (keeping its tapped state) between fields or heroes.
        // Effects follow the card when it changes hero.
        move: function (from, fromField, index, to, toField) {
            var entry = from[fromField][index];
            if (from !== to) {
                var card = service.byId(service.entryId(entry));
                var reason = service.check(from, card, -1) || service.check(to, card, +1);
                if (reason) return reason;
                service.applyEffects(from, card, -1);
                service.applyEffects(to, card, +1);
            }
            from[fromField].splice(index, 1);
            to[toField].push(entry);
            return null;
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
            DIE_KEYS.forEach(function (key) {
                if (effects[key]) character[key] = (character[key] || 0) + sign * effects[key];
            });
        }
    };
    return service;
});
