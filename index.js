// Create a new isolate limited to 128MB
let ivm = require('isolated-vm');
const WebSocket = require('ws');
let isolate = new ivm.Isolate({inspector: true});

let context = isolate.createContextSync({inspector: true});
let jail = context.global;

function deepReference(obj, ivm, depth = 0) {
    let newObj = {};

    if (!ivm) {
        throw new Error('Missing argument ivm');
    }

    if (depth > 0) {
        Object.keys(obj).forEach(key => {
            // might not be good enough
            if (typeof obj[key] === 'object' && !Buffer.isBuffer(key)) {
                newObj[key] = deepReference(obj[key], ivm, depth - 1);
            }
        });
    } else {
        newObj = new ivm.Reference(obj);
    }

    return newObj;
}

jail.setSync('global', jail.derefInto());
jail.setSync('_ivm', ivm);
jail.setSync('_console', deepReference(console, ivm));
// jail.setSync('_setTimeout', new ivm.Reference(function(timeout) {
//    return new Promise((resolve, reject) => {
//        console.log('sunt afara si am pornit');
//        setTimeout(() => {
//            console.log('sunt afara si am mers');
//            resolve();
//        }, timeout)
//    });
// }));



const code = 'new ' + function () {
    debugger;
    let ivm = _ivm;
    delete _ivm;

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

        function getAccessProxy(obj) {
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
            getAccessProxy
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
    delete _console;

    const consoleProxy = ReferenceAccess().getAccessProxy(_rawConsole);
    const consoleWrapper = wrapConsoleLogs(consoleProxy);

    console = new Proxy(consoleProxy, {
        get: function (target, prop) {
            if (Object.keys(consoleWrapper).includes(prop)) {
                return consoleWrapper[prop];
            }

            return target[prop];
        }
    });

    // setTimeout = function(timeout) {
    //     console.log('hai timeout', _setTimeout.typeof);
    //     _setTimeout.apply(undefined, [timeout])
    //         .then(() => {
    //             console.log('A MERS TIMEOUT MAAAI');
    //         })
    //         .catch(console.error)
    // }
    //
    // setTimeout(100);


};


setTimeout(function () {
    console.log('starting');
    (async function () {
        let script = await isolate.compileScript(code, {filename: 'example.js'});
        await script.run(context);
    }()).catch(console.error);
}, 2000);


// Create an inspector channel on port 10000
let wss = new WebSocket.Server({port: 10000});

wss.on('connection', function (ws) {
    // Dispose inspector session on websocket disconnect
    let channel = isolate.createInspectorSession();

    function dispose() {
        try {
            channel.dispose();
        } catch (err) {
        }
    }

    ws.on('error', dispose);
    ws.on('close', dispose);

    // Relay messages from frontend to backend
    ws.on('message', function (message) {
        try {
            channel.dispatchProtocolMessage(message);
        } catch (err) {
            // This happens if inspector session was closed unexpectedly
            ws.close();
        }
    });

    // Relay messages from backend to frontend
    function send(message) {
        try {
            ws.send(message);
        } catch (err) {
            dispose();
        }
    }

    channel.onResponse = (callId, message) => send(message);
    channel.onNotification = send;
});
console.log('Inspector: chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:10000');

// bootstrap.runSync(context);

// isolate.compileScriptSync('log("f");').runSync(context);
// isolate.compileScriptSync('log(typeof require)').runSync(context);