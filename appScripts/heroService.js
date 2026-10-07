// Hero cards loaded from data/heroes.json. A character in the party is the
// hero's live state plus heroId; name, ability and portraits come from here.
djCards.factory('heroService', function ($http) {
    var heroes = [];
    var byId = {};
    var readyPromise = null;

    function normalize(name) {
        return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    var service = {
        ready: function () {
            if (!readyPromise) {
                readyPromise = $http.get('data/heroes.json').then(function (res) {
                    heroes = res.data;
                    heroes.forEach(function (hero) { byId[hero.id] = hero; });
                    return service;
                });
            }
            return readyPromise;
        },

        all: function () {
            return heroes;
        },

        byId: function (id) {
            return byId[id];
        },

        // The hero behind a party member (null for an unknown hero).
        of: function (character) {
            return (character && byId[character.heroId]) || null;
        },

        face: function (character) {
            var hero = service.of(character);
            return hero ? hero.face : '';
        },

        body: function (character) {
            var hero = service.of(character);
            return hero ? hero.body : '';
        },

        ability: function (character) {
            var hero = service.of(character);
            return hero ? hero.ability : (character && character.trait) || '';
        },

        idForLegacyName: function (name) {
            var target = normalize(name);
            var match = heroes.filter(function (hero) { return normalize(hero.name) === target; })[0];
            return match ? match.id : null;
        },

        // Starting state for a hero joining the party. Field names match what
        // the character screen and cards already use.
        newCharacter: function (hero) {
            return {
                heroId: hero.id,
                name: hero.name,
                wounds: hero.wounds, woundsCap: hero.wounds,
                fatigue: hero.fatigue, fatigueCap: hero.fatigue,
                armor: hero.armor, speed: hero.speed,
                meleePower: hero.dice.melee, meleeSilverPower: 0, meleeGoldPower: 0,
                rangedPower: hero.dice.ranged, rangedSilverPower: 0, rangedGoldPower: 0,
                magicPower: hero.dice.magic, magicSilverPower: 0, magicGoldPower: 0,
                fighterTraits: hero.traits.fighter,
                subterfugeTraits: hero.traits.subterfuge,
                wizardryTraits: hero.traits.wizardry,
                skills: [], feats: [], equipped: [], bag: [], upgrades: [],
                bleedStatus: 0, dazeStatus: 0, poisonStatus: 0, curseStatus: 0,
                stunStatus: 0, burnStatus: 0, webStatus: 0, freezeStatus: 0,
                isCharTapped: false
            };
        }
    };
    return service;
});
