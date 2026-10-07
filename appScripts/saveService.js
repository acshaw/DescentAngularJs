// Party save files. Since version 6, each party member is its heroId plus live
// state (name and ability come from data/heroes.json). Skills, feats and
// upgrades are stored as card ids, and equipped/backpack items as { id, tapped }.
// No decks are saved (counts are derived from the card data). Older saves are migrated
// on load: any held card still stored the old way is matched to an id by name
// and deck.
app.factory('saveService', function (appData, cardService, heroService) {
    var SAVE_VERSION = 6;
    // Hero-card fields that used to be copied into every saved character.
    var NOT_SAVED = ['trait', 'isTapped'];
    // Where each kind is held on a hero (see cardService.HOLDINGS).
    var HELD_FIELDS = { skills: 'skills', feats: 'feats', equipped: 'items', bag: 'items', upgrades: 'upgrades' };

    function build() {
        var saveFile = {
            version: SAVE_VERSION,
            characters: appData.characters.map(function (character) {
                var copy = angular.copy(character);
                NOT_SAVED.forEach(function (key) { delete copy[key]; });
                return copy;
            }),
            partyGold: appData.partyGold,
            partyConquest: appData.partyConquest
        };
        return saveFile;
    }

    function migrate(saveFile) {
        (saveFile.characters || []).forEach(function (character) {
            if (!character.heroId) character.heroId = heroService.idForLegacyName(character.name);
            // Keep the name in step with the hero data (e.g. after a rename).
            var hero = heroService.byId(character.heroId);
            if (hero) {
                character.name = hero.name;
                NOT_SAVED.forEach(function (key) { delete character[key]; });
            }
            Object.keys(HELD_FIELDS).forEach(function (field) {
                var kind = HELD_FIELDS[field];
                character[field] = (character[field] || []).map(function (entry) {
                    if (typeof entry === 'string' || entry.id) return entry;
                    // Upgrades have no deck; their old names are aliases.
                    var deck = kind === 'upgrades' ? null : (entry.type || '').toLowerCase();
                    var id = cardService.idForLegacyName(kind, entry.name, deck);
                    return kind === 'items' ? { id: id, tapped: !!entry.isItemTapped } : id;
                });
            });
        });
        // Character stats already include card effects, so nothing is reapplied.
        // Old deck arrays (fighterSkills, storeItems, upgradeItems, ...) are ignored: deck
        // counts are derived from what the party holds.
        saveFile.version = SAVE_VERSION;
        return saveFile;
    }

    return {
        download: function (partyName) {
            var blob = new Blob([angular.toJson(build())], { type: 'text/plain' });
            var name = partyName || 'Descent Party';
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(blob, name);
            } else {
                var a = document.createElement('a');
                a.download = name;
                a.href = window.URL.createObjectURL(blob);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        },

        load: function (text) {
            var saveFile = JSON.parse(text);
            saveFile = migrate(saveFile);
            appData.characters = saveFile.characters;
            appData.partyGold = saveFile.partyGold;
            appData.partyConquest = saveFile.partyConquest;
        }
    };
});
