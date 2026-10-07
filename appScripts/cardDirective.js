// <dj-card card="card" on-remove="remove()" tapped="entry.tapped" on-tap="..." on-collect="..."></dj-card>
// The one renderer for every card type. on-remove, tapped, on-tap and on-collect
// (shown on cards that grant a reward, e.g. Treasure Caches) are optional.
djCards.constant('CARD_KIND_LABELS', {
    skills: 'skill',
    feats: 'feat',
    items: 'item'
});

djCards.constant('EFFECT_LABELS', {
    maxWounds: { icon: 'fa-heart dj-ico-wound', label: 'max' },
    maxFatigue: { icon: 'fa-tint dj-ico-fatigue', label: 'max' },
    speed: { icon: 'fa-bolt', label: 'speed' }
});

djCards.directive('djCard', function (CARD_KIND_LABELS, EFFECT_LABELS) {
    return {
        restrict: 'E',
        scope: { card: '<', onRemove: '&?', tapped: '<?', onTap: '&?', onCollect: '&?' },
        template:
            '<div class="dj-card" ng-class="[\'dj-deck-\' + card.deck, {\'dj-missing\': card.missing, \'dj-tapped\': tapped, \'dj-tappable\': onTap}]">' +
            '  <div class="dj-card-head" ng-click="onTap && onTap()">' +
            '    <div class="dj-card-kind">{{kindLabel()}}<span ng-if="tapped"> · tapped</span></div>' +
            '    <div class="dj-card-name">{{card.name}}</div>' +
            '    <button type="button" class="dj-card-x" ng-if="onRemove" ng-click="$event.stopPropagation(); onRemove()" aria-label="Remove {{card.name}}"><i class="fa fa-remove"></i></button>' +
            '  </div>' +
            '  <img class="dj-card-art" ng-if="card.art" ng-src="{{card.art}}" alt="" ng-click="onTap && onTap()" />' +
            '  <img class="dj-card-scanonly" ng-if="scanOnly()" ng-src="{{card.scan}}" alt="Scan of {{card.name}}" ng-click="onTap && onTap()" />' +
            '  <div class="dj-card-type" ng-if="card.category">' +
            '    {{card.category}}<span ng-if="card.rune"> — Rune</span><span ng-if="card.cursed"> — Cursed</span>' +
            '    <small ng-if="card.attack || card.subtitle"> · {{card.attack || card.subtitle}}</small>' +
            '  </div>' +
            '  <div class="dj-card-abilities" ng-if="card.abilities.length"><div ng-repeat="a in card.abilities track by $index">{{a}}</div></div>' +
            '  <div class="dj-card-surges" ng-if="card.surges.length">' +
            '    <div ng-repeat="s in card.surges track by $index"><span class="dj-surge-cost" aria-label="{{s.cost}} surge"><i class="dj-ico dj-ico-surge" ng-repeat="n in surgeRange(s.cost) track by $index"></i></span>: <span ng-bind-html="s.effect | cardInline"></span></div>' +
            '  </div>' +
            '  <div class="dj-card-text" ng-if="card.text" ng-bind-html="card.text | cardText"></div>' +
            '  <div class="dj-card-collect" ng-if="card.grants && onCollect"><button type="button" class="btn btn-warning btn-sm" ng-click="onCollect()"><i class="fa fa-circle"></i> Collect</button></div>' +
            '  <div class="dj-card-spacer"></div>' +
            '  <div class="dj-card-effects" ng-if="card.effects">' +
            '    <span class="dj-chip" ng-repeat="(key, value) in card.effects"><i class="fa {{effectLabels[key].icon}}"></i> {{value > 0 ? \'+\' : \'\'}}{{value}} {{effectLabels[key].label}}</span>' +
            '  </div>' +
            '  <div class="dj-card-foot" ng-if="card.cost || card.hands || card.dice.length">' +
            '    <span class="dj-cost" ng-if="card.cost"><i class="fa fa-circle"></i> {{card.cost}}</span>' +
            '    <span class="dj-hands" ng-if="card.hands" title="{{card.hands}}-handed"><i class="fa fa-hand-paper-o" ng-repeat="n in surgeRange(card.hands) track by $index"></i></span>' +
            '    <span class="dj-dice"><i class="dj-die dj-die-{{d}}" title="{{d}} die" ng-repeat="d in card.dice track by $index"></i></span>' +
            '  </div>' +
            '  <a class="dj-card-scan" ng-if="card.scan && !scanOnly()" ng-href="{{card.scan}}" target="_blank" rel="noopener">view original</a>' +
            '</div>',
        link: function (scope) {
            scope.effectLabels = EFFECT_LABELS;
            scope.surgeRange = function (n) { return new Array(n || 0); };
            // Cards not yet transcribed show their scan as the picture.
            scope.scanOnly = function () {
                var card = scope.card || {};
                return !!card.scan && !card.text && !card.category && !card.missing;
            };
            scope.kindLabel = function () {
                var card = scope.card || {};
                if (card.missing) return 'missing card';
                var deck = card.deck ? card.deck.charAt(0).toUpperCase() + card.deck.slice(1) + ' ' : '';
                return deck + (CARD_KIND_LABELS[card.kind] || '');
            };
        }
    };
});

// <dj-deck-picker kind="items" field="bag" deck="appData.currentDeck" character="character"
//                 party="appData.characters" on-switch="switchDeck(...)"></dj-deck-picker>
// Deck button (cycles decks via on-switch), a picker of cards with copies left,
// and a random-draw button. Adding goes through cardService.give into `field`
// (default: the kind's first holding).
djCards.directive('djDeckPicker', function (cardService, CARD_KIND_LABELS) {
    return {
        restrict: 'E',
        scope: { kind: '@', field: '@', deck: '<', character: '<', party: '<', onSwitch: '&' },
        template:
            '<div class="input-group dj-deck-picker">' +
            '  <span class="input-group-btn">' +
            '    <button type="button" class="btn btn-default dj-deck-button" ng-class="deckId()" ng-click="onSwitch()">{{deck}}</button>' +
            '  </span>' +
            '  <select class="form-control" ng-model="pick.card" ng-change="add(pick.card)"' +
            '          ng-options="card as pickerLabel(card) for card in choices() track by card.id">' +
            '    <option value="">Add {{article}} {{label}}…</option>' +
            '  </select>' +
            '  <span class="input-group-btn">' +
            '    <button type="button" class="btn btn-success dj-random" ng-click="addRandom()" aria-label="Add a random {{label}}"><i class="fa fa-random"></i></button>' +
            '  </span>' +
            '</div>',
        link: function (scope) {
            scope.pick = {};
            scope.label = CARD_KIND_LABELS[scope.kind];
            scope.article = /^[aeiou]/.test(scope.label) ? 'an' : 'a';
            scope.deckId = function () { return String(scope.deck || '').toLowerCase(); };
            scope.pickerLabel = cardService.pickerLabel;
            scope.choices = function () {
                return cardService.choices(scope.kind, scope.deckId(), scope.party);
            };
            scope.add = function (card) {
                if (card) cardService.give(scope.character, card, scope.field || undefined);
                scope.pick.card = null;
            };
            scope.addRandom = function () {
                scope.add(cardService.drawRandom(scope.kind, scope.deckId(), scope.party));
            };
        }
    };
});
