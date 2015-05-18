var vDOM = function ($, fastdom, btr) {
  /**
   * возвращает все атрибуты, имя блока, элемент, представление и состояния.
   * @param jqueryNode
   * @returns {Object}
   */
  var ParseNode = function (jqueryNode) {

      var obj = {};

      /**
       * разбирает css класс на блок, представление, элемент и состояние
       * @param {String} [cls] css класс
       */
      function ParseClass(cls) {
        var
          searchState = /\b_\w+/g,
          block_view__elem = /^\S+/.exec(cls)[0],
          elem = /__[A-Za-z0-9-]+/.exec(block_view__elem),
          view = /(_{1})[A-Za-z0-9-]+/.exec(block_view__elem),
          myArray,
          states = {};

        obj.block = /^[A-Za-z0-9-]+/.exec(block_view__elem)[0];

        while ((myArray = searchState.exec(cls)) !== null) {
          if (/^_[A-Za-z0-9-]+_/.test(myArray[0])) {
            states[/^_[A-Za-z0-9-]+/.exec(myArray[0])[0].replace('_', '')] = /_[A-Za-z0-9-]+$/.exec(myArray[0])[0].replace('_', '');
          } else {
            states[myArray[0].replace('_', '')] = true;
          }
        }

        if (Object.keys(states).length > 0) obj._state = states;
        if (!!elem && !!elem[0]) {
          obj.elem = elem[0].replace(/_/g, '');
        }
        if (!!view && !!view[0]) {
          obj.view = view[0].replace(/_/g, '');
        }
      }

      $.map(jqueryNode, function (item) {
        $.map(item.attributes, function (attribute) {
          switch (attribute.name) {
            case 'class':
              ParseClass(attribute.value);
              break;
            case 'data-block':
              break;
            default :
              if (obj._attrs === undefined) obj._attrs = {};
              obj._attrs[attribute.name] = attribute.value;
              break;
          }
        });
      });

      return obj;
    },

    /**
     * проходит по готовому DOM блоку и строит обьект вируального дома;
     * @param {jQuery} domNode
     * @returns {Object|Array}
     */
    getBJson = function (domNode) {

      var getObj = function (domNode, parent, iteration) {

        iteration = iteration || 0;

        if (domNode.length > 0) {

          if (domNode.length > 1) { //если 'массив'
            parent = [];
            $.map(domNode, function (item, id) {
              getObj($(item), parent, id);
            });
          }
          else {

            if (domNode[0].nodeType === 3) { // если текст
              if (Array.isArray(parent)) {
                parent.push(domNode.text());
              } else {
                parent = domNode.text();
              }
            } else {
              var
                BTRobject = ParseNode(domNode),
                content = domNode.contents(),
                tag = domNode.prop('tagName').toLowerCase();

              if (tag !== 'div') BTRobject._tag = tag;

              if (content.length > 0) {
                BTRobject._content = getObj(content, null);
              } else {
                BTRobject._content = undefined;
              }

              if (parent == null) parent = [];

              if (Array.isArray(parent)) {
                parent.push(BTRobject);
              } else {
                parent = BTRobject;
              }
            }

          }

        } else {
          throw new Error('Не верный параметр: domNode');
        }
        return parent;
      };

      return getObj(domNode, {});
    },

    /**
     * сравнивает два обьекта виртуального дома, находит различия
     * и изменяет соответствующие элементы на переданом DOM объекте
     * возвращает новый объект виртуального дома (obj2)
     * @param {jQuery} domNode
     * @param {Object} obj1
     * @param {Object} obj2
     * @returns {Object}
     */
    diff = function (domNode, obj1, obj2) {

      var equal = function (Node, obj1, obj2) {

          if (!Node[0]) {
            throw new Error('ошибка: НЕТ такой ноды ');
          }

          function replaceClass() {
            fastdom.write(function () {
              Node.attr('class', (function () {
                var className = obj2.block;
                if (obj2.view) className += '_' + obj2.view;
                if (obj2.elem) className += '__' + obj2.elem;
                if (obj2._state) (function () {
                  Object.keys(obj2._state).map(function (item) {
                    if (obj2._state[item] !== true) {
                      className += ' _' + item + '_' + obj2._state[item];
                    } else {
                      className += ' _' + item;
                    }
                  });
                })();

                return className;
              })());
            });
          }

          function replaceAttrs() {
            fastdom.read(function () {
              var arr = $.map(Node[0].attributes, function (item) {
                return item.nodeName;
              });
              fastdom.write(function () {
                for (var i = 0, length = arr.length; i < length; i++) {
                  if (arr[i] !== 'class' && arr[i] !== 'data-block') Node.removeAttr(arr[i]);
                }
                Node.attr(obj2._attrs);
              });
            });
          }

          obj1['_tag'] = obj1['_tag'] || 'div';
          obj2['_tag'] = obj2['_tag'] || 'div';

          if (obj1['_tag'] !== obj2['_tag']) {
            throw new Error('поменялся тег корневого элемента');
          } else {
            for (var i = 0, forClass = ['view', 'block', '_state', 'elem'], length = forClass.length; i < length; i++) {
              if (forClass[i] === '_state') {
                if (JSON.stringify(obj1[forClass[i]]) !== JSON.stringify(obj2[forClass[i]])) {
                  replaceClass();
                  break;
                }
              } else {
                if (obj1[forClass[i]] !== obj1[forClass[i]]) {
                  replaceClass();
                  break;
                }
              }
            }

            if (JSON.stringify(obj1._attrs) !== JSON.stringify(obj2._attrs)) {
              replaceAttrs();
            }

            diffNode(Node, obj1._content, obj2._content);
          }

        },

        /**
         * вставляет новые значения в DOM
         * @param Node
         * @param obj
         */
        paste = function (Node, obj2) {
          fastdom.write(function () {
            Node.html(btr.toHtml(obj2));
          });
        },


        /**
         * Находит изменения и применяет их к переданному DOM элементу
         *
         * если оба объекта массивы то сравнивает имеют ли они равное количество элементов
         * если да, то сравниваем каждый элемент массива
         * иначе заменяет все содержиое в соответствуюшием элементе DOM
         *
         * если же получили объект то сравниваем обьекты через equal()
         *
         * если параметры не массив и не объект то просто заменяем соответствующий элемент если параметры не равны друг другу
         *
         * @param Node
         * @param obj1
         * @param obj2
         */
        diffNode = function (Node, obj1, obj2) {
          if (typeof obj2 === 'object') {

            if (Array.isArray(obj2)) {
              if (Array.isArray(obj1)) {
                if (obj1.length === obj2.length) {
                  var replace = false,
                    i = 0,
                    l = obj2.length;

                  for (; i < l; i++) {
                    if (typeof obj2[i] === 'string' || typeof obj2[i] === 'number') {
                      if (obj2[i] !== obj1[i]) {
                        replace = true;
                        break;
                      }
                    }
                  }

                  if (!replace) {
                    for (i = 0; i < l; i++) {
                      if (typeof obj2[i] === 'object') {
                        diffNode(Node.children('[data-uniq="' + obj2[i]._attrs['data-uniq'] + '"]').eq(0), obj1[i], obj2[i]);
                      }
                    }
                  } else {
                    paste(Node, obj2);
                  }

                } else {
                  paste(Node, obj2);
                }

              } else {
                paste(Node, obj2);
              }

            } else {
              equal(Node, obj1, obj2);
            }

          } else {

            if ('' + obj1 !== '' + obj2) {
              if (!!obj2 || obj2 === 0) {
                fastdom.write(function () {
                  Node.html(obj2);
                })
              } else {
                fastdom.write(function () {
                  Node.html('');
                })
              }
            }
          }
        };
      diffNode(domNode, obj1, obj2);
      return obj2;
    };


  return {
    getBJson: getBJson,
    diff: diff
  };

};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = vDOM;
} else if (typeof define === 'function' && define.amd) {
  define(function(){ return vDOM });
} else {
  window['vDOM'] = vDOM;
}