/* global Bigpipe */
(function() {
    "use strict";
    function staticUrlGenerator(ids) {
        var urls = [];
        for (var i = ids.length - 1; i >=0; i--) {
            urls.unshift("http://static.tieba.baidu.com/??" + ids[i]);
        }
        return urls;
    }
    Bigpipe.config({
        getStylesUrl: staticUrlGenerator,
        getScriptsUrl: staticUrlGenerator
    });
})();
