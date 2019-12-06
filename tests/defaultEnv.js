require('../../../psknode/bundles/pskruntime');
const Isolate = require('..');
const fs = require('fs');

const defaultBundle = fs.readFileSync('../../../psknode/bundles/sandboxBase.js', 'utf8');

const config = Isolate.IsolateConfig.defaultConfig;
config.debug.useInspector = false;
config.runtime.delay = 0;

Isolate.getDefaultIsolate({shimsBundle: defaultBundle, config}, async (err, defaultIsolate) => {
    if (err) {
        throw err;
    }
    await defaultIsolate.run(`
    
        global.receiveArrayBuffer = function(arrayBuffer) {
            console.log('am primit array buffer', arrayBuffer);
        }
    
    `);

    const fnRef = defaultIsolate.context.global.getSync('receiveArrayBuffer');
    const ab = new Uint8Array(new ArrayBuffer(16));

    const ref = new defaultIsolate.ivm.ExternalCopy(ab).copyInto();

    fnRef.apply(undefined, [ref]);




    await defaultIsolate.run(`
        debugger;
        const crypto = require('crypto');

        const bytes = crypto.randomBytes(10);
        console.log('bytes', bytes);
    `);

    console.log('Run successful');
});
