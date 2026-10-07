// Party save files. Since version 3, each hero's skills and feats are stored
// as card ids, and their decks aren't saved (they're derived from the card
// data). Older saves are migrated on load: any held card still stored as an
// object is matched to an id by name and deck.
app.factory('saveService', function (appData, cardService) {
    var SAVE_VERSION = 3;
    var DATA_KINDS = ['skills', 'feats'];
    var STILL_SAVED_DECKS = [
        'storeItems', 'copperItems', 'silverItems', 'goldItems', 'upgradeItems'
    ];

    function build() {
        var saveFile = {
            version: SAVE_VERSION,
            characters: appData.characters,
            partyGold: appData.partyGold,
            partyConquest: appData.partyConquest
        };
        STILL_SAVED_DECKS.forEach(function (key) { saveFile[key] = appData[key]; });
        return saveFile;
    }

    function migrate(saveFile) {
        (saveFile.characters || []).forEach(function (character) {
            DATA_KINDS.forEach(function (kind) {
                character[kind] = (character[kind] || []).map(function (card) {
                    if (typeof card === 'string') return card;
                    return cardService.idForLegacyName(kind, card.name, (card.type || '').toLowerCase());
                });
            });
        });
        // Character stats already include card effects, so nothing is reapplied.
        // Old deck arrays (fighterSkills, fighterFeats, ...) are ignored: deck
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
            STILL_SAVED_DECKS.forEach(function (key) {
                if (saveFile[key]) appData[key] = saveFile[key];
            });
        }
    };
});
