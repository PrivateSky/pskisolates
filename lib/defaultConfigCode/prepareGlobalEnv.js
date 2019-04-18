const code = 'new ' + function () {
    debugger;
    let ivm = _ivm;

    function PSKBuffer() {}

    PSKBuffer.from = function (source) {
        const buffer = new Uint8Array(new SharedArrayBuffer(source.length));
        buffer.set(source, 0);

        return buffer;
    };

    PSKBuffer.concat = function ([...params], totalLength) {
        if (!totalLength && totalLength !== 0) {
            totalLength = 0;
            for (const buffer of params) {
                totalLength += buffer.length;
            }
        }

        const buffer = new Uint8Array(new SharedArrayBuffer(totalLength));
        let offset = 0;

        for (const buf of params) {
            const len = buf.length;

            const nextOffset = offset + len;
            if (nextOffset > totalLength) {
                const remainingSpace = totalLength - offset;
                for (let i = 0; i < remainingSpace; ++i) {
                    buffer[offset + i] = buf[i];
                }
            } else {
                buffer.set(buf, offset);
            }

            offset = nextOffset;
        }

        return buffer;
    };

    PSKBuffer.isBuffer = function (pskBuffer) {
        return !!ArrayBuffer.isView(pskBuffer);
    };

    global.PSKBuffer = PSKBuffer;

    /**
     * Creates a proxy that hides the dereferencing action when accessing properties on external references
     * @returns {{getAccessProxyFor: (function(*=): *)}}
     * @constructor
     */
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

                // better alternative, now that reference is always a Proxy, maybe it can implement ownKeys

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
                    return reference.applySync(undefined, args.map(BufferTransform));
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

        function BufferTransform(arg) {
            if(PSKBuffer.isBuffer(arg)) {
                return new ivm.ExternalCopy(arg).copyInto();
            }

            if(isPrimitive(arg)) {
                return arg
            }

            return new ivm.ExternalCopy(arg).copyInto();
        }

        function isPrimitive(value) {
            return value !== Object(value);
        }

        return {
            getAccessProxyFor,
            for: getAccessProxyFor
        };
    }

    global.ReferenceAccess = ReferenceAccess();

    /**
     * Wrapper over console functions to transform input in string because complex objects can't be passed
     * outside of the Isolate Environment
     * @param consoleSource
     * @returns {{warn: Function, log: Function, error: Function, info: Function}}
     */
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
                if (!ArrayBuffer.isView(arg)) { // is not of ArrayBuffer or SharedArrayBuffer type
                    arg = arg.constructor.name + ' ' + JSON.stringify(arg);
                }
            }

            return arg;
        }
    }

    const _rawConsole = _console;
    const consoleProxy = global.ReferenceAccess.getAccessProxyFor(_rawConsole);
    const consoleWrapper = wrapConsoleLogs(consoleProxy);

    global.console = new Proxy(consoleProxy, {
        get: function (target, prop) {
            if (consoleWrapper.hasOwnProperty(prop)) {
                return consoleWrapper[prop];
            }

            return target[prop];
        }
    });

    /**
     * SetTimeout implementation that uses setTimeout of parent environment due to lack of "timers" inside Isolate
     */
    let _rawSetTimeout = _setTimeout;
    setTimeout = function (callback, timeout) {
        const callbackReference = new ivm.Reference(() => callback());
        _rawSetTimeout.apply(undefined, [timeout, callbackReference])
            .catch(() => {
                console.log('Error calling timeout');
            });
    };

};


module.exports = code;