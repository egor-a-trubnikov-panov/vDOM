if (typeof require !== 'undefined') {
    var assert = require('chai').assert,
        BTR = require('btr').BTR,
        btr = new BTR();
} else {
    var assert = chai.assert,
        btr = new BTR();
}

var
    button_HTML,
    $button;

btr.match("button", function (ctx) {
    ctx.setTag('button');
    ctx.setContent([
        {
            elem: "test1"
        },
        {
            elem: "test2"
        },
        {
            elem: "test3"
        }
    ])
});


describe('btr', function () {
    it('Проверка коректной работы BTR.apply()', function () {

        button_HTML = btr.apply({block: "button"});

        var button_static_HTML = '<button class="button" data-block="button" data-uniq="root">' +
            '<div class="button__test1" data-uniq=".0"></div>' +
            '<div class="button__test2" data-uniq=".1"></div>' +
            '<div class="button__test3" data-uniq=".2"></div>' +
            '</button>';

        assert.equal(button_HTML, button_static_HTML);
    });

    it('Проверка коректной работы BTR.processBtrJson()', function () {

        var button_BTRJSON = btr.processBtrJson({block: "button"});

        var to_button_BTRJSON = {
            "block": "button",
            "__func0": true,
            "_tag": "button",
            "_content": [{"elem": "test1", "block": "button"}, {
                "elem": "test2",
                "block": "button"
            }, {"elem": "test3", "block": "button"}]
        };

        assert.equal(JSON.stringify(button_BTRJSON), JSON.stringify(to_button_BTRJSON));
    });
});

describe('vDOM', function () {
    it('построение объекта BTRJSON по DOM элементу', function () {
        $button = $(button_HTML);

        var exit = {
            "block": "button",
            "_attrs": {"data-uniq": "root"},
            "_tag": "button",
            "_content": [{
                "block": "button",
                "elem": "test1",
                "view": "test1",
                "_attrs": {"data-uniq": ".0"}
            }, {
                "block": "button",
                "elem": "test2",
                "view": "test2",
                "_attrs": {"data-uniq": ".1"}
            }, {"block": "button", "elem": "test3", "view": "test3", "_attrs": {"data-uniq": ".2"}}]
        };

        assert.equal(JSON.stringify(vDOM.getBJson($button)), JSON.stringify(exit));

        //todo: FF меняет порядок полей объекта
    })


});

