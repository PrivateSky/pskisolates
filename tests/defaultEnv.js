const Isolate = require('..');
const fs = require('fs');

const defaultBundle = fs.readFileSync('../lib/shimsGenerator/builds/devel/sandboxBase.js', 'utf8');

const config = Isolate.IsolateConfig.defaultConfig;
config.debug.useInspector = true;
config.runtime.delay = 10;
config.debug.logs = false;

Isolate.getDefaultIsolate({shimsBundle: defaultBundle, config}, async (err, defaultIsolate) => {
    if(err) {
        throw err;
    }

    await defaultIsolate.run(`
        debugger;
        const crypto = require('crypto');
        
        const bytes = crypto.randomBytes(10);
        console.log('bytes', bytes);
    `);
    console.log('Init successful');
});