# vDOM

Виртуальный DOM для проекта [Boris](https://github.com/egor-a-trubnikov-panov/Boris) 

## Использование

Используется совместно с [btr](https://github.com/egor-a-trubnikov-panov/btr)

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