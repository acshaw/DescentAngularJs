// <dj-card card="card" on-remove="remove()"></dj-card>
// The one renderer for every card type. on-remove is optional.
djCards.constant('CARD_KIND_LABELS', {
    skills: 'skill',
    feats: 'feat'
});

djCards.constant('EFFECT_LABELS', {
    maxWounds: { icon: 'fa-heart dj-ico-wound', label: 'max' },
    maxFatigue: { icon: 'fa-tint dj-ico-fatigue', label: 'max' },
    speed: { icon: 'fa-bolt', label: 'speed' }
});

djCards.directive('djCard', function (CARD_KIND_LABELS, EFFECT_LABELS) {
    return {
        restrict: 'E',
        scope: { card: '<', onRemove: '&?' },
        template:
            '<div class="dj-card" ng-class="[\'dj-deck-\' + card.deck, {\'dj-missing\': card.missing}]">' +
            '  <div class="dj-card-head">' +
            '    <div class="dj-card-kind">{{kindLabel()}}</div>' +
            '    <div class="dj-card-name">{{card.name}}</div>' +
            '    <button type="button" class="dj-card-x" ng-if="onRemove" ng-click="onRemove()" aria-label="Remove {{card.name}}"><i class="fa fa-remove"></i></button>' +
            '  </div>' +
            '  <div class="dj-card-text" ng-bind-html="card.text | cardText"></div>' +
            '  <div class="dj-card-effects" ng-if="card.effects">' +
            '    <span class="dj-chip" ng-repeat="(key, value) in card.effects"><i class="fa {{effectLabels[key].icon}}"></i> {{value > 0 ? \'+\' : \'\'}}{{value}} {{effectLabels[key].label}}</span>' +
            '  </div>' +
            '  <a class="dj-card-scan" ng-if="card.scan" ng-href="{{card.scan}}" target="_blank" rel="noopener">view original</a>' +
            '</div>',
        link: function (scope) {
            scope.effectLabels = EFFECT_LABELS;
            scope.kindLabel = function () {
                var card = scope.card || {};
                if (card.missing) return 'missing card';
                var deck = card.deck ? card.deck.charAt(0).toUpperCase() + card.deck.slice(1) + ' ' : '';
                return deck + (CARD_KIND_LABELS[card.kind] || '');
            };
        }
    };
});

// <dj-deck-picker kind="skills" deck="appData.currentSkillDeck" character="character"
//                 party="appData.characters" on-switch="switchDeck(...)"></dj-deck-picker>
// Deck button (cycles decks via on-switch), a picker of cards with copies left,
// and a random-draw button. Adding goes through cardService.give.
djCards.directive('djDeckPicker', function (cardService, CARD_KIND_LABELS) {
    return {
        restrict: 'E',
        scope: { kind: '@', deck: '<', character: '<', party: '<', onSwitch: '&' },
        template:
            '<div class="input-group dj-deck-picker">' +
            '  <span class="input-group-btn">' +
            '    <button type="button" class="btn btn-default dj-deck-button" ng-class="deckId()" ng-click="onSwitch()">{{deck}}</button>' +
            '  </span>' +
            '  <select class="form-control" ng-model="pick.card" ng-change="add(pick.card)"' +
            '          ng-options="card as card.name for card in choices() track by card.id">' +
            '    <option value="">Add a {{label}}…</option>' +
            '  </select>' +
            '  <span class="input-group-btn">' +
            '    <button type="button" class="btn btn-success dj-random" ng-click="addRandom()" aria-label="Add a random {{label}}"><i class="fa fa-random"></i></button>' +
            '  </span>' +
            '</div>',
        link: function (scope) {
            scope.pick = {};
            scope.label = CARD_KIND_LABELS[scope.kind];
            scope.deckId = function () { return String(scope.deck || '').toLowerCase(); };
            scope.choices = function () {
                return cardService.choices(scope.kind, scope.deckId(), scope.party);
            };
            scope.add = function (card) {
                if (card) cardService.give(scope.character, card);
                scope.pick.card = null;
            };
            scope.addRandom = function () {
                scope.add(cardService.drawRandom(scope.kind, scope.deckId(), scope.party));
            };
        }
    };
});
