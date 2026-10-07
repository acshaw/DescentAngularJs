var app = angular.module("myApp", ['ui.bootstrap', 'ngAnimate', 'ngRoute', 'ui.uploader', 'djCards']);

app.config(function ($routeProvider) {
    // Routes wait for the card and hero data so templates never render half-loaded.
    var loadCards = ['$q', 'cardService', 'heroService', function ($q, cardService, heroService) {
        return $q.all([cardService.ready(), heroService.ready()]);
    }];

    $routeProvider
        .when('/', {
            templateUrl: 'main.html',
            controller: 'MainCtrl',
            resolve: { cards: loadCards }
        })
        .when('/char/:id', {
            templateUrl: 'character.html',
            controller: 'CharCtrl',
            resolve: { cards: loadCards }
        });
});


app.factory("appData", function () {
    var appData = {
        partyGold: 0,
        partyConquest: 0,
        handSwitch: [true, false, false, false, false],
        currentDeck: 'Store',
        currentSkillDeck: 'Fighter',
        currentFeatDeck: 'Fighter',
        characters: []
    };
    return appData;

});