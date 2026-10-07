// Party save files. Since version 5, each hero's skills, feats and upgrades
// are stored as card ids, and equipped/backpack items as { id, tapped }. No
// decks are saved (counts are derived from the card data). Older saves are migrated
// on load: any held card still stored the old way is matched to an id by name
// and deck.
app.factory('saveService', function (appData, cardService) {
    var SAVE_VERSION = 5;
    // Where each kind is held on a hero (see cardService.HOLDINGS).
    var HELD_FIELDS = { skills: 'skills', feats: 'feats', equipped: 'items', bag: 'items', upgrades: 'upgrades' };

    function build() {
        var saveFile = {
            version: SAVE_VERSION,
            characters: appData.characters,
            partyGold: appData.partyGold,
            partyConquest: appData.partyConquest
        };
        return saveFile;
    }

    function migrate(saveFile) {
        (saveFile.characters || []).forEach(function (character) {
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
