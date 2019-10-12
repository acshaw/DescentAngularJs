app.controller('MainCtrl', function ($scope, appData, uiUploader, $log,$location) {

    $scope.appData = appData;
    $scope.createNewParty = function () {
        if ($scope.appData.characters.length > 0) {
            swal({
                title: 'Are you sure?',
                text: "This will erase the currently loaded party.",
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, I am sure!'
            }).then(function () {
                $scope.appData.characters = [];
                $scope.creatingParty = true;
                $scope.$apply();
            });
        } else
            $scope.creatingParty = true;
    };
    $scope.setHero = function (index) {
        $scope.appData.characters[index] = JSON.parse($scope.newHero[index]);
    }
    $scope.exportToFile = function () {
        if ($scope.partyName.length === 0 || $scope.partyName === null || $scope.partyName === undefined) {
            $scope.partyName = 'Descent Party';
        }
        console.log($scope.appData);
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
    }
    $scope.fileNameChanged = function (ele) {


        var files = ele.files;
        var l = files.length;
        var namesArr = [];

        for (var i = 0; i < l; i++) {
            namesArr.push(files[i].name);
        }

        var reader = new FileReader();
        reader.onload = function () {
            $scope.fileContent = JSON.parse(reader.result);
            $scope.appData.characters = $scope.fileContent.characters;
            $scope.appData.partyGold = $scope.fileContent.partyGold;
            $scope.appData.partyConquest = $scope.fileContent.partyConquest;
            $scope.appData.storeItems = $scope.fileContent.storeItems;
            $scope.appData.copperItems = $scope.fileContent.copperItems;
            $scope.appData.silverItems = $scope.fileContent.silverItems;
            $scope.appData.goldItems = $scope.fileContent.goldItems;
            $scope.appData.fighterSkills = $scope.fileContent.fighterSkills;
            $scope.appData.subterfugeSkills = $scope.fileContent.subterfugeSkills;
            $scope.appData.wizardrySkills = $scope.fileContent.wizardrySkills;
            $scope.appData.fighterFeats = $scope.fileContent.fighterFeats;
            $scope.appData.subterfugeFeats = $scope.fileContent.subterfugeFeats;
            $scope.appData.wizardryFeats = $scope.fileContent.wizardryFeats;
            $scope.appData.upgradeItems = $scope.fileContent.upgradeItems;

            $scope.$apply();

            $location.path('/char/1');
            $scope.$apply();
        }
        reader.readAsText(files[0]);
    };
    $scope.doneCreatingParty = function () {
        $scope.appData.partyGold = $scope.appData.characters.length * 300;
        $location.path('/char/1');
        //$scope.apply();
    };



});