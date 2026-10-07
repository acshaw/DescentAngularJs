app.controller('NavCtrl', function ($scope, appData, saveService, heroService) {
    $scope.appData = appData;
    $scope.heroes = heroService;
    $scope.isNavCollapsed = true;
    $scope.unTapAll = function () {
        for (i = 0; i < $scope.appData.characters.length; i++) {
            $scope.appData.characters[i].isCharTapped = false;

            for (j = 0; j < $scope.appData.characters[i].equipped.length; j++) {
                $scope.appData.characters[i].equipped[j].tapped = false;
            };

        };
    };
    $scope.exportToFile = function () {
        saveService.download('Descent Party');
    };
});