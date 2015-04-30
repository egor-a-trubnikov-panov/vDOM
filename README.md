# vDOM

Виртуальный DOM для проекта Boris 

## Использование

Используется совместно с btr

```js

var btrjson = {
    block: 'button',
    value: 'hello world'
},
$button = $('.button');

var old_obj = vDOM.getBJson($button);
var new_obj = btr.setUniq(btr.processBtrJson(btrjson));

vDOM.diff($button, old_obj, new_obj);

```