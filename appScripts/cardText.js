// Turns card text markup into HTML:
//   ***x*** bold italic, **x** bold, *x* italic
//   {token} inline icon (see ICONS), unknown tokens are left as text
//   a blank line starts a new paragraph
djCards.constant('CARD_ICONS', {
    surge: '<i class="dj-ico dj-ico-surge" title="surge"></i>',
    fatigue: '<i class="fa fa-tint dj-ico-fatigue" title="fatigue"></i>',
    wound: '<i class="fa fa-heart dj-ico-wound" title="wound"></i>',
    power: '<i class="dj-die dj-die-power" title="power die"></i>',
    red: '<i class="dj-die dj-die-red" title="red die"></i>',
    blue: '<i class="dj-die dj-die-blue" title="blue die"></i>',
    white: '<i class="dj-die dj-die-white" title="white die"></i>',
    green: '<i class="dj-die dj-die-green" title="green die"></i>',
    yellow: '<i class="dj-die dj-die-yellow" title="yellow die"></i>',
    black: '<i class="dj-die dj-die-black" title="black die"></i>',
    silver: '<i class="dj-die dj-die-silver" title="silver die"></i>',
    gold: '<i class="dj-die dj-die-gold" title="gold die"></i>'
});

djCards.filter('cardText', function ($sce, CARD_ICONS) {
    function escape(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    return function (text) {
        if (!text) return '';
        var html = escape(String(text))
            .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
            .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.+?)\*/g, '<i>$1</i>')
            .replace(/\{(\w+)\}/g, function (whole, token) {
                return CARD_ICONS[token] || whole;
            });
        return html.split(/\n\s*\n/).map(function (para) {
            return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
        }).join('');
    };
});
