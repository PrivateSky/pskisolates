let ivm = require('isolated-vm');
const WebSocket = require('ws');

function IsolatedExecutionEnvironment(config) {
    const useInspector = config.useInspector;

    const isolate = new ivm.Isolate({ inspector: useInspector });
    const isolateGlobal = context.global;

    if(useInspector) {
        startDebugger(isolate);
    }

    isolateGlobal.setSync('global', isolateGlobal.derefInto());
    jail.setSync('_ivm', ivm);
    jail.setSync('_console', deepReference(console, ivm));


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
}

function IsolateConfig() {
    return {
        useInspector: false
    }
}

function startDebugger(isolate, port = 10000) {
    let wss = new WebSocket.Server({ port: port });

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
    console.log(`Inspector: chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:${port}`);
}

module.exports = IsolatedExecutionEnvironment;