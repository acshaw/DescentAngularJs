app.controller('CharCtrl', function ($scope, $routeParams, appData, $location, cardService, saveService) {
    var charId = $routeParams.id;
    $scope.appData = appData;
    $scope.statusSwitch = 'bleed';
    $scope.pick = {};
    $scope.cards = cardService;
    $scope.upgradeDeck = $scope.appData.upgradeItems;
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

    $scope.removeItemFromSkills = function (index) {
        var removedId = $scope.character.skills.splice(index, 1)[0];
        cardService.applyEffects($scope.character, cardService.byId(removedId), -1);
    };
    $scope.removeItemFromEquipment = function (index) {
        var removedItem = $scope.character.equipped.splice(index, 1);
        switch (removedItem[0].type) {
            case 'store':
                for (i = 0; i < $scope.appData.storeItems.length; i++) {
                    if ($scope.appData.storeItems[i].name === removedItem[0].name) {
                        $scope.appData.storeItems[i].qty++;
                    };
                };
                break;
            case 'Copper':
                for (i = 0; i < $scope.appData.copperItems.length; i++) {
                    if ($scope.appData.copperItems[i].name === removedItem[0].name) {
                        $scope.appData.copperItems[i].qty++;
                    };
                };
                break;
            case 'Silver':
                for (i = 0; i < $scope.appData.silverItems.length; i++) {
                    if ($scope.appData.silverItems[i].name === removedItem[0].name) {
                        $scope.appData.silverItems[i].qty++;
                    };
                };
                break;
            case 'Gold':
                for (i = 0; i < $scope.appData.goldItems.length; i++) {
                    if ($scope.appData.goldItems[i].name === removedItem[0].name) {
                        $scope.appData.goldItems[i].qty++;
                    };
                };
                break;
        };
    };
    $scope.removeItemFromBag = function (index) {
        var removedItem = $scope.character.bag.splice(index, 1);
        switch (removedItem[0].type) {
            case 'store':
                for (i = 0; i < $scope.appData.storeItems.length; i++) {
                    if ($scope.appData.storeItems[i].name === removedItem[0].name) {
                        $scope.appData.storeItems[i].qty++;
                    };
                };
                break;
            case 'Copper':
                for (i = 0; i < $scope.appData.copperItems.length; i++) {
                    if ($scope.appData.copperItems[i].name === removedItem[0].name) {
                        $scope.appData.copperItems[i].qty++;
                    };
                };
                break;
            case 'Silver':
                for (i = 0; i < $scope.appData.silverItems.length; i++) {
                    if ($scope.appData.silverItems[i].name === removedItem[0].name) {
                        $scope.appData.silverItems[i].qty++;
                    };
                };
                break;
            case 'Gold':
                for (i = 0; i < $scope.appData.goldItems.length; i++) {
                    if ($scope.appData.goldItems[i].name === removedItem[0].name) {
                        $scope.appData.goldItems[i].qty++;
                    };
                };
                break;
        };

    };
    $scope.removeItemFromFeats = function (index) {
        var removedItem = $scope.character.feats.splice(index, 1);
        switch (removedItem[0].type) {
            case 'Fighter':
                for (i = 0; i < $scope.appData.fighterFeats.length; i++) {
                    if ($scope.appData.fighterFeats[i].name === removedItem[0].name) {
                        $scope.appData.fighterFeats[i].qty++;
                    };
                };
                break;
            case 'Subterfuge':
                for (i = 0; i < $scope.appData.subterfugeFeats.length; i++) {
                    if ($scope.appData.subterfugeFeats[i].name === removedItem[0].name) {
                        $scope.appData.subterfugeFeats[i].qty++;
                    };
                };
                break;
            case 'Wizardry':
                for (i = 0; i < $scope.appData.wizardryFeats.length; i++) {
                    if ($scope.appData.wizardryFeats[i].name === removedItem[0].name) {
                        $scope.appData.wizardryFeats[i].qty++;
                    };
                };
                break;
        };
    };
    $scope.removeItemFromUpgrades = function (index) {
        var original = angular.copy($scope.character.upgrades);
        var removedItem = $scope.character.upgrades.splice(index, 1)[0];
        for (i = 0; i < $scope.appData.upgradeItems.length; i++) {
            if ($scope.appData.upgradeItems[i].name === removedItem.name) {
                $scope.appData.upgradeItems[i].qty--;
                switch (removedItem.name) {
                    case 'Maximum Wounds Copper':
                        $scope.character.woundsCap = $scope.character.woundsCap - 4;
                        $scope.character.wounds = $scope.character.wounds - 4;
                        break;
                    case 'Maximum Wounds Silver':
                        $scope.character.woundsCap = $scope.character.woundsCap - 4;
                        $scope.character.wounds = $scope.character.wounds - 4;
                        break;
                    case 'Maximum Wounds Gold':
                        $scope.character.woundsCap = $scope.character.woundsCap - 4;
                        $scope.character.wounds = $scope.character.wounds - 4;
                        break;
                    case 'Maximum Fatigue Copper':
                        $scope.character.fatigueCap = $scope.character.fatigueCap - 2;
                        $scope.character.fatigue = $scope.character.fatigue - 2;
                        break;
                    case 'Maximum Fatigue Silver':
                        $scope.character.fatigueCap = $scope.character.fatigueCap - 2;
                        $scope.character.fatigue = $scope.character.fatigue - 2;
                        break;
                    case 'Maximum Fatigue Gold':
                        $scope.character.fatigueCap = $scope.character.fatigueCap - 2;
                        $scope.character.fatigue = $scope.character.fatigue - 2;
                        break;
                    case 'Melee Power':
                        if ($scope.character.meleePower > 0)
                            $scope.character.meleePower = $scope.character.meleePower - 1;
                        else {
                            $scope.character.upgrades = orginal;
                        }
                        break;
                    case 'Ranged Power':
                        if ($scope.character.rangedPower > 0)
                            $scope.character.rangedPower = $scope.character.rangedPower - 1;
                        else {
                            $scope.character.upgrades = original;
                        }
                        break;
                    case 'Magic Power':
                        if ($scope.character.magicPower > 0)
                            $scope.character.magicPower = $scope.character.magicPower - 1;
                        else {
                            $scope.character.upgrades = original;
                        }
                        break;
                    case 'Melee Power Silver':
                        if ($scope.character.meleeSilverPower > 0) {
                            $scope.character.meleePower = $scope.character.meleePower + 1;
                            $scope.character.meleeSilverPower = $scope.character.meleeSilverPower - 1;
                        }
                        else {
                            $scope.character.upgrades = original;
                        }
                        break;
                    case 'Ranged Power Silver':
                        alert('hi');
                        if ($scope.character.rangedSilverPower > 0) {
                            alert('HI')
                            $scope.character.rangedPower = $scope.character.rangedPower + 1;
                            $scope.character.rangedSilverPower = $scope.character.rangedSilverPower - 1;
                        }
                        else {
                            $scope.character.upgrades = original;
                        }
                        break;
                    case 'Magic Power Silver':
                        if ($scope.character.magicSilverPower > 0) {
                            $scope.character.magicPower = $scope.character.magicPower + 1;
                            $scope.character.magicSilverPower = $scope.character.magicSilverPower - 1;
                        }
                        else {
                            $scope.character.upgrades = original;
                        }
                        break;
                    case 'Melee Power Gold':
                        if ($scope.character.meleeGoldPower > 0) {
                            $scope.character.meleeSilverPower = $scope.character.meleeSilverPower + 1;
                            $scope.character.meleeGoldPower = $scope.character.meleeGoldPower - 1;
                        }
                        else {
                            $scope.character.upgrades = original;
                        }
                        break;
                    case 'Ranged Power Gold':
                        if ($scope.character.rangedGoldPower > 0) {
                            $scope.character.rangedSilverPower = $scope.character.rangedSilverPower + 1;
                            $scope.character.rangedGoldPower = $scope.character.rangedGoldPower - 1;
                        }
                        else {
                            $scope.character.upgrades = original;
                        }
                        break;
                    case 'Magic Power Gold':
                        if ($scope.character.magicGoldPower > 0) {
                            $scope.character.magicSilverPower = $scope.character.magicSilverPower + 1;
                            $scope.character.magicGoldPower = $scope.character.magicGoldPower - 1;
                        }
                        else {
                            $scope.character.upgrades = original;
                        }
                        break;
                    default:
                        break;
                };
            };
        };
    };

    $scope.moveItemToBag = function (index) {
        $scope.character.bag.push($scope.character.equipped[index]);
        $scope.character.equipped.splice(index, 1);
    };
    $scope.moveItemToEquipment = function (index) {
        $scope.character.equipped.push($scope.character.bag[index]);
        $scope.character.bag.splice(index, 1);
    };

    $scope.addRandomSkill = function () {
        // Weighted by copies left, so every remaining card is equally likely.
        var pool = [];
        $scope.skillChoices().forEach(function (card) {
            for (var n = $scope.skillsLeft(card); n > 0; n--) pool.push(card);
        });
        if (pool.length)
            $scope.addSkill(pool[Math.floor(Math.random() * pool.length)]);
    };
    $scope.addRandomFeat = function () {
        var deckName = $scope.currentFeatDeck;
        var cardCount = 0;
        var newItem
        for (i = 0; i < $scope.featDeck.length; i++)
            cardCount = cardCount + $scope.featDeck[i].qty;

        var randomNumber = Math.floor(Math.random() * cardCount);

        for (i = 0; i < $scope.featDeck.length; i++) {
            randomNumber = randomNumber - $scope.featDeck[i].qty;

            if (randomNumber < 1) {
                newItem = $scope.featDeck[i];

                switch (newItem.type) {
                    case "Fighter":
                        for (i = 0; i < $scope.appData.fighterFeats.length; i++) {
                            if ($scope.appData.fighterFeats[i].name === newItem.name) {
                                $scope.appData.fighterFeats[i].qty--;
                            };
                        };
                        break;
                    case "Subterfuge":
                        for (i = 0; i < $scope.appData.subterfugeFeats.length; i++) {
                            if ($scope.appData.subterfugeFeats[i].name === newItem.name) {
                                $scope.appData.subterfugeFeats[i].qty--;
                            };
                        };
                        break;
                    case "Wizardry":
                        for (i = 0; i < $scope.appData.wizardryFeats.length; i++) {
                            if ($scope.appData.wizardryFeats[i].name === newItem.name) {
                                $scope.appData.wizardryFeats[i].qty--;
                            };
                        };
                        break;
                };
                $scope.character.feats.push(newItem);
                return;
            }
        }
    };
    $scope.addRandomItemToEquipment = function () {
        var deckName = $scope.currentDeck;
        var cardCount = 0;
        var deck = $scope.itemDeck;
        var newItem

        for (i = 0; i < $scope.itemDeck.length; i++)
            cardCount = cardCount + $scope.itemDeck[i].qty;

        var randomNumber = Math.floor(Math.random() * cardCount);

        for (i = 0; i < $scope.itemDeck.length; i++) {
            randomNumber = randomNumber - $scope.itemDeck[i].qty;

            if (randomNumber < 1) {
                newItem = $scope.itemDeck[i];

                switch (newItem.type) {
                    case "store":
                        for (i = 0; i < $scope.appData.storeItems.length; i++) {
                            if ($scope.appData.storeItems[i].name === newItem.name) {
                                $scope.appData.storeItems[i].qty--;
                            };
                        };
                        break;
                    case "Copper":
                        for (i = 0; i < $scope.appData.copperItems.length; i++) {
                            if ($scope.appData.copperItems[i].name === newItem.name) {
                                $scope.appData.copperItems[i].qty--;
                            };
                        };
                        break;
                    case "Silver":
                        for (i = 0; i < $scope.appData.silverItems.length; i++) {
                            if ($scope.appData.silverItems[i].name === newItem.name) {
                                $scope.appData.silverItems[i].qty--;
                            };
                        };
                        break;
                    case "Gold":
                        for (i = 0; i < $scope.appData.goldItems.length; i++) {
                            if ($scope.appData.goldItems[i].name === newItem.name) {
                                $scope.appData.goldItems[i].qty--;
                            };
                        };
                        break;
                };
                $scope.character.equipped.push(newItem);
                return;
            }
        }

    };
    $scope.addRandomItemToBag = function () {
        var deckName = $scope.currentDeck;
        var cardCount = 0;
        var deck = $scope.itemDeck;
        var newItem

        for (i = 0; i < $scope.itemDeck.length; i++)
            cardCount = cardCount + $scope.itemDeck[i].qty;

        var randomNumber = Math.floor(Math.random() * cardCount);

        for (i = 0; i < $scope.itemDeck.length; i++) {
            randomNumber = randomNumber - $scope.itemDeck[i].qty;

            if (randomNumber < 1) {
                newItem = $scope.itemDeck[i];

                switch (newItem.type) {
                    case "store":
                        for (i = 0; i < $scope.appData.storeItems.length; i++) {
                            if ($scope.appData.storeItems[i].name === newItem.name) {
                                $scope.appData.storeItems[i].qty--;
                            };
                        };
                        break;
                    case "Copper":
                        for (i = 0; i < $scope.appData.copperItems.length; i++) {
                            if ($scope.appData.copperItems[i].name === newItem.name) {
                                $scope.appData.copperItems[i].qty--;
                            };
                        };
                        break;
                    case "Silver":
                        for (i = 0; i < $scope.appData.silverItems.length; i++) {
                            if ($scope.appData.silverItems[i].name === newItem.name) {
                                $scope.appData.silverItems[i].qty--;
                            };
                        };
                        break;
                    case "Gold":
                        for (i = 0; i < $scope.appData.goldItems.length; i++) {
                            if ($scope.appData.goldItems[i].name === newItem.name) {
                                $scope.appData.goldItems[i].qty--;
                            };
                        };
                        break;
                };
                $scope.character.bag.push(newItem);
                return;
            }
        }
    };

    $scope.addItemToEquipment = function () {
        var newItem = JSON.parse($scope.newEquipment);
        switch (newItem.type) {
            case 'store':
                for (i = 0; i < $scope.appData.storeItems.length; i++) {
                    if ($scope.appData.storeItems[i].name === newItem.name) {
                        $scope.appData.storeItems[i].qty--;
                    };
                };
                break;
            case 'Copper':
                for (i = 0; i < $scope.appData.copperItems.length; i++) {
                    if ($scope.appData.copperItems[i].name === newItem.name) {
                        $scope.appData.copperItems[i].qty--;
                    };
                };
                break;
            case 'Silver':
                for (i = 0; i < $scope.appData.silverItems.length; i++) {
                    if ($scope.appData.silverItems[i].name === newItem.name) {
                        $scope.appData.silverItems[i].qty--;
                    };
                };
                break;
            case 'Gold':
                for (i = 0; i < $scope.appData.goldItems.length; i++) {
                    if ($scope.appData.goldItems[i].name === newItem.name) {
                        $scope.appData.goldItems[i].qty--;
                    };
                };
                break;
        }
        $scope.character.equipped.push(newItem);
    };
    $scope.addItemToBag = function () {
        var newItem = JSON.parse($scope.newEquipment);
        switch (newItem.type) {
            case 'store':
                for (i = 0; i < $scope.appData.storeItems.length; i++) {
                    if ($scope.appData.storeItems[i].name === newItem.name) {
                        $scope.appData.storeItems[i].qty--;
                    };
                };
                break;
            case 'Copper':
                for (i = 0; i < $scope.appData.copperItems.length; i++) {
                    if ($scope.appData.copperItems[i].name === newItem.name) {
                        $scope.appData.copperItems[i].qty--;
                    };
                };
                break;
            case 'Silver':
                for (i = 0; i < $scope.appData.silverItems.length; i++) {
                    if ($scope.appData.silverItems[i].name === newItem.name) {
                        $scope.appData.silverItems[i].qty--;
                    };
                };
                break;
            case 'Gold':
                for (i = 0; i < $scope.appData.goldItems.length; i++) {
                    if ($scope.appData.goldItems[i].name === newItem.name) {
                        $scope.appData.goldItems[i].qty--;
                    };
                };
                break;
        };
        $scope.character.bag.push(newItem);
    };
    $scope.addSkill = function (card) {
        if (!card) return;
        $scope.character.skills.push(card.id);
        cardService.applyEffects($scope.character, card, +1);
        $scope.pick.skill = null;
    };
    $scope.skillsLeft = function (card) {
        return cardService.remaining(card, $scope.appData.characters, 'skills');
    };
    $scope.skillChoices = function () {
        var deck = ($scope.currentSkillDeck || 'Fighter').toLowerCase();
        return cardService.deck('skills', deck).filter(function (card) {
            return $scope.skillsLeft(card) > 0;
        });
    };
    $scope.addFeat = function () {
        var newItem = JSON.parse($scope.newFeat);
        console.log(newItem);
        switch (newItem.type) {
            case 'Fighter':
                for (i = 0; i < $scope.appData.fighterFeats.length; i++) {
                    if ($scope.appData.fighterFeats[i].name === newItem.name) {
                        $scope.appData.fighterFeats[i].qty--;
                    };
                };
                break;
            case 'Subterfuge':
                for (i = 0; i < $scope.appData.subterfugeFeats.length; i++) {
                    if ($scope.appData.subterfugeFeats[i].name === newItem.name) {
                        $scope.appData.subterfugeFeats[i].qty--;
                    };
                };
                break;
            case 'Wizardry':
                for (i = 0; i < $scope.appData.wizardryFeats.length; i++) {
                    if ($scope.appData.wizardryFeats[i].name === newItem.name) {
                        $scope.appData.wizardryFeats[i].qty--;
                    };
                };
                break;
        };
        $scope.character.feats.push(newItem);
    };
    $scope.addUpgrade = function () {
        var newItem = JSON.parse($scope.newUpgrade);
        for (i = 0; i < $scope.appData.upgradeItems.length; i++) {
            if ($scope.appData.upgradeItems[i].name === newItem.name) {
                $scope.appData.upgradeItems[i].qty--;

                switch (newItem.name) {
                    case 'Maximum Wounds Copper':
                        $scope.character.woundsCap = $scope.character.woundsCap + 4;
                        $scope.character.wounds = $scope.character.wounds + 4;
                        $scope.character.upgrades.push(newItem);
                        break;
                    case 'Maximum Wounds Silver':
                        $scope.character.woundsCap = $scope.character.woundsCap + 4;
                        $scope.character.wounds = $scope.character.wounds + 4;
                        $scope.character.upgrades.push(newItem);
                        break;
                    case 'Maximum Wounds Gold':
                        $scope.character.woundsCap = $scope.character.woundsCap + 4;
                        $scope.character.wounds = $scope.character.wounds + 4;
                        $scope.character.upgrades.push(newItem);
                        break;
                    case 'Maximum Fatigue Copper':
                        $scope.character.fatigueCap = $scope.character.fatigueCap + 2;
                        $scope.character.fatigue = $scope.character.fatigue + 2;
                        $scope.character.upgrades.push(newItem);
                        break;
                    case 'Maximum Fatigue Silver':
                        $scope.character.fatigueCap = $scope.character.fatigueCap + 2;
                        $scope.character.fatigue = $scope.character.fatigue + 2;
                        $scope.character.upgrades.push(newItem);
                        break;
                    case 'Maximum Fatigue Gold':
                        $scope.character.fatigueCap = $scope.character.fatigueCap + 2;
                        $scope.character.fatigue = $scope.character.fatigue + 2;
                        $scope.character.upgrades.push(newItem);
                        break;
                    case 'Melee Power':
                        if ($scope.character.meleePower + $scope.character.meleeSilverPower + $scope.character.meleeGoldPower < 5) {
                            $scope.character.meleePower = $scope.character.meleePower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Maximum Power Dice", "This character may not add any additional melee power dice. The limit is 5.", "info");
                        break;
                    case 'Ranged Power':
                        if ($scope.character.rangedPower + $scope.character.rangedSilverPower + $scope.character.rangedGoldPower < 5) {
                            $scope.character.rangedPower = $scope.character.rangedPower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Maximum Power Dice", "This character may not add any additional ranged power dice. The limit is 5.", "info");
                        break;
                    case 'Magic Power':
                        if ($scope.character.magicPower + $scope.character.magicSilverPower + $scope.character.magicGoldPower < 5) {
                            $scope.character.magicPower = $scope.character.magicPower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Maximum Power Dice", "This character may not add any additional magic power dice. The limit is 5.", "info");
                        break;
                    case 'Melee Power Silver':
                        if ($scope.character.meleePower > 0) {
                            $scope.character.meleePower = $scope.character.meleePower - 1;
                            $scope.character.meleeSilverPower = $scope.character.meleeSilverPower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Maximum Power Dice", "This character does not have any black melee power dice to upgrade.", "info");
                        break;
                    case 'Ranged Power Silver':
                        if ($scope.character.rangedPower > 0) {
                            $scope.character.rangedPower = $scope.character.rangedPower - 1;
                            $scope.character.rangedSilverPower = $scope.character.rangedSilverPower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Upgrading Power Dice", "This character does not have any black ranged power dice to upgrade.", "info");
                        break;
                    case 'Magic Power Silver':
                        if ($scope.character.magicPower > 0) {
                            $scope.character.magicPower = $scope.character.magicPower - 1;
                            $scope.character.magicSilverPower = $scope.character.magicSilverPower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Upgrading Power Dice", "This character does not have any black magic power dice to upgrade.", "info");
                        break;
                    case 'Melee Power Gold':
                        if ($scope.character.meleeSilverPower > 0) {
                            $scope.character.meleeSilverPower = $scope.character.meleeSilverPower - 1;
                            $scope.character.meleeGoldPower = $scope.character.meleeGoldPower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Upgrading Power Dice", "This character does not have any silver magic power dice to upgrade.", "info");
                        break;
                    case 'Ranged Power Gold':
                        if ($scope.character.rangedSilverPower > 0) {
                            $scope.character.rangedSilverPower = $scope.character.rangedSilverPower - 1;
                            $scope.character.rangedGoldPower = $scope.character.rangedGoldPower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Upgrading Power Dice", "This character does not have any silver magic power dice to upgrade.", "info");
                        break;
                    case 'Magic Power Gold':
                        if ($scope.character.magicSilverPower > 0) {
                            $scope.character.magicSilverPower = $scope.character.magicSilverPower - 1;
                            $scope.character.magicGoldPower = $scope.character.magicGoldPower + 1;
                            $scope.character.upgrades.push(newItem);
                        }
                        else
                            swal("Rules: Upgrading Power Dice", "This character does not have any silver magic power dice to upgrade.", "info");
                        break;
                    default:
                        break;
                };
            };
        };
        return;
    };

    $scope.giveBaggedItemAway = function (index, heroIndex) {
        $scope.appData.characters[heroIndex].bag.push($scope.character.bag[index]);
        $scope.character.bag.splice(index, 1);
    };
    $scope.giveEquippedItemAway = function (index, heroIndex) {
        $scope.appData.characters[heroIndex].bag.push($scope.character.equipped[index]);
        $scope.character.equipped.splice(index, 1);
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
        $scope.switchFeatDeck();
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
        $scope.switchItemDeck();
        $scope.switchSkillDeck();
    };
    $scope.switchItemDeck = function () {
        switch ($scope.currentDeck) {
            case 'Copper':
                $scope.itemDeck = $scope.appData.copperItems;
                break;
            case 'Silver':
                $scope.itemDeck = $scope.appData.silverItems;
                break;
            case 'Gold':
                $scope.itemDeck = $scope.appData.goldItems;
                break;
            case 'Store':
                $scope.itemDeck = $scope.appData.storeItems;
                break;
            default:
                $scope.itemDeck = $scope.appData.storeItems;
                break;
        }
    };
    $scope.switchSkillDeck = function () {
        // Skill choices are computed from currentSkillDeck by skillChoices().
    };
    $scope.switchFeatDeck = function () {
        switch ($scope.currentFeatDeck) {
            case 'Subterfuge':
                $scope.featDeck = $scope.appData.subterfugeFeats;
                break;
            case 'Wizardry':
                $scope.featDeck = $scope.appData.wizardryFeats;
                break;
            case 'Fighter':
                $scope.featDeck = $scope.appData.fighterFeats;
                break;
            default:
                $scope.featDeck = $scope.appData.fighterFeats;
                break;
        }
    };
    $scope.getNumber = function (num) {
        return new Array(num);
    };

    $scope.switchItemDeck();
    $scope.switchSkillDeck();
    $scope.switchFeatDeck();

});