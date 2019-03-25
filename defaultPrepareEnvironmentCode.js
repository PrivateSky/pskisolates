const code = 'new ' + function () {
    debugger;
    let ivm = _ivm;

    function ReferenceAccess() {
        const referenceAccessHandler = {
            get: function (target, prop) {
                let unwrappedValue;

                if (objectIsReference(target)) {
                    const rawProperty = target.getSync(prop);

                    if (isFunction(rawProperty)) {
                        unwrappedValue = toNativeFunction(rawProperty);
                    } else if (isNativeValue(rawProperty)) {
                        unwrappedValue = toNativeValue(rawProperty);
                    } else {
                        unwrappedValue = new Proxy(rawProperty, referenceAccessHandler);
                    }

                } else {
                    unwrappedValue = target[prop];
                }

                return unwrappedValue;
            },
            set: function (target, prop, value) {
                // needs more testing

                if (objectIsReference(target)) {
                    target.setSync(prop, value);
                } else {
                    target[prop] = value;
                }

                return true;
            },
            ownKeys: function (reference) {
                // doesn't work yet, target should use 'deepReference' function (which might come with a performance penalty)
                // to be able to copySync each level individually instead of trying to parse the entire object which
                // causes and error to be thrown most of the time due to native code that can't be copied

                try {
                    const nativeObject = reference.copySync();

                    return Reflect.ownKeys(nativeObject);
                } catch (e) {
                    return []
                }
            }
        };

        function getAccessProxyFor(obj) {
            return new Proxy(obj, referenceAccessHandler);
        }


        function objectIsReference(obj) {
            return !!(typeof obj === 'object' && obj.constructor.name === 'Reference' && obj.typeof && obj.getSync);
        }

        function isFunction(reference) {
            return !!(reference.typeof === 'function' || typeof reference === 'function');
        }

        function toNativeFunction(reference) {
            if (reference.typeof === 'function') {
                return function (...args) {
                    // this probably looses the reference to `this`

                    return reference.applySync(undefined, args);
                }
            } else if (typeof reference === 'function') {
                return reference;
            }
        }

        function isNativeValue(reference) {
            return reference.typeof !== 'object';
        }

        function toNativeValue(reference) {
            return reference.copySync();
        }

        return {
            getAccessProxyFor
        };
    }


    function wrapConsoleLogs(consoleSource) {
        return {
            log: wrapper(consoleSource.log),
            warn: wrapper(consoleSource.warn),
            error: wrapper(consoleSource.error),
            info: wrapper(consoleSource.info)
        };

        function wrapper(fn) {
            return function (...args) {
                try {
                    fn.apply(undefined, args.map(arg => new ivm.ExternalCopy(transform(arg)).copyInto()));
                } catch (e) {
                    consoleSource.error('>>> [error] could not display non-transferable value');
                }
            }
        }

        function transform(arg) {
            const type = typeof arg;
            if (type === 'object') {
                arg = arg.constructor.name + ' ' + JSON.stringify(arg);
            }

            return arg;
        }
    }

    let _rawConsole = _console;

    global.ReferenceAccess = ReferenceAccess();

    const consoleProxy = ReferenceAccess().getAccessProxyFor(_rawConsole);
    const consoleWrapper = wrapConsoleLogs(consoleProxy);

    console = new Proxy(consoleProxy, {
        get: function (target, prop) {
            if (Object.keys(consoleWrapper).includes(prop)) {
                return consoleWrapper[prop];
            }

            return target[prop];
        }
    });

    let _rawSetTimeout = _setTimeout;

    setTimeout = function (callback, timeout) {
        _rawSetTimeout.apply(undefined, [timeout, new ivm.Reference(function () {
            callback();
        })])
            .catch(() => {
                console.log('Error calling timeout');
            });
    };

};


module.exports = code;