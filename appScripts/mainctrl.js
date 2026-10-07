app.controller('MainCtrl', function ($scope, appData, uiUploader, $log, $location, saveService, heroService) {

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
                $scope.newHero = [];
                $scope.creatingParty = true;
                $scope.$apply();
            });
        } else
            $scope.creatingParty = true;
    };
    // Party creation: one picker per slot. A hero already chosen in another
    // slot isn't offered again.
    $scope.newHero = [];
    $scope.heroChoices = function (slot) {
        // Compare by id: with "track by", ngOptions gives the model a copy.
        var taken = $scope.newHero.filter(function (hero, i) { return hero && i !== slot; })
            .map(function (hero) { return hero.id; });
        return heroService.all().filter(function (hero) { return taken.indexOf(hero.id) === -1; });
    };
    $scope.setHero = function (index) {
        var hero = $scope.newHero[index];
        if (hero) {
            $scope.appData.characters[index] = heroService.newCharacter(hero);
        } else {
            // Clearing a slot also clears the slots after it (they're shown in order).
            $scope.appData.characters.length = index;
            $scope.newHero.length = index;
        }
    };
    $scope.exportToFile = function () {
        saveService.download($scope.partyName || 'Descent Party');
    };
    $scope.fileNameChanged = function (ele) {
        var reader = new FileReader();
        reader.onload = function () {
            saveService.load(reader.result);
            $location.path('/char/1');
            $scope.$apply();
        };
        reader.readAsText(ele.files[0]);
    };
    $scope.doneCreatingParty = function () {
        $scope.appData.partyGold = $scope.appData.characters.length * 300;
        $location.path('/char/1');
        //$scope.apply();
    };



});