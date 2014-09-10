# jQuery breakpoint 0.0.1 #
A simple jQuery plugin which allows you to set callbacks to be called on customisable breakpoints when certain breakpoints are entered an exited. Providing a flexible way to make fully responsive web apps.

## Introduction ##
### $.breakpoint.on(toMatch, callback, [callNow], [altBreakpoints]) ###
To set a callback to be run on a breakpoint, call `$.breakpoint.on`, it returns the current matched breakpoint (see `toMatch` below)

The first parameter, `toMatch`, is an array of the names of the breakpoints which, when entered/exited the callback should be called.

The second parameter, `callback`, is the callback which should be called.

The third parameter, `callNow`, is optional, and provides a way to automatically call `callback`, passing the name of the breakpoint that is currently matched - note that this will not work unless the page has been rendered at the time of calling.

The fourth parameter, `altBreakpoints`, is optional and provides a way to override the breakpoints which should be used with this particular callback - it will not affect any other callbacks that you set. For information about the format of this parameter, see `$.breakpoint.changeBreakpoints` below.

The callback receives the name of the first breakpoint matched in the `toMatch` array, if no breakpoint was matched (in the case that one of these breakpoints was left), then this will be 'default'. In addition, the breakpoint matched at the time of calling is returned from every call to `$.breakpoint.on`.

    var makeChanges = function (breakpointName) {
        if (breakpointName === 'palm') {
            // make changes for mobile
        } else if (breakpointName === 'lap') {
            // make changes for small screen width
        } else {
            // `breakpointName` is 'default' as the new page width matches neither 'palm' nor 'lap'
        }
    };

    $.breakpoint.on(['palm', 'lap'], makeChanges);

### $.breakpoint.off(callback) ###
To disable the calling of a callback when the breakpoint has changed, call `$.breakpoint.off`. The first and only parameter is the callback which should be disabled.

To disable the callback set above:

    $.breakpoint.off(makeChanges);

### $.breakpoint.changeBreakpoints(newDefaultBreakpoints) ###
In order to change the global breakpoints - which apply to all callbacks set using `$.breakpoint.on`, except those for which the breakpoints have been overridden - call `$.breakpoint.changeBreakpoints`.

The first and only parameter, `newDefaultBreakpoints`, is a map of the new breakpoints. The property names of this object correspond to the names used to refer to the breakpoints in calls to `$.breakpoint.on`. The format of each property of this map is an object with the properties `min` and `max` indicating the width of the window, in number of pixels, which should match this breakpoint. A breakpoint name of `default` is not advisable as this will lead to ambiguity when this is passed to a callback.

The default value for the breakpoints is:

    {
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
    }