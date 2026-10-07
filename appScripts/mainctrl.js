app.controller('MainCtrl', function ($scope, appData, uiUploader, $log, $location, saveService) {

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