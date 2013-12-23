/**
 * almond 0.2.7 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */

(function(){var e,t,n;(function(r){function d(e,t){return h.call(e,t)}function v(e,t){var n,r,i,s,o,u,a,f,c,h,p=t&&t.split("/"),d=l.map,v=d&&d["*"]||{};if(e&&e.charAt(0)===".")if(t){p=p.slice(0,p.length-1),e=p.concat(e.split("/"));for(f=0;f<e.length;f+=1){h=e[f];if(h===".")e.splice(f,1),f-=1;else if(h===".."){if(f===1&&(e[2]===".."||e[0]===".."))break;f>0&&(e.splice(f-1,2),f-=2)}}e=e.join("/")}else e.indexOf("./")===0&&(e=e.substring(2));if((p||v)&&d){n=e.split("/");for(f=n.length;f>0;f-=1){r=n.slice(0,f).join("/");if(p)for(c=p.length;c>0;c-=1){i=d[p.slice(0,c).join("/")];if(i){i=i[r];if(i){s=i,o=f;break}}}if(s)break;!u&&v&&v[r]&&(u=v[r],a=f)}!s&&u&&(s=u,o=a),s&&(n.splice(0,o,s),e=n.join("/"))}return e}function m(e,t){return function(){return s.apply(r,p.call(arguments,0).concat([e,t]))}}function g(e){return function(t){return v(t,e)}}function y(e){return function(t){a[e]=t}}function b(e){if(d(f,e)){var t=f[e];delete f[e],c[e]=!0,i.apply(r,t)}if(!d(a,e)&&!d(c,e))throw new Error("No "+e);return a[e]}function w(e){var t,n=e?e.indexOf("!"):-1;return n>-1&&(t=e.substring(0,n),e=e.substring(n+1,e.length)),[t,e]}function E(e){return function(){return l&&l.config&&l.config[e]||{}}}var i,s,o,u,a={},f={},l={},c={},h=Object.prototype.hasOwnProperty,p=[].slice;o=function(e,t){var n,r=w(e),i=r[0];return e=r[1],i&&(i=v(i,t),n=b(i)),i?n&&n.normalize?e=n.normalize(e,g(t)):e=v(e,t):(e=v(e,t),r=w(e),i=r[0],e=r[1],i&&(n=b(i))),{f:i?i+"!"+e:e,n:e,pr:i,p:n}},u={require:function(e){return m(e)},exports:function(e){var t=a[e];return typeof t!="undefined"?t:a[e]={}},module:function(e){return{id:e,uri:"",exports:a[e],config:E(e)}}},i=function(e,t,n,i){var s,l,h,p,v,g=[],w=typeof n,E;i=i||e;if(w==="undefined"||w==="function"){t=!t.length&&n.length?["require","exports","module"]:t;for(v=0;v<t.length;v+=1){p=o(t[v],i),l=p.f;if(l==="require")g[v]=u.require(e);else if(l==="exports")g[v]=u.exports(e),E=!0;else if(l==="module")s=g[v]=u.module(e);else if(d(a,l)||d(f,l)||d(c,l))g[v]=b(l);else{if(!p.p)throw new Error(e+" missing "+l);p.p.load(p.n,m(i,!0),y(l),{}),g[v]=a[l]}}h=n?n.apply(a[e],g):undefined;if(e)if(s&&s.exports!==r&&s.exports!==a[e])a[e]=s.exports;else if(h!==r||!E)a[e]=h}else e&&(a[e]=n)},e=t=s=function(e,t,n,a,f){return typeof e=="string"?u[e]?u[e](t):b(o(e,t).f):(e.splice||(l=e,t.splice?(e=t,t=n,n=null):e=r),t=t||function(){},typeof n=="function"&&(n=a,a=f),a?i(r,e,t,n):setTimeout(function(){i(r,e,t,n)},4),s)},s.config=function(e){return l=e,l.deps&&s(l.deps,l.callback),s},e._defined=a,n=function(e,t,n){t.splice||(n=t,t=[]),!d(a,e)&&!d(f,e)&&(f[e]=[e,t,n])},n.amd={jQuery:!0}})(),n("../lib/almond",function(){}),n("closeHandler",[],function(){function e(t,n){return t===n?!0:n.parentNode==null?!1:e(t,n.parentNode)}function t(t,n){return function(r){e(t,r.srcElement)||n()}}function n(e,n,r){var r=t(n,r);return document.addEventListener(e,r,!0),function(){document.removeEventListener(e,r)}}return{create:function(e,t){var r=[],i;return i=function(){r.forEach(function(e){e()}),t()},r.push(n("click",e,i)),r.push(n("keypress",e,i)),i}}}),n("../lib/text",{load:function(e){throw new Error("Dynamic load not allowed: "+e)}}),n("../lib/text!../templates/dropdown.html",[],function(){return'<div class="dropdown" data-bind="if: loading">\r\n  <ul class="dropdown-menu" role="menu">\r\n    <li role="presentation"><a role="menuitem" tabindex="-1" href="#">Loading...</a></li>\r\n  </ul>\r\n</div>\r\n<div class="dropdown" data-bind="if: (items().length == 0 &amp;&amp; !loading())">\r\n  <ul class="dropdown-menu" role="menu">\r\n    <li role="presentation"><a role="menuitem" tabindex="-1" href="#">No matches found...</a></li>\r\n  </ul>\r\n</div>\r\n<div id="menu" class="dropdown" data-bind="if: items().length">\r\n  <ul class="dropdown-menu" role="menu" data-bind="foreach: items">\r\n    <li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-bind="text: name"></a></li>\r\n  </ul>\r\n</div>'}),n("constants",[],function(){var e;return e={Keys:{UP:38,DOWN:40,ENTER:13,ESC:27}}}),n("jquery",function(){return $}),n("ko",function(){return ko}),n("bindingHandler",["jquery","ko","closeHandler","../lib/text!../templates/dropdown.html","constants"],function(e,t,n,r,i){return t.bindingHandlers.dropdown={init:function(s,o,u,a,f){var l,c,h,p,d,v,m,g,y,b,w,E,S,x;return d=o(),E=!1,x=null,v=function(){},S=function(){var t;return E=!0,t=e(".dropdown",h),t.addClass("open"),v=n.create(h.get(0),function(){return t.removeClass("open"),E=!1}),d.query(e(s).val())},y=function(){if(!E)return S()},m=function(){if(!E)return S()},p=function(e){return e.preventDefault(),e.stopPropagation()},b=function(n){var r;p(n);switch(n.keyCode){case i.Keys.UP:if(E)return r=e("li.selected",h),r.length?r.removeClass("selected").prev("li").addClass("selected"):e("li",h).last().addClass("selected");break;case i.Keys.DOWN:return E?(r=e("li.selected",h),r.length?r.removeClass("selected").next("li").addClass("selected"):e("li",h).first().addClass("selected")):S();case i.Keys.ENTER:if(E){r=e("li.selected > a",h);if(r.length)return d.select(t.dataFor(r.get(0))),v()}break;case i.Keys.ESC:if(E)return v();break;default:return E||S(),clearTimeout(x),x=setTimeout(function(){return d.query(e(s).val())},200)}},g=function(e){return p(e),d.select(t.dataFor(e.toElement)),v()},w=function(n){var r;p(n),r=t.dataFor(n.toElement);if(r!==f.$data)return e("li",h).removeClass("selected"),e(n.toElement).parent().addClass("selected")},l=e(s),h=l.parent(),h.append(e(r)),c=e("#menu",h),l.bind("focus",y),l.bind("click",m),l.bind("keyup",b),c.bind("click",g),c.bind("mouseover",w),t.utils.domNodeDisposal.addDisposeCallback(s,function(){return l.unbind(y),l.unbind(m),l.unbind(b),c.unbind(g),c.unbind(w)})},update:function(e,t,n,r,i){}}}),t("bindingHandler")})();