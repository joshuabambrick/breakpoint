/*
    breakpoint.js
    version 0.0.1
    
    Provides a jQuery method to call callbacks on customisable breakpoints for responsive web apps.

    Copyright 2014 Josh Bambrick
    http://joshbambrick.com/

    Github
    http://github.com/joshbambrick/breakpoint
    
    Licensed under the MIT license:
    http://www.opensource.org/licenses/mit-license.php

*/
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        factory(this.$);
    }
}(function ($) {
    $.breakpoint = (function () {
        var on, off, changeBreakpoints, getMatch,
            callbackObjs = [],
            $window = $(window),
            breakpoints = {
                palm: {
                    max: 719
                },
                lap: {
                    max: 1023,
                    min: 720
                },
                'lap-and-up': {
                    min: 720
                },
                portable: {
                    max: 1023
                },
                desk: {
                    min: 1024
                }
            };

        $window.on('resize', function () {
            // NOTE: must prevent scrollbar affecting result
            var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

            $.each(callbackObjs, function (curCallbackObjIndex, curCallbackObj) {
                var newMatch = getMatch(curCallbackObj.toMatch, width, curCallbackObj.altBreakpoints || breakpoints);

                if (newMatch !== curCallbackObj.lastSent) {
                    curCallbackObj.lastSent = newMatch;
                    curCallbackObj.callback(newMatch);
                }
            });

        });


        // look through `toMatch` for first match to a breakpoint
        getMatch = function (toMatch, width, breakpoints) {
            var match;

            $.each(toMatch, function (curMatchIndex, curMatch) {
                var min = breakpoints[curMatch] && breakpoints[curMatch].min,
                    max = breakpoints[curMatch] && breakpoints[curMatch].max;

                if (breakpoints[curMatch] != null && (min == null || min <= width) && (max == null || max >= width)) {
                    match = match || curMatch;
                }
            });

            return match || 'default';
        };

        // alt breakpoints REPLACE the current ones but only apply to this particular callback 
        on = function (toMatch, callback, callNow, altBreakpoints) {
            var width = $window.width(), callbackObj, temp;

            if (typeof callNow === 'object') {
                temp = callNow;
                callNow = altBreakpoints;
                altBreakpoints = temp;
            }

            callbackObj = {
                toMatch: toMatch,
                lastSent: getMatch(toMatch, width, altBreakpoints || breakpoints),
                callback: callback,
                altBreakpoints: altBreakpoints
            };

            if (callNow) {
                callback(callbackObj.lastSent);
            }

            callbackObjs.push(callbackObj);

            return callbackObj.lastSent;
        };

        off = function (callback) {
            var indicesToRemove = [];

            $.each(callbackObjs, function (curCallbackObjIndex, curCallbackObj) {
                if (curCallbackObj.callback === callback) {
                    indicesToRemove.push(curCallbackObjIndex);
                }
            });

            $.each(indicesToRemove, function (curArrIndex, curIndex) {
                callbackObjs.splice(curIndex - curArrIndex, 1);
            });
        };

        changeBreakpoints = function (newBreakpoints, keepOld) {
            breakpoints = $.extend(keepOld ? breakpoints : {}, newBreakpoints);
        };

        return {
            on: on,
            off: off,
            changeBreakpoints: changeBreakpoints
        };
    })();
}));