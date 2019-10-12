app.controller('NavCtrl', function ($scope, appData) {
    $scope.appData = appData;
    $scope.isNavCollapsed = true;
    $scope.unTapAll = function () {
        for (i = 0; i < $scope.appData.characters.length; i++) {
            $scope.appData.characters[i].isCharTapped = false;

            for (j = 0; j < $scope.appData.characters[i].equipped.length; j++) {
                $scope.appData.characters[i].equipped[j].isItemTapped = false;
            };

        };
    };
    $scope.exportToFile = function () {

        $scope.partyName = 'Descent Party';
        var saveFile = {};
        saveFile.characters = $scope.appData.characters;
        saveFile.partyGold = $scope.appData.partyGold;
        saveFile.partyConquest = $scope.appData.partyConquest;
        saveFile.storeItems = $scope.appData.storeItems;
        saveFile.copperItems = $scope.appData.copperItems;
        saveFile.silverItems = $scope.appData.silverItems;
        saveFile.goldItems = $scope.appData.goldItems;
        saveFile.fighterSkills = $scope.appData.fighterSkills;
        saveFile.subterfugeSkills = $scope.appData.subterfugeSkills;
        saveFile.wizardrySkills = $scope.appData.wizardrySkills;
        saveFile.fighterFeats = $scope.appData.fighterFeats;
        saveFile.subterfugeFeats = $scope.appData.subterfugeFeats;
        saveFile.wizardryFeats = $scope.appData.wizardryFeats;
        saveFile.upgradeItems = $scope.appData.upgradeItems;

        var blob = new Blob([JSON.stringify(saveFile)], { type: 'text/plain' });

        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, $scope.partyName);
        } else {
            var e = document.createEvent('MouseEvents'),
                a = document.createElement('a');
            a.download = $scope.partyName;
            a.href = window.URL.createObjectURL(blob);
            a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
            e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            // window.URL.revokeObjectURL(url); // clean the url.createObjectURL resource
        }
    };
});