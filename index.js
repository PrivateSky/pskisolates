// Create a new isolate limited to 128MB
let ivm = require('isolated-vm');
const WebSocket = require('ws');
let isolate = new ivm.Isolate({ inspector: true });

let context = isolate.createContextSync({ inspector: true });
let jail = context.global;

jail.setSync('global', jail.derefInto());
jail.setSync('_console', new ivm.Reference({x: 2, y: 3, m: new ivm.Reference(function() {return 'ana';})}));
jail.setSync('_ivm', ivm);
jail.setSync('_log', new ivm.Reference(function(...args) {
    console.log(...args);
}));

const utils = require('util');

console.log('x', utils.inspect(ivm.lib.hrtime, {showHidden: true, depth: 10, colors: true, showProxy:true}));

jail.setSync('stdout', new ivm.Reference(process.stdout));

const code = 'new '+ function () {
    debugger;
    let ivm = _ivm;
    delete _ivm;

    let log = _log;

    // delete _log;
    global.log = function(...args) {
       const transform = (arg) => {
           const type = typeof arg;
           if(type === 'object') {
               arg = arg.constructor.name + ' ' + JSON.stringify(arg);
           }

           return arg;
       };
        log.applyIgnored(undefined, args.map(arg => new ivm.ExternalCopy(transform(arg)).copyInto()));
    };
    // let console = new ivm.ExternalCopy(_console).copy();
    let console = _console.copySync();
    // let m = console.m.copyInto();
    let mRef = console.m;
    // global.log(new ivm.ExternalCopy(mRef).copyInto());
    let m = function(...args) {
        global.log(mRef.applySync(undefined));
    }

    // global.log(new Proxy({}, {}))
    // let out = stdout.getSync('write');

    // let std = new ivm.ExternalCopy(stdout);

    global.log(stdout);

    // for (let entry in std) {
    //     global.log(entry)
    // }

    // let megaConsole = {
    //     log: function(...args) {console.getSync('log').applyIgnored(undefined, args) },
    //     error: console.getSync('error')
    // };
    // // let loggy = console.getSync('log');
    // megaConsole.log('da');
    // global.log(console);
};


// This will bootstrap the context. Prependeng 'new ' to a function is just a convenient way to
// convert that function into a self-executing closure that is still syntax highlighted by
// editors. It drives strict mode and linters crazy though.
// let bootstrap = isolate.compileScriptSync('new '+ function() {
//     for(;;)debugger;
//     let ivm = _ivm;
//     delete _ivm;
//
//     let log = _log;
//
//     // delete _log;
//     global.log = function(...args) {
//         // We use `copyInto()` here so that on the other side we don't have to call `copy()`. It
//         // doesn't make a difference who requests the copy, the result is the same.
//         // `applyIgnored` calls `log` asynchronously but doesn't return a promise-- it ignores the
//         // return value or thrown exception from `log`.
//         log.applyIgnored(undefined, args.map(arg => new ivm.ExternalCopy(arg).copyInto()));
//     };
//     // let console = new ivm.ExternalCopy(_console).copy();
//     let console = _console.copySync();
//     // let m = console.m.copyInto();
//     let mRef = console.m;
//     // global.log(new ivm.ExternalCopy(mRef).copyInto());
//     let m = function(...args) {
//         global.log(mRef.applySync(undefined));
//     }
//
//     // global.log(new Proxy({}, {}))
//     // let out = stdout.getSync('write');
//
//     let std = stdout.copy();
//     global.log(Object.keys(std));
//
//     // let megaConsole = {
//     //     log: function(...args) {console.getSync('log').applyIgnored(undefined, args) },
//     //     error: console.getSync('error')
//     // };
//     // // let loggy = console.getSync('log');
//     // megaConsole.log('da');
//     // global.log(console);
// }, {filename:'index.js'});

setTimeout(function() {
    console.log('starting');
    (async function() {
        let script = await isolate.compileScript(code, { filename: 'example.js' });
        await script.run(context);
    }()).catch(console.error);
}, 2000);


// Create an inspector channel on port 10000
let wss = new WebSocket.Server({ port: 10000 });

wss.on('connection', function(ws) {
    // Dispose inspector session on websocket disconnect
    let channel = isolate.createInspectorSession();
    function dispose() {
        try {
            channel.dispose();
        } catch (err) {}
    }
    ws.on('error', dispose);
    ws.on('close', dispose);

    // Relay messages from frontend to backend
    ws.on('message', function(message) {
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