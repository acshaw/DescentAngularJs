app.controller('CharCtrl', function ($scope, $routeParams, appData, $location, cardService, cardNotice, saveService) {
    var charId = $routeParams.id;
    $scope.appData = appData;
    $scope.statusSwitch = 'bleed';
    $scope.cards = cardService;
    if ($scope.appData.characters.length < 1) {
        $location.path('/');
        $scope.$apply();
    };
    $scope.character = appData.characters[charId - 1];
    $scope.currentDeck = $scope.appData.currentDeck;
    $scope.currentSkillDeck = $scope.appData.currentSkillDeck;
    $scope.currentFeatDeck = $scope.appData.currentFeatDeck;
    $scope.picture = 'Images/Body Portraits/' + $scope.appData.characters[charId - 1].name + '.PNG';

    $scope.nextChar = function () {
        if (charId < 4)
            $location.path('char/' + (parseInt(charId) + 1));
    };
    $scope.prevChar = function () {
        if (charId > 1)
            $location.path('char/' + (parseInt(charId) + 1));
    };
    $scope.exportToFile = function () {
        saveService.download('Descent Party');
    };
    $scope.tapCharacter = function () {
        $scope.isCharTapped = !$scope.isCharTapped;
    };
    $scope.handBtn = function (id) {
        $scope.appData.handSwitch = [];
        $scope.appData.handSwitch[id] = true;
    };
    $scope.movementHelp = function () {
        swal('Movement Costs', '<ul class="text-left"><li>0 Pick up a token in your space</li><li>0 Drop an item (lost forever)</li><li>1 Move from Glyph to town</li><li>1 Move from town to glyph</li><li>1 Walk up or down a staircase</li><li>1 Give one item to adjacent hero</li><li>1 Drink a potion</li><li>2 Open or close a door</li><li>2 Open chest</li><li>2 Re-equip</li><li>3 Jump over an obstacle (per space)</li></ul>', 'info');
    };

    $scope.woundIncrementer = function () {
        if ($scope.appData.characters[charId - 1].wounds < $scope.appData.characters[charId - 1].woundsCap)
            $scope.appData.characters[charId - 1].wounds++;
    };
    $scope.woundDecrementer = function () {
        if ($scope.appData.characters[charId - 1].wounds > 0)
            $scope.appData.characters[charId - 1].wounds--;
    };
    $scope.fatigueIncrementer = function () {
        if ($scope.character.fatigue < $scope.character.fatigueCap)
            $scope.character.fatigue++;

    };
    $scope.fatigueDecrementer = function () {
        if ($scope.character.fatigue > 0)
            $scope.character.fatigue--;
    };
    $scope.moneyIncrementer = function () {
        $scope.appData.partyGold = $scope.appData.partyGold + 25;
    };
    $scope.moneyDecrementer = function () {
        if ($scope.appData.partyGold > 0)
            $scope.appData.partyGold = $scope.appData.partyGold - 25;
    };
    $scope.conquestIncrementer = function () {
        $scope.appData.partyConquest = $scope.appData.partyConquest + 1;
    };
    $scope.conquestDecrementer = function () {
        if ($scope.appData.partyConquest > 0)
            $scope.appData.partyConquest = $scope.appData.partyConquest - 1;
    };

    // field is where the card is held: 'skills', 'feats', 'equipped' or 'bag'.
    // The rules can refuse a change (e.g. removing a power die that was
    // upgraded); cardNotice shows why.
    $scope.removeCard = function (field, index) {
        cardNotice(cardService.take($scope.character, field, index));
    };
    $scope.moveCard = function (field, index, toField) {
        cardNotice(cardService.move($scope.character, field, index, $scope.character, toField));
    };
    // Given items go into the other hero's backpack.
    $scope.giveCard = function (field, index, hero) {
        cardNotice(cardService.move($scope.character, field, index, hero, 'bag'));
    };
    // Treasure Caches: add the coins to party gold, put any granted items in
    // the backpack (if copies are left), then remove the cache.
    $scope.collect = function (field, index) {
        var card = cardService.byId(cardService.entryId($scope.character[field][index]));
        var grants = card.grants || {};
        $scope.appData.partyGold += grants.coins || 0;
        (grants.items || []).forEach(function (id) {
            var item = cardService.byId(id);
            if (!item.missing && cardService.remaining(item, $scope.appData.characters) > 0)
                cardService.give($scope.character, item, 'bag');
        });
        cardService.take($scope.character, field, index);
    };
    $scope.otherHeroes = function () {
        return $scope.appData.characters.filter(function (hero) { return hero !== $scope.character; });
    };
    $scope.switchFeatLabel = function (val) {
        switch (val) {
            case 'Fighter':
                $scope.appData.currentFeatDeck = 'Subterfuge';
                break;
            case 'Subterfuge':
                $scope.appData.currentFeatDeck = 'Wizardry';
                break;
            case 'Wizardry':
                $scope.appData.currentFeatDeck = 'Fighter';
                break;
        }
        $scope.currentFeatDeck = $scope.appData.currentFeatDeck;
    }
    $scope.switchDeck = function (val) {
        switch (val) {
            case 'Store':
                $scope.appData.currentDeck = 'Copper';
                break;
            case 'Copper':
                $scope.appData.currentDeck = 'Silver';
                break;
            case 'Silver':
                $scope.appData.currentDeck = 'Gold';
                break;
            case 'Gold':
                $scope.appData.currentDeck = 'Store';
                break;
            case 'Fighter':
                $scope.appData.currentSkillDeck = 'Subterfuge';
                break;
            case 'Subterfuge':
                $scope.appData.currentSkillDeck = 'Wizardry';
                break;
            case 'Wizardry':
                $scope.appData.currentSkillDeck = 'Fighter';
                break;
        }
        $scope.currentSkillDeck = $scope.appData.currentSkillDeck;
        $scope.currentDeck = $scope.appData.currentDeck;
    };
    $scope.getNumber = function (num) {
        return new Array(num);
    };


});