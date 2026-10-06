// Party save files. Version 2 stores each hero's skills as card ids and no
// longer stores skill decks (they're derived from the card data). Version 1
// saves (no "version" field) are migrated on load.
app.factory('saveService', function (appData, cardService) {
    var SAVE_VERSION = 2;
    var STILL_SAVED_DECKS = [
        'storeItems', 'copperItems', 'silverItems', 'goldItems',
        'fighterFeats', 'subterfugeFeats', 'wizardryFeats', 'upgradeItems'
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

    function migrateV1(saveFile) {
        (saveFile.characters || []).forEach(function (character) {
            character.skills = (character.skills || []).map(function (skill) {
                return cardService.idForLegacyName('skills', skill.name, (skill.type || '').toLowerCase());
            });
        });
        // Character stats already include skill effects, so nothing is reapplied.
        // The fighterSkills/subterfugeSkills/wizardrySkills arrays are ignored:
        // deck counts are derived from what the party holds.
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
            if (!saveFile.version) saveFile = migrateV1(saveFile);
            appData.characters = saveFile.characters;
            appData.partyGold = saveFile.partyGold;
            appData.partyConquest = saveFile.partyConquest;
            STILL_SAVED_DECKS.forEach(function (key) {
                if (saveFile[key]) appData[key] = saveFile[key];
            });
        }
    };
});
