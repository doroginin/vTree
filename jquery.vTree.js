/* Vega Tree v. 1.0 Beta */

(function($){

   // Конфигурации дерева
   $.vTree = {
      configs : {
         'v-list': {
            setBranch : function(){ return $('<ul></ul>'); },
            setBud    : function(){ return null; },
            setLeaf   : function(){ return $('<li></li>'); }
         },
         'v-catalog': {
            showLinks : ['branch-wrap','bud-top','bud-bottom'],
            setBranch : function(){ return $('<div></div>'); },
            setBud    : function(){ return $('<div></div>'); },
            setLeaf   : function(){ return $('<div></div>'); }
         },
         'v-tree': {
            showLinks : ['bud-wrap','bud-top','bud-bottom'],
            setBranch : function(){ return $('<table><tbody><tr class="branch-body"></tr></tdody></table>'); },
            setBud    : function(){ return $('<td align="center" valign="top"></td>'); },
            setLeaf   : function(){ return $('<div><span class="leaf-body"></span></div>'); }
         }
      }
   };

   $.fn.vTree = function(options)
   {
      // Значения по умолчанию
      var _settings = {
         url                        : '',
         nestingLevel               : 0,
         id                         : null,
         showLinks                  : [],
         selectable                 : false,        // Если true, листья дерева становятся "выбираемыми". При клике на лист добавляется класс selected и елемент считается "выбранным". При клике на "выбранный" элемент загружаются/сворачиваются его дети.
         clickSelector              : '.leaf-body', // По умолчанию клик воспринимается на всех элементах с указанным селектором

         onBranchLoadStart          : function(){},
         onBranchLoadEnd            : function(){},
         onLeafSelect               : function(){},
         onLeafDeSelect             : function(){},
         onTreeLoad                 : function(){},
         onBeforeCollapse           : function(){},
         onBeforeExpande            : function(){},
         onCollapse                 : function(){},
         onExpande                  : function(){},
         onBeforeLeafShow           : function(){},
         onLeafShow                 : function (el, data) { var html = (data && data.name) || (data && data.leaf_id); el.append(html); },

         // Функции с постфиксом ExtBefore и ExtAfter служат для задания дополнительного действия
         // до и после того как отработает одноименная функция без посфикса.
         onBranchLoadStartExtBefore : function(){},
         onBranchLoadStartExtAfter  : function(){},
         onBranchLoadEndExtBefore   : function(){},
         onBranchLoadEndExtAfter    : function(){},
         onLeafSelectExtBefore      : function(){},
         onLeafSelectExtAfter       : function(){},
         onLeafDeSelectExtBefore    : function(){},
         onLeafDeSelectExtAfter     : function(){},
         onTreeLoadExtBefore        : function(){},
         onTreeLoadExtAfter         : function(){},
         onBeforeCollapseExtBefore  : function(){},
         onBeforeCollapseExtAfter   : function(){},
         onBeforeExpandeExtBefore   : function(){},
         onBeforeExpandeExtAfter    : function(){},
         onCollapseExtBefore        : function(){},
         onCollapseExtAfter         : function(){},
         onExpandeExtBefore         : function(){},
         onExpandeExtAfter          : function(){},
         onBeforeLeafShowExtBefore  : function(){},
         onBeforeLeafShowExtAfter   : function(){},
         onLeafShowExtBefore        : function(){},
         onLeafShowExtAfter         : function(){},

         setBranch                  : function(){}, // Функции setBranch, setBud, setLeaf устанавливают новые контейнеры для ветки, почки и листа дерева.
         setBud                     : function(){}, // В перечисленные функции передается один параметр: данные о вновь отображаемом элементе (для setBranch передается все добавляемые дети).
         setLeaf                    : function(){}, // Возвращаемое значение устанавливается как новый контейнер.
         config                     : 'v-list'
      };

      var _request_count  = 0;    // Счетчик запросов на раскрытие дерева
      var _branch         = null; // Ветка
      var _bud            = null; // Почка
      var _leaf           = null; // Лист
      var _this           = null; // Контейнер для дерева
      var _current_conf   = null; // Текущая выбранная конфигурация

      _current_conf = (options && options.config) || _settings.config;
      $.extend(_settings, $.vTree.configs[_current_conf], options);

      var _add_branch = function (id, root, nestingLevel, init)
      {
         if (!_settings.url)
         {
            alert('jQuery.fn.vTree: Не указан обязательный параметр url.');
            return;
         }
         if (root.hasClass('no-leaves')) {
            if (init && _request_count === 0) {
               _settings.onTreeLoadExtBefore();
               _settings.onTreeLoad         ();
               _settings.onTreeLoadExtAfter ();
            }
            return;
         }
         var root_body = root.find('.bud-body:first');
         if (!root_body.length) { root_body = root; root_body.addClass('bud-body'); }

         $.post(_settings.url, {id: id}, function(data)
         {
            _request_count--;
            if (data.leaves.length)
            {
               _settings.onBeforeExpandeExtBefore(root, null);
               _settings.onBeforeExpande         (root, null);
               _settings.onBeforeExpandeExtAfter (root, null);

               _branch = _settings.setBranch(data.leaves);

               var branch = _branch.clone().appendTo(root_body).addClass('branch');
               var branch_body = branch.find('.branch-body:first');
               if (!branch_body.length) { branch_body = branch; branch_body.addClass('branch-body'); }

               // Добавляем связь-обертку для ветки
               if ($.inArray('branch-wrap', _settings.showLinks) !== -1) {
                  branch_body =
                     branch_body.removeClass('branch-body').append($('<div />')
                        .addClass('branch-link-wrap').addClass('branch-body')).find('.branch-link-wrap');
               }

               $(data.leaves).each(function (i, child)
               {
                  _settings.onBeforeLeafShowExtBefore(child);
                  _settings.onBeforeLeafShow         (child);
                  _settings.onBeforeLeafShowExtAfter (child);

                  _bud  = _settings.setBud (child);
                  _leaf = _settings.setLeaf(child);

                  // Если не задана ни почка, ни лист выходим
                  if (!_bud && !_leaf) {
                     alert('jQuery.fn.vTree: Не задан контейнер ни для листьев, ни для почек.'); return;
                  }

                  var bud = (_bud || _leaf).clone().addClass('bud').appendTo(branch_body);
                  var bud_body = bud.find('.bud-body:first');
                  if (!bud_body.length) { bud_body = bud; bud_body.addClass('bud-body'); }

                  // Добавляем связь-обертку для почки
                  if ($.inArray('bud-wrap', _settings.showLinks) !== -1) {
                     bud_body = bud_body.removeClass('bud-body').append($('<div />').addClass('bud-link-wrap').addClass('bud-body')).find('.bud-link-wrap');
                  }

                  var leaf = (_bud && _leaf)?(_leaf.clone().addClass('leaf').attr({id: 'vTree-leaf-'+child.leaf_id}).appendTo(bud_body)):bud.addClass('leaf');
                  var leaf_body = leaf.find('.leaf-body:first');
                  if (!leaf_body.length) { leaf_body = leaf; leaf_body.addClass('leaf-body'); }

                  if (parseInt(child.no_leaves)) { // Если нет детей
                     bud.addClass('no-leaves');
                  }

                  if (i === 0)                      bud.addClass('first'); // для первого ребенка
                  if (i === data.leaves.length - 1) bud.addClass('last');  // для последнего ребенка

                  if (bud.parents('.bud').length === 1) { // для корня дерева
                     bud.addClass('root');
                     branch.addClass('root');
                  }

                  bud.data('info', child);

                  _settings.onLeafShowExtBefore(leaf_body, child);
                  _settings.onLeafShow         (leaf_body, child);
                  _settings.onLeafShowExtAfter (leaf_body, child);

                  // Добавляем связи
                  if ($.inArray('bud-top', _settings.showLinks) !== -1) {
                     bud_body.prepend($('<div />').addClass('bud-link-top'));
                  }
                  if ($.inArray('bud-bottom', _settings.showLinks) !== -1) {
                     bud_body.append ($('<div />').addClass('bud-link-bottom'));
                  }

                  if (nestingLevel) {
                     _add_branch(child.leaf_id, bud.addClass("expanded"), nestingLevel-1, init);
                  }
               });

               _settings.onExpandeExtBefore(root, null);
               _settings.onExpande         (root, null);
               _settings.onExpandeExtAfter (root, null);

               if (root.data('callback') && typeof root.data('callback') === 'function') { root.data('callback')(root, root.data('params')); }
            }
            root.removeClass('loading');
            _settings.onBranchLoadEndExtBefore(root, data.leaves);
            _settings.onBranchLoadEnd         (root, data.leaves);
            _settings.onBranchLoadEndExtAfter (root, data.leaves);

            if ((!nestingLevel || !data.leaves.length) && init && _request_count === 0) {
               _settings.onTreeLoadExtBefore();
               _settings.onTreeLoad         ();
               _settings.onTreeLoadExtAfter ();
            }

         }, "json");
         root.addClass('loading');
         _settings.onBranchLoadStartExtBefore(root);
         _settings.onBranchLoadStart         (root);
         _settings.onBranchLoadStartExtAfter (root);
         _request_count++;
      };

      _this = this;

      _this.click(function (event)
      {
         var elem = $(event.target);

         if (_settings.clickSelector) {
            if (!elem.is(_settings.clickSelector)) return;
         }

         var clicked = { el: elem };
         if (clicked.el.hasClass('bud')) {
            clicked.bud = elem;
         } else {
            clicked.bud = clicked.el.parents('.bud:first');
         }
         if (clicked.el.hasClass('leaf')) {
            clicked.leaf = elem;
         } else {
            clicked.leaf = clicked.el.parents('.leaf:first');
         }
         clicked.data = clicked.bud.data('info');

         if ((_this.data('selected') && (clicked.data === _this.data('selected').data)) || !_settings.selectable)
         {
            if (!clicked.bud.hasClass("expanded") && !clicked.bud.hasClass("collapsed"))
            {
               _add_branch(clicked.data.leaf_id, clicked.bud.addClass("expanded"));
            }
            else {
               if (clicked.bud.hasClass("collapsed")) {
                  _settings.onBeforeExpandeExtBefore(clicked.bud, clicked.data);
                  _settings.onBeforeExpande         (clicked.bud, clicked.data);
                  _settings.onBeforeExpandeExtAfter (clicked.bud, clicked.data);
               }
               if (clicked.bud.hasClass("expanded"))  {
                  _settings.onBeforeCollapseExtBefore(clicked.bud, clicked.data);
                  _settings.onBeforeCollapse         (clicked.bud, clicked.data);
                  _settings.onBeforeCollapseExtAfter (clicked.bud, clicked.data);
               }
               clicked.bud.toggleClass('collapsed').toggleClass('expanded');
               if (clicked.bud.hasClass("collapsed")) {
                  _settings.onCollapseExtBefore(clicked.bud, clicked.data);
                  _settings.onCollapse         (clicked.bud, clicked.data);
                  _settings.onCollapseExtAfter (clicked.bud, clicked.data);
               }
               if (clicked.bud.hasClass("expanded"))  {
                  _settings.onExpandeExtBefore(clicked.bud, clicked.data);
                  _settings.onExpande         (clicked.bud, clicked.data);
                  _settings.onExpandeExtAfter (clicked.bud, clicked.data);
               }
            }
         }
         else
         {
            if (_this.data('selected')) {
               _this.data('selected').bud.removeClass('selected');
               _settings.onLeafDeSelectExtBefore(_this.data('selected').leaf, _this.data('selected').data);
               _settings.onLeafDeSelect         (_this.data('selected').leaf, _this.data('selected').data);
               _settings.onLeafDeSelectExtAfter (_this.data('selected').leaf, _this.data('selected').data);
            }
            _settings.onLeafSelectExtBefore(clicked.leaf, clicked.data);
            _settings.onLeafSelect         (clicked.leaf, clicked.data);
            _settings.onLeafSelectExtAfter (clicked.leaf, clicked.data);
            _this.data('selected', clicked);
            clicked.bud.addClass('selected');
         }
      });

      _this.bind('refresh', function(event, nestingLevel) {
         nestingLevel = nestingLevel || 0;
         var elem = $(event.target);
         if (!elem.hasClass('bud')) return;
         elem.removeClass('expanded collapsed');
         var id = (elem.data('info') && elem.data('info').leaf_id) || _settings.id;
         elem.find('.branch').remove();
         _add_branch(id, elem.addClass("expanded"), nestingLevel);
      });

      return _this.each(function() {
         _add_branch(_settings.id, $(this).addClass(_current_conf + ' bud'), _settings.nestingLevel, true);
      });
   };
})(jQuery);