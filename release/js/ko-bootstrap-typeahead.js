(function() {/**
 * almond 0.2.7 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../lib/almond", function(){});

define('closeHandler',[], function() {

  "use strict";

  function isChildOf(parent, possibleChild) {
    if (parent === possibleChild) {
      return true;
    }
    if (possibleChild.parentNode == null) { // top of the DOM
      return false;
    }
    return isChildOf(parent, possibleChild.parentNode);
  }

  function createChildOfHandler(el, fn) {
    return function(e) {
      if (!isChildOf(el, e.srcElement)) {
        fn();
      }
    };
  }

  function createHandler(eventName, el, fn) {
    var fn = createChildOfHandler(el, fn);
    document.addEventListener(eventName, fn, true);
    return function() {
      document.removeEventListener(eventName, fn);
    };
  }

  return {
    create: function(el, fn) {
      var disposables = [], disposer;
      disposer = function() {
        disposables.forEach(function(fn) { fn(); });
        fn();
      };
      disposables.push(createHandler("click", el, disposer));
      disposables.push(createHandler("keypress", el, disposer));
      return disposer;
    }
  };
});
define('../lib/text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

define('../lib/text!../templates/dropdown.html',[],function () { return '<div class="dropdown" data-bind="if: loading">\r\n  <ul class="dropdown-menu" role="menu">\r\n    <li role="presentation" class="disabled"><a role="menuitem" tabindex="-1" href="#" onclick="javascript: return false"><span class="fa fa-spinner" aria-hidden="true"></span> Loading...</a></li>\r\n  </ul>\r\n</div>\r\n<div class="dropdown" data-bind="if: (suggestions().length == 0 &amp;&amp; !loading())">\r\n  <ul class="dropdown-menu" role="menu">\r\n    <li role="presentation" class="disabled"><a role="menuitem" tabindex="-1" href="#" onclick="javascript: return false">No matches found...</a></li>\r\n  </ul>\r\n</div>\r\n<div id="menu" class="dropdown" data-bind="if: suggestions().length">\r\n  <ul class="dropdown-menu" role="menu" data-bind="foreach: suggestions">\r\n    <li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-bind="text: name"></a></li>\r\n  </ul>\r\n</div>\r\n';});

define('constants',[], function() {
  var Constants;
  return Constants = {
    Keys: {
      UP: 38,
      DOWN: 40,
      ENTER: 13,
      ESC: 27
    }
  };
});

define("jquery", function() {
  return $;
});

define("ko", function() {
  return ko;
});

define('bindingHandler',["jquery", "ko", "closeHandler", "../lib/text!../templates/dropdown.html", "constants"], function($, ko, closeHandler, template, constants) {
  return ko.bindingHandlers.dropdown = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
      var $el, $menu, $parent, cancelEvent, config, disposer, onChange, onClick, onClickItem, onFocus, onKeyDown, onKeyPress, onKeyUp, onMouseOverItem, open, openTypeAhead, throttleTimeout;
      config = valueAccessor();
      if (ko.isObservable(config.isOpen)) {
        open = config.isOpen;
      } else {
        open = ko.observable();
      }
      open(false);
      throttleTimeout = null;
      disposer = function() {};
      openTypeAhead = function() {
        var $dropdown;
        open(true);
        config.suggestion("");
        $dropdown = $(".dropdown", $parent);
        $dropdown.addClass("open");
        disposer = closeHandler.create($parent.get(0), function() {
          $dropdown.removeClass("open");
          open(false);
          return false;
        });
        return config.query($(element).val());
      };
      onFocus = function() {
        if (!open()) {
          return openTypeAhead();
        }
      };
      onClick = function() {
        if (!open()) {
          return openTypeAhead();
        }
      };
      cancelEvent = function(e) {
        e.preventDefault();
        return e.stopPropagation();
      };
      onKeyPress = function(e) {
        switch (e.keyCode) {
          case constants.Keys.ENTER:
            return e.preventDefault();
        }
      };
      onKeyDown = function(e) {
        switch (e.keyCode) {
          case constants.Keys.ENTER:
            return e.preventDefault();
        }
      };
      onKeyUp = function(e) {
        var $selected, data;
        cancelEvent(e);
        switch (e.keyCode) {
          case constants.Keys.UP:
            if (open()) {
              $selected = $("li.selected", $parent);
              if ($selected.length) {
                return $selected.removeClass("selected").prev("li").addClass("selected");
              } else if (ko.isObservable(config.suggestions) && config.suggestions().length) {
                return $("li", $parent).last().addClass("selected");
              }
            }
            break;
          case constants.Keys.DOWN:
            if (open()) {
              $selected = $("li.selected", $parent);
              if ($selected.length) {
                return $selected.removeClass("selected").next("li").addClass("selected");
              } else if (ko.isObservable(config.suggestions) && config.suggestions().length) {
                return $("li", $parent).first().addClass("selected");
              }
            } else {
              return openTypeAhead();
            }
            break;
          case constants.Keys.ENTER:
            if (open()) {
              $selected = $("li.selected > a", $parent);
              if ($selected.length) {
                data = ko.dataFor($selected.get(0));
                config.suggestion(data);
                $el.val(data.name);
                return disposer();
              }
            }
            break;
          case constants.Keys.ESC:
            if (open()) {
              return disposer();
            }
            break;
          default:
            if (!open()) {
              openTypeAhead();
            }
            clearTimeout(throttleTimeout);
            return throttleTimeout = setTimeout((function() {
              return config.query($(element).val());
            }), 200);
        }
      };
      onClickItem = function(e) {
        var data;
        cancelEvent(e);
        data = ko.dataFor(e.toElement);
        $el.val(data.name);
        config.suggestion(data);
        return disposer();
      };
      onMouseOverItem = function(e) {
        var data;
        cancelEvent(e);
        data = ko.dataFor(e.toElement);
        if (data !== bindingContext.$data) {
          $("li", $parent).removeClass("selected");
          return $(e.toElement).parent().addClass("selected");
        }
      };
      onChange = function(e) {
        var selected;
        selected = config.suggestion();
        if (!selected) {
          return config.suggestion($el.val());
        }
      };
      $el = $(element);
      $parent = $el.parent();
      $parent.append($(template));
      $menu = $("#menu", $parent);
      $el.bind("focus", onFocus);
      $el.bind("click", onClick);
      $el.bind("keyup", onKeyUp);
      $el.bind("keypress", onKeyPress);
      $el.bind("keydown", onKeyDown);
      $el.bind("change", onChange);
      $menu.bind("click", onClickItem);
      $menu.bind("mouseover", onMouseOverItem);
      return ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        $el.unbind(onFocus);
        $el.unbind(onClick);
        $el.unbind(onKeyUp);
        $el.unbind(onKeyPress);
        $el.unbind(onKeyDown);
        $el.unbind(onChange);
        $menu.unbind(onClickItem);
        return $menu.unbind(onMouseOverItem);
      });
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {}
  };
});


  require("bindingHandler");

})();