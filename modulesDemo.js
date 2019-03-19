// Create a new isolate limited to 128MB
let ivm = require('isolated-vm');
const WebSocket = require('ws');
let isolate = new ivm.Isolate({inspector: true});

let context = isolate.createContextSync({inspector: true});
let jail = context.global;

jail.setSync('global', jail.derefInto());
jail.setSync('_console', new ivm.Reference({
    x: 2, y: 3, m: new ivm.Reference(function () {
        return 'ana';
    })
}));
jail.setSync('_ivm', ivm);
jail.setSync('_log', new ivm.Reference(function (...args) {
    console.log(...args);
}));

jail.setSync('_require', new ivm.Reference(function (name) {
    if (name === 'fs') {
        const fs = require('fs');
        return new ivm.Reference(fs);
    } else if (name === "buffer") {
        return new ivm.Reference(Buffer);
    } else if (name === "stream") {
        console.log('getting stream');
        return new ivm.Reference(require('stream'));
    } else if (name === 'path') {
        return new ivm.Reference(require('path'));
    } else {
        return undefined;
    }
}));

jail.setSync('_buffer', new ivm.Reference({
    from: function (arr) {
        console.log('called buffer from with ', arr);

        return new ivm.Reference(Buffer.from(arr));
    }
}));


jail.setSync('stdout', new ivm.Reference(process.stdout));

const code = 'new ' + function () {
    debugger;
    let ivm = _ivm;
    delete _ivm;

    let log = _log;

    // delete _log;
    global.log = function (...args) {
        const transform = (arg) => {
            const type = typeof arg;
            if (type === 'object') {
                arg = arg.constructor.name + ' ' + JSON.stringify(arg);
            }

            return arg;
        };
        log.applyIgnored(undefined, args.map(arg => new ivm.ExternalCopy(transform(arg)).copyInto()));
    };

    const require = function (...args) {
        args.forEach(arg => {
            if (typeof arg !== 'string') throw new Error('Invalid argument type ' + typeof arg)
        });
        return _require.applySync(undefined, args);
    };

    const buffer = {
        from: function (arr) {
            console.log('getting from ', _buffer);
            const from = _buffer.getSync('from');

            console.log('type ', from.typeof);
            const result = from.applySync(undefined, [new ivm.ExternalCopy(arr).copyInto()]);

            return result.copySync();
        }
    }
    
    // const path = require.applySync(undefined, ['path']);

    const timer = bundle('/home/developer/Documents/isolationModule/moduleToBrowserify.js');
    global.log(timer.add(1, 2));

    // global.log(path.getSync('resolve').applySync(undefined, ['ana']));


    // const buffer = require.applySync(undefined, ['buffer']).copySync();

    // const from = buffer.getSync('from');
    //
    // const b = from.applySync(undefined, [0]);
    // const fs = require.applySync(undefined, ['fs']);

};


setTimeout(function () {
    console.log('starting');
    (async function () {
        let script = await isolate.compileScript(code, {filename: 'example.js'});
        await script.run(context);
        console.log('done ');
        // const module = await isolate.compileModule(`import * as fs from 'fs';`);
        // const fs = await isolate.compileModule(`export default class {}`);
        // module.instantiateSync(context, (spec) => {
        //     if(spec === 'fs') {
        //         // const module = require('module');
        //         return new ivm.Reference(require('fs'));
        //     } else {
        //         console.log('woooow');
        //         return {};
        //     }
        // })
        //
        // module.evaluateSync();
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