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
        define(['underscore', 'backbone'], factory);
    } else {
        // Browser globals
        factory( this._, this.Backbone );
    }
}(function (_, Backbone) {
    var oldCollectionSet, oldEnsureElement, oldTrigger, newEvents, oldCollection;

    oldCollectionSet = Backbone.Collection.prototype.set;

    // support setMatch (instead of `set` matching using ids, it can match based on properties)
    // pass in an array of properties (/one property/a function which receives property names) which must match for the models to considered be the same
    // this is achieved by setting the `cid` of incoming elements
    // if incoming models have an `id` attribute, that is used instead to decide if there is a matching model
    // if `id` is 'inherit' and incoming models have an `id`, matched models in the collection will inherit that id
    // if `id` is 'retain' and incoming models have an `id`, matched models in the collection will retain the original id
    Backbone.Collection.prototype.set = function (incomingModels, options) {
        var matchedModel,                   // the model which matches the object to match
            namesToMatch,                   // array of names to match
            thisCollection = this,          // the collection
            currentModelIndex,              // used in `for` loop
            objectToMatch = {},             // an object whose properties the matchedModel should match
            shouldMatchUser,                // used to determine if a property name should match (based on user-defined property names)
            shouldMatch;                    // modified version to also consider other settings which would change the result

        if (thisCollection.setMatch && thisCollection.setMatch.active !== false) {
            // instead of having `setMatch` as an object, it can also be used as `match` (where no other options need specified)
            if (!_.isObject(thisCollection.setMatch)) {
                thisCollection.setMatch = {
                    match: thisCollection.setMatch
                };
            }

            // create `shouldMatchUser` function
            if (!_.isFunction(thisCollection.setMatch.match)) {
                // change to use `namesToMatch` and if `match` is a string, make an array of it
                // names to match may include spaces or other characters so don't use a string delimeter
                namesToMatch = _.isString(thisCollection.setMatch.match) ? [thisCollection.setMatch.match] : thisCollection.setMatch.match;
                shouldMatchUser = function (nameToCompare) {
                    // if `namesToMatch` is an array, check for a match, otherwise, return true
                    return _.isArray(namesToMatch) ? _.indexOf(namesToMatch, nameToCompare) !== -1 : true;
                };
            } else {
                shouldMatchUser = thisCollection.setMatch.match;
            }

            shouldMatch = function (nameToCompare) {
                // if `shouldMatchUser(nameToCompare)` is true, check to ensure the case of id (otherwise use its reponse of false)
                return (shouldMatchUser(nameToCompare)
                    ? !(nameToCompare === 'id' && (thisCollection.setMatch.id === 'inherit' || thisCollection.setMatch.id === 'retain'))
                    : false);
            };

            // set the cid of incoming items to that of elements matched in the collection
            for (currentModelIndex = 0; currentModelIndex < incomingModels.length; currentModelIndex += 1) {

                // make this into a proper model object instance (arbitrary cid assigned)
                incomingModels[currentModelIndex] = thisCollection._prepareModel(incomingModels[currentModelIndex], options);

                // create `objectToMatch` by comparing property names
                _.each(incomingModels[currentModelIndex].attributes, function (propertyValue, propertyName) {
                    if (shouldMatch(propertyName)) {
                        objectToMatch[propertyName] = propertyValue;
                    }
                });

                // look for match with `objectToMatch`
                matchedModel = thisCollection.findWhere(objectToMatch);

                if (matchedModel) {
                    if (incomingModels[currentModelIndex].id != null && matchedModel.id !== incomingModels[currentModelIndex].id) {
                        if (thisCollection.setMatch.id === 'inherit') {
                            // use the id of the new element, to assign that of the old
                            matchedModel.set('id', incomingModels[currentModelIndex].id);
                        } else if (thisCollection.setMatch.id === 'retain') {
                            // remove id of new element (uses same concept as my custom `clone` method)
                            incomingModels[currentModelIndex] = new incomingModels[currentModelIndex].constructor(_.omit(incomingModels[currentModelIndex].attributes, 'id'));
                        }
                    }

                    // overwrite randomly assigned cid on new element (used by Backbone.Collection.prototype.set to match)
                    // do after the above since `incomingModels[currentModelIndex]` may have changed
                    incomingModels[currentModelIndex].cid = matchedModel.cid;
                }

            }
        }

        oldCollectionSet.call(thisCollection, incomingModels, options);
    };
});


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

            _.each(toMatch, function (curMatch) {
                var min = breakpoints[curMatch] && breakpoints[curMatch].min,
                    max = breakpoints[curMatch] && breakpoints[curMatch].max;

                if (breakpoints[curMatch] != null && (min == null || min <= width) && (max == null || max >= width)) {
                    match = match || curMatch;
                }
            });

            return match || 'default';
        };

        // alt breakpoints REPLACE the current ones but only apply to this particular callback 
        on = function (toMatch, callback, callImmediately, altBreakpoints) {
            var width = $window.width(), callbackObj, temp;

            if (typeof callImmediately === 'object') {
                temp = callImmediately;
                callImmediately = altBreakpoints;
                altBreakpoints = temp;
            }

            callbackObj = {
                toMatch: toMatch,
                lastSent: getMatch(toMatch, width, altBreakpoints || breakpoints),
                callback: callback,
                altBreakpoints: altBreakpoints
            };

            if (callImmediately) {
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